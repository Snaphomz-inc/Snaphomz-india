# Environment-specific configuration

## Overview

The app is now configured to use environment-specific settings for snaphomz.in across demo, staging, and production environments.

## Files Added

### Configuration
- `src/config.js` - Application configuration with domain and environment settings
- `.env.example` - Template for environment variables
- `.env.development` - Development environment
- `.env.demo` - Demo/development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### How It Works

1. **Domain Tagging**: The app now includes meta tags for snaphomz.in:
   - Canonical URL: `https://snaphomz.in`
   - Open Graph tags for social sharing
   - Twitter card tags

2. **Environment Variables**: Each environment has specific configuration:
   - `VITE_ENV`: Environment name (demo, staging, prod)
   - `VITE_API_BASE`: API endpoint for the environment
   - `VITE_DOMAIN`: Domain name for the environment
   - `VITE_GA_TRACKING_ID`: Analytics tracking ID

3. **Build Scripts**: Environment-specific build commands:
   ```bash
   npm run build:demo      # Builds for demo environment
   npm run build:staging   # Builds for staging environment
   npm run build:prod      # Builds for production environment
   ```

4. **Vite Configuration**: 
   - Global variables available in the app via `__APP_DOMAIN__` and `__APP_ENV__`
   - Proper domain validation on app load

## Using in Components

Import the config in any component:

```javascript
import APP_CONFIG from '@/config.js'

export default function MyComponent() {
  return (
    <div>
      <p>Domain: {APP_CONFIG.domain}</p>
      <p>Environment: {APP_CONFIG.environment}</p>
      <a href={APP_CONFIG.baseUrl}>Home</a>
    </div>
  )
}
```

## Deployment

### GitHub Actions
The workflow automatically builds with the correct environment:
- Push to `main` → builds with `VITE_ENV=prod`
- Push to `staging` → builds with `VITE_ENV=staging`
- Push to `develop` → builds with `VITE_ENV=demo`

### Manual Deployment
```bash
# Build for specific environment
npm run build:prod

# Deploy to specific environment
npm run deploy:app:prod
```

## Environment Files in .gitignore

To keep the app secure, add to `.gitignore`:
```
.env
.env.local
.env.*.local
```

The `.env.example` file serves as a template.

## SEO & Social Media

The app now includes proper meta tags:
- **Canonical URL**: Prevents duplicate content issues
- **Open Graph**: Proper sharing preview on social media
- **Twitter Cards**: Enhanced Twitter sharing
- **Description & Keywords**: Better search engine visibility

## Domain Verification

When the app loads in production, it will verify the domain matches `snaphomz.in` and warn if mismatched.

---

All environment-specific configurations are now in place for snaphomz.in deployment.
