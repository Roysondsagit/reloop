#!/usr/bin/env bash
# =============================================================================
# ReLoop: AWS One-Click Deploy Script
# Usage: bash aws/deploy.sh
#
# What this does:
#   1. Deploys CloudFormation stack (S3, SNS, IAM, Lambda)
#   2. Pushes Docker image to ECR
#   3. (Optional) SSHes into EC2 and pulls + runs the new image
# =============================================================================

set -e  # Exit on any error

# ── CONFIG (Edit these) ──────────────────────────────────────────────────────
AWS_REGION="ap-south-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO_NAME="reloop-engine"
EC2_HOST=""              # Your EC2 public IP or DNS (fill after launch)
EC2_KEY_PATH="~/.ssh/reloop-key.pem"  # Path to your EC2 key pair
STACK_NAME="reloop-infra"
ALERT_EMAIL="your-email@example.com"  # Change this!
S3_BUCKET_NAME="reloop-waste-uploads"

ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME"

echo ""
echo "============================================================"
echo "  🚀 ReLoop AWS Deploy Script"
echo "  Region: $AWS_REGION | Account: $AWS_ACCOUNT_ID"
echo "============================================================"
echo ""

# ── STEP 1: Deploy CloudFormation Stack ─────────────────────────────────────
echo "📦 [1/4] Deploying CloudFormation infrastructure stack..."
aws cloudformation deploy \
  --template-file aws/cloudformation.yaml \
  --stack-name "$STACK_NAME" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$AWS_REGION" \
  --parameter-overrides \
    S3BucketName="$S3_BUCKET_NAME" \
    AlertEmail="$ALERT_EMAIL"

echo "✅ CloudFormation stack deployed."

# Print outputs
echo ""
echo "📋 Stack Outputs:"
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --query "Stacks[0].Outputs" \
  --output table

# ── STEP 2: Create ECR Repository (if not exists) ───────────────────────────
echo ""
echo "🗄️ [2/4] Ensuring ECR repository exists..."
aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" --region "$AWS_REGION" 2>/dev/null || \
  aws ecr create-repository --repository-name "$ECR_REPO_NAME" --region "$AWS_REGION"
echo "✅ ECR repository ready: $ECR_URI"

# ── STEP 3: Build & Push Docker Image ───────────────────────────────────────
echo ""
echo "🐳 [3/4] Building and pushing Docker image..."

# Login to ECR
aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Build image
docker build -t "$ECR_REPO_NAME:latest" .

# Tag and push
docker tag "$ECR_REPO_NAME:latest" "$ECR_URI:latest"
docker push "$ECR_URI:latest"
echo "✅ Image pushed: $ECR_URI:latest"

# ── STEP 4: Deploy to EC2 (if EC2_HOST is set) ──────────────────────────────
if [ -n "$EC2_HOST" ]; then
  echo ""
  echo "🖥️ [4/4] Deploying to EC2: $EC2_HOST"
  ssh -i "$EC2_KEY_PATH" -o StrictHostKeyChecking=no "ec2-user@$EC2_HOST" << EOF
    set -e
    echo "📥 Pulling latest image from ECR..."
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    docker pull $ECR_URI:latest

    echo "🔄 Stopping old container (if running)..."
    docker stop reloop-api 2>/dev/null || true
    docker rm reloop-api 2>/dev/null || true

    echo "🚀 Starting new container..."
    docker run -d \
      --name reloop-api \
      --restart unless-stopped \
      -p 8000:8000 \
      --env-file /home/ec2-user/reloop.env \
      $ECR_URI:latest

    echo "✅ Container started!"
    docker ps | grep reloop-api
EOF
  echo "✅ EC2 deployment complete!"
else
  echo ""
  echo "ℹ️ [4/4] EC2_HOST not set — skipping EC2 deployment."
  echo "    Set EC2_HOST in this script after launching your EC2 instance."
fi

echo ""
echo "============================================================"
echo "  ✅ ReLoop AWS Deploy Complete!"
echo "  App URL: http://$EC2_HOST:8000"
echo "  Health:  http://$EC2_HOST:8000/health"
echo "============================================================"
