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

    console.log(`[HostedZoneStack] Creating hosted zone for ${props.domainName}`);

    // Create Route 53 Hosted Zone
    const hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
      zoneName: props.domainName,
      comment: `Hosted zone for ${props.domainName}`,
    });

    this.hostedZoneId = hostedZone.hostedZoneId;
    this.nameServers = hostedZone.hostedZoneNameServers || [];

    console.log(`[HostedZoneStack] Hosted zone created: ${hostedZone.hostedZoneId}`);

    // Store hosted zone ID in SSM Parameter Store
    new ssm.StringParameter(this, 'HostedZoneIdParameter', {
      parameterName: `/snaphomz/hosted-zone/${props.domainName}/zone-id`,
      stringValue: hostedZone.hostedZoneId,
      description: `Hosted Zone ID for ${props.domainName}`,
    });

    // Store name servers in SSM Parameter Store
    new ssm.StringParameter(this, 'NameServersParameter', {
      parameterName: `/snaphomz/hosted-zone/${props.domainName}/name-servers`,
      stringValue: cdk.Fn.join(',', hostedZone.hostedZoneNameServers as any),
      description: `Name servers for ${props.domainName}`,
    });

    // Outputs (use hyphens instead of dots for export names - dots are not allowed)
    const exportDomainSafe = props.domainName.replace(/\./g, '-');
    
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
      exportName: `SnaphomzHostedZone-${exportDomainSafe}`,
    });

    new cdk.CfnOutput(this, 'NameServers', {
      value: cdk.Fn.join(', ', hostedZone.hostedZoneNameServers as any),
      description: 'Route 53 Name Servers',
      exportName: `SnaphomzNameServers-${exportDomainSafe}`,
    });

    // Instructions for domain configuration
    new cdk.CfnOutput(this, 'DomainConfigurationInstructions', {
      value: cdk.Fn.sub('Update your domain registrar to use these name servers: ${NS}', {
        NS: cdk.Fn.join(', ', hostedZone.hostedZoneNameServers as any),
      }),
      description: 'Instructions for DNS configuration',
    });

    console.log(`[HostedZoneStack] Stack setup complete`);
  }
}
