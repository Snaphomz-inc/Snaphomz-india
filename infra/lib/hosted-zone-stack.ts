import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface HostedZoneStackProps extends cdk.StackProps {
  domainName: string;
  enableDnsSecValidation?: boolean;
}

export class HostedZoneStack extends cdk.Stack {
  public readonly hostedZoneId: string;
  public readonly nameServers: string[];

  constructor(scope: Construct, id: string, props: HostedZoneStackProps) {
    super(scope, id, props);

    // Create Route 53 Hosted Zone
    const hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
      zoneName: props.domainName,
      comment: `Hosted zone for ${props.domainName}`,
    });

    this.hostedZoneId = hostedZone.hostedZoneId;
    this.nameServers = hostedZone.hostedZoneNameServers || [];

    // Store hosted zone ID in SSM Parameter Store
    new ssm.StringParameter(this, 'HostedZoneIdParameter', {
      parameterName: `/snaphomz/hosted-zone/${props.domainName}/zone-id`,
      stringValue: hostedZone.hostedZoneId,
      description: `Hosted Zone ID for ${props.domainName}`,
    });

    // Store name servers in SSM Parameter Store
    new ssm.StringParameter(this, 'NameServersParameter', {
      parameterName: `/snaphomz/hosted-zone/${props.domainName}/name-servers`,
      stringValue: hostedZone.hostedZoneNameServers?.join(',') || '',
      description: `Name servers for ${props.domainName}`,
    });

    // Outputs
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
      exportName: `SnaphomzHostedZone-${props.domainName}`,
    });

    new cdk.CfnOutput(this, 'NameServers', {
      value: hostedZone.hostedZoneNameServers?.join(', ') || '',
      description: 'Route 53 Name Servers',
      exportName: `SnaphomzNameServers-${props.domainName}`,
    });

    // Instructions for domain configuration
    new cdk.CfnOutput(this, 'DomainConfigurationInstructions', {
      value: `Update your domain registrar to use these name servers: ${hostedZone.hostedZoneNameServers?.join(', ') || 'N/A'}`,
      description: 'Instructions for DNS configuration',
    });
  }
}
