/**
 * Utility functions for CloudFront URL generation
 * Replaces presigned URL generation for better performance and simplicity
 */

export function getCloudFrontUrl(s3Key: string): string {
  const cloudFrontDomain = (process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || 'd1234567890.cloudfront.net').trim();
  return `https://${cloudFrontDomain}/${s3Key}`;
}

export function isS3Key(data: string): boolean {
  // Check if it's an S3 key (doesn't start with 'data:', 'http', '/uploads/', or 'blob:')
  return !data.startsWith('data:') && 
         !data.startsWith('http') && 
         !data.startsWith('/uploads/') && 
         !data.startsWith('blob:');
}

export function getDocumentUrl(documentData: string): string {
  if (isS3Key(documentData)) {
    return getCloudFrontUrl(documentData);
  }
  return documentData; // Return as-is if it's already a URL or data URI
}
