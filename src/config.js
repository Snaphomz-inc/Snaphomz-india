/**
 * Application Configuration
 * Domain and environment settings for Snaphomz India
 */

export const APP_CONFIG = {
  domain: 'snaphomz.in',
  displayName: 'Snaphomz India',
  description: 'Leading platform for real estate, college admissions, and financial services',
  
  // URLs
  baseUrl: typeof window !== 'undefined' ? window.location.protocol + '//' + window.location.host : 'https://snaphomz.in',
  
  // Environment
  environment: import.meta.env.VITE_ENV || 'demo',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Analytics
  gaTrackingId: import.meta.env.VITE_GA_TRACKING_ID || '',
  
  // API
  apiBase: import.meta.env.VITE_API_BASE || 'https://api.snaphomz.in',
  
  // Social
  social: {
    twitter: '@snaphomz',
    linkedin: 'https://linkedin.com/company/snaphomz',
    instagram: '@snaphomz',
    facebook: 'https://facebook.com/snaphomz',
  },
  
  // Contact
  contact: {
    email: 'info@snaphomz.in',
    phone: '+91-1234-567-890',
    address: 'Snaphomz Inc, India',
  },
}

// Validate domain on load
if (typeof window !== 'undefined') {
  const currentHost = window.location.hostname
  const expectedDomain = APP_CONFIG.domain
  
  if (currentHost !== expectedDomain && currentHost !== 'localhost' && !currentHost.startsWith('127.')) {
    console.warn(`⚠️ App running on ${currentHost}, expected ${expectedDomain}`)
  }
}

export default APP_CONFIG
