// pipeline {
//     agent {
//         kubernetes {
//             yaml '''
// apiVersion: v1
// kind: Pod
// spec:
//   containers:
//   - name: sonar-scanner
//     image: sonarsource/sonar-scanner-cli
//     command: ["cat"]
//     tty: true

//   - name: kubectl
//     image: bitnami/kubectl:latest
//     command: ["cat"]
//     tty: true
//     env:
//     - name: KUBECONFIG
//       value: /kube/config
//     volumeMounts:
//     - name: kubeconfig-secret
//       mountPath: /kube/config
//       subPath: kubeconfig

//   - name: dind
//     image: docker:dind
//     securityContext:
//       privileged: true
//     command: ["sh", "-c"]
//     args:
//       - |
//         dockerd-entrypoint.sh &
//         sleep 20
//         tail -f /dev/null
//     volumeMounts:
//     - name: docker-config
//       mountPath: /etc/docker/daemon.json
//       subPath: daemon.json

//   volumes:
//   - name: docker-config
//     configMap:
//       name: docker-daemon-config
//   - name: kubeconfig-secret
//     secret:
//       secretName: kubeconfig-secret
// '''
//         }
//     }

//     environment {
//         REGISTRY = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
//         PROJECT = "2401021-project"
//         SONAR_URL = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
//     }

//     stages {

//         /* ======================  BUILD BACKEND ======================= */

//         stage('Build Backend Docker Image') {
//             steps {
//                 container('dind') {
//                     sh """
//                         docker build -t blood-backend:latest -f server/Dockerfile.backend server
//                         docker image ls
//                     """
//                 }
//             }
//         }

//         /* ======================  BUILD FRONTEND ======================= */

//         stage('Build Frontend Docker Image') {
//             steps {
//                 container('dind') {
//                     sh """
//                         docker build -t blood-frontend:latest -f client/Dockerfile.frontend client
//                         docker image ls
//                     """
//                 }
//             }
//         }

//         /* ======================  SONAR QUBE ======================= */

//         stage('SonarQube Analysis') {
//             steps {
//                 container('sonar-scanner') {
//                      withCredentials([string(credentialsId: '2401021', variable: 'SONAR_TOKEN')]) {
//                         sh '''
//                             sonar-scanner \
//                                 -Dsonar.projectKey=2401021_Blood_Donation \
//                                 -Dsonar.host.url=http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000 \
//                                 -Dsonar.login=$SONAR_TOKEN \
//                                 -Dsonar.python.coverage.reportPaths=coverage.xml
//                         '''
//                     }
//                 }
//             }
//         }

//         /* ====================== DOCKER LOGIN ======================= */

//         stage('Login to Nexus Registry') {
//             steps {
//                 container('dind') {
//                     sh """
//                         docker login ${REGISTRY} -u admin -p Changeme@2025
//                     """
//                 }
//             }
//         }

//         /* ====================== TAG & PUSH IMAGES ======================= */

//         stage('Tag & Push Docker Images') {
//             steps {
//                 container('dind') {
//                     sh """
//                         docker tag blood-backend:latest ${REGISTRY}/${PROJECT}/blood-backend:latest
//                         docker tag blood-frontend:latest ${REGISTRY}/${PROJECT}/blood-frontend:latest

//                         docker push ${REGISTRY}/${PROJECT}/blood-backend:latest
//                         docker push ${REGISTRY}/${PROJECT}/blood-frontend:latest
//                     """
//                 }
//             }
//         }

//         /* ====================== DEPLOY TO K8s ======================= */

//          stage('Deploy AI Application') {
//             steps {
//                 container('kubectl') {
//                     script {
                        
//                             sh '''
//                                 # Apply all resources in deployment YAML
//                                  kubectl apply -f k8s/deployment.yaml

                               
//                             '''
                        
//                     }
//                 }
//             }
//         }
//     }
// }



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
    volumeMounts:
    - mountPath: /home/jenkins/agent
      name: workspace-volume

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
    - mountPath: /home/jenkins/agent
      name: workspace-volume

  - name: dind
    image: docker:dind
    securityContext:
      privileged: true
    command: ["dockerd-entrypoint.sh"]
    args: ["--host=tcp://0.0.0.0:2375"]
    volumeMounts:
    - name: docker-config
      mountPath: /etc/docker/daemon.json
      subPath: daemon.json
    - mountPath: /home/jenkins/agent
      name: workspace-volume

  volumes:
  - name: docker-config
    configMap:
      name: docker-daemon-config
  - name: kubeconfig-secret
    secret:
      secretName: kubeconfig-secret
  - name: workspace-volume
    emptyDir: {}
'''
        }
    }

    environment {
        REGISTRY = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
        PROJECT = "2401021-project"
        SONAR_URL = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                container('dind') {
                    sh '''
                        docker build -t blood-backend:latest -f server/Dockerfile.backend server
                        docker image ls
                    '''
                }
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                container('dind') {
                    sh '''
                        docker build -t blood-frontend:latest -f client/Dockerfile.frontend client
                        docker image ls
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    withCredentials([string(credentialsId: '2401021', variable: 'SONAR_TOKEN')]) {
                        sh """
                        sonar-scanner \
                            -Dsonar.projectKey=2401021_Blood_Donation \
                            -Dsonar.host.url=${SONAR_URL} \
                            -Dsonar.login=${SONAR_TOKEN}
                        """
                    }
                }
            }
        }

        stage('Docker Login to Nexus') {
            steps {
                container('dind') {
                    withCredentials([usernamePassword(credentialsId: 'nexus-docker-creds', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                        sh 'docker login ${REGISTRY} -u ${NEXUS_USER} -p ${NEXUS_PASS}'
                    }
                }
            }
        }

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

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh 'kubectl apply -f k8s/deployment.yaml'
                }
            }
        }
    }

    post {
        success { echo 'Pipeline completed successfully!' }
        failure { echo 'Pipeline failed!' }
    }
}
