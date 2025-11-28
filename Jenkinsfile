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
        // Stage 1: Checkout (Jenkins automatically creates "Declarative: Checkout SCM")
        stage('Checkout') {
            steps {
                script {
                    echo "📥 Checking out source code..."
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: '*/main']],
                        extensions: [],
                        userRemoteConfigs: [[
                            credentialsId: "${GIT_CREDENTIALS_ID}",
                            url: 'https://github.com/SBShweta/blood-donation-app.git'
                        ]]
                    ])
                    echo "✅ Checkout completed!"
                }
            }
        }
        
        // Stage 2: Check
        stage('Check') {
            steps {
                script {
                    echo "🔍 Checking environment and files..."
                    sh '''
                    echo "=== File Structure ==="
                    ls -la
                    echo ""
                    echo "=== Checking Directories ==="
                    [ -d "client" ] && echo "✅ Client directory exists" || echo "❌ Client directory missing"
                    [ -d "server" ] && echo "✅ Server directory exists" || echo "❌ Server directory missing"
                    [ -d "k8s" ] && echo "✅ K8s directory exists" || echo "❌ K8s directory missing"
                    echo ""
                    echo "=== Checking Dockerfiles ==="
                    [ -f "client/Dockerfile.frontend" ] && echo "✅ Frontend Dockerfile exists" || echo "❌ Frontend Dockerfile missing"
                    [ -f "server/Dockerfile.backend" ] && echo "✅ Backend Dockerfile exists" || echo "❌ Backend Dockerfile missing"
                    echo ""
                    echo "=== Tools Check ==="
                    docker --version && echo "✅ Docker available"
                    kubectl version --client && echo "✅ Kubectl available" || echo "⚠️ Kubectl not available"
                    '''
                    echo "✅ Environment check completed!"
                }
            }
        }
        
        // Stage 3: Build Docker Images
        stage('Build Docker Images') {
            steps {
                script {
                    echo "🐳 Building Docker images..."
                    
                    sh '''
                    echo "📱 Building Frontend image..."
                    cd client
                    docker build -t blood-donation-app-frontend:latest -f Dockerfile.frontend .
                    echo "✅ Frontend image built!"
                    '''
                    
                    sh '''
                    echo "⚙️ Building Backend image..."
                    cd server
                    docker build -t blood-donation-app-backend:latest -f Dockerfile.backend .
                    echo "✅ Backend image built!"
                    '''
                    
                    echo "✅ All Docker images built successfully!"
                }
            }
        }
        
        // Stage 4: SonarQube Scan
        stage('SonarQube Scan') {
            steps {
                script {
                    echo "📊 Running SonarQube analysis..."
                    withSonarQubeEnv('sonarqube') {
                        withCredentials([string(credentialsId: "${SONARQUBE_CREDENTIALS_ID}", variable: 'SONAR_TOKEN')]) {
                            sh """
                            # Install sonar-scanner if not available
                            if ! command -v sonar-scanner &> /dev/null; then
                                echo "Installing sonar-scanner..."
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
                    echo "✅ SonarQube scan completed!"
                }
            }
        }
        
        // Stage 5: Login to Nexus Registry
        stage('Login to Nexus Registry') {
            steps {
                script {
                    echo "🔐 Logging into Nexus registry..."
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", passwordVariable: 'NEXUS_PASSWORD', usernameVariable: 'NEXUS_USERNAME')]) {
                        sh """
                        echo ${NEXUS_PASSWORD} | docker login -u ${NEXUS_USERNAME} --password-stdin ${DOCKER_REGISTRY}
                        """
                    }
                    echo "✅ Nexus login successful!"
                }
            }
        }
        
        // Stage 6: Tag + Push Images
        stage('Tag + Push Images') {
            steps {
                script {
                    echo "🏷️ Tagging and pushing images..."
                    
                    sh """
                    echo "📱 Tagging and pushing frontend..."
                    docker tag blood-donation-app-frontend:latest ${DOCKER_REGISTRY}/blood-donation-app-frontend:latest
                    docker push ${DOCKER_REGISTRY}/blood-donation-app-frontend:latest
                    echo "✅ Frontend pushed!"
                    """
                    
                    sh """
                    echo "⚙️ Tagging and pushing backend..."
                    docker tag blood-donation-app-backend:latest ${DOCKER_REGISTRY}/blood-donation-app-backend:latest
                    docker push ${DOCKER_REGISTRY}/blood-donation-app-backend:latest
                    echo "✅ Backend pushed!"
                    """
                    
                    echo "✅ All images tagged and pushed!"
                }
            }
        }
        
        // Stage 7: Create Namespace + Secrets
        stage('Create Namespace + Secrets') {
            steps {
                script {
                    echo "📁 Creating namespace and secrets..."
                    
                    sh """
                    # Create namespace
                    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
                    echo "✅ Namespace created"
                    
                    # Create Docker registry secret
                    kubectl create secret docker-registry nexus-registry-secret \
                        --docker-server=${DOCKER_REGISTRY} \
                        --docker-username=student \
                        --docker-password=Imcc@2025 \
                        --namespace=${NAMESPACE} \
                        --dry-run=client -o yaml | kubectl apply -f -
                    echo "✅ Registry secret created"
                    """
                    
                    echo "✅ Namespace and secrets created!"
                }
            }
        }
        
        // Stage 8: Create Registry Secrets
        stage('Create Registry Secrets') {
            steps {
                script {
                    echo "🔑 Creating additional registry secrets..."
                    
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", passwordVariable: 'NEXUS_PASSWORD', usernameVariable: 'NEXUS_USERNAME')]) {
                        sh """
                        # Create Nexus registry secret for image pull
                        kubectl create secret docker-registry nexus-pull-secret \
                            --docker-server=${DOCKER_REGISTRY} \
                            --docker-username=${NEXUS_USERNAME} \
                            --docker-password=${NEXUS_PASSWORD} \
                            --namespace=${NAMESPACE} \
                            --dry-run=client -o yaml | kubectl apply -f -
                        echo "✅ Nexus pull secret created"
                        """
                    }
                    
                    echo "✅ Registry secrets created!"
                }
            }
        }
        
        // Stage 9: Create Application Secrets
        stage('Create Application Secrets') {
            steps {
                script {
                    echo "🔐 Creating application secrets..."
                    
                    sh """
                    # Create JWT secret
                    kubectl create secret generic jwt-secret \
                        --from-literal=JWT_SECRET=your_super_secure_jwt_secret_key_2024_college_project \
                        --namespace=${NAMESPACE} \
                        --dry-run=client -o yaml | kubectl apply -f -
                    echo "✅ JWT secret created"
                    
                    # Create MongoDB secret
                    kubectl create secret generic mongo-secret \
                        --from-literal=MONGO_URI=mongodb://mongo-service:27017/blooddonation \
                        --namespace=${NAMESPACE} \
                        --dry-run=client -o yaml | kubectl apply -f -
                    echo "✅ MongoDB secret created"
                    
                    # Create application config secret
                    kubectl create secret generic app-config \
                        --from-literal=NODE_ENV=production \
                        --from-literal=PORT=5000 \
                        --namespace=${NAMESPACE} \
                        --dry-run=client -o yaml | kubectl apply -f -
                    echo "✅ App config secret created"
                    """
                    
                    echo "✅ Application secrets created!"
                }
            }
        }
        
        // Stage 10: Deploy to Kubernetes
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "🚀 Deploying to Kubernetes..."
                    
                    sh """
                    echo "=== Applying Kubernetes Manifests ==="
                    
                    # Apply MongoDB
                    kubectl apply -f k8s/mongo-deployment.yaml -n ${NAMESPACE}
                    kubectl apply -f k8s/mongo-service.yaml -n ${NAMESPACE}
                    echo "✅ MongoDB deployed"
                    
                    # Wait for MongoDB to be ready
                    echo "⏳ Waiting for MongoDB..."
                    sleep 30
                    
                    # Apply Backend
                    kubectl apply -f k8s/backend-deployment.yaml -n ${NAMESPACE}
                    kubectl apply -f k8s/backend-service.yaml -n ${NAMESPACE}
                    echo "✅ Backend deployed"
                    
                    # Apply Frontend
                    kubectl apply -f k8s/frontend-deployment.yaml -n ${NAMESPACE}
                    kubectl apply -f k8s/frontend-service.yaml -n ${NAMESPACE}
                    echo "✅ Frontend deployed"
                    
                    # Apply Ingress if exists
                    if [ -f "k8s/ingress.yaml" ]; then
                        kubectl apply -f k8s/ingress.yaml -n ${NAMESPACE}
                        echo "✅ Ingress deployed"
                    fi
                    
                    echo "✅ All deployments completed!"
                    """
                    
                    // Wait for deployments to be ready
                    sh """
                    echo "⏳ Waiting for all deployments to be ready..."
                    kubectl rollout status deployment/mongo-deployment -n ${NAMESPACE} --timeout=300s
                    kubectl rollout status deployment/backend-deployment -n ${NAMESPACE} --timeout=300s
                    kubectl rollout status deployment/frontend-deployment -n ${NAMESPACE} --timeout=300s
                    echo "✅ All deployments are ready!"
                    """
                }
            }
        }
    }
    
    // Stage 11: Declarative Post Actions (Automatically created by Jenkins)
    post {
        always {
            echo "🏁 Pipeline execution completed with status: ${currentBuild.currentResult}"
            script {
                // Cleanup
                sh 'docker system prune -f || true'
                echo "🧹 Cleanup completed"
            }
        }
        success {
            echo "🎉 🎉 🎉 PIPELINE SUCCESS! 🎉 🎉 🎉"
            echo "✅ All stages completed successfully!"
            
            sh """
            echo "=== FINAL DEPLOYMENT STATUS ==="
            kubectl get all -n ${NAMESPACE}
            echo ""
            echo "=== SERVICES ==="
            kubectl get svc -n ${NAMESPACE}
            echo ""
            echo "=== PODS ==="
            kubectl get pods -n ${NAMESPACE} -o wide
            echo ""
            echo "=== SECRETS ==="
            kubectl get secrets -n ${NAMESPACE}
            """
        }
        failure {
            echo "❌ ❌ ❌ PIPELINE FAILED! ❌ ❌ ❌"
            echo "Check the console output for details"
            
            sh """
            echo "=== DEBUG INFO ==="
            kubectl get pods -n ${NAMESPACE} 2>/dev/null || echo "No pods found"
            kubectl describe pods -n ${NAMESPACE} 2>/dev/null || echo "Cannot describe pods"
            """
        }
        unstable {
            echo "⚠️ ⚠️ ⚠️ PIPELINE UNSTABLE! ⚠️ ⚠️ ⚠️"
            echo "SonarQube quality gates may have failed"
        }
        aborted {
            echo "🛑 🛑 🛑 PIPELINE ABORTED! 🛑 🛑 🛑"
        }
    }
}