#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN_NAME="${1:-snaphomz.in}"
ENVIRONMENT="${2:-demo}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Snaphomz Infrastructure Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install Node.js.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites satisfied${NC}"
echo ""

# Setup infrastructure directory
cd infra

echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Build TypeScript
echo -e "${YELLOW}Building TypeScript...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build TypeScript${NC}"
    exit 1
fi

echo -e "${GREEN}✓ TypeScript built successfully${NC}"
echo ""

# Get AWS Account ID
echo -e "${YELLOW}Retrieving AWS Account ID...${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}Failed to retrieve AWS Account ID. Check your AWS credentials.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ AWS Account ID: $AWS_ACCOUNT_ID${NC}"
echo ""

# Check if hosted zone exists
echo -e "${YELLOW}Checking for existing hosted zone...${NC}"
EXISTING_ZONE_ID=$(aws route53 list-hosted-zones-by-name --query "HostedZones[?Name=='${DOMAIN_NAME}.'].Id" --output text | cut -d'/' -f3)

if [ -z "$EXISTING_ZONE_ID" ]; then
    echo -e "${YELLOW}Hosted zone not found. Creating...${NC}"
    
    # Create hosted zone
    export CREATE_HOSTED_ZONE=true
    export DOMAIN_NAME=$DOMAIN_NAME
    export CDK_DEFAULT_ACCOUNT=$AWS_ACCOUNT_ID
    export CDK_DEFAULT_REGION=$AWS_REGION
    export ENVIRONMENT=$ENVIRONMENT
    
    npm run build
    npx cdk deploy SnaphomzHostedZone --require-approval never
    
    HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --query "HostedZones[?Name=='${DOMAIN_NAME}.'].Id" --output text | cut -d'/' -f3)
    echo -e "${GREEN}✓ Hosted zone created: $HOSTED_ZONE_ID${NC}"
else
    HOSTED_ZONE_ID=$EXISTING_ZONE_ID
    echo -e "${GREEN}✓ Existing hosted zone found: $HOSTED_ZONE_ID${NC}"
fi

echo ""

# Display hosted zone details
echo -e "${YELLOW}Retrieving hosted zone details...${NC}"
ZONE_DETAILS=$(aws route53 get-hosted-zone --id $HOSTED_ZONE_ID)
NAME_SERVERS=$(echo $ZONE_DETAILS | grep -oP '"NameServers":\s*\K\[[^\]]*\]' | tr ',' '\n' | tr -d '[]" ')

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Hosted Zone Information${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Domain: $DOMAIN_NAME"
echo "Hosted Zone ID: $HOSTED_ZONE_ID"
echo ""
echo "Name Servers:"
echo "$NAME_SERVERS" | while read ns; do
    echo "  - $ns"
done
echo ""
echo -e "${YELLOW}⚠️  If this is a new hosted zone, update your domain registrar to use these name servers.${NC}"
echo ""

# Deploy static site infrastructure
echo -e "${YELLOW}Deploying static site infrastructure...${NC}"
export HOSTED_ZONE_ID=$HOSTED_ZONE_ID
export HOSTED_ZONE_NAME=$DOMAIN_NAME
export CUSTOM_DOMAIN=$DOMAIN_NAME
export ENVIRONMENT=$ENVIRONMENT
export CREATE_CERTIFICATE=true
export CDK_DEFAULT_ACCOUNT=$AWS_ACCOUNT_ID
export CDK_DEFAULT_REGION=$AWS_REGION

npm run build
npx cdk deploy snaphomz-india-$ENVIRONMENT --require-approval never

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Infrastructure deployed successfully${NC}"
else
    echo -e "${RED}Failed to deploy infrastructure${NC}"
    exit 1
fi

echo ""

# Retrieve deployment details
echo -e "${YELLOW}Retrieving deployment details...${NC}"

BUCKET_NAME=$(aws ssm get-parameter --name /snaphomz/india/$ENVIRONMENT/bucket-name --query 'Parameter.Value' --output text)
DISTRIBUTION_ID=$(aws ssm get-parameter --name /snaphomz/india/$ENVIRONMENT/distribution-id --query 'Parameter.Value' --output text)
DISTRIBUTION_DOMAIN=$(aws ssm get-parameter --name /snaphomz/india/$ENVIRONMENT/distribution-domain --query 'Parameter.Value' --output text)

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Environment: $ENVIRONMENT"
echo "S3 Bucket: $BUCKET_NAME"
echo "CloudFront Distribution ID: $DISTRIBUTION_ID"
echo "CloudFront Domain: https://$DISTRIBUTION_DOMAIN"
echo "Custom Domain: https://$DOMAIN_NAME (DNS may take up to 48 hours to propagate)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Build your application: npm run build"
echo "2. Deploy your application: npm run deploy:app:$ENVIRONMENT"
echo "3. Or deploy everything at once: npm run deploy:full"
echo ""
echo -e "${GREEN}Setup complete!${NC}"
