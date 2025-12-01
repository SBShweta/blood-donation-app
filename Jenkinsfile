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
        REGISTRY = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
        BACKEND_IMAGE = "blood-donation/blood-donation-backend"
        FRONTEND_IMAGE = "blood-donation/blood-donation-frontend"
    }

    stages {

        stage('Build Backend Docker Image') {
            steps {
                container('dind') {
                    sh """
                        sleep 8
                        docker build -t ${BACKEND_IMAGE}:latest -f server/Dockerfile.backend server
                    """
                }
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                container('dind') {
                    sh """
                        docker build -t ${FRONTEND_IMAGE}:latest -f client/Dockerfile.frontend client
                    """
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    withCredentials([
                        string(credentialsId: 'sonar-token-2401021', variable: 'SONAR_TOKEN')
                    ]) {
                        sh """
                        sonar-scanner \
                            -Dsonar.projectKey=2401021_Blood_Donation \
                            -Dsonar.projectName=2401021_Blood_Donation \
                            -Dsonar.host.url=http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000 \
                            -Dsonar.login=$SONAR_TOKEN \
                            -Dsonar.sources=./server,./client \
                            -Dsonar.language=js \
                            -Dsonar.sourceEncoding=UTF-8
                        """
                    }
                }
            }
        }

        stage('Login to Nexus Registry') {
            steps {
                container('dind') {
                    sh """
                        docker login ${REGISTRY} -u admin -p Changeme@2025
                    """
                }
            }
        }

        stage('Tag & Push Docker Images') {
            steps {
                container('dind') {
                    sh """
                        docker tag ${BACKEND_IMAGE}:latest ${REGISTRY}/${BACKEND_IMAGE}:latest
                        docker tag ${FRONTEND_IMAGE}:latest ${REGISTRY}/${FRONTEND_IMAGE}:latest

                        docker push ${REGISTRY}/${BACKEND_IMAGE}:latest
                        docker push ${REGISTRY}/${FRONTEND_IMAGE}:latest
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    script {
                        dir('k8s') {
                            sh """
                                kubectl apply -f namespace.yaml
                                kubectl apply -f mongo-deployment.yaml -n blood
                                kubectl apply -f backend-deployment.yaml -n blood
                                kubectl apply -f frontend-deployment.yaml -n blood
                                kubectl apply -f ingress.yaml -n blood
                            """
                        }
                    }
                }
            }
        }

    }
}
