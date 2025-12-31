pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: sonar-scanner
    image: sonarsource/sonar-scanner-cli
    command:
    - cat
    tty: true
  - name: kubectl
    image: bitnami/kubectl:latest
    command:
    - cat
    tty: true
    securityContext:
      runAsUser: 0
      readOnlyRootFilesystem: false
    env:
    - name: KUBECONFIG
      value: /kube/config        
    volumeMounts:
    - name: kubeconfig-secret
      mountPath: /kube/config
      subPath: kubeconfig
  - name: dind
    image: docker:dind
    securityContext:
      privileged: true  # Needed to run Docker daemon
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ""  # Disable TLS for simplicity
    volumeMounts:
    - name: docker-config
      mountPath: /etc/docker/daemon.json
      subPath: daemon.json  # Mount the file directly here
  volumes:
  - name: docker-config
    configMap:
      name: docker-daemon-config
  - name: kubeconfig-secret
    secret:
      secretName: kubeconfig-secret
'''
        }
    }

    environment {
        NAMESPACE        = "2401021"

        REGISTRY_URL     = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
        REGISTRY_REPO    = "2401021"

        FRONTEND_APP     = "blood-donation-frontend"
        BACKEND_APP      = "blood-donation-backend"
        IMAGE_TAG        = "latest"

        SONAR_PROJECT    = "blood-donation-app"
        SONAR_HOST_URL   = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git url: 'https://github.com/SBShweta/blood-donation-app.git',
                    branch: 'main'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    withCredentials([
                        string(credentialsId: '2401021_stoken', variable: 'SONAR_TOKEN')
                    ]) {
                        sh '''
                            sonar-scanner \
                              -Dsonar.projectKey=$SONAR_PROJECT \
                              -Dsonar.sources=. \
                              -Dsonar.host.url=$SONAR_HOST_URL \
                              -Dsonar.login=$SONAR_TOKEN
                        '''
                    }
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                container('dind') {
                    sh '''
                        cd client
                        docker build -f Dockerfile.frontend \
                          -t $FRONTEND_APP:$IMAGE_TAG .+-
                    '''
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                container('dind') {
                    sh '''
                        cd server
                        docker build -f Dockerfile.backend \
                          -t $BACKEND_APP:$IMAGE_TAG .
                    '''
                }
            }
        }

        stage('Login to Docker Registry') {
            steps {
                container('dind') {
                    sh 'docker --version'
                    sh 'sleep 10'
                    sh 'docker login nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085 -u admin -p Changeme@2025'
                }
            }
        }

        stage('Tag & Push Images') {
            steps {
                container('dind') {
                    sh '''
                        docker tag $FRONTEND_APP:$IMAGE_TAG \
                          $REGISTRY_URL/$REGISTRY_REPO/$FRONTEND_APP:$IMAGE_TAG

                        docker tag $BACKEND_APP:$IMAGE_TAG \
                          $REGISTRY_URL/$REGISTRY_REPO/$BACKEND_APP:$IMAGE_TAG

                        docker push $REGISTRY_URL/$REGISTRY_REPO/$FRONTEND_APP:$IMAGE_TAG
                        docker push $REGISTRY_URL/$REGISTRY_REPO/$BACKEND_APP:$IMAGE_TAG
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh '''
                        kubectl apply -f k8s/deployment.yaml -n $NAMESPACE
                        kubectl rollout status deployment/frontend-deployment -n $NAMESPACE
                        kubectl rollout status deployment/backend-deployment -n $NAMESPACE
                    '''
                }
            }
        }
    }
}
