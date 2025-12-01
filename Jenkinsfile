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
                        sh '''
                            sonar-scanner \
                                -Dsonar.projectKey=2401021_Blood_Donation \
                                -Dsonar.host.url=http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000 \
                                -Dsonar.login=$SONAR_TOKEN \
                                -Dsonar.python.coverage.reportPaths=coverage.xml
                        '''
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
            sh '''
                echo "Starting Kubernetes deployment..."
                
                # Check cluster connection
                echo "1. Checking cluster connection..."
                kubectl cluster-info
                
                # Ensure namespace exists
                echo "2. Ensuring namespace exists..."
                kubectl get namespace 2401021 || kubectl create namespace 2401021
                
                # List available files
                echo "3. Available k8s files:"
                ls -la k8s/
                
                # Check which file exists
                if [ -f "k8s/deployment.yaml" ]; then
                    echo "Found: deployment.yaml (correct spelling)"
                    MANIFEST_FILE="k8s/deployment.yaml"
                elif [ -f "k8s/deployement.yaml" ]; then
                    echo "Found: deployement.yaml (typo)"
                    MANIFEST_FILE="k8s/deployement.yaml"
                else
                    echo "ERROR: No deployment file found in k8s/"
                    exit 1
                fi
                
                # Apply the manifest
                echo "4. Applying manifest: $MANIFEST_FILE"
                kubectl apply -f $MANIFEST_FILE -n 2401021
                
                # Check deployment status
                echo "5. Checking deployment status..."
                sleep 10
                kubectl get all -n 2401021
                
                echo "Deployment completed successfully!"
            '''
        }
    }
}
    }
}
