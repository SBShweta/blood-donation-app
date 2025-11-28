pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'nexus.imcc.com:8082'
        DOCKER_CREDENTIALS = '21-nexus'
        SONARQUBE_TOKEN = credentials('2401021-SonarQube_token')
        NAMESPACE = 'blood-donation'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', 
                url: 'https://github.com/SBShweta/blood-donation-app.git',
                credentialsId: '21-nexus'
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonarqube') {
                    sh '''
                    sonar-scanner \
                    -Dsonar.projectKey=2401021_Blood_Donation \
                    -Dsonar.projectName=2401021_Blood_Donation \
                    -Dsonar.host.url=http://sonarqube.imcc.com \
                    -Dsonar.token=${SONARQUBE_TOKEN} \
                    -Dsonar.sources=server,client/src \
                    -Dsonar.exclusions=**/node_modules/**,**/build/**,**/dist/**,**/.scannerwork/**
                    '''
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    // Build frontend
                    sh 'docker build -t blood-donation-app-frontend:latest -f client/Dockerfile.frontend ./client'
                    
                    // Build backend  
                    sh 'docker build -t blood-donation-app-backend:latest -f server/Dockerfile.backend ./server'
                }
            }
        }
        
        stage('Push to Nexus') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: '21-nexus', passwordVariable: 'NEXUS_PASSWORD', usernameVariable: 'NEXUS_USERNAME')]) {
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
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    // Create namespace if not exists
                    sh "kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"
                    
                    // Apply Kubernetes manifests
                    sh "kubectl apply -f k8s/ -n ${NAMESPACE}"
                    
                    // Wait for deployment to be ready
                    sh "kubectl rollout status deployment/frontend-deployment -n ${NAMESPACE} --timeout=300s"
                    sh "kubectl rollout status deployment/backend-deployment -n ${NAMESPACE} --timeout=300s"
                }
            }
        }
    }
    
    post {
        always {
            // Clean up Docker images
            sh 'docker system prune -f'
        }
        success {
            echo 'Deployment completed successfully!'
            sh "kubectl get all -n ${NAMESPACE}"
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}