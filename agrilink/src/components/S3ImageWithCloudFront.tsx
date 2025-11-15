'use client';

import { useState, useEffect } from 'react';
import { isS3Key } from '@/lib/s3-utils';

// CloudFront configuration
const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || 'd1234567890.cloudfront.net';

// Simple cache for URLs
const urlCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute

// Clear cache function for debugging
export function clearS3ImageCache() {
  urlCache.clear();
  console.log('🧹 S3Image cache cleared');
}

interface S3ImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function S3Image({ src, alt, className, fallback }: S3ImageProps) {
  const [imageUrl, setImageUrl] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      console.log('🖼️ S3Image loading:', { src, isS3Key: isS3Key(src) });
      
      // If it's already a full URL, data URL, or base64 data, use it directly
      if (!isS3Key(src)) {
        console.log('🖼️ Using direct URL/data:', src.substring(0, 50) + '...');
        setImageUrl(src);
        return;
      }

      // Check cache first
      const cached = urlCache.get(src);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log('🖼️ Using cached URL for:', src);
        setImageUrl(cached.url);
        return;
      }

      // If it's an S3 key, use CloudFront URL for better performance
      setIsLoading(true);
      setHasError(false);
      
      try {
        console.log('🖼️ Using CloudFront URL for:', src);
        
        // Use CloudFront URL instead of generating presigned URL
        const cloudFrontUrl = `https://${CLOUDFRONT_DOMAIN}/${src}`;
        console.log('🖼️ Generated CloudFront URL:', cloudFrontUrl);
        
        setImageUrl(cloudFrontUrl);
        
        // Cache the URL
        urlCache.set(src, { url: cloudFrontUrl, timestamp: now });
      } catch (error) {
        console.error('❌ Failed to load S3 image:', error);
        setHasError(true);
        
        // Clear cache for this key to force fresh generation next time
        urlCache.delete(src);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [src]);

  if (hasError || !imageUrl) {
    return fallback || (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Image not available</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt} 
      className={className}
      onError={() => {
        console.error('❌ Image failed to load:', imageUrl);
        setHasError(true);
      }}
    />
  );
}
