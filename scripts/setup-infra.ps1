# Snaphomz Infrastructure Setup Script
# Usage: .\setup-infra.ps1 [-DomainName "snaphomz.in"] [-Environment "demo"]

param(
    [string]$DomainName = "snaphomz.in",
    [string]$Environment = "demo",
    [string]$AwsRegion = "us-east-1"
)

# Colors
$colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
}

function Write-Header {
    param([string]$Text)
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host $Text -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host ""
}

function Write-Success {
    param([string]$Text)
    Write-Host "✓ $Text" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Text)
    Write-Host "✗ $Text" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Text)
    Write-Host "⚠️  $Text" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Text)
    Write-Host "$Text" -ForegroundColor Cyan
}

# Check prerequisites
Write-Header "Snaphomz Infrastructure Setup"

Write-Info "Checking prerequisites..."

$prerequisites = @("aws", "node", "npm")
foreach ($tool in $prerequisites) {
    $command = Get-Command $tool -ErrorAction SilentlyContinue
    if ($null -eq $command) {
        Write-Error-Custom "$tool is not installed. Please install it first."
        exit 1
    }
}

Write-Success "All prerequisites satisfied"
Write-Host ""

# Setup infrastructure directory
Push-Location infra

Write-Info "Installing dependencies..."
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Failed to install dependencies"
    Pop-Location
    exit 1
}

Write-Success "Dependencies installed"
Write-Host ""

# Build TypeScript
Write-Info "Building TypeScript..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Failed to build TypeScript"
    Pop-Location
    exit 1
}

Write-Success "TypeScript built successfully"
Write-Host ""

# Get AWS Account ID
Write-Info "Retrieving AWS Account ID..."
$AwsAccountId = aws sts get-caller-identity --query Account --output text

if ([string]::IsNullOrEmpty($AwsAccountId)) {
    Write-Error-Custom "Failed to retrieve AWS Account ID. Check your AWS credentials."
    Pop-Location
    exit 1
}

Write-Success "AWS Account ID: $AwsAccountId"
Write-Host ""

# Check if hosted zone exists
Write-Info "Checking for existing hosted zone..."
$existingZoneId = aws route53 list-hosted-zones-by-name --query "HostedZones[?Name=='$DomainName.'].Id" --output text

if ([string]::IsNullOrEmpty($existingZoneId)) {
    $existingZoneId = ($existingZoneId | ForEach-Object { $_ -replace '^/hostedzone/', '' })
}

if ([string]::IsNullOrEmpty($existingZoneId)) {
    Write-Info "Hosted zone not found. Creating..."
    
    $env:CREATE_HOSTED_ZONE = "true"
    $env:DOMAIN_NAME = $DomainName
    $env:CDK_DEFAULT_ACCOUNT = $AwsAccountId
    $env:CDK_DEFAULT_REGION = $AwsRegion
    $env:ENVIRONMENT = $Environment
    
    npm run build
    npx cdk deploy SnaphomzHostedZone --require-approval never
    
    $hostedZoneId = aws route53 list-hosted-zones-by-name --query "HostedZones[?Name=='$DomainName.'].Id" --output text
    $hostedZoneId = ($hostedZoneId | ForEach-Object { $_ -replace '^/hostedzone/', '' })
    Write-Success "Hosted zone created: $hostedZoneId"
}
else {
    $hostedZoneId = ($existingZoneId | ForEach-Object { $_ -replace '^/hostedzone/', '' })
    Write-Success "Existing hosted zone found: $hostedZoneId"
}

Write-Host ""

# Display hosted zone details
Write-Info "Retrieving hosted zone details..."
$zoneDetails = aws route53 get-hosted-zone --id $hostedZoneId | ConvertFrom-Json
$nameServers = $zoneDetails.DelegationSet.NameServers

Write-Host ""
Write-Header "Hosted Zone Information"
Write-Host "Domain: $DomainName"
Write-Host "Hosted Zone ID: $hostedZoneId"
Write-Host ""
Write-Host "Name Servers:"
$nameServers | ForEach-Object {
    Write-Host "  - $_"
}
Write-Host ""
Write-Warning-Custom "If this is a new hosted zone, update your domain registrar to use these name servers."
Write-Host ""

# Deploy static site infrastructure
Write-Info "Deploying static site infrastructure..."
$env:HOSTED_ZONE_ID = $hostedZoneId
$env:HOSTED_ZONE_NAME = $DomainName
$env:CUSTOM_DOMAIN = $DomainName
$env:ENVIRONMENT = $Environment
$env:CREATE_CERTIFICATE = "true"
$env:CDK_DEFAULT_ACCOUNT = $AwsAccountId
$env:CDK_DEFAULT_REGION = $AwsRegion

npm run build
npx cdk deploy snaphomz-india-$Environment --require-approval never

if ($LASTEXITCODE -eq 0) {
    Write-Success "Infrastructure deployed successfully"
}
else {
    Write-Error-Custom "Failed to deploy infrastructure"
    Pop-Location
    exit 1
}

Write-Host ""

# Retrieve deployment details
Write-Info "Retrieving deployment details..."

$bucketName = aws ssm get-parameter --name "/snaphomz/india/$Environment/bucket-name" --query 'Parameter.Value' --output text
$distributionId = aws ssm get-parameter --name "/snaphomz/india/$Environment/distribution-id" --query 'Parameter.Value' --output text
$distributionDomain = aws ssm get-parameter --name "/snaphomz/india/$Environment/distribution-domain" --query 'Parameter.Value' --output text

Write-Host ""
Write-Header "Deployment Complete!"
Write-Host "Environment: $Environment"
Write-Host "S3 Bucket: $bucketName"
Write-Host "CloudFront Distribution ID: $distributionId"
Write-Host "CloudFront Domain: https://$distributionDomain"
Write-Host "Custom Domain: https://$DomainName (DNS may take up to 48 hours to propagate)"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Build your application: npm run build"
Write-Host "2. Deploy your application: npm run deploy:app:$Environment"
Write-Host "3. Or deploy everything at once: npm run deploy:full"
Write-Host ""
Write-Success "Setup complete!"

Pop-Location
