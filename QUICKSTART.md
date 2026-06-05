# Quick Start Guide

Get your Snaphomz India app deployed to AWS in 5 minutes!

## Prerequisites Checklist

- [ ] AWS Account (with billing enabled)
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Node.js 18+ installed
- [ ] GitHub account with repository access
- [ ] Git configured locally

## Step 1: Create IAM Role (2 minutes)

Run the CloudFormation stack to create the OIDC role:

```bash
# From the infra directory
cd infra

aws cloudformation create-stack \
  --stack-name github-actions-role \
  --template-body file://github-actions-iam-template.yaml \
  --parameters ParameterKey=GitHubOwner,ParameterValue=YOUR_GITHUB_USERNAME \
               ParameterKey=GitHubRepo,ParameterValue=YOUR_REPO_NAME \
  --capabilities CAPABILITY_NAMED_IAM
```

Wait for the stack creation to complete:

```bash
aws cloudformation wait stack-create-complete \
  --stack-name github-actions-role
```

Get the role ARN:

```bash
aws cloudformation describe-stacks \
  --stack-name github-actions-role \
  --query 'Stacks[0].Outputs[?OutputKey==`RoleArn`].OutputValue' \
  --output text
```

## Step 2: Set GitHub Secrets (1 minute)

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Create new secrets:

   **AWS_ACCOUNT_ID**
   ```bash
   aws sts get-caller-identity --query Account --output text
   ```

   **AWS_ROLE_ARN** (from Step 1 output)
   ```
   arn:aws:iam::ACCOUNT_ID:role/github-actions-role
   ```

## Step 3: Deploy Infrastructure (2 minutes)

From the project root:

```bash
# Install dependencies
npm install
cd infra && npm install && cd ..

# Deploy infrastructure
npm run setup:infra
# Or on Windows:
# .\scripts\setup-infra.ps1
```

Note the Route53 nameservers from the output.

## Step 4: Update Domain DNS (5 minutes)

If using your own domain:

1. Log in to your domain registrar
2. Update nameservers to Route53 nameservers:
   ```
   ns-xxx.awsdns-xx.com
   ns-yyy.awsdns-yy.com
   ns-zzz.awsdns-zz.com
   ns-www.awsdns-ww.com
   ```
3. Wait for DNS propagation (typically 24-48 hours)

If using CloudFront domain, you can skip this step.

## Step 5: Deploy Your App

### Option A: Automatic Deployment (Recommended)

```bash
# Push to trigger automatic deployment
git push origin main              # Deploy to production
git push origin staging           # Deploy to staging
git push origin develop          # Deploy to demo
```

### Option B: Manual Deployment

```bash
# Deploy demo environment
npm run deploy:app:demo

# Deploy staging environment
npm run deploy:app:staging

# Deploy production environment
npm run deploy:app:prod
```

## Verify Deployment

Once deployed, verify your app is live:

```bash
# Get deployment details
aws ssm get-parameter --name /snaphomz/india/demo/distribution-domain --query 'Parameter.Value' --output text

# Visit the URL
curl https://YOUR_DISTRIBUTION_DOMAIN
```

## What's Deployed?

✅ **Route53 Hosted Zone** - DNS management for snaphomz.in
✅ **S3 Bucket** - Static file storage (private)
✅ **CloudFront Distribution** - Global CDN with SSL/TLS
✅ **GitHub Actions Workflow** - Automatic CI/CD
✅ **AWS Systems Manager Parameters** - Configuration storage

## Next Steps

- [View Full Deployment Guide](DEPLOYMENT.md)
- [Configure Custom Domain](DEPLOYMENT.md#dns-configuration)
- [Set Up Monitoring](DEPLOYMENT.md#monitoring--logs)
- [Enable Slack Notifications](DEPLOYMENT.md#optional-slack-notifications)

## Troubleshooting

### CloudFormation stack creation failed
```bash
# Check stack events
aws cloudformation describe-stack-events \
  --stack-name github-actions-role \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
```

### Deployment failed in GitHub Actions
1. Check the workflow run logs
2. Verify AWS_ACCOUNT_ID and AWS_ROLE_ARN secrets are set
3. Verify IAM role trust relationship

### DNS not resolving
```bash
# Verify nameservers
nslookup -type=NS snaphomz.in
```

## Need Help?

1. Check [Troubleshooting Section](DEPLOYMENT.md#troubleshooting)
2. Review GitHub Actions logs
3. Check AWS CloudTrail for errors

---

**Time to deployment:** ~10 minutes (including DNS propagation)
**Monthly estimated cost:** ~$2-5 (for low traffic)
