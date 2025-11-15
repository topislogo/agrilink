import { s3UploadService, S3UploadedFile } from './s3-upload';

// Re-export S3 types for backward compatibility
export interface UploadedFile {
  filename: string;
  filepath: string;
  originalName: string;
  size: number;
  mimeType: string;
}

/**
 * Upload a base64 image to S3 and return the file path
 * This function now uses S3 instead of local filesystem for Vercel compatibility
 */
export async function uploadBase64Image(
  base64Data: string,
  folder: 'verification' | 'profiles' | 'storefronts' | 'products',
  originalName?: string
): Promise<UploadedFile> {
  try {
    const s3Result = await s3UploadService.uploadBase64Image(base64Data, folder, originalName);
    
    // Convert S3 result to legacy format for backward compatibility
    const uploadedFile: UploadedFile = {
      filename: s3Result.filename,
      filepath: s3Result.filepath, // Now contains S3 URL
      originalName: s3Result.originalName,
      size: s3Result.size,
      mimeType: s3Result.mimeType
    };
    
    return uploadedFile;
  } catch (error) {
    console.error('❌ File upload failed:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload multiple base64 images to S3
 */
export async function uploadMultipleBase64Images(
  base64DataArray: string[],
  folder: 'verification' | 'profiles' | 'storefronts' | 'products',
  originalNames?: string[]
): Promise<UploadedFile[]> {
  const uploadPromises = base64DataArray.map((base64Data, index) => 
    uploadBase64Image(base64Data, folder, originalNames?.[index])
  );
  
  return Promise.all(uploadPromises);
}

/**
 * Delete a file from S3
 */
export async function deleteFile(filepath: string): Promise<void> {
  try {
    // Check if it's already an S3 key (starts with folder name)
    if (filepath.startsWith('profiles/') || filepath.startsWith('storefronts/') || 
        filepath.startsWith('verification/') || filepath.startsWith('products/')) {
      // It's already an S3 key, delete directly
      await s3UploadService.deleteFile(filepath);
    } else {
      // Try to extract S3 key from URL if it's an S3 URL
      const s3Key = s3UploadService.extractS3KeyFromUrl(filepath);
      
      if (s3Key) {
        // It's an S3 URL, delete from S3
        await s3UploadService.deleteFile(s3Key);
      } else {
        // Legacy local file path - log but don't error
        console.log('📁 [LEGACY] Local file deletion not supported in S3 mode:', filepath);
      }
    }
  } catch (error) {
    console.error('❌ File deletion failed:', error);
    // Don't throw error for file deletion failures
  }
}
