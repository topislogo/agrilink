# Deployment Guide

## Overview
This guide covers deploying the AgriLink marketplace to Vercel with proper environment configuration and CloudFront CDN setup.

## Prerequisites

### 1. Required Accounts
- **Vercel Account**: [vercel.com](https://vercel.com)
- **AWS Account**: [aws.amazon.com](https://aws.amazon.com)
- **GitHub Account**: [github.com](https://github.com)
- **Resend Account**: [resend.com](https://resend.com) (for emails)
- **Twilio Account**: [twilio.com](https://twilio.com) (for SMS)

### 2. Required Tools
```bash
# Install Vercel CLI
npm install -g vercel

# Install AWS CLI (optional)
npm install -g aws-cli

# Git (should already be installed)
git --version
```

## Step-by-Step Deployment

### 1. Prepare Your Repository

#### Push Code to GitHub
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit with CloudFront migration"

# Add remote origin
git remote add origin https://github.com/yourusername/agrilink-marketplace.git

# Push to GitHub
git push -u origin main
```

### 2. Set Up AWS S3 and CloudFront

#### Create S3 Bucket
1. Go to AWS S3 Console
2. Create bucket: `agrilink-bucket-343218206997`
3. Region: `eu-central-1` (Frankfurt)
4. Block public access: **Enabled** (we'll use CloudFront)

#### Create CloudFront Distribution
1. Go to AWS CloudFront Console
2. Create Distribution
3. Origin Domain: `agrilink-bucket-343218206997.s3.amazonaws.com`
4. Origin Access: **Restrict Bucket Access** = Yes
5. Create Origin Access Control (OAC)
6. Viewer Protocol Policy: **Redirect HTTP to HTTPS**
7. Allowed HTTP Methods: **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE**
8. Cache Policy: **CachingOptimized**
9. Default TTL: **86400** (1 day)
10. Price Class: **Use All Edge Locations**

#### Update S3 Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::agrilink-bucket-343218206997/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

### 3. Deploy to Vercel

#### Method 1: Vercel CLI
```bash
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

#### Method 2: Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import from GitHub
4. Select your repository
5. Configure environment variables (see below)
6. Deploy

### 4. Configure Environment Variables

#### Required Variables for Production
```bash
# Database
DATABASE_URL="postgresql://username:password@host:5432/database"

# Security
JWT_SECRET="your-128-character-jwt-secret-key"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

# AWS S3
AWS_ACCESS_KEY_ID="AKIAU72LGHEKQ4LCWFAZ"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_REGION="eu-central-1"
AWS_S3_BUCKET="agrilink-bucket-343218206997"

# CloudFront
NEXT_PUBLIC_CLOUDFRONT_DOMAIN="d1dnr245ff3v1m.cloudfront.net"

# Email Service
RESEND_API_KEY="re_your-resend-api-key"

# SMS Service
TWILIO_ACCOUNT_SID="AC_your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Environment
NODE_ENV="production"
```

#### Setting Variables in Vercel Dashboard
1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable for **Production**, **Preview**, and **Development**
4. Click **Save** after adding each variable

### 5. Database Setup

#### Option 1: Vercel Postgres
1. Go to Vercel Dashboard
2. Navigate to **Storage** → **Create Database**
3. Select **Postgres**
4. Choose region: **Frankfurt** (for EU users)
5. Copy the connection string to `DATABASE_URL`

#### Option 2: External Database
- **Neon**: [neon.tech](https://neon.tech)
- **Supabase**: [supabase.com](https://supabase.com)
- **Railway**: [railway.app](https://railway.app)

#### Run Database Migrations
```bash
# Install Drizzle CLI
npm install -g drizzle-kit

# Run migrations
drizzle-kit push:pg
```

### 6. Test Your Deployment

#### Health Check
```bash
# Test your deployed app
curl https://your-app.vercel.app/api/health
```

#### Test Image Upload
1. Go to your deployed app
2. Try uploading a profile image
3. Check if it appears correctly
4. Verify CloudFront URLs are being used

#### Test Email/SMS
1. Try user registration
2. Check if verification emails are sent
3. Test phone verification with SMS

### 7. Configure Custom Domain (Optional)

#### Add Custom Domain
1. Go to Vercel Dashboard
2. Navigate to **Settings** → **Domains**
3. Add your custom domain
4. Update DNS records as instructed

#### Update Environment Variables
```bash
# Update app URL
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

## Post-Deployment Checklist

### ✅ Verify Core Functionality
- [ ] User registration works
- [ ] User login works
- [ ] Profile image upload works
- [ ] Product image upload works
- [ ] Images load via CloudFront URLs
- [ ] Email verification works
- [ ] SMS verification works
- [ ] Admin panel works
- [ ] Document viewing/downloading works

### ✅ Performance Check
- [ ] Images load quickly (check Network tab)
- [ ] CloudFront URLs are being used
- [ ] No 404 errors for images
- [ ] Admin panel loads documents correctly

### ✅ Security Check
- [ ] All environment variables are set
- [ ] No secrets in client-side code
- [ ] HTTPS is enforced
- [ ] S3 bucket is not publicly accessible

## Troubleshooting

### Common Issues

#### 1. Images Not Loading
```bash
# Check CloudFront distribution status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Test CloudFront URL directly
curl -I https://d1dnr245ff3v1m.cloudfront.net/test-image.jpg
```

#### 2. Database Connection Failed
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### 3. AWS S3 Upload Failed
```bash
# Check AWS credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://agrilink-bucket-343218206997
```

#### 4. Environment Variables Not Loading
```bash
# Check Vercel environment variables
vercel env ls

# Redeploy after adding variables
vercel --prod
```

### Debug Commands

#### Check Environment Variables
```bash
# In your Vercel function
console.log('Environment check:', {
  hasDatabase: !!process.env.DATABASE_URL,
  hasJWT: !!process.env.JWT_SECRET,
  hasAWS: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
  hasCloudFront: !!process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN,
});
```

#### Test API Endpoints
```bash
# Test S3 upload
curl -X POST https://your-app.vercel.app/api/user/profile \
  -H "Content-Type: application/json" \
  -d '{"profileImage": "data:image/jpeg;base64,..."}'

# Test CloudFront URL generation
curl https://your-app.vercel.app/api/s3/view?key=test-image.jpg
```

## Monitoring and Maintenance

### 1. Set Up Monitoring
- **Vercel Analytics**: Built-in performance monitoring
- **AWS CloudWatch**: Monitor S3 and CloudFront usage
- **Uptime Monitoring**: Use services like Pingdom or UptimeRobot

### 2. Regular Maintenance
- **Update Dependencies**: Monthly security updates
- **Rotate Secrets**: Quarterly key rotation
- **Monitor Costs**: Check AWS and Vercel billing
- **Backup Database**: Regular database backups

### 3. Scaling Considerations
- **Database**: Consider read replicas for high traffic
- **CDN**: CloudFront automatically scales
- **Vercel**: Automatically scales with traffic
- **S3**: Virtually unlimited storage

## Cost Optimization

### Vercel Costs
- **Hobby Plan**: Free for personal projects
- **Pro Plan**: $20/month for commercial use
- **Enterprise**: Custom pricing

### AWS Costs
- **S3 Storage**: ~$0.023 per GB per month
- **S3 Requests**: ~$0.0004 per 1,000 requests
- **CloudFront**: ~$0.085 per GB transferred
- **Data Transfer**: Free for first 1GB per month

### Estimated Monthly Costs (1,000 users)
- **Vercel Pro**: $20
- **AWS S3**: $5-10
- **CloudFront**: $10-20
- **Database**: $10-20
- **Total**: ~$45-70/month

## Security Best Practices

### 1. Environment Security
- Never commit `.env` files
- Use different secrets per environment
- Rotate secrets regularly
- Use strong, random secrets

### 2. AWS Security
- Use IAM roles with minimal permissions
- Enable S3 bucket versioning
- Use CloudFront for all public access
- Monitor AWS CloudTrail logs

### 3. Application Security
- Validate all inputs
- Use HTTPS everywhere
- Implement rate limiting
- Regular security audits

## Support and Resources

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [AWS S3 Docs](https://docs.aws.amazon.com/s3/)
- [CloudFront Docs](https://docs.aws.amazon.com/cloudfront/)
- [Next.js Docs](https://nextjs.org/docs)

### Community
- [Vercel Discord](https://vercel.com/discord)
- [Next.js Discord](https://discord.gg/nextjs)
- [GitHub Issues](https://github.com/your-repo/issues)

This deployment guide ensures your AgriLink marketplace is properly deployed and configured! 🚀
