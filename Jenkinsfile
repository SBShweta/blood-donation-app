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
    command: ["cat"]
    tty: true

  - name: kubectl
    image: bitnami/kubectl:latest
    command: ["cat"]
    tty: true
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
      privileged: true
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ""
    volumeMounts:
    - name: docker-config
      mountPath: /etc/docker/daemon.json
      subPath: daemon.json

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
        SONARQUBE_URL = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
        SONAR_PROJECT_KEY = "2401021_Blood_Donation"
        SONAR_PROJECT_NAME = "2401021_Blood_Donation"
        REGISTRY = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
        NAMESPACE = "2401021"
    }

    stages {

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    withCredentials([string(credentialsId: '2401021-SonarQube_token', variable: 'SONAR_TOKEN')]) {
                        sh '''
                            sonar-scanner \
                              -Dsonar.projectKey='''${SONAR_PROJECT_KEY}''' \
                              -Dsonar.projectName='''${SONAR_PROJECT_NAME}''' \
                              -Dsonar.sources=. \
                              -Dsonar.language=js \
                              -Dsonar.host.url='''${SONARQUBE_URL}''' \
                              -Dsonar.login=$SONAR_TOKEN
                        '''
                    }
                }
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                container('dind') {
                    sh '''
                        cd client
                        docker build -t blood-donation-app-frontend:latest -f Dockerfile.frontend .
                    '''
                }
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                container('dind') {
                    sh '''
                        cd server
                        docker build -t blood-donation-app-backend:latest -f Dockerfile.backend .
                    '''
                }
            }
        }

        stage('Login to Nexus Registry') {
            steps {
                container('dind') {
                    sh '''
                        docker login ${REGISTRY} -u admin -p Changeme@2025
                    '''
                }
            }
        }

        stage('Push Images to Nexus') {
            steps {
                container('dind') {
                    sh '''
                        docker tag blood-donation-app-frontend:latest ${REGISTRY}/blood-app/blood-donation-app-frontend:latest
                        docker tag blood-donation-app-backend:latest  ${REGISTRY}/blood-app/blood-donation-app-backend:latest

                        docker push ${REGISTRY}/blood-app/blood-donation-app-frontend:latest
                        docker push ${REGISTRY}/blood-app/blood-donation-app-backend:latest
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    dir('k8s') {
                        sh '''
                            kubectl apply -f namespace.yaml
                            kubectl apply -f mongo-deployment.yaml -n ${NAMESPACE}
                            kubectl apply -f backend-deployment.yaml -n ${NAMESPACE}
                            kubectl apply -f frontend-deployment.yaml -n ${NAMESPACE}
                            kubectl apply -f ingress.yaml -n ${NAMESPACE}

                            kubectl rollout status deployment/blood-donation-backend -n ${NAMESPACE}
                            kubectl rollout status deployment/blood-donation-frontend -n ${NAMESPACE}
                        '''
                    }
                }
            }
        }
    }
}
