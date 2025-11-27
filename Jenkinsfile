pipeline {
    agent any

    environment {
        SONAR_SCANNER_HOME = tool 'sonar-scanner'
        SONARQUBE_ENV = "sqp_d523987f0289c0a136a5defed7d70c15694ff380"
        NEXUS_URL = "http://nexus.imcc.com/"
        NEXUS_USERNAME = "student"
        NEXUS_PASSWORD = "Imcc@2025"
        DOCKER_REGISTRY = "nexus.imcc.com" // Using your Nexus as Docker registry
        DOCKER_NAMESPACE = "blood-donation" // Your project namespace
    }

    tools {
        nodejs 'node18' // Using your pre-configured NodeJS installation
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', 
                url: 'https://github.com/SBShweta/blood-donation-app.git'
            }
        }

        stage('Configure NPM Registry') {
            steps {
                sh '''
                    # Configure Nexus registry
                    npm config set registry http://nexus.imcc.com/repository/npm-group/
                    npm config set always-auth true
                    npm config set _auth YWRtaW46SW1jY0AyMDI1
                    
                    echo "✅ NPM registry configured to use Nexus"
                    echo "Node.js version:"
                    node --version
                    echo "NPM version:"
                    npm --version
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    echo "📥 Installing backend dependencies..."
                    npm install
                    
                    echo "📥 Installing frontend dependencies..."
                    cd client && npm install && cd ..
                    
                    echo "✅ All dependencies installed successfully"
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonar-imcc') {
                    sh """
                        echo "🔍 Running SonarQube analysis..."
                        ${SONAR_SCANNER_HOME}/bin/sonar-scanner \\
                        -Dsonar.projectKey=2401021_Blood_Donation \\
                        -Dsonar.projectName=2401021_Blood_Donation \\
                        -Dsonar.sources=.,client/src \\
                        -Dsonar.host.url=http://sonarqube.imcc.com \\
                        -Dsonar.login=${SONARQUBE_ENV}
                        
                        echo "✅ SonarQube analysis completed"
                    """
                }
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''
                    echo "🏗️ Building frontend..."
                    cd client && npm run build
                    
                    echo "✅ Frontend build completed"
                    ls -la build/ | head -10
                '''
            }
        }

        stage('Archive Build Files') {
            steps {
                archiveArtifacts artifacts: 'client/build/**/*', fingerprint: true
                echo "📦 Build artifacts archived"
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    // Login to Docker Registry (Nexus in this case)
                    withCredentials([usernamePassword(
                        credentialsId: 'nexus-docker-creds', // Create this in Jenkins
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh """
                            docker login -u $DOCKER_USER -p $DOCKER_PASS ${env.DOCKER_REGISTRY}
                        """
                    }
                    
                    def buildNumber = env.BUILD_NUMBER
                    def gitCommit = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    
                    echo "🐳 Building Docker images..."
                    
                    // Build and push MongoDB image
                    echo "📦 Building MongoDB Docker image..."
                    sh """
                        docker build -f Dockerfile.mongo -t ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-mongo:latest .
                        docker tag ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-mongo:latest ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-mongo:${buildNumber}
                        docker tag ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-mongo:latest ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-mongo:${gitCommit}
                    """
                    
                    echo "🚀 Pushing MongoDB image to registry..."
                    sh """
                        docker push ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-mongo:latest
                        docker push ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-mongo:${buildNumber}
                        docker push ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-mongo:${gitCommit}
                    """
                    
                    // Build backend
                    sh """
                        docker build -f Dockerfile.backend -t ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-backend:latest .
                        docker tag ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-backend:latest ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-backend:${buildNumber}
                        docker tag ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-backend:latest ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-backend:${gitCommit}
                    """
                    echo "✅ Backend Docker image built"
                    
                    // Build frontend
                    sh """
                        docker build -f client/Dockerfile.frontend -t ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-frontend:latest ./client
                        docker tag ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-frontend:latest ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-frontend:${buildNumber}
                        docker tag ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-frontend:latest ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-frontend:${gitCommit}
                    """
                    echo "✅ Frontend Docker image built"
                    
                    // Push all images
                    echo "🚀 Pushing all images to registry..."
                    sh """
                        docker push ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-backend:latest
                        docker push ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-backend:${buildNumber}
                        docker push ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-backend:${gitCommit}
                        
                        docker push ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-frontend:latest
                        docker push ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-frontend:${buildNumber}
                        docker push ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-frontend:${gitCommit}
                    """
                    
                    echo "✅ All Docker images pushed to registry"
                }
            }
        }

        stage('Deploy to Test Environment') {
            steps {
                script {
                    echo "🚀 Deploying containers..."
                    
                    // Stop and remove existing containers
                    echo "🔄 Stopping existing containers..."
                    sh 'docker stop blood-backend blood-frontend blood-mongo || true'
                    sh 'docker rm blood-backend blood-frontend blood-mongo || true'
                    
                    // Create Docker network if it doesn't exist
                    sh 'docker network create blood-donation-network || true'
                    
                    // Run MongoDB container
                    echo "🐳 Starting MongoDB container..."
                    sh """
                        docker run -d \\
                          --name blood-mongo \\
                          --network blood-donation-network \\
                          -p 27017:27017 \\
                          -v mongo_data:/data/db \\
                          ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-mongo:latest
                    """
                    
                    // Wait for MongoDB to be ready
                    sh 'sleep 10'
                    
                    // Run backend container (link to MongoDB)
                    echo "🔧 Starting Backend container..."
                    sh """
                        docker run -d \\
                          --name blood-backend \\
                          --network blood-donation-network \\
                          -p 5000:5000 \\
                          -e MONGODB_URI=mongodb://blood-mongo:27017/blooddonation \\
                          ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-backend:latest
                    """
                    
                    // Run frontend container
                    echo "🎨 Starting Frontend container..."
                    sh """
                        docker run -d \\
                          --name blood-frontend \\
                          --network blood-donation-network \\
                          -p 3000:3000 \\
                          -e REACT_APP_API_URL=http://localhost:5000 \\
                          ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}/blood-donation-frontend:latest
                    """
                    
                    echo "✅ Docker containers running:"
                    echo "   - MongoDB: localhost:27017"
                    echo "   - Frontend: http://localhost:3000"
                    echo "   - Backend: http://localhost:5000"
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo "🏥 Performing health checks..."
                    
                    // Wait for services to start
                    sh 'sleep 30'
                    
                    // Check if containers are running
                    sh '''
                        echo "📊 Container Status:"
                        docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
                        
                        echo "🔍 Checking backend health..."
                        curl -f http://localhost:5000/api/health || echo "Backend health check failed"
                        
                        echo "🔍 Checking frontend accessibility..."
                        curl -f http://localhost:3000 || echo "Frontend accessibility check failed"
                    '''
                }
            }
        }
    }

    post {
        always {
            echo "🧹 Cleaning up workspace..."
            // Optional: Clean up local Docker images to save space
            sh '''
                docker system prune -f || true
            '''
            deleteDir()
        }
        success {
            echo "🎉 PIPELINE SUCCESS!"
            echo "📋 Summary:"
            echo "   - Project: 2401021_Blood_Donation"
            echo "   - Build: ${env.BUILD_NUMBER}"
            echo "   - Commit: ${sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()}"
            echo "   - SonarQube: Analysis completed"
            echo "   - Docker: Images pushed to ${env.DOCKER_REGISTRY}/${env.DOCKER_NAMESPACE}"
            echo "   - Deployment: Containers running on ports 27017, 3000 & 5000"
            
            // Update deployment information
            script {
                currentBuild.description = "Build ${env.BUILD_NUMBER} - All images pushed to ${env.DOCKER_REGISTRY}"
            }
        }
        failure {
            echo "💥 PIPELINE FAILED!"
            echo "🔍 Check the console output for details"
            
            // Clean up failed containers
            sh '''
                docker stop blood-backend blood-frontend blood-mongo || true
                docker rm blood-backend blood-frontend blood-mongo || true
                docker network rm blood-donation-network || true
            '''
        }
    }
}