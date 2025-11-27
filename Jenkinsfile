pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "nexus.imcc.com"
        DOCKER_NAMESPACE = "blood-donation"
        NEXUS_URL = "http://nexus.imcc.com/"
    }

    parameters {
        choice(
            name: 'DEPLOY_ENV',
            choices: ['dev', 'qa', 'prod'],
            description: 'Select deployment environment'
        )
    }

    tools {
        nodejs 'node18'
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', 
                url: 'https://github.com/SBShweta/blood-donation-app.git'
            }
        }

        stage('Setup Environment') {
            steps {
                script {
                    env.KUBE_NAMESPACE = "blood-donation-${params.DEPLOY_ENV}"
                    echo "🎯 Deployment to: ${env.KUBE_NAMESPACE}"
                }
            }
        }

        stage('Configure NPM') {
            steps {
                sh '''
                    echo "📦 Configuring NPM registry..."
                    npm config set registry http://nexus.imcc.com/repository/npm-group/
                    npm config set always-auth true
                    echo "Node: $(node --version)"
                    echo "NPM: $(npm --version)"
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    echo "📥 Installing backend dependencies..."
                    cd client && npm install && cd ..
                    npm install
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                sh '''
                    echo "🔍 Running SonarQube analysis..."
                    sonar-scanner -Dproject.settings=sonar-project.properties
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''
                    echo "🏗️ Building frontend..."
                    cd client && npm run build && cd ..
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    echo "🐳 Building Docker images..."
                    
                    sh """
                        docker build -t blood-donation-backend:latest -f Dockerfile.backend .
                        docker build -t blood-donation-frontend:latest -f client/Dockerfile.frontend ./client
                    """
                }
            }
        }

        stage('Push to Nexus') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'nexus-creds',
                        usernameVariable: 'NEXUS_USER',
                        passwordVariable: 'NEXUS_PASS'
                    )]) {
                        sh """
                            docker login -u $NEXUS_USER -p $NEXUS_PASS ${env.DOCKER_REGISTRY}
                            docker tag blood-donation-backend:latest ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-backend:${env.BUILD_NUMBER}
                            docker tag blood-donation-frontend:latest ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-frontend:${env.BUILD_NUMBER}
                            
                            docker push ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-backend:${env.BUILD_NUMBER}
                            docker push ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-frontend:${env.BUILD_NUMBER}
                        """
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "🚀 Deploying to Kubernetes..."
                    
                    sh """
                        # Create namespace
                        kubectl create namespace ${env.KUBE_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
                        
                        # Deploy MongoDB
                        kubectl apply -f k8s/mongo-secret.yaml -n ${env.KUBE_NAMESPACE}
                        kubectl apply -f k8s/mongo-configmap.yaml -n ${env.KUBE_NAMESPACE}
                        kubectl apply -f k8s/mongo-deployment.yaml -n ${env.KUBE_NAMESPACE}
                        kubectl apply -f k8s/mongo-service.yaml -n ${env.KUBE_NAMESPACE}
                        
                        # Wait for MongoDB
                        kubectl wait --for=condition=ready pod -l app=mongodb -n ${env.KUBE_NAMESPACE} --timeout=120s
                        
                        # Deploy Backend
                        kubectl apply -f k8s/backend-deployment.yaml -n ${env.KUBE_NAMESPACE}
                        kubectl apply -f k8s/backend-service.yaml -n ${env.KUBE_NAMESPACE}
                        
                        # Deploy Frontend
                        kubectl apply -f k8s/frontend-deployment.yaml -n ${env.KUBE_NAMESPACE}
                        kubectl apply -f k8s/frontend-service.yaml -n ${env.KUBE_NAMESPACE}
                    """
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    sh """
                        sleep 30
                        echo "📊 Deployment Status:"
                        kubectl get pods -n ${env.KUBE_NAMESPACE}
                        echo ""
                        echo "🌐 Services:"
                        kubectl get svc -n ${env.KUBE_NAMESPACE}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "🎉 PIPELINE SUCCESS! Application deployed to ${env.KUBE_NAMESPACE}"
        }
        failure {
            echo "💥 PIPELINE FAILED! Check logs above"
        }
    }
}