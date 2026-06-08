import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

interface StaticSiteStackProps extends cdk.StackProps {
  environment: string;
  customDomain?: string;    // e.g. snaphomz.in
  wwwDomain?: string;       // e.g. www.snaphomz.in  (CF aliases + Route53 only)
  certificateArn?: string;  // pre-existing ISSUED cert covering both apex + www
  hostedZoneId?: string;
  hostedZoneName?: string;
}

export class StaticSiteStack extends cdk.Stack {
  public readonly bucketName: string;
  public readonly distributionDomainName: string;
  public readonly distributionId: string;

  constructor(scope: Construct, id: string, props: StaticSiteStackProps) {
    super(scope, id, props);

    const environment = props.environment;

    // S3 bucket
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: `snaphomz-india-${environment}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [{ noncurrentVersionExpiration: cdk.Duration.days(30) }],
    });

    this.bucketName = siteBucket.bucketName;

    // CloudFront OAI
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for snaphomz-india ${environment}`,
    });
    siteBucket.grantRead(oai);

    // ACM Certificate - import pre-existing ISSUED cert by ARN
    // Cert must already cover both apex (snaphomz.in) and www.snaphomz.in as SANs
    // Use the prepare-certificate job in CI to create/validate the cert first
    let certificate: acm.ICertificate | undefined;
    const domainNames: string[] = [];

    if (props.customDomain && props.certificateArn) {
      certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', props.certificateArn);
      domainNames.push(props.customDomain);
      if (props.wwwDomain) domainNames.push(props.wwwDomain);
    }

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket, { originAccessIdentity: oai }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: cdk.Duration.minutes(5) },
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: cdk.Duration.minutes(5) },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enableIpv6: true,
      ...(certificate && domainNames.length > 0 && { domainNames, certificate }),
    });

    this.distributionDomainName = distribution.domainName;
    this.distributionId = distribution.distributionId;

    // Route53 A + AAAA for apex and www - matches snaphomz.com pattern
    if (props.customDomain && props.hostedZoneId && props.hostedZoneName) {
      const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.hostedZoneName,
      });

      const cfTarget = route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(distribution),
      );

      // Apex records: snaphomz.in
      new route53.ARecord(this, 'ARecord', {
        zone: hostedZone,
        recordName: props.customDomain,
        target: cfTarget,
      });
      new route53.AaaaRecord(this, 'AaaaRecord', {
        zone: hostedZone,
        recordName: props.customDomain,
        target: cfTarget,
      });

      // www records: www.snaphomz.in
      if (props.wwwDomain) {
        new route53.ARecord(this, 'WwwARecord', {
          zone: hostedZone,
          recordName: props.wwwDomain,
          target: cfTarget,
        });
        new route53.AaaaRecord(this, 'WwwAaaaRecord', {
          zone: hostedZone,
          recordName: props.wwwDomain,
          target: cfTarget,
        });
      }
    }

    // SSM Parameter Store
    new ssm.StringParameter(this, 'BucketNameParameter', {
      parameterName: `/snaphomz/india/${environment}/bucket-name`,
      stringValue: siteBucket.bucketName,
    });
    new ssm.StringParameter(this, 'DistributionIdParameter', {
      parameterName: `/snaphomz/india/${environment}/distribution-id`,
      stringValue: distribution.distributionId,
    });
    new ssm.StringParameter(this, 'DistributionDomainParameter', {
      parameterName: `/snaphomz/india/${environment}/distribution-domain`,
      stringValue: distribution.domainName,
    });

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: siteBucket.bucketName,
      exportName: `SnaphomzIndia-${environment}-BucketName`,
    });
    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      exportName: `SnaphomzIndia-${environment}-DistributionId`,
    });
    new cdk.CfnOutput(this, 'DistributionDomain', {
      value: distribution.domainName,
      exportName: `SnaphomzIndia-${environment}-DistributionDomain`,
    });
    if (props.customDomain) {
      new cdk.CfnOutput(this, 'CustomDomain', {
        value: `https://${props.customDomain}`,
        exportName: `SnaphomzIndia-${environment}-CustomDomain`,
      });
    }
  }
}
