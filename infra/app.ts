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

const domainName     = process.env.DOMAIN_NAME     || 'snaphomz.in';
const customDomain   = process.env.CUSTOM_DOMAIN   || 'snaphomz.in';
const wwwDomain      = process.env.WWW_DOMAIN      || 'www.snaphomz.in';
const hostedZoneId   = process.env.HOSTED_ZONE_ID  || undefined;
const hostedZoneName = process.env.HOSTED_ZONE_NAME || 'snaphomz.in';
// Cert must be pre-created + ISSUED before CDK deploy (see prepare-certificate job in CI)
// Must cover both snaphomz.in and www.snaphomz.in as SANs
const certificateArn = process.env.CERTIFICATE_ARN || undefined;

const env = { account: awsAccount, region: awsRegion };

// Stack 1: Route53 Hosted Zone (deployed once, idempotent)
new HostedZoneStack(app, 'SnaphomzHostedZone', {
  env,
  domainName,
  description: `Route53 Hosted Zone for ${domainName}`,
});

// Stack 2: S3 + CloudFront + Route53 A/AAAA records (cert imported by ARN)
new StaticSiteStack(app, `snaphomz-india-${environment}`, {
  env,
  environment,
  customDomain,
  wwwDomain,
  certificateArn,
  hostedZoneId,
  hostedZoneName,
  description: `Snaphomz India Static Site - ${environment}`,
});

app.synth();