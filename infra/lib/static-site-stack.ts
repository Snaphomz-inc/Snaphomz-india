import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

// DNS is managed by Namecheap (ALIAS → CloudFront), same pattern as snaphomz.com.
// No Route53 records needed here.
interface StaticSiteStackProps extends cdk.StackProps {
  environment: string;
  customDomain?: string;
  certificateArn?: string;
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

    // Import existing issued certificate (no DNS validation wait)
    let certificate: acm.ICertificate | undefined;
    const domainNames: string[] = [];

    if (props.customDomain && props.certificateArn) {
      certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', props.certificateArn);
      domainNames.push(props.customDomain);
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

    if (props.customDomain) {
      new cdk.CfnOutput(this, 'CustomDomain', {
        value: `https://${props.customDomain}`,
        exportName: `SnaphomzIndia-${environment}-CustomDomain`,
      });
    }
  }
}

export class StaticSiteStack extends cdk.Stack {
  public readonly bucketName: string;
  public readonly distributionDomainName: string;
  public readonly distributionId: string;

  constructor(scope: Construct, id: string, props: StaticSiteStackProps) {
    super(scope, id, props);

    const environment = props.environment;

    // S3 bucket — RETAIN like snaphomz-toolpage (no autoDeleteObjects Lambda)
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

    // CloudFront Origin Access Identity
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for snaphomz-india ${environment}`,
    });

    siteBucket.grantRead(oai);

    // Certificate — like snaphomz-toolpage:
    //   if certificateArn provided  → import existing cert (fastest, no waiting)
    //   if createCertificate + zone  → create cert with DNS validation against existing zone
    let certificate: acm.ICertificate | undefined;
    const domainNames: string[] = [];

    if (props.customDomain) {
      if (props.certificateArn) {
        certificate = acm.Certificate.fromCertificateArn(
          this,
          'Certificate',
          props.certificateArn,
        );
        domainNames.push(props.customDomain);
      } else if (props.createCertificate && props.hostedZoneId && props.hostedZoneName) {
        const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
          this,
          'HostedZone',
          {
            hostedZoneId: props.hostedZoneId,
            zoneName: props.hostedZoneName,
          },
        );
        certificate = new acm.Certificate(this, 'Certificate', {
          domainName: props.customDomain,
          validation: acm.CertificateValidation.fromDns(hostedZone),
        });
        domainNames.push(props.customDomain);
      }
    }

    // CloudFront distribution — like snaphomz-toolpage
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

    // Route53 A + AAAA records — alias to CloudFront
    // Reference pattern: Snaphomz-frontend-prod terraform/module/route53/main.tf
    if (props.customDomain && props.hostedZoneId && props.hostedZoneName) {
      const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        'HostedZoneForAlias',
        {
          hostedZoneId: props.hostedZoneId,
          zoneName: props.hostedZoneName,
        },
      );

      const cfTarget = route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(distribution),
      );

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

      new cdk.CfnOutput(this, 'DnsRecords', {
        value: `A + AAAA: ${props.customDomain} → ${distribution.domainName}`,
        description: 'Route53 alias records pointing to CloudFront',
      });
    }

    // SSM Parameter Store — like snaphomz-toolpage
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

    // CloudFormation Outputs
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
