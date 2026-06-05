# AWS Infrastructure Setup - Summary

## ✅ Completed Tasks

This document provides a summary of all AWS infrastructure and CI/CD configurations created for Snaphomz India.

### Infrastructure Created

1. **Route53 Hosted Zone** (`hosted-zone-stack.ts`)
   - Domain: `snaphomz.in`
   - Automatic nameserver setup
   - DNS validation support

2. **Static Site Stack** (`static-site-stack.ts`)
   - S3 bucket per environment (demo, staging, prod)
   - CloudFront distribution with CDN caching
   - SSL/TLS certificate (auto-provisioned)
   - Route53 DNS alias records
   - Origin access identity for secure bucket access

3. **AWS Systems Manager Parameters**
   - Bucket names stored in Parameter Store
   - Distribution IDs for cache invalidation
   - Distribution domains for deployment

### Files Created

#### Infrastructure Files (TypeScript/CDK)
- `infra/lib/hosted-zone-stack.ts` - Route53 hosted zone
- `infra/lib/static-site-stack.ts` - S3 + CloudFront stack
- `infra/app.ts` - CDK app entry point
- `infra/cdk.json` - CDK configuration
- `infra/tsconfig.json` - TypeScript configuration
- `infra/package.json` - CDK dependencies

#### GitHub Actions Configuration
- `.github/workflows/deploy.yml` - Complete CI/CD pipeline

#### Deployment Scripts
- `scripts/setup-infra.sh` - Infrastructure setup (Bash)
- `scripts/setup-infra.ps1` - Infrastructure setup (PowerShell)
- `scripts/deploy-app.js` - Application deployment
- `scripts/setup-github-secrets.js` - GitHub secrets configuration

#### CloudFormation Templates
- `infra/github-actions-iam-template.yaml` - IAM role setup

#### Documentation
- `DEPLOYMENT.md` - Comprehensive deployment guide
- `QUICKSTART.md` - 5-minute setup guide
- `ENVIRONMENTS.md` - GitHub Actions environments
- `SETUP_CHECKLIST.md` - Complete setup checklist
- `README.md` - Updated with deployment info
- `INFRASTRUCTURE_SUMMARY.md` - This file

#### Project Configuration
- Updated `package.json` with deployment scripts

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│          GitHub Repository (Snaphomz-india)    │
│                                                  │
│  • Source code (React + Vite)                   │
│  • CDK infrastructure code                      │
│  • GitHub Actions workflow                      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│      GitHub Actions CI/CD Pipeline              │
│                                                  │
│  1. Checkout code                               │
│  2. Build React application                     │
│  3. Deploy CDK infrastructure                   │
│  4. Upload to S3                                │
│  5. Invalidate CloudFront cache                 │
│  6. Send notifications                          │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│            AWS Account                          │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │  Route53                               │    │
│  │  • Hosted Zone: snaphomz.in            │    │
│  │  • Nameservers configured             │    │
│  └────────────────────────────────────────┘    │
│           ↓         ↓         ↓                 │
│    ┌─────────┬────────────┬──────────┐         │
│    ↓         ↓            ↓          ↓         │
│  Demo      Staging     Prod      Certificate  │
│   ↓          ↓           ↓                     │
│  ┌─────────────────────────────────────┐      │
│  │      CloudFront Distribution        │      │
│  │  • SSL/TLS Certificate              │      │
│  │  • Global CDN                       │      │
│  │  • Cache Optimization               │      │
│  └─────────────────────────────────────┘      │
│           ↓                                     │
│  ┌─────────────────────────────────────┐      │
│  │      S3 Bucket (Static Files)       │      │
│  │  • Versioning enabled               │      │
│  │  • Block public access              │      │
│  │  • Encryption enabled               │      │
│  └─────────────────────────────────────┘      │
│           ↓                                     │
│  ┌─────────────────────────────────────┐      │
│  │  AWS Systems Manager                │      │
│  │  • Parameters stored                │      │
│  │  • Configuration accessible         │      │
│  └─────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

## Key Features

### Automated Deployment
- **Branch-based Deployment:** Push to main/staging/develop = auto deploy
- **Manual Deployment:** GitHub Actions workflow dispatch
- **Local Deployment:** npm run scripts for quick testing

### Security
- **OIDC Authentication:** No long-lived credentials stored
- **IAM Least Privilege:** Minimal required permissions
- **S3 Block Public Access:** Bucket completely private
- **SSL/TLS Encryption:** All traffic encrypted
- **CloudFront Origin Access Identity:** Secure bucket access

### Performance
- **CloudFront CDN:** Global content distribution
- **Intelligent Caching:** 
  - Static assets: 1 year cache
  - HTML: No cache (always fresh)
  - Config: 1 hour cache
- **Compression:** Automatic gzip compression
- **IPv6 Support:** Modern protocol support

### Cost Optimization
- **CloudFront Price Class 100:** 100 edge locations (lower cost)
- **Versioning:** Old versions auto-deleted (30 days)
- **On-demand:** Pay only for what you use
- **Estimated Monthly Cost:** $2-5 for typical traffic

### Monitoring & Logging
- **GitHub Actions Logs:** Detailed workflow execution logs
- **AWS CloudTrail:** All AWS API calls logged
- **SSM Parameters:** Configuration stored centrally
- **Slack Notifications:** Optional deployment alerts

## Environment Configuration

### Demo Environment
- **Branch:** develop
- **Domain:** CloudFront domain (auto-generated)
- **S3 Bucket:** `snaphomz-india-demo-{account-id}`
- **Purpose:** Development/testing
- **Approval:** None required

### Staging Environment
- **Branch:** staging
- **Domain:** staging.snaphomz.in
- **S3 Bucket:** `snaphomz-india-staging-{account-id}`
- **Purpose:** Pre-production testing
- **Approval:** Optional (configurable)

### Production Environment
- **Branch:** main
- **Domain:** snaphomz.in
- **S3 Bucket:** `snaphomz-india-prod-{account-id}`
- **Purpose:** Live environment
- **Approval:** Can require reviewers

## GitHub Actions Workflow

The workflow (`deploy.yml`) performs:

1. **Setup Phase**
   - Detect environment from branch
   - Prepare deployment context

2. **Build Phase**
   - Checkout code
   - Configure AWS credentials (OIDC)
   - Install dependencies
   - Build React/Vite application

3. **Infrastructure Phase**
   - Install CDK dependencies
   - Create/update hosted zone (if needed)
   - Deploy CDK stacks
   - Retrieve S3 & CloudFront details

4. **Deployment Phase**
   - Upload to S3 (smart caching headers)
   - Invalidate CloudFront cache
   - Verify deployment

5. **Notification Phase**
   - Send Slack notification (optional)
   - Display deployment summary

## Deployment Checklist

To use this infrastructure:

1. **AWS Setup**
   - [ ] Create CloudFormation stack for IAM role
   - [ ] Verify OIDC provider created

2. **GitHub Setup**
   - [ ] Set `AWS_ACCOUNT_ID` secret
   - [ ] Set `AWS_ROLE_ARN` secret
   - [ ] Create demo, staging, prod environments

3. **Infrastructure Setup**
   - [ ] Run `npm run setup:infra`
   - [ ] Note Route53 nameservers
   - [ ] Update domain registrar

4. **Test Deployments**
   - [ ] Deploy to demo: `npm run deploy:app:demo`
   - [ ] Deploy to staging: `npm run deploy:app:staging`
   - [ ] Deploy to prod: `npm run deploy:app:prod`

5. **Verify DNS**
   - [ ] `nslookup snaphomz.in`
   - [ ] Verify nameservers point to Route53
   - [ ] Wait for DNS propagation (24-48 hours)

## Quick Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production

# Deployment
npm run deploy:infra          # Deploy infrastructure
npm run deploy:app:demo       # Deploy to demo
npm run deploy:app:staging    # Deploy to staging
npm run deploy:app:prod       # Deploy to production
npm run deploy:full           # Build + deploy everything

# Setup
npm run setup:infra           # Setup AWS infrastructure
npm run setup:secrets         # Configure GitHub secrets

# AWS Management
aws s3 ls                     # List S3 buckets
aws cloudfront list-distributions  # List CloudFront distributions
aws route53 list-hosted-zones # List Route53 zones
aws ssm get-parameters-by-path --path /snaphomz  # View parameters
```

## Documentation Structure

```
QUICKSTART.md          ← Start here (5 minutes)
    ↓
README.md             ← Project overview
    ↓
SETUP_CHECKLIST.md    ← Verify your setup
    ↓
DEPLOYMENT.md         ← Comprehensive guide
    ↓
ENVIRONMENTS.md       ← GitHub Actions configuration
```

## Support Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Route53 Documentation](https://docs.aws.amazon.com/route53/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Vite Documentation](https://vitejs.dev/)

## Next Steps

1. Follow [QUICKSTART.md](QUICKSTART.md) to deploy infrastructure
2. Configure GitHub secrets and environments
3. Test deployment with `npm run deploy:app:demo`
4. Monitor deployment in GitHub Actions
5. Verify application at CloudFront domain
6. Configure custom domain when DNS propagates

## Maintenance

### Monthly Tasks
- [ ] Review CloudFront cache statistics
- [ ] Check S3 bucket size
- [ ] Verify SSL/TLS certificate validity
- [ ] Review deployment logs
- [ ] Check AWS billing

### Quarterly Tasks
- [ ] Update dependencies (npm, CDK, Node.js)
- [ ] Review security configurations
- [ ] Test disaster recovery
- [ ] Review and optimize caching

### Annual Tasks
- [ ] Review overall architecture
- [ ] Plan for scalability
- [ ] Review cost optimization
- [ ] Update documentation

---

**Created:** June 2024
**Infrastructure as Code:** AWS CDK (TypeScript)
**CI/CD Platform:** GitHub Actions
**Hosting:** AWS (S3 + CloudFront + Route53)
**Domain:** snaphomz.in
