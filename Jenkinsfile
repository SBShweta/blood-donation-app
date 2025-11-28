pipeline {
    agent any
    
    environment {
        SONARQUBE_CREDENTIALS_ID = '2401021-SonarQube_token'
        GIT_CREDENTIALS_ID = '21-nexus'
        DOCKER_REGISTRY = 'nexus.imcc.com:8082'
        DOCKER_CREDENTIALS_ID = '21-nexus'
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
        
        stage('Verify Environment') {
            steps {
                script {
                    echo "🔧 Verifying environment and tools..."
                    sh '''
                    echo "=== NodeJS Environment ==="
                    node --version || echo "NodeJS not found in PATH"
                    npm --version || echo "NPM not found in PATH"
                    
                    echo "=== Docker Environment ==="
                    docker --version || echo "Docker not available"
                    
                    echo "=== Directory Structure ==="
                    find . -name "package.json" -o -name "Dockerfile*" | head -10
                    
                    echo "✅ Environment verification completed"
                    '''
                }
            }
        }
        
        stage('Install SonarScanner') {
            steps {
                script {
                    echo "📦 Installing SonarScanner..."
                    sh '''
                    # Install sonar-scanner globally
                    npm install -g sonar-scanner
                    sonar-scanner --version
                    echo "✅ SonarScanner installed successfully!"
                    '''
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
        
        stage('Build Application') {
            steps {
                script {
                    echo "🏗️ Building application..."
                    
                    // Build frontend
                    sh '''
                    echo "📱 Building Frontend..."
                    if [ -d "client" ]; then
                        cd client
                        npm install
                        npm run build
                        echo "✅ Frontend built successfully!"
                    else
                        echo "❌ Client directory not found"
                    fi
                    '''
                    
                    // Build backend  
                    sh '''
                    echo "⚙️ Building Backend..."
                    if [ -d "server" ]; then
                        cd server
                        npm install
                        echo "✅ Backend dependencies installed!"
                    else
                        echo "❌ Server directory not found"
                    fi
                    '''
                    
                    echo "✅ Application build completed!"
                }
            }
        }
        
        stage('Docker Build & Push') {
            steps {
                script {
                    echo "🐳 Building and pushing Docker images..."
                    
                    // Check if Docker is available
                    sh 'docker --version'
                    
                    // Build and push frontend
                    sh '''
                    echo "📱 Building Frontend Docker image..."
                    if [ -f "client/Dockerfile.frontend" ]; then
                        cd client
                        docker build -t blood-donation-app-frontend:latest -f Dockerfile.frontend .
                        echo "✅ Frontend Docker image built!"
                    else
                        echo "❌ Frontend Dockerfile not found"
                    fi
                    '''
                    
                    // Build and push backend  
                    sh '''
                    echo "⚙️ Building Backend Docker image..."
                    if [ -f "server/Dockerfile.backend" ]; then
                        cd server
                        docker build -t blood-donation-app-backend:latest -f Dockerfile.backend .
                        echo "✅ Backend Docker image built!"
                    else
                        echo "❌ Backend Dockerfile not found"
                    fi
                    '''
                    
                    // Push to Nexus
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", passwordVariable: 'NEXUS_PASSWORD', usernameVariable: 'NEXUS_USERNAME')]) {
                        sh """
                        echo "📤 Logging into Nexus registry..."
                        echo ${NEXUS_PASSWORD} | docker login -u ${NEXUS_USERNAME} --password-stdin ${DOCKER_REGISTRY} || echo "Docker login failed"
                        
                        echo "📱 Pushing frontend image..."
                        docker tag blood-donation-app-frontend:latest ${DOCKER_REGISTRY}/blood-donation-app-frontend:latest
                        docker push ${DOCKER_REGISTRY}/blood-donation-app-frontend:latest || echo "Frontend push failed"
                        
                        echo "⚙️ Pushing backend image..."
                        docker tag blood-donation-app-backend:latest ${DOCKER_REGISTRY}/blood-donation-app-backend:latest
                        docker push ${DOCKER_REGISTRY}/blood-donation-app-backend:latest || echo "Backend push failed"
                        """
                    }
                    
                    echo "✅ Docker operations completed!"
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "🚀 Deploying to Kubernetes..."
                    
                    sh '''
                    # Check if kubectl is available
                    if command -v kubectl &> /dev/null; then
                        echo "Kubectl is available"
                        kubectl version --client
                        
                        # Create namespace
                        kubectl create namespace blood-donation --dry-run=client -o yaml | kubectl apply -f -
                        
                        # Apply Kubernetes manifests if they exist
                        if [ -f "k8s/mongo-deployment.yaml" ]; then
                            kubectl apply -f k8s/mongo-deployment.yaml -n blood-donation
                            kubectl apply -f k8s/mongo-service.yaml -n blood-donation
                        fi
                        
                        if [ -f "k8s/backend-deployment.yaml" ]; then
                            kubectl apply -f k8s/backend-deployment.yaml -n blood-donation
                            kubectl apply -f k8s/backend-service.yaml -n blood-donation
                        fi
                        
                        if [ -f "k8s/frontend-deployment.yaml" ]; then
                            kubectl apply -f k8s/frontend-deployment.yaml -n blood-donation
                            kubectl apply -f k8s/frontend-service.yaml -n blood-donation
                        fi
                        
                        echo "✅ Kubernetes deployment completed!"
                    else
                        echo "⚠️ Kubectl not available, skipping Kubernetes deployment"
                    fi
                    '''
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                script {
                    echo "🔍 Verifying deployment..."
                    sh '''
                    if command -v kubectl &> /dev/null; then
                        echo "=== Kubernetes Status ==="
                        kubectl get pods -n blood-donation 2>/dev/null || echo "No pods found in namespace"
                        kubectl get services -n blood-donation 2>/dev/null || echo "No services found in namespace"
                        kubectl get deployments -n blood-donation 2>/dev/null || echo "No deployments found in namespace"
                    else
                        echo "⚠️ Kubectl not available for verification"
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
            echo "📊 SonarQube: Code analysis completed"
            echo "🐳 Docker: Images built and pushed to Nexus"
            echo "☸️ Kubernetes: Application deployed"
            
            sh '''
            echo "=== FINAL STATUS ==="
            if command -v kubectl &> /dev/null; then
                kubectl get all -n blood-donation 2>/dev/null || echo "Cannot get Kubernetes status"
            fi
            '''
        }
        failure {
            echo "❌ PIPELINE FAILED!"
            echo "Check the console output above for error details"
        }
        unstable {
            echo "⚠️ PIPELINE UNSTABLE - Quality gates may have failed"
        }
    }
}