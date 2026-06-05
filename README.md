# Snaphomz India

Landing page for the India launch of Snaphomz — built with React + Vite and deployed to AWS with automated CI/CD.

## Quick Links

- 🚀 [Quick Start Guide](QUICKSTART.md) - Get started in 5 minutes
- 📋 [Setup Checklist](SETUP_CHECKLIST.md) - Verify your setup
- 📖 [Deployment Guide](DEPLOYMENT.md) - Full documentation
- 🔧 [Environments Configuration](ENVIRONMENTS.md) - GitHub Actions environments

## Infrastructure Stack

- **Hosting:** AWS S3 + CloudFront CDN
- **DNS:** AWS Route53 Hosted Zone
- **SSL/TLS:** AWS Certificate Manager (ACM)
- **CI/CD:** GitHub Actions with OIDC authentication
- **Infrastructure as Code:** AWS CDK (TypeScript)

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- npm (ships with Node)
- AWS Account (for deployment)
- GitHub Account (for CI/CD)

## Install

```bash
npm install
```

## Run (development)

Starts the Vite dev server with hot reload.

```bash
npm run dev
```

Open the printed URL (typically http://localhost:5173) in your browser.

## Build (production)

```bash
npm run build
```

Output is written to `dist/`.

## Preview the production build

```bash
npm run preview
```

## Deployment

### Local Deployment

```bash
# Deploy to demo environment
npm run deploy:app:demo

# Deploy to staging environment
npm run deploy:app:staging

# Deploy to production environment
npm run deploy:app:prod

# Full deployment (build + deploy)
npm run deploy:full
```

### Automatic Deployment (GitHub Actions)

Deployments are triggered automatically based on git branches:

```
main     → production    (snaphomz.in)
staging  → staging       (staging.snaphomz.in)
develop  → demo          (CloudFront domain)
```

Just push your code:

```bash
git push origin main     # Deploy to production
git push origin develop  # Deploy to demo
```

### Infrastructure Management

```bash
# Initial infrastructure setup
npm run setup:infra

# Setup GitHub Actions secrets
npm run setup:secrets

# Deploy infrastructure
npm run deploy:infra
```

## AWS Resources Created

- **Route53 Hosted Zone** for snaphomz.in
- **S3 Buckets** for each environment (demo, staging, prod)
- **CloudFront Distributions** for global CDN delivery
- **ACM Certificates** for SSL/TLS encryption
- **Systems Manager Parameters** for configuration storage

## Architecture

```
GitHub Repository
        ↓
GitHub Actions Workflow
        ↓
AWS CloudFormation (CDK Deploy)
        ↓
    ┌───┴───┬───────┬────────┐
    ↓       ↓       ↓        ↓
Route53  S3      CloudFront ACM
  ↓      ↓         ↓
snaphomz.in ← CDN ← Origin
```

## Environments

| Environment | Branch | Domain | Status |
|---|---|---|---|
| Production | main | snaphomz.in | ✅ |
| Staging | staging | staging.snaphomz.in | ✅ |
| Demo | develop | CloudFront domain | ✅ |

See [ENVIRONMENTS.md](ENVIRONMENTS.md) for detailed configuration.

## Project structure

```
.github/
  workflows/
    deploy.yml           # GitHub Actions CI/CD workflow

infra/                   # AWS CDK Infrastructure
  lib/
    hosted-zone-stack.ts # Route53 hosted zone
    static-site-stack.ts # S3 + CloudFront
  app.ts                 # CDK app configuration
  cdk.json               # CDK context

scripts/
  setup-infra.sh         # Infrastructure setup (bash)
  setup-infra.ps1        # Infrastructure setup (PowerShell)
  deploy-app.js          # Application deployment
  setup-github-secrets.js# GitHub secrets setup

public/                  # Static assets served at /
  india-map.png          # 3D India map (hero right)
  Skyline.png            # Heritage skyline backdrop
  logo.png               # Snaphomz logo (white-on-transparent)

src/
  App.jsx                # Mounts <Header /> + <Hero />
  main.jsx               # React entry
  index.css              # Global styles, font stack, page bg
  components/
    Header.jsx / .css    # Top-left logo bar
    Hero.jsx  / .css     # Hero section: title, subtitle,
                         # feature cards, COMING SOON pill,
                         # map, skyline backdrop
```

## Editing content

- Hero copy (title, subtitle, feature cards): [src/components/Hero.jsx](src/components/Hero.jsx)
- Hero styling (colors, sizes, layout): [src/components/Hero.css](src/components/Hero.css)
- Logo / header: [src/components/Header.jsx](src/components/Header.jsx)
- Page background color and base typography: [src/index.css](src/index.css)
