// Utility to get CloudFront URLs (replaces presigned URLs)
export function getS3Url(s3Key: string): string {
  try {
    const cloudFrontDomain = (process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || 'd1234567890.cloudfront.net').trim();
    return `https://${cloudFrontDomain}/${s3Key}`;
  } catch (error) {
    console.error('Failed to get CloudFront URL:', error);
    // Fallback to placeholder image
    return '/api/placeholder/400/300?text=Image+Not+Available';
  }
}

// Check if a string is an S3 key (not a full URL)
export function isS3Key(filepath: string): boolean {
  return !filepath.startsWith('http') && !filepath.startsWith('data:') && !filepath.startsWith('/');
}
