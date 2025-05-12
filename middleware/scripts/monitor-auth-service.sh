#!/bin/bash

echo "Monitoring auth service deployment status..."
echo "Press Ctrl+C to stop monitoring"

while true; do
    echo "----------------------------------------"
    echo "Checking service status at $(date)"
    
    # Get service status
    aws ecs describe-services \
        --cluster uber-simulation-cluster \
        --services auth-service \
        --query 'services[0].{Status:status,RunningCount:runningCount,DesiredCount:desiredCount,PendingCount:pendingCount,Deployments:deployments[*].{Status:status,RunningCount:runningCount,DesiredCount:desiredCount,PendingCount:pendingCount}}' \
        --output json \
        --region us-west-2

    # Get task status
    echo "----------------------------------------"
    echo "Current tasks:"
    aws ecs list-tasks \
        --cluster uber-simulation-cluster \
        --service-name auth-service \
        --query 'taskArns[]' \
        --output text \
        --region us-west-2 | while read -r taskArn; do
        if [ ! -z "$taskArn" ]; then
            aws ecs describe-tasks \
                --cluster uber-simulation-cluster \
                --tasks "$taskArn" \
                --query 'tasks[0].{TaskArn:taskArn,LastStatus:lastStatus,DesiredStatus:desiredStatus,HealthStatus:healthStatus}' \
                --output json \
                --region us-west-2
        fi
    done

    sleep 10
done 