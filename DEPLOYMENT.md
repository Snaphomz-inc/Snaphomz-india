# Snaphomz India - AWS Infrastructure & CI/CD Setup

This project includes complete AWS infrastructure setup with Route53 hosted zone, S3 static hosting, CloudFront CDN, and automated GitHub Actions CI/CD deployment.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │          GitHub Actions Workflow (deploy.yml)           ││
│  │  - Build React/Vite application                         ││
│  │  - Deploy CDK infrastructure                            ││
│  │  - Upload to S3                                         ││
│  │  - Invalidate CloudFront cache                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      AWS Account                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Route53 (DNS)                           │  │
│  │  - Hosted Zone: snaphomz.in                          │  │
│  │  - Nameservers: ns-xxx.awsdns-xx.com               │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         CloudFront Distribution (CDN)               │  │
│  │  - Custom domain: snaphomz.in                        │  │
│  │  - SSL/TLS certificate (ACM)                         │  │
│  │  - Caching policies configured                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         S3 Bucket (Static Files)                     │  │
│  │  - snaphomz-india-{env}-{account-id}               │  │
│  │  - Versioning enabled                               │  │
│  │  - Block public access                              │  │
│  │  - SSE-S3 encryption                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

Before you start, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
   ```bash
   aws configure
   ```
3. **Node.js** 18+ and npm
4. **GitHub Account** with repository access
5. **GitHub CLI** (optional, for secret setup)
   ```bash
   # macOS
   brew install gh
   
   # Windows
   choco install gh
   ```

## Initial Setup

### 1. Create AWS IAM Role for GitHub Actions

First, create an IAM role for GitHub Actions with OIDC provider:

**Option A: Using CloudFormation (Recommended)**

```bash
# Create OIDC provider and IAM role
aws cloudformation create-stack \
  --stack-name github-actions-role \
  --template-body file://scripts/github-actions-iam-template.yaml \
  --capabilities CAPABILITY_NAMED_IAM
```

**Option B: Manual Setup**

1. Go to AWS IAM Console
2. Create OIDC Provider:
   - Provider: `token.actions.githubusercontent.com`
   - Client ID: `sts.amazonaws.com`
3. Create Role:
   - Trust entity: OIDC provider
   - Attach policies:
     - `AmazonS3FullAccess`
     - `CloudFrontFullAccess`
     - `IAMFullAccess`
     - `AWSCloudFormationFullAccess`

### 2. Configure GitHub Secrets

Set up the required GitHub secrets for your repository:

```bash
# Automated setup (requires GitHub CLI)
npm run setup:secrets

# Or manually in GitHub:
# Settings > Secrets and variables > Actions
```

Required secrets:
- `AWS_ACCOUNT_ID`: Your AWS account ID
- `AWS_ROLE_ARN`: ARN of the IAM role created above

Optional secrets:
- `SLACK_WEBHOOK_URL`: For deployment notifications

### 3. Set Up Infrastructure

Choose your domain name and environment, then deploy:

```bash
# macOS/Linux
chmod +x scripts/setup-infra.sh
./scripts/setup-infra.sh snaphomz.in demo

# Windows PowerShell
.\scripts\setup-infra.ps1 -DomainName "snaphomz.in" -Environment "demo"

# Or using npm
npm run setup:infra
```

This will:
1. ✓ Create Route53 Hosted Zone for snaphomz.in
2. ✓ Create S3 bucket for static hosting
3. ✓ Set up CloudFront distribution
4. ✓ Create SSL/TLS certificate (auto-validated)
5. ✓ Configure DNS records

**Important:** Update your domain registrar's nameservers to point to AWS Route53 nameservers (provided in the output).

## Deployment

### Development Environment

```bash
# Build only
npm run build

# Deploy to demo environment
npm run deploy:app:demo

# Or full deployment (build + deploy)
npm run deploy
```

### Staging Environment

```bash
npm run deploy:app:staging
```

### Production Environment

```bash
npm run deploy:app:prod
```

### Automatic Deployment (GitHub Actions)

Deployments are triggered automatically based on git branches:

- **main** branch → Deploys to **prod** environment
- **staging** branch → Deploys to **staging** environment
- **develop** branch → Deploys to **demo** environment

Push to trigger automatic deployment:

```bash
git push origin main              # Deploy to production
git push origin staging           # Deploy to staging
git push origin develop          # Deploy to demo
```

### Manual Deployment (Workflow Dispatch)

Trigger deployments manually from GitHub Actions:

1. Go to Actions tab in your repository
2. Select "Deploy Snaphomz India to AWS"
3. Click "Run workflow"
4. Choose environment and options

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions CI/CD workflow
├── infra/                          # AWS CDK Infrastructure as Code
│   ├── lib/
│   │   ├── hosted-zone-stack.ts   # Route53 hosted zone
│   │   └── static-site-stack.ts   # S3 + CloudFront stack
│   ├── app.ts                      # CDK app configuration
│   ├── cdk.json                    # CDK context
│   ├── tsconfig.json              # TypeScript configuration
│   └── package.json               # CDK dependencies
├── scripts/
│   ├── deploy-app.js              # Application deployment
│   ├── setup-infra.sh            # Infrastructure setup (bash)
│   ├── setup-infra.ps1           # Infrastructure setup (PowerShell)
│   └── setup-github-secrets.js    # GitHub secrets configuration
├── src/                            # React application source
├── public/                         # Static files
├── index.html                      # Entry point
├── vite.config.js                 # Vite configuration
└── package.json                   # Project dependencies
```

## Environment Configuration

### Environment Variables

Configure environment-specific variables:

**demo environment:**
- Domain: `tools.snaphomz.in` (or CloudFront domain)
- S3 Bucket: `snaphomz-india-demo-{account-id}`
- Branch: `develop`

**staging environment:**
- Domain: `staging.snaphomz.in`
- S3 Bucket: `snaphomz-india-staging-{account-id}`
- Branch: `staging`

**prod environment:**
- Domain: `snaphomz.in`
- S3 Bucket: `snaphomz-india-prod-{account-id}`
- Branch: `main`

### AWS Parameters (SSM)

Deployment details are stored in AWS Systems Manager Parameter Store:

```bash
# View bucket name
aws ssm get-parameter --name /snaphomz/india/demo/bucket-name

# View distribution ID
aws ssm get-parameter --name /snaphomz/india/demo/distribution-id

# View distribution domain
aws ssm get-parameter --name /snaphomz/india/demo/distribution-domain

# View hosted zone
aws ssm get-parameter --name /snaphomz/hosted-zone/snaphomz.in/zone-id
```

## Cache Configuration

The deployment uses intelligent cache headers:

- **Static assets** (JS, CSS, images): 1 year cache
- **HTML files**: No cache (always fresh)
- **Manifests** (JSON, XML): 1 hour cache

This ensures:
- Fast loading times for returning users
- Instant updates for HTML changes
- Configuration flexibility with JSON

## DNS Configuration

### If Using AWS Route53

If you're using a subdomain (e.g., `tools.snaphomz.in`):

1. Create an A record pointing to CloudFront distribution
2. Or use the automatic alias record created by CDK

### If Using External Domain Registrar

1. Note the Route53 nameservers from setup output
2. Update your domain registrar's DNS settings
3. Point nameservers to AWS Route53
4. Wait for DNS propagation (typically 24-48 hours)

DNS Example:
```
Name Servers:
  ns-123.awsdns-12.com
  ns-456.awsdns-34.com
  ns-789.awsdns-56.com
  ns-012.awsdns-78.com
```

## Monitoring & Logs

### CloudFront Logs

```bash
# View CloudFront metrics
aws cloudfront get-distribution --id {DISTRIBUTION_ID}

# List invalidations
aws cloudfront list-invalidations --distribution-id {DISTRIBUTION_ID}
```

### S3 Bucket Metrics

```bash
# List recent uploads
aws s3 ls s3://snaphomz-india-demo-{account-id}/ --recursive

# Check bucket size
aws s3 ls s3://snaphomz-india-demo-{account-id}/ --recursive --summarize
```

### GitHub Actions Logs

1. Go to Actions tab in GitHub
2. Select the workflow run
3. View detailed logs for each step

## Troubleshooting

### Deployment Fails with "Infrastructure not found"

Solution: Run setup again
```bash
npm run setup:infra
```

### CloudFront Distribution not updating

Solution: Manually invalidate cache
```bash
aws cloudfront create-invalidation \
  --distribution-id {DISTRIBUTION_ID} \
  --paths "/*"
```

### DNS not resolving

Solution: Verify nameserver configuration
```bash
nslookup snaphomz.in
# Or
dig snaphomz.in NS
```

### GitHub Actions OIDC authentication fails

Solution: Verify IAM role trust relationship
```bash
aws iam get-role --role-name github-actions-role
```

Ensure the trust policy includes:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::{ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:{OWNER}/{REPO}:ref:refs/heads/*"
        }
      }
    }
  ]
}
```

### S3 upload permissions denied

Solution: Verify IAM role has S3 permissions
```bash
aws s3 ls s3://snaphomz-india-demo-{account-id}/
```

If denied, add S3 policy to IAM role.

## Security Best Practices

1. **Least Privilege**: Minimize IAM permissions
2. **Secrets Management**: Never commit AWS credentials
3. **SSL/TLS**: Always use HTTPS
4. **S3 Bucket**: Block public access (already configured)
5. **CloudFront**: Use origin access identity (already configured)
6. **Monitoring**: Enable CloudTrail for audit logs

## Cost Optimization

### Estimate Monthly Costs

- **Route53 Hosted Zone**: $0.50
- **CloudFront Distribution**: $0.085/GB
- **S3 Storage**: $0.023/GB
- **S3 Requests**: $0.0007/1000 requests

### Cost-saving Tips

- Use CloudFront caching effectively (already configured)
- Delete old CloudFront distributions
- Archive old S3 versions
- Use S3 lifecycle policies

## References

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Route53 Documentation](https://docs.aws.amazon.com/route53/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Vite Documentation](https://vitejs.dev/)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Check AWS CloudTrail for error details
4. Consult AWS documentation

## License

MIT - See LICENSE file

---

**Maintained by:** Snaphomz Inc.
**Last Updated:** 2024
