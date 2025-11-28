// pipeline {
//     agent any
    
//     environment {
//         SONARQUBE_CREDENTIALS_ID = '2401021-SonarQube_token'
//         GIT_CREDENTIALS_ID = '21-nexus'
//         DOCKER_REGISTRY = 'nexus.imcc.com:8082'
//         DOCKER_CREDENTIALS_ID = '21-nexus'
//         NAMESPACE = 'blood-donation'
//     }
    
//     stages {
//         // Stage 1: Checkout
//         stage('Checkout') {
//             steps {
//                 script {
//                     echo "📥 Checking out source code..."
//                     checkout([
//                         $class: 'GitSCM',
//                         branches: [[name: '*/main']],
//                         extensions: [],
//                         userRemoteConfigs: [[
//                             credentialsId: "${GIT_CREDENTIALS_ID}",
//                             url: 'https://github.com/SBShweta/blood-donation-app.git'
//                         ]]
//                     ])
//                     echo "✅ Checkout completed!"
//                 }
//             }
//         }
        
//         // Stage 2: Check
//         stage('Check') {
//             steps {
//                 script {
//                     echo "🔍 Checking environment and files..."
//                     sh '''
//                     echo "=== File Structure ==="
//                     ls -la
//                     echo ""
//                     echo "=== Checking Directories ==="
//                     [ -d "client" ] && echo "✅ Client directory exists" || echo "❌ Client directory missing"
//                     [ -d "server" ] && echo "✅ Server directory exists" || echo "❌ Server directory missing"
//                     [ -d "k8s" ] && echo "✅ K8s directory exists" || echo "❌ K8s directory missing"
//                     echo ""
//                     echo "=== Checking Dockerfiles ==="
//                     [ -f "client/Dockerfile.frontend" ] && echo "✅ Frontend Dockerfile exists" || echo "❌ Frontend Dockerfile missing"
//                     [ -f "server/Dockerfile.backend" ] && echo "✅ Backend Dockerfile exists" || echo "❌ Backend Dockerfile missing"
//                     '''
//                     echo "✅ Environment check completed!"
//                 }
//             }
//         }
        
//         // Stage 3: Install Required Tools
//         stage('Install Tools') {
//             steps {
//                 script {
//                     echo "🔧 Installing required tools..."
                    
//                     sh '''
//                     echo "=== Installing Docker ==="
//                     apk update && apk add docker docker-cli
//                     # Start Docker daemon
//                     nohup dockerd > /var/log/docker.log 2>&1 &
//                     sleep 20
//                     echo "Docker version:"
//                     docker --version || echo "Docker check failed"
                    
//                     echo "=== Installing kubectl ==="
//                     curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
//                     chmod +x kubectl
//                     mv kubectl /usr/local/bin/
//                     echo "Kubectl version:"
//                     kubectl version --client || echo "Kubectl check failed"
//                     '''
                    
//                     echo "✅ Tools installation completed!"
//                 }
//             }
//         }
        
//         // Stage 4: SonarQube Scan
//         stage('SonarQube Scan') {
//             steps {
//                 script {
//                     echo "📊 Running SonarQube analysis..."
                    
//                     withSonarQubeEnv('sonarqube') {
//                         sh '''
//                         sonar-scanner \
//                         -Dsonar.projectKey=2401021_Blood_Donation \
//                         -Dsonar.projectName=2401021_Blood_Donation \
//                         -Dsonar.host.url=http://sonarqube.imcc.com \
//                         -Dsonar.sources=server,client/src \
//                         -Dsonar.exclusions=**/node_modules/**,**/build/**,**/dist/**,**/.scannerwork/** \
//                         -Dsonar.sourceEncoding=UTF-8 \
//                         -Dsonar.language=js
//                         '''
//                     }
//                     echo "✅ SonarQube scan completed!"
//                 }
//             }
//         }
        
//         // Stage 5: Build Docker Images
//         stage('Build Docker Images') {
//             steps {
//                 script {
//                     echo "🐳 Building Docker images from source..."
                    
//                     sh '''
//                     echo "📱 Building Frontend image..."
//                     cd client
//                     docker build -t blood-donation-app-frontend:latest -f Dockerfile.frontend .
//                     echo "✅ Frontend image built!"
//                     '''
                    
//                     sh '''
//                     echo "⚙️ Building Backend image..."
//                     cd server
//                     docker build -t blood-donation-app-backend:latest -f Dockerfile.backend .
//                     echo "✅ Backend image built!"
//                     '''
                    
//                     echo "✅ All Docker images built successfully!"
//                 }
//             }
//         }
        
//         // Stage 6: Login to Nexus Registry
//         stage('Login to Nexus Registry') {
//             steps {
//                 script {
//                     echo "🔐 Logging into Nexus registry..."
//                     withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", passwordVariable: 'NEXUS_PASSWORD', usernameVariable: 'NEXUS_USERNAME')]) {
//                         sh """
//                         echo "${NEXUS_PASSWORD}" | docker login -u "${NEXUS_USERNAME}" --password-stdin "${DOCKER_REGISTRY}"
//                         """
//                     }
//                     echo "✅ Nexus login successful!"
//                 }
//             }
//         }
        
//         // Stage 7: Tag + Push Images
//         stage('Tag + Push Images') {
//             steps {
//                 script {
//                     echo "🏷️ Tagging and pushing images..."
                    
//                     sh """
//                     echo "📱 Tagging and pushing frontend..."
//                     docker tag blood-donation-app-frontend:latest ${DOCKER_REGISTRY}/blood-donation-app-frontend:latest
//                     docker push ${DOCKER_REGISTRY}/blood-donation-app-frontend:latest
//                     echo "✅ Frontend pushed!"
//                     """
                    
//                     sh """
//                     echo "⚙️ Tagging and pushing backend..."
//                     docker tag blood-donation-app-backend:latest ${DOCKER_REGISTRY}/blood-donation-app-backend:latest
//                     docker push ${DOCKER_REGISTRY}/blood-donation-app-backend:latest
//                     echo "✅ Backend pushed!"
//                     """
                    
//                     echo "✅ All images tagged and pushed!"
//                 }
//             }
//         }
        
//         // Stage 8: Create Namespace + Secrets
//         stage('Create Namespace + Secrets') {
//             steps {
//                 script {
//                     echo "📁 Creating namespace and secrets..."
                    
//                     sh """
//                     # Create namespace if not exists
//                     kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
//                     echo "✅ Namespace created/verified"
                    
//                     # Create Docker registry secret
//                     kubectl create secret docker-registry nexus-registry-secret \\
//                         --docker-server=${DOCKER_REGISTRY} \\
//                         --docker-username=student \\
//                         --docker-password=Imcc@2025 \\
//                         --namespace=${NAMESPACE} \\
//                         --dry-run=client -o yaml | kubectl apply -f -
//                     echo "✅ Registry secret created"
//                     """
                    
//                     echo "✅ Namespace and secrets created!"
//                 }
//             }
//         }
        
//         // Stage 9: Create Registry Secrets
//         stage('Create Registry Secrets') {
//             steps {
//                 script {
//                     echo "🔑 Creating additional registry secrets..."
                    
//                     withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", passwordVariable: 'NEXUS_PASSWORD', usernameVariable: 'NEXUS_USERNAME')]) {
//                         sh """
//                         # Create Nexus registry secret for image pull
//                         kubectl create secret docker-registry nexus-pull-secret \\
//                             --docker-server=${DOCKER_REGISTRY} \\
//                             --docker-username=${NEXUS_USERNAME} \\
//                             --docker-password=${NEXUS_PASSWORD} \\
//                             --namespace=${NAMESPACE} \\
//                             --dry-run=client -o yaml | kubectl apply -f -
//                         echo "✅ Nexus pull secret created"
//                         """
//                     }
                    
//                     echo "✅ Registry secrets created!"
//                 }
//             }
//         }
        
//         // Stage 10: Create Application Secrets
//         stage('Create Application Secrets') {
//             steps {
//                 script {
//                     echo "🔐 Creating application secrets..."
                    
//                     sh """
//                     # Create JWT secret
//                     kubectl create secret generic jwt-secret \\
//                         --from-literal=JWT_SECRET=your_super_secure_jwt_secret_key_2024_college_project \\
//                         --namespace=${NAMESPACE} \\
//                         --dry-run=client -o yaml | kubectl apply -f -
//                     echo "✅ JWT secret created"
                    
//                     # Create MongoDB secret
//                     kubectl create secret generic mongo-secret \\
//                         --from-literal=MONGO_URI=mongodb://mongo-service:27017/blooddonation \\
//                         --namespace=${NAMESPACE} \\
//                         --dry-run=client -o yaml | kubectl apply -f -
//                     echo "✅ MongoDB secret created"
                    
//                     # Create application config secret
//                     kubectl create secret generic app-config \\
//                         --from-literal=NODE_ENV=production \\
//                         --from-literal=PORT=5000 \\
//                         --namespace=${NAMESPACE} \\
//                         --dry-run=client -o yaml | kubectl apply -f -
//                     echo "✅ App config secret created"
//                     """
                    
//                     echo "✅ Application secrets created!"
//                 }
//             }
//         }
        
//         // Stage 11: Deploy to Kubernetes
//         stage('Deploy to Kubernetes') {
//             steps {
//                 script {
//                     echo "🚀 Deploying to Kubernetes..."
                    
//                     sh """
//                     echo "=== Applying Kubernetes Manifests ==="
                    
//                     # Apply MongoDB
//                     kubectl apply -f k8s/mongo-deployment.yaml -n ${NAMESPACE}
//                     kubectl apply -f k8s/mongo-service.yaml -n ${NAMESPACE}
//                     echo "✅ MongoDB deployed"
                    
//                     # Wait for MongoDB to be ready
//                     echo "⏳ Waiting for MongoDB to start..."
//                     sleep 30
                    
//                     # Apply Backend
//                     kubectl apply -f k8s/backend-deployment.yaml -n ${NAMESPACE}
//                     kubectl apply -f k8s/backend-service.yaml -n ${NAMESPACE}
//                     echo "✅ Backend deployed"
                    
//                     # Apply Frontend
//                     kubectl apply -f k8s/frontend-deployment.yaml -n ${NAMESPACE}
//                     kubectl apply -f k8s/frontend-service.yaml -n ${NAMESPACE}
//                     echo "✅ Frontend deployed"
                    
//                     # Apply Ingress if exists
//                     if [ -f "k8s/ingress.yaml" ]; then
//                         kubectl apply -f k8s/ingress.yaml -n ${NAMESPACE}
//                         echo "✅ Ingress deployed"
//                     else
//                         echo "ℹ️  No ingress.yaml found, skipping ingress deployment"
//                     fi
                    
//                     echo "✅ All deployments completed!"
//                     """
                    
//                     // Wait for deployments to be ready
//                     sh """
//                     echo "⏳ Waiting for all deployments to be ready..."
//                     kubectl rollout status deployment/mongo-deployment -n ${NAMESPACE} --timeout=300s || echo "MongoDB rollout status check failed"
//                     kubectl rollout status deployment/backend-deployment -n ${NAMESPACE} --timeout=300s || echo "Backend rollout status check failed"
//                     kubectl rollout status deployment/frontend-deployment -n ${NAMESPACE} --timeout=300s || echo "Frontend rollout status check failed"
//                     echo "✅ All deployments are ready!"
//                     """
//                 }
//             }
//         }
//     }
    
//     post {
//         always {
//             echo "🏁 Pipeline execution completed with status: ${currentBuild.currentResult}"
//             script {
//                 // Cleanup
//                 sh 'docker system prune -f || true'
//                 echo "🧹 Cleanup completed"
//             }
//         }
//         success {
//             echo "🎉 🎉 🎉 PIPELINE SUCCESS! 🎉 🎉 🎉"
//             echo "✅ All stages completed successfully!"
            
//             sh """
//             echo "=== FINAL DEPLOYMENT STATUS ==="
//             kubectl get all -n ${NAMESPACE} || echo "Failed to get resources"
//             echo ""
//             echo "=== SERVICES ==="
//             kubectl get svc -n ${NAMESPACE} || echo "Failed to get services"
//             echo ""
//             echo "=== PODS ==="
//             kubectl get pods -n ${NAMESPACE} -o wide || echo "Failed to get pods"
//             echo ""
//             echo "=== SECRETS ==="
//             kubectl get secrets -n ${NAMESPACE} || echo "Failed to get secrets"
//             """
//         }
//         failure {
//             echo "❌ ❌ ❌ PIPELINE FAILED! ❌ ❌ ❌"
//             echo "Check the console output for details"
            
//             sh """
//             echo "=== DEBUG INFO ==="
//             kubectl get pods -n ${NAMESPACE} 2>/dev/null || echo "No pods found in namespace ${NAMESPACE}"
//             kubectl describe pods -n ${NAMESPACE} 2>/dev/null || echo "Cannot describe pods in namespace ${NAMESPACE}"
//             echo "=== RECENT EVENTS ==="
//             kubectl get events -n ${NAMESPACE} --sort-by='.lastTimestamp' 2>/dev/null || echo "Cannot get events"
//             """
//         }
//         unstable {
//             echo "⚠️ ⚠️ ⚠️ PIPELINE UNSTABLE! ⚠️ ⚠️ ⚠️"
//             echo "SonarQube quality gates may have failed"
//         }
//         aborted {
//             echo "🛑 🛑 🛑 PIPELINE ABORTED! 🛑 🛑 🛑"
//         }
//     }
// }





pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins/label: "2401021-blood-donation-agent"
spec:
  hostAliases:
  - ip: "10.0.0.100"  # REPLACE WITH ACTUAL SONARQUBE SERVER IP - get it using: nslookup sonarqube.imcc.com
    hostnames:
    - "sonarqube.imcc.com"
  restartPolicy: Never
  nodeSelector:
    kubernetes.io/os: "linux"
  volumes:
    - name: workspace-volume
      emptyDir: {}
    - name: kubeconfig-secret
      secret:
        secretName: "kubeconfig-secret"
  containers:
    - name: node
      image: node:18
      tty: true
      command: ["cat"]
      volumeMounts:
        - name: workspace-volume
          mountPath: /home/jenkins/agent

    - name: sonar-scanner
      image: sonarsource/sonar-scanner-cli:latest
      tty: true
      command: ["cat"]
      volumeMounts:
        - name: workspace-volume
          mountPath: /home/jenkins/agent

    - name: kubectl
      image: bitnami/kubectl:latest
      tty: true
      command: ["cat"]
      env:
        - name: KUBECONFIG
          value: /kube/config
      securityContext:
        runAsUser: 0
      volumeMounts:
        - name: kubeconfig-secret
          mountPath: /kube/config
          subPath: "kubeconfig"
        - name: workspace-volume
          mountPath: /home/jenkins/agent

    - name: dind
      image: docker:dind
      args: 
        - "--storage-driver=overlay2"
        - "--insecure-registry=nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
      securityContext:
        privileged: true
      volumeMounts:
        - name: workspace-volume
          mountPath: /home/jenkins/agent

    - name: jnlp
      image: jenkins/inbound-agent:3345.v03dee9b_f88fc-1
      env:
        - name: JENKINS_SECRET
          value: "********"
        - name: JENKINS_TUNNEL
          value: "my-jenkins-agent.jenkins.svc.cluster.local:50000"
        - name: JENKINS_AGENT_NAME
          value: "2401021-blood-donation-agent"
        - name: JENKINS_AGENT_WORKDIR
          value: "/home/jenkins/agent"
        - name: JENKINS_URL
          value: "http://my-jenkins.jenkins.svc.cluster.local:8080/"
      resources:
        requests:
          cpu: "100m"
          memory: "256Mi"
      volumeMounts:
        - name: workspace-volume
          mountPath: /home/jenkins/agent
'''
        }
    }

    environment {
        NAMESPACE = '2401021'

        // Nexus
        REGISTRY     = 'nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085'
        APP_NAME     = 'blood-donation'
        IMAGE_TAG    = 'latest'

        CLIENT_IMAGE = "${REGISTRY}/${NAMESPACE}/${APP_NAME}-client"
        SERVER_IMAGE = "${REGISTRY}/${NAMESPACE}/${APP_NAME}-server"

        NEXUS_USER = 'student'
        NEXUS_PASS = 'Changeme@2025'

        // SonarQube
        SONAR_PROJECT_KEY   = '2401021_Blood_Donation'
        SONAR_HOST_URL      = 'http://sonarqube.imcc.com'
        SONAR_PROJECT_TOKEN = 'sqp_d523987f0289c0a136a5defed7d70c15694ff380'
    }

    stages {
        stage('Declarative: Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Install + Build Frontend') {
            steps {
                container('node') {
                    dir('client') {
                        sh '''
                        echo "Installing frontend dependencies..."
                        npm install
                        echo "Building frontend..."
                        npm run build
                        '''
                    }
                }
            }
        }

        stage('Install Backend') {
            steps {
                container('node') {
                    dir('server') {
                        sh '''
                        echo "Installing backend dependencies..."
                        npm install
                        '''
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                container('dind') {
                    script {
                        // Test Docker daemon first
                        sh '''
                        echo "Waiting for Docker daemon to be ready..."
                        timeout 60s bash -c 'until docker info > /dev/null 2>&1; do sleep 3; echo "Waiting for Docker daemon..."; done'
                        echo "Docker daemon is ready!"
                        '''
                        
                        // Fix Dockerfile base images for public.ecr.aws
                        sh "sed -i 's|FROM node|FROM public.ecr.aws/docker/library/node|g' ./client/Dockerfile.frontend"
                        sh "sed -i 's|FROM nginx|FROM public.ecr.aws/docker/library/nginx|g' ./client/Dockerfile.frontend"
                        sh "sed -i 's|FROM node|FROM public.ecr.aws/docker/library/node|g' ./server/Dockerfile.backend"

                        sh '''
                        echo "Building client Docker image..."
                        docker build -t ${CLIENT_IMAGE}:${IMAGE_TAG} -f ./client/Dockerfile.frontend ./client
                        
                        echo "Building server Docker image..."
                        docker build -t ${SERVER_IMAGE}:${IMAGE_TAG} -f ./server/Dockerfile.backend ./server
                        
                        echo "Docker images built successfully:"
                        docker images | grep ${REGISTRY}/${NAMESPACE}
                        '''
                    }
                }
            }
        }

        stage('Test SonarQube Connectivity') {
            steps {
                container('sonar-scanner') {
                    sh '''
                    echo "Testing SonarQube DNS resolution..."
                    nslookup sonarqube.imcc.com || echo "DNS resolution failed"
                    
                    echo "Testing SonarQube connectivity..."
                    if curl -s --connect-timeout 10 http://sonarqube.imcc.com/ > /dev/null; then
                        echo "✅ SonarQube is reachable"
                    else
                        echo "❌ SonarQube is not reachable"
                    fi
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    sh """
                    echo "Starting SonarQube analysis..."
                    sonar-scanner \
                      -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                      -Dsonar.sources=. \
                      -Dsonar.host.url=${SONAR_HOST_URL} \
                      -Dsonar.login=${SONAR_PROJECT_TOKEN}
                    echo "SonarQube analysis completed!"
                    """
                }
            }
        }

        stage('Login to Nexus Registry') {
            steps {
                container('dind') {
                    sh """
                    echo "Logging into Nexus registry..."
                    echo "$NEXUS_PASS" | docker login ${REGISTRY} -u "$NEXUS_USER" --password-stdin
                    echo "✅ Successfully logged into Nexus registry"
                    """
                }
            }
        }

        stage('Push to Nexus') {
            steps {
                container('dind') {
                    sh '''
                    echo "Pushing client image to Nexus..."
                    docker push ${CLIENT_IMAGE}:${IMAGE_TAG}
                    
                    echo "Pushing server image to Nexus..."
                    docker push ${SERVER_IMAGE}:${IMAGE_TAG}
                    
                    echo "✅ Images pushed successfully to Nexus"
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh """
                    echo "Deploying to Kubernetes namespace: ${NAMESPACE}"
                    
                    # Apply deployment files
                    kubectl apply -f k8s-deployment.yaml -n ${NAMESPACE} --validate=false
                    kubectl apply -f client-service.yaml -n ${NAMESPACE} --validate=false
                    
                    # Update images
                    kubectl set image deployment/client-deployment client=${CLIENT_IMAGE}:${IMAGE_TAG} -n ${NAMESPACE} --validate=false
                    kubectl set image deployment/server-deployment server=${SERVER_IMAGE}:${IMAGE_TAG} -n ${NAMESPACE} --validate=false
                    
                    # Wait for rollout
                    echo "Waiting for deployment rollout..."
                    kubectl rollout status deployment/client-deployment -n ${NAMESPACE} --timeout=300s
                    kubectl rollout status deployment/server-deployment -n ${NAMESPACE} --timeout=300s
                    
                    echo "✅ Deployment completed successfully!"
                    
                    # Show deployment status
                    kubectl get deployments -n ${NAMESPACE}
                    kubectl get pods -n ${NAMESPACE}
                    """
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline execution completed - Result: ${currentBuild.result}"
            container('kubectl') {
                sh '''
                echo "Final deployment status:"
                kubectl get pods -n ${NAMESPACE} || true
                '''
            }
        }
        success {
            echo "✅ Pipeline completed successfully!"
            emailext (
                subject: "✅ Pipeline SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                The Jenkins pipeline completed successfully!
                
                Job: ${env.JOB_NAME}
                Build: #${env.BUILD_NUMBER}
                URL: ${env.BUILD_URL}
                
                SonarQube Analysis: ${SONAR_HOST_URL}/dashboard?id=${SONAR_PROJECT_KEY}
                """,
                to: "student@example.com"
            )
        }
        failure {
            echo "❌ Pipeline failed!"
            emailext (
                subject: "❌ Pipeline FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                The Jenkins pipeline failed!
                
                Job: ${env.JOB_NAME}
                Build: #${env.BUILD_NUMBER}
                URL: ${env.BUILD_URL}
                
                Please check the logs for details.
                """,
                to: "student@example.com"
            )
        }
        unstable {
            echo "Pipeline unstable!"
        }
        changed {
            echo "Pipeline status changed!"
        }
    }
}