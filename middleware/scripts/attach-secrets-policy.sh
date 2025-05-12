#!/bin/bash

# Create the policy
aws iam create-policy \
    --policy-name AuthServiceSecretsPolicy \
    --policy-document file://middleware/scripts/auth-service-secrets-policy.json \
    --region us-west-2

# Attach the policy to the task execution role
aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::982081080014:policy/AuthServiceSecretsPolicy \
    --region us-west-2 