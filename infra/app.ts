#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StaticSiteStack } from './lib/static-site-stack';
import { HostedZoneStack } from './lib/hosted-zone-stack';

const app = new cdk.App();

const environment = process.env.ENVIRONMENT || 'demo';
const awsAccount = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;
const awsRegion = process.env.CDK_DEFAULT_REGION || 'us-east-1';

if (!awsAccount) {
  throw new Error('AWS_ACCOUNT_ID environment variable is required');
}

const domainName = process.env.DOMAIN_NAME || 'snaphomz.in';
const customDomain = process.env.CUSTOM_DOMAIN || 'snaphomz.in';
const hostedZoneId = process.env.HOSTED_ZONE_ID || undefined;
const hostedZoneName = process.env.HOSTED_ZONE_NAME || 'snaphomz.in';
const certificateArn = process.env.CERTIFICATE_ARN || undefined;
const createCertificate = process.env.CREATE_CERTIFICATE === 'true';

const env = { account: awsAccount, region: awsRegion };

// ── Hosted Zone Stack ─────────────────────────────────────────────────────────
// Deploy once with: npx cdk deploy SnaphomzHostedZone
// Reference pattern: schooltocollege-static
new HostedZoneStack(app, 'SnaphomzHostedZone', {
  env,
  domainName,
  description: `Route53 Hosted Zone for ${domainName}`,
});

// ── Static Site Stack ─────────────────────────────────────────────────────────
// Deploy with: npx cdk deploy snaphomz-india-{env}
// Reference pattern: snaphomz-toolpage
new StaticSiteStack(app, `snaphomz-india-${environment}`, {
  env,
  environment,
  customDomain,
  hostedZoneId,
  hostedZoneName,
  certificateArn,
  createCertificate,
  description: `Snaphomz India Static Site - ${environment}`,
});

app.synth();
