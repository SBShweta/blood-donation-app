pipeline {
    agent any

    tools {
        nodejs "node18"
    }

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
                git branch: 'main', url: 'https://github.com/SBShweta/blood-donation-app.git'
            }
        }

        stage('Configure NPM Registry (Nexus)') {
            steps {
                sh '''
                    npm config set registry http://nexus.imcc.com/repository/npm-group/
                    npm config set always-auth true
                    npm config set _auth YWRtaW46SW1jY0AyMDI1
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'                    // backend
                sh 'cd client && npm install'      // frontend
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonar-imcc') {
                    sh """
                        ${SONAR_SCANNER_HOME}/bin/sonar-scanner \
                        -Dsonar.projectKey=2401021_Blood_Donation \
                        -Dsonar.projectName=2401021_Blood_Donation \
                        -Dsonar.sources=server,client \
                        -Dsonar.host.url=http://sonarqube.imcc.com \
                        -Dsonar.login=${SONARQUBE_ENV}
                    """
                }
            }
        }

        stage('Build MERN App') {
            steps {
                sh 'cd client && npm run build'
            }
        }

        stage('Archive Build Files') {
            steps {
                archiveArtifacts artifacts: 'client/build/**', fingerprint: true
            }
        }

        stage('Publish to Nexus') {
            steps {
                script {
                    // Package the application
                    sh 'npm pack'
                    
                    // Get the package name
                    def packageName = sh(script: 'ls *.tgz', returnStdout: true).trim()
                    
                    // Upload to Nexus repository
                    sh """
                        curl -u ${NEXUS_USERNAME}:${NEXUS_PASSWORD} \
                        --upload-file ${packageName} \
                        ${NEXUS_URL}/repository/npm-releases/
                    """
                    
                    // Also archive the build artifacts in Nexus
                    sh """
                        curl -u ${NEXUS_USERNAME}:${NEXUS_PASSWORD} \
                        --upload-file client/build/** \
                        ${NEXUS_URL}/repository/build-artifacts/
                    """
                }
            }
        }

        stage('Generate Nexus Report') {
            steps {
                script {
                    // Create a simple deployment report
                    def reportContent = """
                    NEXUS DEPLOYMENT REPORT
                    ======================
                    Project: 2401021_Blood_Donation
                    Deployment Time: ${new Date()}
                    Nexus URL: ${NEXUS_URL}
                    Artifacts Published:
                    - NPM Package to npm-releases repository
                    - Build artifacts to build-artifacts repository
                    Status: SUCCESS
                    """
                    
                    writeFile file: 'nexus-deployment-report.txt', text: reportContent
                    archiveArtifacts artifacts: 'nexus-deployment-report.txt', fingerprint: true
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t mern-app .'
            }
        }

        stage('Docker Run') {
            steps {
                sh 'docker run -d -p 3000:3000 --name mern mern-app'
            }
        }
    }

    post {
        always {
            // Clean up workspace
            cleanWs()
        }
        success {
            emailext (
                subject: "SUCCESS: Pipeline ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: """
                Pipeline execution completed successfully!
                
                Project: 2401021_Blood_Donation
                Build: ${env.BUILD_NUMBER}
                SonarQube Analysis: Completed
                Nexus Deployment: Completed
                Docker Container: Running on port 3000
                
                Check Nexus: ${NEXUS_URL}
                Check SonarQube: http://sonarqube.imcc.com
                """,
                to: "your-email@example.com"
            )
        }
        failure {
            emailext (
                subject: "FAILED: Pipeline ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: """
                Pipeline execution failed!
                
                Project: 2401021_Blood_Donation
                Build: ${env.BUILD_NUMBER}
                Please check Jenkins logs for details.
                """,
                to: "your-email@example.com"
            )
        }
    }
}