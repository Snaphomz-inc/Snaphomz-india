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
  customDomain?: string;
  hostedZoneId?: string;
  hostedZoneName?: string;
  certificateArn?: string;
  createCertificate?: boolean;
}

export class StaticSiteStack extends cdk.Stack {
  public readonly bucketName: string;
  public readonly distributionDomainName: string;
  public readonly distributionId: string;

  constructor(scope: Construct, id: string, props: StaticSiteStackProps) {
    super(scope, id, props);

    const environment = props.environment;

    // Create S3 bucket for static site hosting
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: `snaphomz-india-${environment}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [
        {
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    this.bucketName = siteBucket.bucketName;

    // Create Origin Access Identity for CloudFront
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for snaphomz-india ${environment}`,
    });

    // Grant CloudFront access to S3 bucket
    siteBucket.grantRead(oai);

    // Setup custom domain and certificate
    let certificate: acm.ICertificate | undefined;
    const domainNames: string[] = [];

    if (props.customDomain) {
      if (props.createCertificate && props.certificateArn) {
        // Use existing certificate ARN (highest priority)
        certificate = acm.Certificate.fromCertificateArn(
          this,
          'Certificate',
          props.certificateArn
        );
        domainNames.push(props.customDomain);
      } else if (props.createCertificate && props.hostedZoneId && props.hostedZoneName) {
        // Create certificate using DNS validation with existing hosted zone
        try {
          const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
            this,
            'HostedZone',
            {
              hostedZoneId: props.hostedZoneId,
              zoneName: props.hostedZoneName,
            }
          );

          certificate = new acm.Certificate(this, 'Certificate', {
            domainName: props.customDomain,
            validation: acm.CertificateValidation.fromDns(hostedZone),
          });

          domainNames.push(props.customDomain);
        } catch (error) {
          console.warn('Failed to create certificate with DNS validation:', error);
          console.warn('Proceeding without HTTPS certificate');
        }
      }
    }

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket, {
          originAccessIdentity: oai,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enableIpv6: true,
      ...(certificate && domainNames.length > 0 && {
        domainNames,
        certificate,
      }),
    });

    this.distributionDomainName = distribution.domainName;
    this.distributionId = distribution.distributionId;

    // Create Route 53 alias record if custom domain and hosted zone are provided
    if (props.customDomain && props.hostedZoneId && props.hostedZoneName) {
      const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        'HostedZoneForAlias',
        {
          hostedZoneId: props.hostedZoneId,
          zoneName: props.hostedZoneName,
        }
      );

      new route53.ARecord(this, 'AliasRecord', {
        zone: hostedZone,
        recordName: props.customDomain,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.CloudFrontTarget(distribution)
        ),
      });
    }

    // Store important values in SSM Parameter Store
    new ssm.StringParameter(this, 'BucketNameParameter', {
      parameterName: `/snaphomz/india/${environment}/bucket-name`,
      stringValue: siteBucket.bucketName,
      description: 'S3 bucket name for static site',
    });

    new ssm.StringParameter(this, 'DistributionIdParameter', {
      parameterName: `/snaphomz/india/${environment}/distribution-id`,
      stringValue: distribution.distributionId,
      description: 'CloudFront distribution ID',
    });

    new ssm.StringParameter(this, 'DistributionDomainParameter', {
      parameterName: `/snaphomz/india/${environment}/distribution-domain`,
      stringValue: distribution.domainName,
      description: 'CloudFront distribution domain name',
    });

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: siteBucket.bucketName,
      description: 'S3 bucket name',
      exportName: `SnaphomzIndia-${environment}-BucketName`,
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: `SnaphomzIndia-${environment}-DistributionId`,
    });

    new cdk.CfnOutput(this, 'DistributionDomain', {
      value: distribution.domainName,
      description: 'CloudFront distribution domain',
      exportName: `SnaphomzIndia-${environment}-DistributionDomain`,
    });

    if (props.customDomain) {
      new cdk.CfnOutput(this, 'CustomDomain', {
        value: `https://${props.customDomain}`,
        description: 'Custom domain URL',
        exportName: `SnaphomzIndia-${environment}-CustomDomain`,
      });
    }
  }
}
