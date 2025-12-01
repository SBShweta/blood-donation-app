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
    command: ["sh", "-c"]
    args:
      - |
        dockerd-entrypoint.sh &
        sleep 20
        tail -f /dev/null
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
        PROJECT = "2401021-project"
        SONAR_URL = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
    }

    stages {

        /* ======================  BUILD BACKEND ======================= */

        stage('Build Backend Docker Image') {
            steps {
                container('dind') {
                    sh """
                        docker build -t blood-backend:latest -f server/Dockerfile.backend server
                        docker image ls
                    """
                }
            }
        }

        /* ======================  BUILD FRONTEND ======================= */

        stage('Build Frontend Docker Image') {
            steps {
                container('dind') {
                    sh """
                        docker build -t blood-frontend:latest -f client/Dockerfile.frontend client
                        docker image ls
                    """
                }
            }
        }

        /* ======================  SONAR QUBE ======================= */

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    withCredentials([string(credentialsId: '2401021', variable: 'SONAR_TOKEN')]) {
                        sh """
                            sonar-scanner \
                            -Dsonar.projectKey=2401021_Blood-Donation \
                            -Dsonar.host.url=${SONAR_URL} \
                            -Dsonar.login=$SONAR_TOKEN
                        """
                    }
                }
            }
        }

        /* ====================== DOCKER LOGIN ======================= */

        stage('Login to Nexus Registry') {
            steps {
                container('dind') {
                    sh """
                        docker login ${REGISTRY} -u admin -p Changeme@2025
                    """
                }
            }
        }

        /* ====================== TAG & PUSH IMAGES ======================= */

        stage('Tag & Push Docker Images') {
            steps {
                container('dind') {
                    sh """
                        docker tag blood-backend:latest ${REGISTRY}/${PROJECT}/blood-backend:latest
                        docker tag blood-frontend:latest ${REGISTRY}/${PROJECT}/blood-frontend:latest

                        docker push ${REGISTRY}/${PROJECT}/blood-backend:latest
                        docker push ${REGISTRY}/${PROJECT}/blood-frontend:latest
                    """
                }
            }
        }

        /* ====================== DEPLOY TO K8s ======================= */

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh """
                        kubectl apply -f k8s/backend-deployment.yaml -n 2401021
                        kubectl apply -f k8s/frontend-deployment.yaml -n 2401021
                        kubectl apply -f k8s/mongo-deployment.yaml -n 2401021
                        kubectl apply -f k8s/ingress.yaml -n 2401021
                    """

                    sh "kubectl rollout status deployment/blood-backend -n 2401021"
                    sh "kubectl rollout status deployment/blood-frontend -n 2401021"
                }
            }
        }
    }
}
