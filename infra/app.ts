#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StaticSiteStack } from './lib/static-site-stack';
import { HostedZoneStack } from './lib/hosted-zone-stack';

const app = new cdk.App();

// Get environment configuration from context or environment variables
const environment = process.env.ENVIRONMENT || app.node.tryGetContext('environment') || 'demo';
const awsAccount = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;
const awsRegion = process.env.CDK_DEFAULT_REGION || 'us-east-1';

if (!awsAccount) {
  throw new Error('AWS_ACCOUNT_ID environment variable is required');
}

// Get domain and hosted zone configuration
const customDomain = process.env.CUSTOM_DOMAIN || app.node.tryGetContext('custom-domain') || 'snaphomz.in';
const domainName = process.env.DOMAIN_NAME || app.node.tryGetContext('domain-name') || 'snaphomz.in';
const hostedZoneId = process.env.HOSTED_ZONE_ID || app.node.tryGetContext('hosted-zone-id') || undefined;
const hostedZoneName = process.env.HOSTED_ZONE_NAME || app.node.tryGetContext('hosted-zone-name') || 'snaphomz.in';
const certificateArn = process.env.CERTIFICATE_ARN || app.node.tryGetContext('certificate-arn') || undefined;
const createCertificate = process.env.CREATE_CERTIFICATE === 'true' || app.node.tryGetContext('create-certificate') === true;
const createHostedZone = process.env.CREATE_HOSTED_ZONE === 'true' && app.node.tryGetContext('create-hosted-zone') !== false;
const deployMode = app.node.tryGetContext('deploy-mode') || 'all'; // 'hosted-zone', 'static-site', or 'all'

console.log('CDK App Configuration:');
console.log(`  Environment: ${environment}`);
console.log(`  AWS Account: ${awsAccount}`);
console.log(`  AWS Region: ${awsRegion}`);
console.log(`  Custom Domain: ${customDomain}`);
console.log(`  Hosted Zone ID: ${hostedZoneId || 'NOT SET'}`);
console.log(`  Create Certificate: ${createCertificate}`);
console.log(`  Create Hosted Zone: ${createHostedZone}`);
console.log(`  Deploy Mode: ${deployMode}`);

const env = {
  account: awsAccount,
  region: awsRegion,
};

// Deploy based on mode to avoid cross-stack issues
if (deployMode === 'hosted-zone' || deployMode === 'all') {
  // Create Hosted Zone if needed (typically only once)
  if (createHostedZone) {
    new HostedZoneStack(app, 'SnaphomzHostedZone', {
      env,
      domainName,
      enableDnsSecValidation: false,
      description: `Route 53 Hosted Zone for ${domainName}`,
    });
  }
}

if (deployMode === 'static-site' || deployMode === 'all') {
  // Create Static Site Stack
  const stackName = `snaphomz-india-${environment}`;
  new StaticSiteStack(app, stackName, {
    env,
    environment,
    description: `Snaphomz India Static Site - ${environment} environment`,
    customDomain,
    hostedZoneId,
    hostedZoneName,
    certificateArn,
    createCertificate,
  });
}

app.synth();
