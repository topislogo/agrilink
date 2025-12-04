# Environment Variables Guide

## Overview
This guide covers all environment variables required for the AgriLink marketplace application, including development, staging, and production environments.

## Required Environment Variables

### Database Configuration
```bash
# PostgreSQL Database URL
DATABASE_URL="postgresql://username:password@localhost:5432/agrilink_db"
```

### Authentication & Security
```bash
# JWT Secret for token signing (128 characters recommended)
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"

# Application URL (used for email links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### AWS S3 Configuration
```bash
# AWS Credentials
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"

# AWS Region (use eu-central-1 for Frankfurt)
AWS_REGION="eu-central-1"

# S3 Bucket Name
AWS_S3_BUCKET="agrilink-bucket-343218206997"
```

### CloudFront CDN Configuration
```bash
# CloudFront Distribution Domain
NEXT_PUBLIC_CLOUDFRONT_DOMAIN="d1dnr245ff3v1m.cloudfront.net"
```

### Email Service (Resend)
```bash
# Resend API Key for email sending
RESEND_API_KEY="re_1234567890abcdef"
```

### SMS Service (Twilio)
```bash
# Twilio Credentials for SMS verification
TWILIO_ACCOUNT_SID="AC1234567890abcdef"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

### Application Environment
```bash
# Node Environment
NODE_ENV="development"  # or "production"
```

## Environment Setup by Type

### Development Environment (.env.local)
```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/agrilink_dev"

# Security
JWT_SECRET="dev-jwt-secret-key-128-chars-long-for-development-only"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AWS (Development)
AWS_ACCESS_KEY_ID="your-dev-access-key"
AWS_SECRET_ACCESS_KEY="your-dev-secret-key"
AWS_REGION="eu-central-1"
AWS_S3_BUCKET="agrilink-bucket-dev"

# CloudFront
NEXT_PUBLIC_CLOUDFRONT_DOMAIN="d1dnr245ff3v1m.cloudfront.net"

# Email
RESEND_API_KEY="re_dev_key"

# SMS
TWILIO_ACCOUNT_SID="AC_dev_sid"
TWILIO_AUTH_TOKEN="dev_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

# Environment
NODE_ENV="development"
```

### Production Environment (Vercel)
```bash
# Database
DATABASE_URL="postgresql://prod_user:prod_pass@prod_host:5432/agrilink_prod"

# Security
JWT_SECRET="prod-jwt-secret-key-128-chars-long-for-production"
NEXT_PUBLIC_APP_URL="https://agrilink-marketplace.vercel.app"

# AWS (Production)
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_REGION="eu-central-1"
AWS_S3_BUCKET="agrilink-bucket-343218206997"

# CloudFront
NEXT_PUBLIC_CLOUDFRONT_DOMAIN="d1dnr245ff3v1m.cloudfront.net"

# Email
RESEND_API_KEY="re_prod_key"

# SMS
TWILIO_ACCOUNT_SID="AC_prod_sid"
TWILIO_AUTH_TOKEN="prod_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

# Environment
NODE_ENV="production"
```

## Vercel Environment Variables Setup

### Using Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Add environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY
vercel env add AWS_REGION
vercel env add AWS_S3_BUCKET
vercel env add NEXT_PUBLIC_CLOUDFRONT_DOMAIN
vercel env add RESEND_API_KEY
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add TWILIO_PHONE_NUMBER
vercel env add NEXT_PUBLIC_APP_URL
vercel env add NODE_ENV

# Deploy
vercel --prod
```

### Using Vercel Dashboard
1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable for Production, Preview, and Development environments
4. Redeploy your application

## Environment Variable Validation

### Required Variables Check
The application validates these variables on startup:

```typescript
// Database
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

// JWT
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

// AWS S3
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('AWS credentials not found, using development mode');
}

// CloudFront
if (!process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN) {
  console.warn('CloudFront domain not set, using fallback');
}
```

## Security Best Practices

### 1. Never Commit Secrets
```bash
# Add to .gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### 2. Use Different Secrets per Environment
- Development: Use test/development keys
- Staging: Use staging-specific keys
- Production: Use production keys only

### 3. Rotate Secrets Regularly
- Change JWT_SECRET monthly
- Rotate AWS keys quarterly
- Update API keys when compromised

### 4. Use Strong Secrets
```bash
# Generate strong JWT secret (128 chars)
openssl rand -base64 96

# Generate random password
openssl rand -base64 32
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check DATABASE_URL format
DATABASE_URL="postgresql://user:pass@host:port/dbname"

# Verify database is running
pg_isready -h localhost -p 5432
```

#### 2. AWS S3 Upload Failed
```bash
# Check AWS credentials
aws s3 ls s3://your-bucket-name

# Verify bucket permissions
aws s3api get-bucket-policy --bucket your-bucket-name
```

#### 3. CloudFront Images Not Loading
```bash
# Check CloudFront domain
curl -I https://d1dnr245ff3v1m.cloudfront.net/test-image.jpg

# Verify S3 bucket policy allows CloudFront
```

#### 4. Email Not Sending
```bash
# Test Resend API
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"test@example.com","to":"test@example.com","subject":"Test","html":"Test"}'
```

#### 5. SMS Not Sending
```bash
# Test Twilio API
curl -X POST https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json \
  -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN \
  -d "From=$TWILIO_PHONE_NUMBER" \
  -d "To=+1234567890" \
  -d "Body=Test message"
```

## Environment-Specific Notes

### Development
- Use local PostgreSQL database
- Use development AWS resources
- Enable debug logging
- Use test email/SMS services

### Staging
- Use staging database
- Use staging AWS resources
- Mirror production configuration
- Use test email/SMS services

### Production
- Use production database
- Use production AWS resources
- Disable debug logging
- Use real email/SMS services
- Enable monitoring and alerts

## Monitoring

### Environment Variable Monitoring
```typescript
// Add to your health check endpoint
export async function GET() {
  const health = {
    database: !!process.env.DATABASE_URL,
    jwt: !!process.env.JWT_SECRET,
    aws: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    cloudfront: !!process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN,
    email: !!process.env.RESEND_API_KEY,
    sms: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
  };
  
  return Response.json(health);
}
```

### Logging
```typescript
// Log environment status (without secrets)
console.log('Environment Status:', {
  nodeEnv: process.env.NODE_ENV,
  hasDatabase: !!process.env.DATABASE_URL,
  hasJWT: !!process.env.JWT_SECRET,
  hasAWS: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
  hasCloudFront: !!process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN,
  hasEmail: !!process.env.RESEND_API_KEY,
  hasSMS: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
});
```

## Quick Setup Commands

### Local Development
```bash
# Copy environment template
cp .env.example .env.local

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Production Deployment
```bash
# Set environment variables in Vercel
vercel env add DATABASE_URL
vercel env add JWT_SECRET
# ... add all other variables

# Deploy
vercel --prod
```

This guide ensures your AgriLink marketplace runs smoothly across all environments! 🚀
