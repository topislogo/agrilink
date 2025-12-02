import { NextRequest, NextResponse } from "next/server";
import { s3UploadService } from '@/lib/s3-upload';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json(
        { error: 'S3 key is required' },
        { status: 400 }
      );
    }
    
    console.log('👁️ Server-side view for S3 key:', key);
    
    // Generate presigned URL for viewing
    const presignedUrl = await s3UploadService.generatePresignedUrl(key, 3600); // 1 hour for viewing
    
    // Fetch the file from S3
    const response = await fetch(presignedUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file from S3: ${response.status} ${response.statusText}`);
    }
    
    const fileBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    console.log('✅ File fetched from S3 for viewing, size:', fileBuffer.byteLength, 'type:', contentType);
    
    // Return the file for viewing (not download)
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline', // Display in browser instead of download
        'Content-Length': fileBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
    
  } catch (error) {
    console.error('❌ Server-side view failed:', error);
    return NextResponse.json(
      { error: 'Failed to view file' },
      { status: 500 }
    );
  }
}
