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
                    sh 'ls -la'
                }
            }
        }
        
        stage('Install Tools') {
            steps {
                script {
                    echo "📦 Installing required tools..."
                    sh '''
                    # Install Docker
                    curl -fsSL https://get.docker.com | sh
                    docker --version
                    echo "✅ Docker installed"
                    
                    # Install kubectl
                    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
                    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
                    kubectl version --client
                    echo "✅ kubectl installed"
                    
                    # Install sonar-scanner using npm
                    npm install -g sonar-scanner
                    sonar-scanner --version
                    echo "✅ SonarScanner installed"
                    '''
                    echo "✅ All tools installed successfully!"
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
        
        stage('Build Docker Images') {
            steps {
                script {
                    echo "🐳 Building Docker images..."
                    
                    // Build frontend
                    sh '''
                    echo "📱 Building Frontend Docker image..."
                    cd client
                    docker build -t blood-donation-app-frontend:latest -f Dockerfile.frontend .
                    echo "✅ Frontend Docker image built successfully!"
                    '''
                    
                    // Build backend  
                    sh '''
                    echo "⚙️ Building Backend Docker image..."
                    cd server
                    docker build -t blood-donation-app-backend:latest -f Dockerfile.backend .
                    echo "✅ Backend Docker image built successfully!"
                    '''
                    
                    echo "✅ All Docker images built successfully!"
                }
            }
        }
        
        stage('Push to Nexus') {
            steps {
                script {
                    echo "📤 Pushing images to Nexus registry..."
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", passwordVariable: 'NEXUS_PASSWORD', usernameVariable: 'NEXUS_USERNAME')]) {
                        // Tag and push frontend
                        sh """
                        echo "📱 Tagging and pushing frontend image..."
                        docker tag blood-donation-app-frontend:latest ${DOCKER_REGISTRY}/blood-donation-app-frontend:latest
                        docker login -u ${NEXUS_USERNAME} -p ${NEXUS_PASSWORD} ${DOCKER_REGISTRY}
                        docker push ${DOCKER_REGISTRY}/blood-donation-app-frontend:latest
                        echo "✅ Frontend image pushed to Nexus!"
                        """
                        
                        // Tag and push backend
                        sh """
                        echo "⚙️ Tagging and pushing backend image..."
                        docker tag blood-donation-app-backend:latest ${DOCKER_REGISTRY}/blood-donation-app-backend:latest
                        docker push ${DOCKER_REGISTRY}/blood-donation-app-backend:latest
                        echo "✅ Backend image pushed to Nexus!"
                        """
                    }
                    echo "✅ All images pushed to Nexus successfully!"
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "🚀 Deploying to Kubernetes..."
                    
                    // Create namespace
                    sh """
                    echo "📁 Creating namespace..."
                    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
                    echo "✅ Namespace created!"
                    """
                    
                    // Apply all Kubernetes manifests
                    sh """
                    echo "📋 Applying Kubernetes manifests..."
                    if [ -f "k8s/namespace.yaml" ]; then
                        kubectl apply -f k8s/namespace.yaml
                    fi
                    kubectl apply -f k8s/mongo-deployment.yaml -n ${NAMESPACE}
                    kubectl apply -f k8s/mongo-service.yaml -n ${NAMESPACE}
                    echo "⏳ Waiting for MongoDB to be ready..."
                    sleep 30
                    kubectl apply -f k8s/backend-deployment.yaml -n ${NAMESPACE}  
                    kubectl apply -f k8s/backend-service.yaml -n ${NAMESPACE}
                    kubectl apply -f k8s/frontend-deployment.yaml -n ${NAMESPACE}
                    kubectl apply -f k8s/frontend-service.yaml -n ${NAMESPACE}
                    if [ -f "k8s/ingress.yaml" ]; then
                        kubectl apply -f k8s/ingress.yaml -n ${NAMESPACE}
                    fi
                    echo "✅ All Kubernetes manifests applied!"
                    """
                    
                    // Wait for deployments to be ready
                    sh """
                    echo "⏳ Waiting for deployments to be ready..."
                    kubectl rollout status deployment/mongo-deployment -n ${NAMESPACE} --timeout=300s && echo "✅ MongoDB deployment ready!"
                    kubectl rollout status deployment/backend-deployment -n ${NAMESPACE} --timeout=300s && echo "✅ Backend deployment ready!"
                    kubectl rollout status deployment/frontend-deployment -n ${NAMESPACE} --timeout=300s && echo "✅ Frontend deployment ready!"
                    echo "✅ All deployments are ready!"
                    """
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                script {
                    echo "🔍 Verifying deployment..."
                    sh """
                    echo "=== 🎯 Deployment Status ==="
                    kubectl get all -n ${NAMESPACE}
                    echo ""
                    echo "=== 🔗 Services ==="
                    kubectl get svc -n ${NAMESPACE}
                    echo ""
                    echo "=== 📦 Pods ==="
                    kubectl get pods -n ${NAMESPACE} -o wide
                    echo ""
                    echo "=== 🌐 Ingress ==="
                    kubectl get ingress -n ${NAMESPACE} 2>/dev/null || echo "No ingress found"
                    echo ""
                    echo "=== 📊 Pod Status ==="
                    kubectl get pods -n ${NAMESPACE} -o jsonpath='{range .items[*]}{.metadata.name}{\"\\t\"}{.status.phase}{\"\\t\"}{.status.startTime}{\"\\n\"}{end}'
                    """
                    echo "✅ Deployment verification completed!"
                }
            }
        }
    }
    
    post {
        always {
            echo "🏁 Pipeline execution completed with status: ${currentBuild.currentResult}"
            script {
                // Clean up Docker images to save space
                sh 'docker system prune -f || true'
                echo "🧹 Docker cleanup completed"
            }
        }
        success {
            echo "🎉 🎉 🎉 PIPELINE SUCCESS! 🎉 🎉 🎉"
            echo "✅ All stages completed successfully!"
            echo "📱 Frontend: Available at http://blood-donation.imcc.com"
            echo "⚙️ Backend API: Available at http://blood-donation.imcc.com/api"
            echo "📊 SonarQube: Analysis completed successfully"
            echo "🐳 Images: Successfully pushed to Nexus"
            echo "☸️ Kubernetes: Application deployed successfully"
            
            // Display final status
            sh """
            echo "=== 🎊 FINAL DEPLOYMENT STATUS ==="
            kubectl get pods,svc,deploy -n ${NAMESPACE}
            echo "=== 🎊 PIPELINE COMPLETED SUCCESSFULLY! ==="
            """
        }
        failure {
            echo "❌ ❌ ❌ PIPELINE FAILED! ❌ ❌ ❌"
            echo "Please check the console output for details."
            sh """
            echo "=== 🔍 DEBUG INFO ==="
            kubectl get pods -n ${NAMESPACE} 2>/dev/null || echo "No namespace found"
            kubectl describe pods -n ${NAMESPACE} 2>/dev/null || echo "Cannot describe pods"
            """
        }
        unstable {
            echo "⚠️ ⚠️ ⚠️ PIPELINE UNSTABLE! ⚠️ ⚠️ ⚠️"
            echo "Some quality gates may not have passed."
        }
        aborted {
            echo "🛑 🛑 🛑 PIPELINE ABORTED! 🛑 🛑 🛑"
            echo "Pipeline was manually aborted."
        }
    }
}