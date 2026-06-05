# GitHub Actions Environments Configuration

This document explains how GitHub Actions environments are configured and used for deployments.

## Environments Overview

| Environment | Branch | Domain | Purpose |
|---|---|---|---|
| **demo** | develop | CloudFront domain | Development/testing |
| **staging** | staging | staging.snaphomz.in | Pre-production testing |
| **prod** | main | snaphomz.in | Production |

## Environment Settings

Each environment in GitHub Actions has specific configurations:

### Demo Environment
- **Deployment Frequency:** On every develop push
- **Manual Deployment:** Always allowed
- **Reviewers:** None required
- **Deployment Branch:** develop

### Staging Environment
- **Deployment Frequency:** On every staging push
- **Manual Deployment:** Always allowed
- **Reviewers:** Optional (can require specific users)
- **Deployment Branch:** staging

### Production Environment
- **Deployment Frequency:** On every main push
- **Manual Deployment:** Allowed with approval
- **Reviewers:** Can require specific users for approval
- **Deployment Branch:** main

## Setting Up Environments in GitHub

### 1. Create Environment (if not exists)

Go to Repository Settings:
1. Settings → Environments
2. Click "New environment"
3. Name: `demo`, `staging`, or `prod`
4. Configure rules (optional)

### 2. Add Secrets per Environment

For each environment, add:
- `AWS_ACCOUNT_ID`: Your AWS account ID
- `AWS_ROLE_ARN`: IAM role ARN
- `SLACK_WEBHOOK_URL`: (optional) Slack webhook

**Note:** Secrets can be inherited from organization level.

### 3. Configure Deployment Protection Rules

For production deployments (optional):

1. Go to Environment Settings
2. Enable "Required reviewers"
3. Add reviewers who must approve deployments
4. Set wait timer if needed

## Workflow Variables

Environment-specific variables are set in the workflow:

```yaml
environment:
  name: ${{ needs.setup.outputs.environment }}
  url: ${{ steps.deployment.outputs.url }}
```

This automatically:
- Links deployments to the correct environment
- Displays deployment URL in GitHub
- Tracks deployment history

## Branch Protection Rules

Recommended setup for safer deployments:

### Main Branch (Production)
```
- Require pull request reviews before merging
- Require status checks to pass before merging
- Include administrators in restrictions
- Require branches to be up to date before merging
```

### Staging Branch
```
- Require pull request reviews before merging
- Require status checks to pass before merging
```

### Develop Branch
```
- Require status checks to pass before merging
```

## Deployment History

View deployment history:
1. Go to Deployments tab
2. Click on an environment
3. View all deployments and their status

## Manual Deployments

Manually trigger deployments:

1. Go to Actions tab
2. Select "Deploy Snaphomz India to AWS"
3. Click "Run workflow"
4. Select:
   - Branch (keep main for production)
   - Environment (demo/staging/prod)
   - Create hosted zone (false for regular deployments)

## Environment Variables in Workflow

The workflow sets the following for each environment:

### Demo
```
ENVIRONMENT=demo
CUSTOM_DOMAIN=snaphomz.in
S3_BUCKET=snaphomz-india-demo-{ACCOUNT_ID}
DISTRIBUTION_ID=<auto-retrieved>
```

### Staging
```
ENVIRONMENT=staging
CUSTOM_DOMAIN=staging.snaphomz.in
S3_BUCKET=snaphomz-india-staging-{ACCOUNT_ID}
DISTRIBUTION_ID=<auto-retrieved>
```

### Production
```
ENVIRONMENT=prod
CUSTOM_DOMAIN=snaphomz.in
S3_BUCKET=snaphomz-india-prod-{ACCOUNT_ID}
DISTRIBUTION_ID=<auto-retrieved>
```

## Deployment Notifications

### Slack Notifications

If `SLACK_WEBHOOK_URL` is configured, deployments trigger Slack messages:

```
✅ Deployment Complete
Environment: prod
Branch: main
Commit: abc1234
Author: @username
```

To set up:
1. Create Slack Webhook: https://api.slack.com/messaging/webhooks
2. Add to GitHub secrets: `SLACK_WEBHOOK_URL`

## Concurrency Control

By default, deployments are sequential. To run parallel:

```yaml
jobs:
  build-and-deploy:
    concurrency:
      group: deployment-${{ matrix.environment }}
      cancel-in-progress: false
```

## Troubleshooting Deployments

### Deployment stuck in progress

Check workflow logs:
1. Actions tab → Latest run
2. Look for "Deploy infrastructure with CDK" step
3. Check for errors

### Environment not found

Ensure environment exists in GitHub:
1. Settings → Environments
2. Verify environment name matches workflow

### Secrets not available

Verify secrets are set:
1. Settings → Secrets and variables → Actions
2. Check environment-specific secrets
3. Check organization-level secrets

## Best Practices

1. **Use environment protection rules** for production
2. **Require approvals** for production deployments
3. **Monitor deployments** regularly
4. **Test in demo** before staging
5. **Use semantic versioning** in tags
6. **Keep deployment history clean** - archive old runs

## References

- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branch-protection-rules)
