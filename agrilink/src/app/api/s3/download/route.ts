import { NextRequest, NextResponse } from "next/server";
import { s3UploadService } from '@/lib/s3-upload';

export async function POST(request: NextRequest) {
  try {
    const { s3Key, filename } = await request.json();
    
    if (!s3Key) {
      return NextResponse.json(
        { error: 'S3 key is required' },
        { status: 400 }
      );
    }
    
    console.log('📥 Server-side download for S3 key:', s3Key);
    
    // Generate presigned URL for download
    const presignedUrl = await s3UploadService.generatePresignedUrl(s3Key, 3600); // 1 hour for download
    
    // Fetch the file from S3
    const response = await fetch(presignedUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file from S3: ${response.status} ${response.statusText}`);
    }
    
    const fileBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    console.log('✅ File fetched from S3, size:', fileBuffer.byteLength, 'type:', contentType);
    
    // Return the file as a stream
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename || 'download'}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    });
    
  } catch (error) {
    console.error('❌ Server-side download failed:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}