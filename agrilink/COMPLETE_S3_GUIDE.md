# Complete S3 + CloudFront Guide for AgriLink

## 🎯 Overview

This comprehensive guide covers everything you need to know about S3 and CloudFront implementation for AgriLink, from initial setup to advanced usage patterns.

## 🌍 Why S3 + CloudFront?

### **S3 Benefits:**
- ✅ **Scalable**: Handles millions of files
- ✅ **Reliable**: 99.999999999% durability
- ✅ **Cost-effective**: Pay only for what you use
- ✅ **GDPR Compliant**: EU region for data protection

### **CloudFront Benefits:**
- ✅ **Fast for Myanmar users** (Singapore edge location)
- ✅ **Fast for Frankfurt team** (Frankfurt edge location)
- ✅ **Global CDN** (cached worldwide)
- ✅ **No API calls needed** (direct URLs)

## 🚀 Quick Start (30 minutes)

### **Step 1: AWS S3 Setup (15 minutes)**

1. **Go to AWS Console**
   - Login to AWS Console
   - Select **EU (Frankfurt) eu-central-1** region

2. **Create S3 Bucket**
   ```
   Bucket name: agrilink-bucket-eu
   Region: EU (Frankfurt) eu-central-1
   ```

3. **Configure Bucket**
   ```
   ✅ Block all public access (keep private)
   ✅ Versioning: Enabled
   ✅ Encryption: AES-256
   ```

4. **Set Up CORS**
   - Go to Bucket > Permissions > CORS
   - Add this configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": [
         "http://localhost:3000",
         "https://yourdomain.com"
       ],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

5. **Create IAM User**
   - Go to IAM > Users > Create User
   - Username: `agrilink-s3-user`
   - Access type: Programmatic access
   - Attach custom policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:PutObjectAcl"
         ],
         "Resource": "arn:aws:s3:::agrilink-bucket-eu/*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "s3:ListBucket"
         ],
         "Resource": "arn:aws:s3:::agrilink-bucket-eu"
       }
     ]
   }
   ```

### **Step 2: CloudFront Setup (10 minutes)**

1. **Go to CloudFront Console**
   - Search for "CloudFront" in AWS services
   - Click "Create Distribution"

2. **Configure Origin**
   ```
   Origin Domain: agrilink-bucket-eu.s3.eu-central-1.amazonaws.com
   Origin Path: (leave empty)
   Origin Access: Legacy access settings
   ```

3. **Configure Distribution Settings**
   ```
   Price Class: Use all edge locations (best performance)
   Security: Do not enable security protections
   ```

4. **Create Distribution**
   - Click "Create Distribution"
   - Wait 10-15 minutes for deployment
   - Copy your CloudFront domain (e.g., `d1234567890.cloudfront.net`)

### **Step 3: Environment Variables (2 minutes)**

Add to `.env.local`:
```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=eu-central-1
AWS_S3_BUCKET=agrilink-bucket-eu

# CloudFront Configuration
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net

# Database Configuration
DATABASE_URL=postgresql://your_database_url_here
```

### **Step 4: Test Setup (3 minutes)**

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Test image loading**
   - Go to any page with images
   - Check browser console for CloudFront URLs
   - Look for: `https://d1234567890.cloudfront.net/profiles/...`

## 📁 File Structure

```
src/
├── components/
│   ├── S3Image.tsx          # 🎯 Main image component
│   └── S3Avatar.tsx         # Avatar wrapper for S3Image
├── lib/
│   ├── s3-upload.ts         # S3 operations
│   ├── s3-utils.ts          # Helper functions
│   └── file-upload.ts       # File upload wrapper
└── app/api/
    ├── s3/generate-url/     # API endpoint (legacy)
    └── user/profile/        # Profile image upload endpoint
```

## 🔍 Key Concepts

### **1. S3 Key vs CloudFront URL**
```typescript
// S3 Key (what we store in database)
"profiles/user123.jpg"

// CloudFront URL (what we show in browser)
"https://d1234567890.cloudfront.net/profiles/user123.jpg"
```

### **2. Base64 Encoding**
```typescript
// Why we use base64:
// ❌ Can't send files through JSON
fetch('/api/upload', {
  body: JSON.stringify({ file: fileObject }) // Doesn't work!
});

// ✅ Can send base64 through JSON
fetch('/api/upload', {
  body: JSON.stringify({ file: base64String }) // Works!
});
```

### **3. CloudFront vs Presigned URLs**
```typescript
// Old way (presigned URLs):
const presignedUrl = await generatePresignedUrl(s3Key);
// API call needed, expires, more complex

// New way (CloudFront URLs):
const cloudFrontUrl = `https://d1234567890.cloudfront.net/${s3Key}`;
// No API call, never expires, simpler
```

## 🚀 How to Use S3Image Component

### **Basic Usage**
```tsx
import { S3Image } from '@/components/S3Image';

// For S3 images (uses CloudFront automatically)
<S3Image src="profiles/user123.jpg" alt="User Profile" />

// For regular URLs (still works)
<S3Image src="https://example.com/image.jpg" alt="External Image" />

// For base64 data (still works)
<S3Image src="data:image/jpeg;base64,/9j/4AAQ..." alt="Base64 Image" />
```

### **With Styling**
```tsx
<S3Image 
  src="products/123.jpg" 
  alt="Product Image"
  className="w-full h-64 object-cover rounded-lg"
/>
```

### **With Fallback**
```tsx
<S3Image 
  src="profiles/user123.jpg" 
  alt="User Profile"
  fallback={<div className="text-gray-500">No image</div>}
/>
```

## 📤 How to Upload Files

### **1. Simple Upload (Profile Images)**
```typescript
import { uploadBase64Image } from '@/lib/file-upload';

const handleFileUpload = async (file: File) => {
  // Convert to base64
  const base64 = await fileToBase64(file);
  
  // Upload to S3
  const s3Key = await uploadBase64Image(base64, 'profiles/');
  
  // Save to database
  await updateUserProfile({ profileImage: s3Key });
};

// Helper function
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
};
```

### **2. API Upload (Verification Documents)**
```typescript
const handleDocumentUpload = async (file: File) => {
  // Convert to base64
  const base64 = await fileToBase64(file);
  
  // Send to API (API handles S3 upload)
  const response = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      verificationDocuments: {
        idCard: {
          status: 'uploaded',
          data: base64,
          name: file.name
        }
      }
    })
  });
  
  // API returns updated user data with S3 keys
  const { user } = await response.json();
};
```

## 🛠️ Common Patterns

### **1. Image Upload with Preview**
```typescript
const ImageUploadWithPreview = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [s3Key, setS3Key] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (file: File) => {
    // Create preview
    const url = URL.createObjectURL(file);
    setPreview(url);
    
    // Upload to S3
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const key = await uploadBase64Image(base64, 'uploads/');
      setS3Key(key);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        accept="image/*"
      />
      
      {preview && (
        <div className="mt-4">
          <img src={preview} alt="Preview" className="w-32 h-32 object-cover" />
        </div>
      )}
      
      {uploading && <p>Uploading...</p>}
      
      {s3Key && (
        <div className="mt-4">
          <p>Uploaded!</p>
          <S3Image src={s3Key} alt="Uploaded" className="w-32 h-32" />
        </div>
      )}
    </div>
  );
};
```

### **2. Multiple Image Upload**
```typescript
const MultipleFileUpload = () => {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleMultipleUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => 
        uploadBase64Image(file, 'gallery/')
      );
      
      const s3Keys = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...s3Keys]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        multiple
        onChange={(e) => e.target.files && handleMultipleUpload(e.target.files)}
        accept="image/*"
      />
      
      {uploading && <p>Uploading...</p>}
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        {images.map((s3Key, index) => (
          <S3Image 
            key={index}
            src={s3Key} 
            alt={`Image ${index + 1}`}
            className="w-full h-32 object-cover rounded"
          />
        ))}
      </div>
    </div>
  );
};
```

### **3. Image Gallery**
```tsx
const ProductGallery = ({ productImages }: { productImages: string[] }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {productImages.map((s3Key, index) => (
        <S3Image 
          key={index}
          src={s3Key} 
          alt={`Product image ${index + 1}`}
          className="w-full h-32 object-cover rounded"
        />
      ))}
    </div>
  );
};
```

## 🔧 API Endpoints

### **Upload Profile Image**
```typescript
// PUT /api/user/profile
{
  "profileImage": "data:image/jpeg;base64,/9j/4AAQ..."
}

// Response
{
  "user": {
    "profileImage": "profiles/abc123.jpg" // S3 key
  }
}
```

### **Upload Product Images**
```typescript
// POST /api/products
{
  "name": "Product Name",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQ...",
    "data:image/jpeg;base64,/9j/4AAQ..."
  ]
}

// Response
{
  "product": {
    "id": "123",
    "images": [
      "products/abc123.jpg",
      "products/def456.jpg"
    ]
  }
}
```

## 🐛 Common Issues & Solutions

### **Issue 1: Image not showing**
```tsx
// ❌ Wrong - using S3 key directly
<img src="profiles/user123.jpg" alt="Profile" />

// ✅ Correct - using S3Image component
<S3Image src="profiles/user123.jpg" alt="Profile" />
```

### **Issue 2: CORS errors**
- Check S3 bucket CORS settings
- Make sure bucket allows your domain

### **Issue 3: File too large**
```typescript
// Check file size before upload
if (file.size > 10 * 1024 * 1024) { // 10MB
  alert('File too large');
  return;
}
```

### **Issue 4: CloudFront not working**
- Check CloudFront distribution status
- Verify environment variable is set
- Check browser console for errors

## 📊 Performance Tips

### **1. Use Caching**
```typescript
// S3Image automatically caches URLs for 1 minute
// No need to generate the same URL multiple times
```

### **2. Optimize Images**
```typescript
// Resize images before upload
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
// ... resize logic
const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
```

### **3. Lazy Loading**
```typescript
// Use intersection observer for lazy loading
const LazyS3Image = ({ src, alt }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={ref}>
      {isVisible ? <S3Image src={src} alt={alt} /> : <div>Loading...</div>}
    </div>
  );
};
```

## 🧪 Testing

### **Test S3Image Component**
```typescript
// Test with different input types
<S3Image src="profiles/test.jpg" alt="S3 Image" />
<S3Image src="https://example.com/image.jpg" alt="External Image" />
<S3Image src="data:image/jpeg;base64,/9j/4AAQ..." alt="Base64 Image" />
```

### **Test Upload Function**
```typescript
const testUpload = async () => {
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const s3Key = await uploadBase64Image(file, 'test/');
  console.log('Uploaded to:', s3Key);
};
```

## 🔒 GDPR Compliance

### **Data Protection**
- ✅ **Data stored in EU** (Frankfurt S3 bucket)
- ✅ **CloudFront is just caching** (performance optimization)
- ✅ **No new data collection** (just copies of existing data)
- ✅ **You remain data controller** (EU region)

### **Privacy Policy Statement**
> "We store your data in EU data centers (Frankfurt) for GDPR compliance. We use CloudFront CDN to cache copies of your data at global edge locations for performance optimization, but your original data remains in the EU region."

## 📈 Monitoring & Costs

### **CloudWatch Metrics**
- **Storage**: Monitor bucket size
- **Requests**: Track API calls
- **Errors**: Monitor failed requests

### **Cost Optimization**
- **Lifecycle Rules**: Delete old files
- **Storage Classes**: Use cheaper storage for old files
- **Compression**: Optimize images before upload

### **Security**
- **Access Logs**: Enable S3 access logging
- **MFA**: Require MFA for bucket changes
- **Encryption**: All data encrypted at rest

## 🚀 Production Checklist

### **Before Going Live:**
- [ ] **Environment variables** set correctly
- [ ] **CORS** configured for production domain
- [ ] **IAM permissions** minimal and secure
- [ ] **Error handling** implemented
- [ ] **Monitoring** set up
- [ ] **Backup strategy** in place
- [ ] **Cost alerts** configured

### **Performance Optimization:**
- [ ] **Image compression** before upload
- [ ] **CDN** integration (CloudFront)
- [ ] **Lazy loading** for images
- [ ] **Caching** strategy implemented

## 🆘 Need Help?

### **Check These Files First**
1. `src/components/S3Image.tsx` - Main component
2. `src/lib/s3-upload.ts` - S3 operations
3. `src/lib/file-upload.ts` - Upload wrapper

### **Common Questions**
- **Q: Why not use regular `<img>` tags?** A: S3 images are private, need special URLs
- **Q: Why base64?** A: Can't send files through JSON APIs
- **Q: What's CloudFront?** A: Global CDN for fast image loading worldwide

### **Debug Tips**
- Check browser console for errors
- Verify S3 bucket permissions
- Test with different file types
- Check network tab for API calls

---

**You're now ready to use S3 + CloudFront!** 🚀

This guide covers everything from basic setup to advanced patterns. Start with the Quick Start section, then explore the patterns and examples as needed.
