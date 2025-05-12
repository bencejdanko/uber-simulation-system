#!/bin/bash

# Create the task role
aws iam create-role \
    --role-name ecsTaskRole \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "ecs-tasks.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }' \
    --region us-west-2

# Create the policy
aws iam create-policy \
    --policy-name AuthServiceSecretsPolicy \
    --policy-document file://auth-service-secrets-policy.json \
    --region us-west-2

# Attach the policy to the task role
aws iam attach-role-policy \
    --role-name ecsTaskRole \
    --policy-arn arn:aws:iam::982081080014:policy/AuthServiceSecretsPolicy \
    --region us-west-2 