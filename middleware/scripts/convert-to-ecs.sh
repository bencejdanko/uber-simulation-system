#!/bin/bash

# Function to convert docker-compose environment variables to ECS task definition format
convert_to_ecs() {
    local service_name=$1
    local env_file=$2
    
    echo "Converting environment variables for $service_name..."
    
    # Create ECS task definition template
    cat << EOF > "ecs-${service_name}-task-definition.json"
{
    "family": "${service_name}",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "256",
    "memory": "512",
    "containerDefinitions": [
        {
            "name": "${service_name}",
            "image": "<ECR_REPOSITORY_URI>/${service_name}:latest",
            "essential": true,
            "portMappings": [],
            "environment": [
EOF

    # Read environment variables from docker-compose and convert to ECS format
    if [ -f "$env_file" ]; then
        while IFS='=' read -r key value; do
            # Skip empty lines and comments
            [[ -z "$key" || "$key" =~ ^# ]] && continue
            
            # Remove any quotes from the value
            value=$(echo "$value" | tr -d '"' | tr -d "'")
            
            echo "                {
                    \"name\": \"$key\",
                    \"value\": \"$value\"
                }," >> "ecs-${service_name}-task-definition.json"
        done < "$env_file"
    fi

    # Remove the last comma and close the JSON structure
    sed -i '' '$ s/,$//' "ecs-${service_name}-task-definition.json"
    
    cat << EOF >> "ecs-${service_name}-task-definition.json"
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/${service_name}",
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }
    ]
}
EOF

    echo "Created ECS task definition for $service_name"
}

# Main script
echo "Starting conversion of docker-compose services to ECS task definitions..."

# Convert each service
convert_to_ecs "kong" "./kong/.env"
convert_to_ecs "admin-service" "./services/admin/.env"
convert_to_ecs "auth-service" "./services/auth/.env"
convert_to_ecs "billing-service" "./services/billing/.env"
convert_to_ecs "customer-service" "./services/customer/.env"
convert_to_ecs "driver-service" "./services/driver/.env"
convert_to_ecs "rides-service" "./services/rides/.env"

echo "Conversion complete! Task definitions have been created in the current directory."
echo "Please review and modify the task definitions as needed before deploying to ECS." 