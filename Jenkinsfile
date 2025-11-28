pipeline {
    agent {
        kubernetes {
            label "my-jenkins-jenkins-agent"
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: jnlp
    image: jenkins/inbound-agent:3283.v92c105e0f819-7
    imagePullPolicy: IfNotPresent
    resources:
      limits:
        memory: "512Mi"
        cpu: "512m"
      requests:
        memory: "512Mi"
        cpu: "512m"
    volumeMounts:
    - mountPath: "/home/jenkins/agent"
      name: "workspace-volume"
  - name: docker
    image: docker:dind
    imagePullPolicy: IfNotPresent
    resources:
      limits:
        memory: "4Gi"
        cpu: "1"
      requests:
        memory: "1Gi"
        cpu: "500m"
    securityContext:
      privileged: true
    volumeMounts:
    - mountPath: "/home/jenkins/agent"
      name: "workspace-volume"
    - mountPath: "/var/run/docker.sock"
      name: "docker-sock"
  - name: kubectl
    image: bitnami/kubectl:latest
    imagePullPolicy: IfNotPresent
    command:
    - cat
    tty: true
    volumeMounts:
    - mountPath: "/home/jenkins/agent"
      name: "workspace-volume"
  volumes:
  - name: "workspace-volume"
    emptyDir: {}
  - name: "docker-sock"
    hostPath:
      path: "/var/run/docker.sock"
"""
        }
    }
    
    environment {
        DOCKER_REGISTRY = 'nexus.imcc.com:8082'
        DOCKER_CREDENTIALS_ID = '21-nexus'
        SONARQUBE_CREDENTIALS_ID = '2401021-SonarQube_token'
        GIT_CREDENTIALS_ID = '21-nexus'
        NAMESPACE = 'blood-donation'
        KUBECONFIG = '/home/jenkins/agent/.kube/config'
    }
    
    stages {
        stage('Checkout SCM') {
            steps {
                script {
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: '*/main']],
                        extensions: [],
                        userRemoteConfigs: [[
                            credentialsId: "${GIT_CREDENTIALS_ID}",
                            url: 'https://github.com/SBShweta/blood-donation-app.git'
                        ]]
                    ])
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                container('docker') {
                    script {
                        // Install sonar-scanner
                        sh '''
                        apk add --no-cache curl unzip
                        wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
                        unzip sonar-scanner-cli-5.0.1.3006-linux.zip
                        mv sonar-scanner-5.0.1.3006-linux /opt/sonar-scanner
                        '''
                        
                        // Install kubectl
                        sh '''
                        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
                        install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
                        '''
                    }
                }
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                container('docker') {
                    withSonarQubeEnv('sonarqube') {
                        script {
                            withCredentials([string(credentialsId: "${SONARQUBE_CREDENTIALS_ID}", variable: 'SONAR_TOKEN')]) {
                                sh """
                                export PATH=/opt/sonar-scanner/bin:$PATH
                                sonar-scanner \
                                -Dsonar.projectKey=2401021_Blood_Donation \
                                -Dsonar.projectName=2401021_Blood_Donation \
                                -Dsonar.host.url=http://sonarqube.imcc.com \
                                -Dsonar.token=${SONAR_TOKEN} \
                                -Dsonar.sources=server,client/src \
                                -Dsonar.exclusions=**/node_modules/**,**/build/**,**/dist/**,**/.scannerwork/** \
                                -Dsonar.sourceEncoding=UTF-8 \
                                -Dsonar.language=js
                                """
                            }
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                container('docker') {
                    script {
                        // Build frontend
                        sh '''
                        cd client
                        docker build -t blood-donation-app-frontend:latest -f Dockerfile.frontend .
                        '''
                        
                        // Build backend  
                        sh '''
                        cd server
                        docker build -t blood-donation-app-backend:latest -f Dockerfile.backend .
                        '''
                    }
                }
            }
        }
        
        stage('Push to Nexus') {
            steps {
                container('docker') {
                    script {
                        withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", passwordVariable: 'NEXUS_PASSWORD', usernameVariable: 'NEXUS_USERNAME')]) {
                            // Tag and push frontend
                            sh """
                            docker tag blood-donation-app-frontend:latest ${DOCKER_REGISTRY}/blood-donation-app-frontend:latest
                            docker login -u ${NEXUS_USERNAME} -p ${NEXUS_PASSWORD} ${DOCKER_REGISTRY}
                            docker push ${DOCKER_REGISTRY}/blood-donation-app-frontend:latest
                            """
                            
                            // Tag and push backend
                            sh """
                            docker tag blood-donation-app-backend:latest ${DOCKER_REGISTRY}/blood-donation-app-backend:latest
                            docker push ${DOCKER_REGISTRY}/blood-donation-app-backend:latest
                            """
                        }
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    script {
                        // Configure kubectl (you may need to set up your kubeconfig)
                        sh '''
                        mkdir -p /home/jenkins/agent/.kube
                        # Add your kubeconfig here or use service account
                        '''
                        
                        // Create namespace
                        sh "kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"
                        
                        // Apply all Kubernetes manifests
                        sh """
                        kubectl apply -f k8s/namespace.yaml
                        kubectl apply -f k8s/mongo-deployment.yaml -n ${NAMESPACE}
                        kubectl apply -f k8s/mongo-service.yaml -n ${NAMESPACE}
                        sleep 30  # Wait for MongoDB to be ready
                        kubectl apply -f k8s/backend-deployment.yaml -n ${NAMESPACE}  
                        kubectl apply -f k8s/backend-service.yaml -n ${NAMESPACE}
                        kubectl apply -f k8s/frontend-deployment.yaml -n ${NAMESPACE}
                        kubectl apply -f k8s/frontend-service.yaml -n ${NAMESPACE}
                        kubectl apply -f k8s/ingress.yaml -n ${NAMESPACE}
                        """
                        
                        // Wait for deployments to be ready
                        sh "kubectl rollout status deployment/mongo-deployment -n ${NAMESPACE} --timeout=300s"
                        sh "kubectl rollout status deployment/backend-deployment -n ${NAMESPACE} --timeout=300s"
                        sh "kubectl rollout status deployment/frontend-deployment -n ${NAMESPACE} --timeout=300s"
                    }
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                container('kubectl') {
                    script {
                        sh """
                        echo "=== Deployment Status ==="
                        kubectl get all -n ${NAMESPACE}
                        echo ""
                        echo "=== Services ==="
                        kubectl get svc -n ${NAMESPACE}
                        echo ""
                        echo "=== Pods ==="
                        kubectl get pods -n ${NAMESPACE}
                        echo ""
                        echo "=== Ingress ==="
                        kubectl get ingress -n ${NAMESPACE}
                        """
                    }
                }
            }
        }
    }
    
    post {
        always {
            container('docker') {
                script {
                    // Clean up Docker images to save space
                    sh 'docker system prune -f || true'
                    echo "Build completed - ${currentBuild.result}"
                }
            }
        }
        success {
            echo '🎉 Deployment completed successfully!'
            emailext (
                subject: "SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "The build ${env.BUILD_URL} completed successfully.",
                to: "student@imcc.com"
            )
        }
        failure {
            echo '❌ Deployment failed!'
            emailext (
                subject: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "The build ${env.BUILD_URL} failed. Please check the console output.",
                to: "student@imcc.com"
            )
        }
        unstable {
            echo '⚠️ Build is unstable!'
        }
    }
}