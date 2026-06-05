#!/usr/bin/env node

/**
 * Setup GitHub Secrets for AWS Deployment
 * Usage: node setup-github-secrets.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(message, 'cyan');
}

function logHeader(message) {
  log('========================================', 'blue');
  log(message, 'blue');
  log('========================================', 'blue');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function setupSecrets() {
  logHeader('GitHub Secrets Setup');

  // Get GitHub repository information
  logInfo('');
  logInfo('First, let\'s get your GitHub repository information:');
  
  const owner = await question('GitHub repository owner (username or organization): ');
  const repo = await question('GitHub repository name: ');

  if (!owner || !repo) {
    logError('Owner and repository name are required');
    rl.close();
    process.exit(1);
  }

  // Verify GitHub CLI is installed
  try {
    execSync('gh --version', { stdio: 'ignore' });
  } catch (error) {
    logError('GitHub CLI (gh) is not installed. Please install it from https://cli.github.com');
    rl.close();
    process.exit(1);
  }

  // Get AWS Account ID
  logInfo('');
  logInfo('Now, let\'s get your AWS information:');
  
  let awsAccountId;
  try {
    awsAccountId = execSync('aws sts get-caller-identity --query Account --output text', {
      encoding: 'utf-8',
    }).trim();
    logSuccess(`AWS Account ID: ${awsAccountId}`);
  } catch (error) {
    logError('Failed to retrieve AWS Account ID. Make sure AWS CLI is configured.');
    rl.close();
    process.exit(1);
  }

  // Get or create IAM role for GitHub Actions
  logInfo('');
  logInfo('Setting up IAM role for GitHub Actions OIDC...');
  
  const roleName = await question('IAM role name for GitHub Actions (default: github-actions-role): ') || 'github-actions-role';

  // Check if role exists
  let roleArn;
  try {
    const roleInfo = execSync(`aws iam get-role --role-name ${roleName}`, {
      encoding: 'utf-8',
    });
    roleArn = JSON.parse(roleInfo).Role.Arn;
    logSuccess(`Found existing role: ${roleName}`);
  } catch (error) {
    logWarning(`Role ${roleName} not found. Please create it with proper permissions first.`);
    logInfo('You can create the role with CloudFormation or manually through AWS Console.');
    
    roleArn = await question('Enter the ARN of the IAM role: ');
    
    if (!roleArn.startsWith('arn:aws:iam::')) {
      logError('Invalid ARN format');
      rl.close();
      process.exit(1);
    }
  }

  logSuccess(`IAM Role ARN: ${roleArn}`);

  // Set GitHub secrets
  logInfo('');
  logInfo('Setting GitHub secrets...');
  
  const secrets = {
    'AWS_ACCOUNT_ID': awsAccountId,
    'AWS_ROLE_ARN': roleArn,
  };

  for (const [key, value] of Object.entries(secrets)) {
    try {
      execSync(`gh secret set ${key} --body "${value}" --repo ${owner}/${repo}`, {
        stdio: 'ignore',
      });
      logSuccess(`Secret set: ${key}`);
    } catch (error) {
      logError(`Failed to set secret: ${key}`);
      console.error(error.message);
    }
  }

  // Optional: Set Slack webhook
  logInfo('');
  const setupSlack = await question('Do you want to setup Slack notifications? (y/n): ');
  
  if (setupSlack.toLowerCase() === 'y') {
    const slackWebhook = await question('Enter your Slack webhook URL: ');
    
    if (slackWebhook) {
      try {
        execSync(`gh secret set SLACK_WEBHOOK_URL --body "${slackWebhook}" --repo ${owner}/${repo}`, {
          stdio: 'ignore',
        });
        logSuccess('Secret set: SLACK_WEBHOOK_URL');
      } catch (error) {
        logError('Failed to set Slack webhook');
      }
    }
  }

  // Display summary
  logInfo('');
  logHeader('Setup Complete!');
  log(`Repository: ${owner}/${repo}`, 'cyan');
  log(`AWS Account ID: ${awsAccountId}`, 'cyan');
  log(`IAM Role ARN: ${roleArn}`, 'cyan');
  logInfo('');
  logInfo('The following secrets have been configured:');
  Object.keys(secrets).forEach((key) => {
    log(`  - ${key}`, 'cyan');
  });

  logWarning('⚠️  Make sure your IAM role has the following policies:');
  logWarning('  - S3 access (upload to bucket)');
  logWarning('  - CloudFront access (create invalidations)');
  logWarning('  - CDK deploy permissions');
  logWarning('  - SSM Parameter Store read access');

  logInfo('');
  logSuccess('All setup complete! You can now trigger deployments via GitHub Actions.');

  rl.close();
}

setupSecrets().catch((error) => {
  logError(error.message);
  process.exit(1);
});
