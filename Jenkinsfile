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

    stages {

        stage('Build Docker Image') {
            steps {
                container('dind') {
                    sh """
                        sleep 10
                        docker build -t blood-donation-app:latest .
                        docker image ls
                    """
                }
            }
        }

        stage('Run Tests') {
            steps {
                container('dind') {
                    sh """
                        docker run --rm blood-donation-app:latest npm test || true
                    """
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    withCredentials([string(credentialsId: 'sqp_d523987f0289c0a136a5defed7d70c15694ff380', variable: 'SONAR_TOKEN')]) {
                        sh """
                            sonar-scanner \
                                -Dsonar.projectKey=2401021_Blood_Donation \
                                -Dsonar.projectName=2401021_Blood_Donation \
                                -Dsonar.host.url=http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000 \
                                -Dsonar.login=$SONAR_TOKEN \
                                -Dsonar.sources=. \
                                -Dsonar.language=js \
                                -Dsonar.sourceEncoding=UTF-8 \
                                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                        """
                    }
                }
            }
        }

        stage('Login to Nexus Registry') {
            steps {
                container('dind') {
                    sh """
                        docker login nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085 \
                        -u admin -p Changeme@2025
                    """
                }
            }
        }

        stage('Tag & Push Image to Nexus') {
            steps {
                container('dind') {
                    sh """
                        docker tag blood-donation-app:latest \
                        nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085/blood-donation/blood-donation-app:latest

                        docker push nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085/blood-donation/blood-donation-app:latest

                        docker image ls
                    """
                }
            }
        }

        stage('Deploy Blood Donation App') {
            steps {
                container('kubectl') {
                    script {
                        dir('k8s-deployment') {
                            sh """
                                kubectl apply -f blood-donation-deployment.yaml
                                kubectl rollout status deployment/blood-donation-deployment -n 2401021
                            """
                        }
                    }
                }
            }
        }

    }
}
