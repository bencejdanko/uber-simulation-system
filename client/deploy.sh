#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting frontend deployment process..."

# Build the frontend
echo "📦 Building the frontend..."
npm run build

# Upload to S3
echo "📤 Uploading to S3..."
aws s3 sync build/ s3://uber-simulation-frontend

# Create CloudFront invalidation
echo "🔄 Creating CloudFront invalidation..."
aws cloudfront create-invalidation --distribution-id $(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[?contains(@, 'uber-simulation-frontend')]].Id" --output text) --paths "/*"

echo "✅ Deployment completed successfully!"
echo "Note: It may take a few minutes for the CloudFront invalidation to complete." 