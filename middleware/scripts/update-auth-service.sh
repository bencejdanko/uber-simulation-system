#!/bin/bash

# Get the latest task definition ARN
TASK_DEFINITION_ARN=$(aws ecs describe-task-definition \
    --task-definition auth-service \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text \
    --region us-west-2)

# Update the service to use the new task definition
aws ecs update-service \
    --cluster uber-simulation-cluster \
    --service auth-service \
    --task-definition $TASK_DEFINITION_ARN \
    --region us-west-2 