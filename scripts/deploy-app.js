#!/usr/bin/env node

/**
 * Deploy application to S3 and invalidate CloudFront
 * Usage: node deploy-app.js [environment]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const environment = process.argv[2] || 'demo';

// Colors for output
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

function execCommand(command, description) {
  try {
    logInfo(`${description}...`);
    const result = execSync(command, { encoding: 'utf-8' });
    logSuccess(description);
    return result.trim();
  } catch (error) {
    logError(`${description} failed`);
    console.error(error.message);
    process.exit(1);
  }
}

function getAwsParameter(parameterName) {
  try {
    const result = execSync(
      `aws ssm get-parameter --name "${parameterName}" --query 'Parameter.Value' --output text`,
      { encoding: 'utf-8' }
    );
    return result.trim();
  } catch (error) {
    logError(`Failed to retrieve parameter: ${parameterName}`);
    console.error(error.message);
    return null;
  }
}

function deployApp() {
  logHeader(`Deploying Snaphomz India - ${environment.toUpperCase()}`);

  // Verify build directory exists
  if (!fs.existsSync('dist')) {
    logWarning('Build directory not found. Building application...');
    execCommand(`npm run build:${environment}`, 'Building application for ' + environment);
  }

  // Retrieve S3 bucket and CloudFront distribution info
  logInfo('Retrieving AWS resources...');
  const bucketName = getAwsParameter(`/snaphomz/india/${environment}/bucket-name`);
  const distributionId = getAwsParameter(`/snaphomz/india/${environment}/distribution-id`);
  const distributionDomain = getAwsParameter(`/snaphomz/india/${environment}/distribution-domain`);

  if (!bucketName || !distributionId) {
    logError('Failed to retrieve AWS resources. Make sure the infrastructure is deployed.');
    process.exit(1);
  }

  logSuccess(`Retrieved S3 bucket: ${bucketName}`);
  logSuccess(`Retrieved CloudFront distribution: ${distributionId}`);

  // Upload static assets with long cache
  logInfo('Uploading static assets with long-term cache...');
  try {
    execSync(
      `aws s3 sync dist/ s3://${bucketName}/ --delete ` +
      `--cache-control "public, max-age=31536000" ` +
      `--exclude "*.html" ` +
      `--exclude "*.json" ` +
      `--exclude "*.xml"`,
      { stdio: 'inherit' }
    );
    logSuccess('Static assets uploaded');
  } catch (error) {
    logError('Failed to upload static assets');
    process.exit(1);
  }

  // Upload HTML files with no cache
  logInfo('Uploading HTML files with short-term cache...');
  try {
    execSync(
      `aws s3 sync dist/ s3://${bucketName}/ --delete ` +
      `--cache-control "public, max-age=0, must-revalidate" ` +
      `--include "*.html" ` +
      `--content-type "text/html"`,
      { stdio: 'inherit' }
    );
    logSuccess('HTML files uploaded');
  } catch (error) {
    logError('Failed to upload HTML files');
    process.exit(1);
  }

  // Upload manifest and config files with medium cache
  logInfo('Uploading manifest and configuration files...');
  try {
    execSync(
      `aws s3 sync dist/ s3://${bucketName}/ --delete ` +
      `--cache-control "public, max-age=3600" ` +
      `--include "*.json" ` +
      `--include "*.xml"`,
      { stdio: 'inherit' }
    );
    logSuccess('Manifest and configuration files uploaded');
  } catch (error) {
    logError('Failed to upload manifest and configuration files');
    process.exit(1);
  }

  // Invalidate CloudFront cache
  logInfo('Invalidating CloudFront cache...');
  try {
    execSync(
      `aws cloudfront create-invalidation --distribution-id ${distributionId} --paths "/*"`,
      { stdio: 'inherit' }
    );
    logSuccess('CloudFront cache invalidation initiated');
  } catch (error) {
    logError('Failed to invalidate CloudFront cache');
    process.exit(1);
  }

  // Display deployment summary
  log('');
  logHeader('Deployment Complete!');
  log(`Environment: ${environment}`, 'cyan');
  log(`S3 Bucket: ${bucketName}`, 'cyan');
  log(`CloudFront Distribution: ${distributionId}`, 'cyan');
  log(`CloudFront Domain: https://${distributionDomain}`, 'cyan');
  log(`Custom Domain: https://snaphomz.in`, 'cyan');
  log('');
  logSuccess('Deployment finished successfully!');
  log('');
  log('Note: CloudFront cache invalidation may take a few minutes to complete.', 'yellow');
  log('Your application should be available at the URLs above.', 'cyan');
}

deployApp();
