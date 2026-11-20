pipeline {
    agent any

    environment {
        AZURE_RG       = 'FreLock-RG'
        ACR_NAME       = 'frelockacr1362'
        ACR_LOGIN_SRV  = 'frelockacr1362.azurecr.io'
        WEBAPP_NAME    = 'frelock-app'
        IMAGE_REPO     = 'frelock'
        IMAGE_TAG      = "v${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Logic Tests (47 Checks)') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'cd backend && npm test'
                    } else {
                        bat 'cd backend && npm test'
                    }
                }
            }
        }

        stage('Azure Login & Build Image in ACR') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'azure-sp',
                    usernameVariable: 'AZ_CLIENT_ID',
                    passwordVariable: 'AZ_CLIENT_SECRET'
                ), string(
                    credentialsId: 'azure-tenant-id',
                    variable: 'AZ_TENANT_ID'
                )]) {
                    script {
                        if (isUnix()) {
                            sh '''
                                az login --service-principal -u "$AZ_CLIENT_ID" -p "$AZ_CLIENT_SECRET" --tenant "$AZ_TENANT_ID"
                                az acr build --registry $ACR_NAME --image ${IMAGE_REPO}:${IMAGE_TAG} --image ${IMAGE_REPO}:latest .
                            '''
                        } else {
                            bat '''
                                az login --service-principal -u "%AZ_CLIENT_ID%" -p "%AZ_CLIENT_SECRET%" --tenant "%AZ_TENANT_ID%"
                                az acr build --registry %ACR_NAME% --image %IMAGE_REPO%:%IMAGE_TAG% --image %IMAGE_REPO%:latest .
                            '''
                        }
                    }
                }
            }
        }

        stage('Deploy to Azure App Service') {
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            ACR_PWD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)
                            az webapp config container set \
                              --resource-group $AZURE_RG \
                              --name $WEBAPP_NAME \
                              --container-image-name ${ACR_LOGIN_SRV}/${IMAGE_REPO}:${IMAGE_TAG} \
                              --container-registry-url https://${ACR_LOGIN_SRV} \
                              --container-registry-user $ACR_NAME \
                              --container-registry-password "$ACR_PWD"
                            az webapp restart --resource-group $AZURE_RG --name $WEBAPP_NAME
                        '''
                    } else {
                        powershell '''
                            $acrPwd = (az acr credential show --name $env:ACR_NAME --query "passwords[0].value" -o tsv)
                            az webapp config container set `
                              --resource-group $env:AZURE_RG `
                              --name $env:WEBAPP_NAME `
                              --container-image-name "$env:ACR_LOGIN_SRV/$env:IMAGE_REPO`:$env:IMAGE_TAG" `
                              --container-registry-url "https://$env:ACR_LOGIN_SRV" `
                              --container-registry-user $env:ACR_NAME `
                              --container-registry-password $acrPwd
                            az webapp restart --resource-group $env:AZURE_RG --name $env:WEBAPP_NAME
                        '''
                    }
                }
            }
        }

        stage('Verify Deployment Health') {
            steps {
                script {
                    sleep(time: 25, unit: 'SECONDS')
                    if (isUnix()) {
                        sh 'curl -sS https://${WEBAPP_NAME}.azurewebsites.net/api/health'
                    } else {
                        bat 'curl.exe -sS https://%WEBAPP_NAME%.azurewebsites.net/api/health'
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                if (isUnix()) {
                    sh 'az logout || true'
                } else {
                    bat 'az logout || exit /b 0'
                }
            }
        }
    }
}
