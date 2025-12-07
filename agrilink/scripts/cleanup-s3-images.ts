import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME!;

async function cleanupAllImages() {
  try {
    console.log('🧹 Starting S3 cleanup...');
    console.log(`📦 Bucket: ${bucketName}`);
    console.log(`🌍 Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    
    // List all objects in the bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
    });
    
    const listResponse = await s3Client.send(listCommand);
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log('✅ No objects found in S3 bucket');
      return;
    }
    
    console.log(`📊 Found ${listResponse.Contents.length} objects in S3`);
    
    // Group objects by type
    const objectsByType: { [key: string]: string[] } = {
      profiles: [],
      storefronts: [],
      products: [],
      verification: [],
      other: []
    };
    
    listResponse.Contents.forEach(obj => {
      if (obj.Key) {
        if (obj.Key.startsWith('profiles/')) {
          objectsByType.profiles.push(obj.Key);
        } else if (obj.Key.startsWith('storefronts/')) {
          objectsByType.storefronts.push(obj.Key);
        } else if (obj.Key.startsWith('products/')) {
          objectsByType.products.push(obj.Key);
        } else if (obj.Key.startsWith('verification/')) {
          objectsByType.verification.push(obj.Key);
        } else {
          objectsByType.other.push(obj.Key);
        }
      }
    });
    
    // Display summary
    console.log('\n📋 Objects by type:');
    Object.entries(objectsByType).forEach(([type, objects]) => {
      if (objects.length > 0) {
        console.log(`  ${type}: ${objects.length} objects`);
      }
    });
    
    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will delete ALL images from your S3 bucket!');
    console.log('This action cannot be undone.');
    console.log('\nTo proceed, run: npm run cleanup-s3');
    console.log('To cancel, press Ctrl+C');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function deleteAllImages() {
  try {
    console.log('🗑️  Deleting all images...');
    
    // List all objects
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
    });
    
    const listResponse = await s3Client.send(listCommand);
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log('✅ No objects to delete');
      return;
    }
    
    let deletedCount = 0;
    let errorCount = 0;
    
    // Delete each object
    for (const obj of listResponse.Contents) {
      if (obj.Key) {
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: obj.Key,
          });
          
          await s3Client.send(deleteCommand);
          console.log(`✅ Deleted: ${obj.Key}`);
          deletedCount++;
        } catch (error) {
          console.error(`❌ Failed to delete ${obj.Key}:`, error);
          errorCount++;
        }
      }
    }
    
    console.log(`\n🎉 Cleanup completed!`);
    console.log(`✅ Successfully deleted: ${deletedCount} objects`);
    if (errorCount > 0) {
      console.log(`❌ Failed to delete: ${errorCount} objects`);
    }
    
  } catch (error) {
    console.error('❌ Error during deletion:', error);
  }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--delete')) {
  deleteAllImages();
} else {
  cleanupAllImages();
}
