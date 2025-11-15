import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Browser-compatible UUID generation
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for browsers that don't support crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface S3UploadedFile {
  filename: string;
  filepath: string; // S3 URL
  originalName: string;
  size: number;
  mimeType: string;
  bucket: string;
  key: string;
}

class S3UploadService {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private region: string;
  private isDevelopmentMode: boolean;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME || '';
    this.region = process.env.AWS_REGION || 'us-east-1';
    
    console.log('🔍 S3 Service Initialization Debug:');
    console.log('  AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET');
    console.log('  AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');
    console.log('  AWS_REGION:', this.region);
    console.log('  AWS_S3_BUCKET:', this.bucketName);
    console.log('  NODE_ENV:', process.env.NODE_ENV);
    
    // Initialize AWS S3 client if credentials are provided
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && this.bucketName) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      this.isDevelopmentMode = false;
      console.log('✅ AWS S3 client initialized - Production mode enabled');
    } else {
      this.isDevelopmentMode = true;
      console.log('⚠️ AWS S3 credentials not found, using development mode');
      console.log('  Missing:', {
        accessKey: !process.env.AWS_ACCESS_KEY_ID,
        secretKey: !process.env.AWS_SECRET_ACCESS_KEY,
        bucket: !this.bucketName
      });
    }
  }

  /**
   * Upload a base64 image to S3 and return the file information
   */
  async uploadBase64Image(
    base64Data: string,
    folder: 'verification' | 'profiles' | 'storefronts' | 'products',
    originalName?: string
  ): Promise<S3UploadedFile> {
    try {
      // Extract the base64 data and mime type
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 data format');
      }

      const mimeType = matches[1];
      const base64String = matches[2];
      
      // Validate mime type
      if (!mimeType.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(base64String, 'base64');
      
      // Generate unique filename
      const fileExtension = mimeType.split('/')[1] || 'jpg';
      const uniqueId = generateUUID();
      const filename = `${uniqueId}.${fileExtension}`;
      const s3Key = `${folder}/${filename}`;

      if (this.s3Client && !this.isDevelopmentMode) {
        try {
          // Upload to S3 (private, no public access)
          const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: s3Key,
            Body: buffer,
            ContentType: mimeType,
            // No ACL - files are private by default
            Metadata: {
              originalName: originalName || `upload.${fileExtension}`,
              uploadedAt: new Date().toISOString(),
            },
          });

          await this.s3Client.send(command);
          
          console.log('✅ File uploaded to S3 successfully:', {
            bucket: this.bucketName,
            key: s3Key,
            size: buffer.length,
            mimeType
          });
          
          return {
            filename,
            filepath: s3Key, // Store S3 key instead of presigned URL
            originalName: originalName || `upload.${fileExtension}`,
            size: buffer.length,
            mimeType,
            bucket: this.bucketName,
            key: s3Key
          };
        } catch (s3Error) {
          console.error('❌ S3 upload error:', s3Error);
          throw new Error(`S3 upload failed: ${s3Error instanceof Error ? s3Error.message : 'Unknown error'}`);
        }
      } else {
        // Development mode - return mock data
        console.log('📁 [DEV MODE] File would be uploaded to S3:', {
          folder,
          filename,
          size: buffer.length,
          mimeType,
          bucket: this.bucketName || 'mock-bucket',
          key: s3Key
        });
        
        const mockUrl = `/api/placeholder/400/300?text=${encodeURIComponent(filename)}`;
        
        return {
          filename,
          filepath: mockUrl, // Mock URL for development
          originalName: originalName || `upload.${fileExtension}`,
          size: buffer.length,
          mimeType,
          bucket: this.bucketName || 'mock-bucket',
          key: s3Key
        };
      }
    } catch (error) {
      console.error('❌ File upload failed:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple base64 images to S3
   */
  async uploadMultipleBase64Images(
    base64DataArray: string[],
    folder: 'verification' | 'profiles' | 'storefronts' | 'products',
    originalNames?: string[]
  ): Promise<S3UploadedFile[]> {
    const uploadPromises = base64DataArray.map((base64Data, index) => 
      this.uploadBase64Image(base64Data, folder, originalNames?.[index])
    );
    
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(s3Key: string): Promise<void> {
    if (!this.s3Client || this.isDevelopmentMode) {
      console.log('📁 [DEV MODE] File would be deleted from S3:', s3Key);
      return;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(command);
      console.log('✅ File deleted from S3 successfully:', s3Key);
    } catch (error) {
      console.error('❌ S3 file deletion failed:', error);
      // Don't throw error for file deletion failures
    }
  }

  /**
   * Get file from S3 (for admin downloads)
   */
  async getFile(s3Key: string): Promise<Buffer | null> {
    if (!this.s3Client || this.isDevelopmentMode) {
      console.log('📁 [DEV MODE] File would be retrieved from S3:', s3Key);
      return null;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const response = await this.s3Client.send(command);
      
      if (response.Body) {
        const chunks: Uint8Array[] = [];
        const reader = response.Body.transformToWebStream().getReader();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        const buffer = Buffer.concat(chunks);
        console.log('✅ File retrieved from S3 successfully:', s3Key);
        return buffer;
      }
      
      return null;
    } catch (error) {
      console.error('❌ S3 file retrieval failed:', error);
      return null;
    }
  }

  /**
   * Test S3 connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.s3Client) {
      console.log('❌ AWS S3 client not initialized');
      return false;
    }

    try {
      // Try to list objects (this will test the connection)
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        MaxKeys: 1
      });

      await this.s3Client.send(command);
      console.log('✅ AWS S3 connection successful');
      return true;
    } catch (error: any) {
      console.error('❌ AWS S3 connection failed:', error.message);
      return false;
    }
  }

  /**
   * Generate presigned URL for existing file
   */
  async generatePresignedUrl(s3Key: string, expiresIn: number = 604800): Promise<string> {
    if (!this.s3Client || this.isDevelopmentMode) {
      console.log('📁 [DEV MODE] Presigned URL would be generated for:', s3Key);
      return `/api/placeholder/400/300?text=${encodeURIComponent(s3Key)}`;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, { 
        expiresIn 
      });

      console.log('✅ Presigned URL generated:', s3Key);
      return presignedUrl;
    } catch (error) {
      console.error('❌ Presigned URL generation failed:', error);
      throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract S3 key from URL
   */
  extractS3KeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('s3.amazonaws.com') || urlObj.hostname.includes('.s3.')) {
        // Extract key from S3 URL
        const pathParts = urlObj.pathname.split('/');
        return pathParts.slice(1).join('/'); // Remove leading slash and join
      }
      return null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const s3UploadService = new S3UploadService();
