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
    command: ["sleep", "3600"]
    tty: true

  - name: kubectl
    image: bitnami/kubectl:latest
    command: ["sleep", "3600"]
    tty: true
    env:
      - name: KUBECONFIG
        value: /kube/config
    volumeMounts:
      - name: kubeconfig-secret
        mountPath: /kube/config
        subPath: kubeconfig

  - name: kaniko
    image: gcr.io/kaniko-project/executor:latest
    args: ["--sleep=true"]
    volumeMounts:
      - name: kaniko-secret
        mountPath: /kaniko/.docker/

  volumes:
    - name: kubeconfig-secret
      secret:
        secretName: kubeconfig-secret

    - name: kaniko-secret
      secret:
        secretName: nexus-docker-secret   # <-- Create this secret in Jenkins namespace
'''
        }
    }

    environment {
        REGISTRY = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
        PROJECT = "2401021-project"
        SONAR_URL = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
    }

    stages {

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    withCredentials([string(credentialsId: '2401021', variable: 'SONAR_TOKEN')]) {
                        sh """
                        sonar-scanner \
                            -Dsonar.projectKey=2401021_Blood_Donation \
                            -Dsonar.host.url=${SONAR_URL} \
                            -Dsonar.login=$SONAR_TOKEN
                        """
                    }
                }
            }
        }

        stage('Build Backend Image with Kaniko') {
            steps {
                container('kaniko') {
                    sh """
                    /kaniko/executor \
                      --dockerfile=server/Dockerfile.backend \
                      --context=`pwd` \
                      --destination=${REGISTRY}/${PROJECT}/blood-backend:latest
                    """
                }
            }
        }

        stage('Build Frontend Image with Kaniko') {
            steps {
                container('kaniko') {
                    sh """
                    /kaniko/executor \
                      --dockerfile=client/Dockerfile.frontend \
                      --context=`pwd` \
                      --destination=${REGISTRY}/${PROJECT}/blood-frontend:latest
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh """
                    kubectl apply -f k8s/deployment.yaml
                    """
                }
            }
        }
    }
}
