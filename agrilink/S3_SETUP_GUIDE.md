# AWS S3 Setup Guide for Vercel Deployment

## 🚀 **Problem Solved**
Your file uploads were broken on Vercel because Vercel's serverless functions don't support local filesystem writes. This S3 implementation fixes that!

## 📋 **Required Environment Variables**

Add these to your Vercel environment variables:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name-here
```

## 🔧 **AWS S3 Setup Steps**

### 1. **Create S3 Bucket**
1. Go to AWS S3 Console: `https://console.aws.amazon.com/s3/`
2. Click "Create bucket"
3. Choose a unique bucket name (e.g., `agrilink-uploads-2024`)
4. Select region: `us-east-1` (or your preferred region)
5. **Keep default settings** - Block public access can stay ON (more secure)
6. Click "Create bucket"

### 2. **Keep Bucket Private (Recommended)**
**No bucket policy needed!** Your files will be private and accessed via presigned URLs.

**Why this is better:**
- ✅ **More secure** - files are not publicly accessible
- ✅ **Controlled access** - only your app can generate URLs
- ✅ **No public policy needed** - simpler setup
- ✅ **Presigned URLs** - temporary, secure access

### 3. **Create IAM User**
1. Go to AWS IAM Console: `https://console.aws.amazon.com/iam/`
2. Click "Users" → "Create user"
3. Username: `agrilink-s3-user`
4. Attach policies:
   - `AmazonS3FullAccess` (or create custom policy with minimal permissions)
   - **Required permissions**: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`
5. Create access keys and save them

### 4. **Set Environment Variables in Vercel**
1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add these variables:
   - `AWS_ACCESS_KEY_ID`: Your IAM user access key
   - `AWS_SECRET_ACCESS_KEY`: Your IAM user secret key
   - `AWS_REGION`: `us-east-1` (or your bucket region)
   - `AWS_S3_BUCKET_NAME`: Your bucket name

## 🔄 **What Changed**

### **Before (Broken on Vercel):**
```typescript
// Local filesystem (doesn't work on Vercel)
await writeFile(filepath, buffer);
filepath = `/uploads/${folder}/${filename}`;
```

### **After (Works on Vercel + Secure):**
```typescript
// S3 upload with presigned URLs (works everywhere + secure)
await s3Client.send(putObjectCommand);
const presignedUrl = await getSignedUrl(s3Client, getObjectCommand);
filepath = presignedUrl; // Temporary, secure URL
```

## 📁 **File Structure in S3**
```
your-bucket/
├── verification/
│   ├── uuid1.jpg
│   └── uuid2.png
├── profiles/
│   ├── uuid3.jpg
│   └── uuid4.png
├── storefronts/
│   └── uuid5.jpg
└── products/
    ├── uuid6.jpg
    └── uuid7.png
```

## 🧪 **Testing**

### **Development Mode**
- If S3 credentials are missing, it runs in development mode
- Files show as mock URLs: `/api/placeholder/400/300`
- No actual uploads happen

### **Production Mode**
- With S3 credentials, files upload to S3
- URLs are real S3 URLs: `https://bucket.s3.region.amazonaws.com/path/file.jpg`

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **"Access Denied" Error**
   - Check IAM user permissions
   - Verify bucket policy allows public read

2. **"Bucket Not Found" Error**
   - Check bucket name spelling
   - Verify region matches

3. **"Invalid Credentials" Error**
   - Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
   - Verify IAM user has S3 permissions

### **Debug Commands:**
```bash
# Test S3 connection
curl -X POST http://localhost:3000/api/test-s3

# Check environment variables
echo $AWS_S3_BUCKET_NAME
```

## 💰 **Cost Estimation**
- **S3 Storage**: ~$0.023 per GB per month
- **S3 Requests**: ~$0.0004 per 1,000 PUT requests
- **Data Transfer**: Free for uploads, ~$0.09 per GB for downloads

For a typical app with 1GB of images and 10,000 uploads/month: **~$2-5/month**

## 🚀 **Deployment**
1. Set environment variables in Vercel
2. Redeploy your app
3. Test file uploads - they should now work!

## 📞 **Support**
If you need help with AWS setup, I can guide you through:
- Creating the S3 bucket
- Setting up IAM permissions
- Configuring Vercel environment variables
