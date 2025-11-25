pipeline {
    agent any

    tools {
        nodejs "node18"
    }

    environment {
        SONAR_SCANNER_HOME = tool 'sonar-scanner'
        SONARQUBE_ENV = "sqp_d523987f0289c0a136a5defed7d70c15694ff380"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/YOUR_USERNAME/YOUR_REPO.git'
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
}
