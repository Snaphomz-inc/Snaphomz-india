# Setup Checklist & Status

Complete this checklist to ensure your Snaphomz India infrastructure is properly deployed.

## Prerequisites

- [ ] AWS Account created
- [ ] AWS CLI installed (`aws --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] GitHub account created
- [ ] Git installed and configured
- [ ] GitHub CLI installed (optional, for automation)

## AWS Setup

- [ ] AWS credentials configured (`aws configure`)
- [ ] Verify AWS access: `aws sts get-caller-identity`
- [ ] AWS Account ID noted
- [ ] IAM role for GitHub Actions created
- [ ] OIDC provider created in IAM
- [ ] S3 bucket permissions available
- [ ] CloudFront permissions available
- [ ] Route53 permissions available
- [ ] ACM certificate permissions available

## GitHub Setup

- [ ] Repository created/forked
- [ ] Code pushed to GitHub
- [ ] GitHub secrets configured:
  - [ ] `AWS_ACCOUNT_ID`
  - [ ] `AWS_ROLE_ARN`
- [ ] Environments created in GitHub:
  - [ ] demo
  - [ ] staging
  - [ ] prod
- [ ] Branch protection rules configured
- [ ] GitHub Actions enabled
- [ ] Deploy workflow file in place: `.github/workflows/deploy.yml`

## Local Development

- [ ] Project dependencies installed: `npm install`
- [ ] Application builds successfully: `npm run build`
- [ ] Vite configured correctly
- [ ] Environment variables set up (if needed)
- [ ] Dev server runs: `npm run dev`

## Infrastructure Setup

- [ ] CDK infrastructure files created
- [ ] CDK dependencies installed: `cd infra && npm install`
- [ ] TypeScript compiles: `npm run build`
- [ ] Hosted zone created for snaphomz.in
- [ ] S3 buckets created for all environments:
  - [ ] demo
  - [ ] staging
  - [ ] prod
- [ ] CloudFront distributions created
- [ ] SSL/TLS certificates provisioned
- [ ] Route53 DNS records configured
- [ ] SSM parameters populated:
  - [ ] `/snaphomz/india/demo/bucket-name`
  - [ ] `/snaphomz/india/demo/distribution-id`
  - [ ] `/snaphomz/india/demo/distribution-domain`
  - [ ] (same for staging and prod)

## Domain Configuration

- [ ] Domain registered (snaphomz.in)
- [ ] Domain registrar account access verified
- [ ] Route53 nameservers noted
- [ ] Domain nameservers updated at registrar
- [ ] DNS propagation verified:
  ```bash
  nslookup -type=NS snaphomz.in
  ```
- [ ] Domain resolves correctly (wait 24-48 hours if needed)
- [ ] SSL certificate validated
- [ ] HTTPS works: `https://snaphomz.in`

## Deployment Testing

- [ ] Demo deployment successful
  - [ ] Command: `npm run deploy:app:demo`
  - [ ] Files uploaded to S3
  - [ ] CloudFront cache invalidated
  - [ ] Site accessible at CloudFront domain

- [ ] Staging deployment successful
  - [ ] Command: `npm run deploy:app:staging`
  - [ ] Accessible at staging domain

- [ ] Production deployment successful
  - [ ] Command: `npm run deploy:app:prod`
  - [ ] Accessible at snaphomz.in
  - [ ] HTTPS certificate valid

## GitHub Actions Testing

- [ ] Workflow file syntax valid
- [ ] Test push to develop branch triggers demo deployment
- [ ] Check workflow run logs
- [ ] Verify app deployed to demo environment
- [ ] Test push to staging triggers staging deployment
- [ ] Test push to main triggers production deployment
- [ ] Deployments show in GitHub Deployments tab
- [ ] Deployment URLs link correctly

## Monitoring & Logging

- [ ] CloudWatch logs configured
- [ ] CloudFront logs enabled (optional)
- [ ] S3 access logs enabled (optional)
- [ ] GitHub Actions logs visible
- [ ] Alerts configured (optional)
- [ ] Slack notifications enabled (optional)

## Documentation

- [ ] README.md updated with project info
- [ ] DEPLOYMENT.md reviewed and bookmarked
- [ ] QUICKSTART.md available for new developers
- [ ] ENVIRONMENTS.md understood
- [ ] Architecture diagram available
- [ ] Team documentation shared

## Security Review

- [ ] IAM role follows least privilege principle
- [ ] Secrets are properly protected
- [ ] No hardcoded credentials in code
- [ ] S3 bucket has block public access enabled
- [ ] CloudFront has origin access identity
- [ ] HTTPS enforced
- [ ] SSL/TLS certificate is valid
- [ ] Security groups configured (if using EC2)

## Performance Optimization

- [ ] CloudFront caching policies configured
- [ ] Cache headers set correctly:
  - [ ] Static assets: 1 year
  - [ ] HTML: no cache
  - [ ] Config files: 1 hour
- [ ] Compression enabled in CloudFront
- [ ] Price class optimized
- [ ] IPv6 enabled in CloudFront

## Maintenance & Operations

- [ ] Backup strategy planned
- [ ] DNS records documented
- [ ] SSL certificate renewal process understood
- [ ] Cost monitoring enabled
- [ ] Monthly cost tracking set up
- [ ] Disaster recovery plan created
- [ ] Team members have access
- [ ] Documentation kept up-to-date

## Post-Deployment

- [ ] Run end-to-end test from browser
- [ ] Test on mobile devices
- [ ] Test different browsers
- [ ] Verify page load times
- [ ] Check all links work
- [ ] Verify images load correctly
- [ ] Test form submissions (if applicable)
- [ ] Check analytics integration (if applicable)

## Known Issues / Notes

List any issues or notes here for future reference:

```
1. Issue: [describe issue]
   Resolution: [how it was resolved]
   Date: [date]

2. Issue: [describe issue]
   Resolution: [how it was resolved]
   Date: [date]
```

## Contact & Support

- **Team Lead:** [Name]
- **AWS Account Owner:** [Name]
- **GitHub Organization Owner:** [Name]
- **Domain Registrar:** [Registrar Name]
- **Slack Channel:** [#channel]

## Approval Sign-Off

- [ ] Development Lead Approved: ________________ Date: _______
- [ ] Operations Lead Approved: ________________ Date: _______
- [ ] Project Manager Approved: ________________ Date: _______

---

## Quick Status Check

Run these commands to verify your setup:

```bash
# Check AWS access
aws sts get-caller-identity

# Check GitHub
gh auth status

# Check Node.js
node --version
npm --version

# Check project
npm run build

# Check CDK
cd infra && npm run cdk:synth

# Check CloudFront
aws cloudfront list-distributions

# Check S3 buckets
aws s3 ls

# Check Route53 hosted zones
aws route53 list-hosted-zones
```

**Setup Date:** ________________
**Last Updated:** ________________
**Next Review Date:** ________________

---

For detailed information, see:
- [Deployment Guide](DEPLOYMENT.md)
- [Quick Start Guide](QUICKSTART.md)
- [Environments Configuration](ENVIRONMENTS.md)
