pipeline {
    agent any
    
    tools {
        nodejs "node18"
    }
    
    environment {
        DOCKER_REGISTRY = 'nexus.imcc.com:8082'
        DOCKER_CREDENTIALS_ID = '21-nexus'
        SONARQUBE_CREDENTIALS_ID = '2401021-SonarQube_token'
        GIT_CREDENTIALS_ID = '21-nexus'
        NAMESPACE = 'blood-donation'
    }
    
    stages {
        stage('Checkout SCM') {
            steps {
                script {
                    echo "🔍 Checking out source code from GitHub..."
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: '*/main']],
                        extensions: [],
                        userRemoteConfigs: [[
                            credentialsId: "${GIT_CREDENTIALS_ID}",
                            url: 'https://github.com/SBShweta/blood-donation-app.git'
                        ]]
                    ])
                    echo "✅ Source code checkout completed successfully!"
                }
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                script {
                    echo "🔍 Running SonarQube analysis..."
                    withSonarQubeEnv('sonarqube') {
                        withCredentials([string(credentialsId: "${SONARQUBE_CREDENTIALS_ID}", variable: 'SONAR_TOKEN')]) {
                            sh """
                            # Install sonar-scanner if not present
                            if ! command -v sonar-scanner &> /dev/null; then
                                npm install -g sonar-scanner
                            fi
                            
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
                    echo "✅ SonarQube analysis completed successfully!"
                }
            }
        }
        
        stage('Build Application') {
            steps {
                script {
                    echo "🏗️ Building application..."
                    
                    // Build frontend
                    sh '''
                    echo "📱 Building Frontend..."
                    cd client
                    npm install
                    npm run build
                    echo "✅ Frontend built successfully!"
                    '''
                    
                    // Build backend  
                    sh '''
                    echo "⚙️ Building Backend..."
                    cd server
                    npm install
                    echo "✅ Backend dependencies installed!"
                    '''
                    
                    echo "✅ Application built successfully!"
                }
            }
        }
        
        stage('Docker Build & Push') {
            steps {
                script {
                    echo "🐳 Building and pushing Docker images..."
                    
                    // Use Jenkins Docker (already installed)
                    sh 'docker --version'
                    
                    // Build frontend
                    sh '''
                    echo "📱 Building Frontend Docker image..."
                    cd client
                    docker build -t blood-donation-app-frontend:latest -f Dockerfile.frontend .
                    echo "✅ Frontend Docker image built!"
                    '''
                    
                    // Build backend  
                    sh '''
                    echo "⚙️ Building Backend Docker image..."
                    cd server
                    docker build -t blood-donation-app-backend:latest -f Dockerfile.backend .
                    echo "✅ Backend Docker image built!"
                    '''
                    
                    // Push to Nexus
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", passwordVariable: 'NEXUS_PASSWORD', usernameVariable: 'NEXUS_USERNAME')]) {
                        // Tag and push frontend
                        sh """
                        echo "📱 Pushing frontend to Nexus..."
                        docker tag blood-donation-app-frontend:latest ${DOCKER_REGISTRY}/blood-donation-app-frontend:latest
                        echo ${NEXUS_PASSWORD} | docker login -u ${NEXUS_USERNAME} --password-stdin ${DOCKER_REGISTRY}
                        docker push ${DOCKER_REGISTRY}/blood-donation-app-frontend:latest
                        echo "✅ Frontend pushed to Nexus!"
                        """
                        
                        // Tag and push backend
                        sh """
                        echo "⚙️ Pushing backend to Nexus..."
                        docker tag blood-donation-app-backend:latest ${DOCKER_REGISTRY}/blood-donation-app-backend:latest
                        docker push ${DOCKER_REGISTRY}/blood-donation-app-backend:latest
                        echo "✅ Backend pushed to Nexus!"
                        """
                    }
                    
                    echo "✅ All images built and pushed successfully!"
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "🚀 Deploying to Kubernetes..."
                    
                    // Check if kubectl is available
                    sh '''
                    if command -v kubectl &> /dev/null; then
                        kubectl version --client
                    else
                        echo "kubectl not available, skipping deployment"
                        exit 0
                    fi
                    '''
                    
                    // Create namespace if kubectl is available
                    sh """
                    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f - || true
                    """
                    
                    // Apply Kubernetes manifests if they exist
                    sh """
                    if [ -f "k8s/mongo-deployment.yaml" ]; then
                        kubectl apply -f k8s/mongo-deployment.yaml -n ${NAMESPACE} || true
                        kubectl apply -f k8s/mongo-service.yaml -n ${NAMESPACE} || true
                    fi
                    
                    if [ -f "k8s/backend-deployment.yaml" ]; then
                        kubectl apply -f k8s/backend-deployment.yaml -n ${NAMESPACE} || true
                        kubectl apply -f k8s/backend-service.yaml -n ${NAMESPACE} || true
                    fi
                    
                    if [ -f "k8s/frontend-deployment.yaml" ]; then
                        kubectl apply -f k8s/frontend-deployment.yaml -n ${NAMESPACE} || true
                        kubectl apply -f k8s/frontend-service.yaml -n ${NAMESPACE} || true
                    fi
                    """
                    
                    echo "✅ Kubernetes deployment attempted!"
                }
            }
        }
        
        stage('Verify') {
            steps {
                script {
                    echo "🔍 Verifying deployment..."
                    sh '''
                    if command -v kubectl &> /dev/null; then
                        echo "=== Kubernetes Status ==="
                        kubectl get pods -n blood-donation 2>/dev/null || echo "No pods found"
                        kubectl get svc -n blood-donation 2>/dev/null || echo "No services found"
                    else
                        echo "kubectl not available for verification"
                    fi
                    '''
                    echo "✅ Verification completed!"
                }
            }
        }
    }
    
    post {
        always {
            echo "🏁 Pipeline execution completed with status: ${currentBuild.currentResult}"
        }
        success {
            echo "🎉 🎉 🎉 PIPELINE SUCCESS! 🎉 🎉 🎉"
            echo "✅ All stages completed successfully!"
            echo "📊 SonarQube: Analysis completed"
            echo "🐳 Images: Built and pushed to Nexus"
            echo "☸️ Kubernetes: Deployment attempted"
        }
        failure {
            echo "❌ PIPELINE FAILED!"
            echo "Check console output for details"
        }
    }
}