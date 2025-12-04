# CloudFront CDN Setup Guide

## Overview
This guide shows how to set up AWS CloudFront CDN for your S3 image storage in the AgriLink marketplace. CloudFront provides better global performance, reduced costs, and improved user experience.

## Benefits
- **Faster Loading**: Images served from nearest edge location (10-50ms vs 200-500ms)
- **Reduced S3 Costs**: ~80% savings on request costs
- **Better Caching**: Automatic cache management with 1-day default TTL
- **Global Performance**: Users worldwide get fast access
- **No Presigned URLs**: Direct CloudFront URLs eliminate API calls for viewing
- **Better Security**: HTTPS-only delivery with Origin Access Control

## Setup Steps

### 1. Create CloudFront Distribution

1. Go to AWS CloudFront Console
2. Click "Create Distribution"
3. Configure:

**Origin Settings:**
- Origin Domain: `your-bucket-name.s3.amazonaws.com`
- Origin Path: (leave empty)
- Origin Access: "Restrict Bucket Access" = Yes
- Origin Access Control: Create new OAC
- Viewer Protocol Policy: "Redirect HTTP to HTTPS"
- Allowed HTTP Methods: "GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE"

**Cache Settings:**
- Cache Policy: "CachingOptimized"
- TTL Settings:
  - Default TTL: 86400 (1 day)
  - Maximum TTL: 31536000 (1 year)
  - Minimum TTL: 0

**Distribution Settings:**
- Price Class: "Use All Edge Locations"
- Alternate Domain Names: (optional) `images.yourapp.com`
- SSL Certificate: "Default CloudFront Certificate"

### 2. S3 Bucket Policy (Not Required)

**Note**: With Origin Access Control (OAC), you don't need to manually update the S3 bucket policy. CloudFront automatically manages the necessary permissions when you create the OAC and attach it to your distribution.

The OAC handles the authentication between CloudFront and S3, making the manual policy update unnecessary.

### 3. Update Your Code

#### Environment Variables
```bash
# Add to .env.local
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=d1dnr245ff3v1m.cloudfront.net
```

#### Current Implementation
Our CloudFront integration is already implemented with the following components:

**CloudFront Utils** (`src/lib/cloudfront-utils.ts`):
```typescript
export function getDocumentUrl(s3Key: string): string {
  const cloudFrontDomain = (process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || 'd1234567890.cloudfront.net').trim();
  if (!cloudFrontDomain) {
    console.error('NEXT_PUBLIC_CLOUDFRONT_DOMAIN is not set.');
    return `/api/placeholder/400/300?text=CDN+Error`; 
  }
  return `https://${cloudFrontDomain}/${s3Key}`;
}
```

**S3Image Component** (`src/components/S3Image.tsx`):
```typescript
// Automatically uses CloudFront URLs for S3 keys
const cloudFrontDomain = (process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || 'd1234567890.cloudfront.net').trim();
const cloudFrontUrl = `https://${cloudFrontDomain}/${src}`;
```

**S3 Utils** (`src/lib/s3-utils.ts`):
```typescript
export function getS3Url(s3Key: string): string {
  const cloudFrontDomain = (process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || 'd1234567890.cloudfront.net').trim();
  return `https://${cloudFrontDomain}/${s3Key}`;
}
```

#### Server-Side Proxies
For admin panel downloads and viewing (to avoid CORS issues):
- **Download**: `/api/s3/download` - Downloads files to user's device
- **View**: `/api/s3/view` - Displays files in browser modal

## Performance Comparison

### Before CDN:
- S3 Direct: 200-500ms globally
- Presigned URL generation: 100-300ms
- Total: 300-800ms

### After CDN:
- CDN Edge: 10-50ms globally
- No presigned URL needed: 0ms
- Total: 10-50ms

## Cost Benefits

### S3 Costs (per month):
- 10,000 requests: $0.40
- 100,000 requests: $4.00
- 1,000,000 requests: $40.00

### CloudFront Costs (per month):
- 10,000 requests: $0.085
- 100,000 requests: $0.85
- 1,000,000 requests: $8.50

**Savings: ~80% on request costs!**

## Cache Invalidation

When you update an image:
```bash
# Invalidate specific file
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/profiles/user123.jpg"

# Invalidate all files (expensive!)
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## Monitoring

CloudFront provides detailed metrics:
- Cache hit ratio
- Request count by region
- Error rates
- Bandwidth usage

## Security

- Images are served over HTTPS
- No direct S3 access needed
- Can add custom headers
- Can restrict by geographic location
