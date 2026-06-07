#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StaticSiteStack } from './lib/static-site-stack';

// DNS is managed by Namecheap (ALIAS record → CloudFront) — same as snaphomz.com.
// Route53 hosted zone is NOT needed.
// ACM cert is already ISSUED — import by ARN, no DNS validation wait.

const app = new cdk.App();

const environment = process.env.ENVIRONMENT || 'demo';
const awsAccount = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;
const awsRegion = process.env.CDK_DEFAULT_REGION || 'us-east-1';

if (!awsAccount) {
  throw new Error('AWS_ACCOUNT_ID environment variable is required');
}

const customDomain = process.env.CUSTOM_DOMAIN || 'snaphomz.in';
// Cert already ISSUED — pass ARN so CloudFront uses it immediately (no wait)
const certificateArn = process.env.CERTIFICATE_ARN;

const env = { account: awsAccount, region: awsRegion };

new StaticSiteStack(app, `snaphomz-india-${environment}`, {
  env,
  environment,
  customDomain,
  certificateArn,
  description: `Snaphomz India Static Site - ${environment}`,
});

app.synth();
