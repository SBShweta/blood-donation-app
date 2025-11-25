pipeline {
    agent any

    environment {
        SONAR_SCANNER_HOME = tool 'sonar-scanner'
        SONARQUBE_ENV = "sqp_d523987f0289c0a136a5defed7d70c15694ff380"
        NEXUS_URL = "http://nexus.imcc.com/"
        NEXUS_USERNAME = "student"
        NEXUS_PASSWORD = "Imcc@2025"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', 
                url: 'https://github.com/SBShweta/blood-donation-app.git'
            }
        }

        stage('Setup Node.js Manually') {
            steps {
                sh '''
                    # Install Node.js manually - faster and more reliable
                    echo "📦 Installing Node.js 18.19.1 manually..."
                    
                    # Download Node.js
                    curl -L https://nodejs.org/dist/v18.19.1/node-v18.19.1-linux-x64.tar.xz -o node.tar.xz
                    
                    # Extract
                    tar -xf node.tar.xz
                    
                    # Set PATH for current session
                    export PATH="$PWD/node-v18.19.1-linux-x64/bin:${PATH}"
                    
                    # Verify installation
                    echo "Node.js version:"
                    node --version
                    echo "NPM version:"
                    npm --version
                    
                    # Create symlinks for easier access
                    ln -sf "$PWD/node-v18.19.1-linux-x64/bin/node" /usr/local/bin/node || true
                    ln -sf "$PWD/node-v18.19.1-linux-x64/bin/npm" /usr/local/bin/npm || true
                    ln -sf "$PWD/node-v18.19.1-linux-x64/bin/npx" /usr/local/bin/npx || true
                '''
            }
        }

        stage('Configure NPM Registry') {
            steps {
                sh '''
                    # Set PATH again (each step is isolated)
                    export PATH="$PWD/node-v18.19.1-linux-x64/bin:${PATH}"
                    
                    # Configure Nexus registry
                    npm config set registry http://nexus.imcc.com/repository/npm-group/
                    npm config set always-auth true
                    npm config set _auth YWRtaW46SW1jY0AyMDI1
                    
                    echo "✅ NPM registry configured to use Nexus"
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    # Set PATH again
                    export PATH="$PWD/node-v18.19.1-linux-x64/bin:${PATH}"
                    
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
                        # Set PATH for SonarQube
                        export PATH="$PWD/node-v18.19.1-linux-x64/bin:${PATH}"
                        
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
                    # Set PATH again
                    export PATH="$PWD/node-v18.19.1-linux-x64/bin:${PATH}"
                    
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

        stage('Docker Build & Run') {
            steps {
                script {
                    echo "🐳 Building Docker images..."
                    
                    // Build backend
                    sh 'docker build -f Dockerfile.backend -t blood-donation-backend .'
                    echo "✅ Backend Docker image built"
                    
                    // Build frontend
                    sh 'docker build -f client/Dockerfile.frontend -t blood-donation-frontend ./client'
                    echo "✅ Frontend Docker image built"
                    
                    // Stop and remove existing containers
                    echo "🔄 Stopping existing containers..."
                    sh 'docker stop blood-backend || true'
                    sh 'docker rm blood-backend || true'
                    sh 'docker stop blood-frontend || true'
                    sh 'docker rm blood-frontend || true'
                    
                    // Run containers
                    echo "🚀 Starting containers..."
                    sh 'docker run -d -p 5000:5000 --name blood-backend blood-donation-backend'
                    sh 'docker run -d -p 3000:3000 --name blood-frontend blood-donation-frontend'
                    
                    echo "✅ Docker containers running:"
                    echo "   - Frontend: http://localhost:3000"
                    echo "   - Backend: http://localhost:5000"
                }
            }
        }
    }

    post {
        always {
            echo "🧹 Cleaning up workspace..."
            deleteDir()
        }
        success {
            echo "🎉 PIPELINE SUCCESS!"
            echo "📋 Summary:"
            echo "   - Project: 2401021_Blood_Donation"
            echo "   - Build: ${env.BUILD_NUMBER}"
            echo "   - SonarQube: Analysis completed"
            echo "   - Docker: Containers running on ports 3000 & 5000"
            echo "   - Artifacts: Archived successfully"
        }
        failure {
            echo "💥 PIPELINE FAILED!"
            echo "🔍 Check the console output for details"
            echo "💡 Tip: The issue might be network-related or missing dependencies"
        }
    }
}