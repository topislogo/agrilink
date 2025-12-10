import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploadBase64Image } from '@/lib/file-upload';

import jwt from 'jsonwebtoken';
import { 
  products as productsTable, 
  productImages, 
  savedProducts,
  users,
  userProfiles,
  userVerification,
  userRatings,
  locations,
  categories,
  deliveryOptions as deliveryOptionsTable,
  paymentTerms as paymentTermsTable,
  sellerCustomDeliveryOptions,
  sellerCustomPaymentTerms,
  offers as offersTable,
  offers
} from '@/lib/db/schema';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import { verifyToken } from '@/lib/api-middleware';



export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const sellerId = searchParams.get('sellerId');

    // Build query using normalized structure
    let productsQuery;
    if (sellerId) {
      productsQuery = db
        .select({
          id: productsTable.id,
          name: productsTable.name,
          description: productsTable.description,
          createdAt: productsTable.createdAt,
          updatedAt: productsTable.updatedAt,
          price: productsTable.price,
          quantity: productsTable.quantity,
        quantityUnit: productsTable.quantityUnit,
        packaging: productsTable.packaging,
          availableStock: productsTable.availableStock,
          minimumOrder: productsTable.minimumOrder,
          deliveryOptions: productsTable.deliveryOptions,
          paymentTerms: productsTable.paymentTerms,
          additionalNotes: productsTable.additionalNotes,
          sellerType: productsTable.sellerType,
          sellerName: productsTable.sellerName,
          imageData: productImages.imageData,
          sellerId: users.id,
          sellerNameFromUser: users.name,
          userType: users.userType,
          accountType: users.accountType,
          category: categories.name,
          categoryId: productsTable.categoryId,
          location: sql<string>`CASE 
            WHEN seller_locations.city IS NOT NULL AND seller_locations.region IS NOT NULL THEN seller_locations.city || ', ' || seller_locations.region
            WHEN seller_locations.city IS NOT NULL THEN seller_locations.city
            ELSE 'Myanmar'
          END`,
          region: sql<string>`COALESCE(seller_locations.region, '')`,
          city: sql<string>`COALESCE(seller_locations.city, '')`,
          profileImage: userProfiles.profileImage,
          verified: userVerification.verified,
          phoneVerified: userVerification.phoneVerified,
          verificationStatus: userVerification.verificationStatus,
          rating: userRatings.rating,
          totalReviews: userRatings.totalReviews,
        })
        .from(productsTable)
        .innerJoin(categories, eq(productsTable.categoryId, categories.id))
        .leftJoin(users, eq(productsTable.sellerId, users.id))
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .leftJoin(sql`locations seller_locations`, eq(userProfiles.locationId, sql`seller_locations.id`))
        .leftJoin(userVerification, eq(users.id, userVerification.userId))
        .leftJoin(userRatings, eq(users.id, userRatings.userId))
        .leftJoin(productImages, and(eq(productImages.productId, productsTable.id), eq(productImages.isPrimary, true)))
        .where(and(eq(productsTable.isActive, true), eq(productsTable.sellerId, sellerId)))
        .orderBy(desc(productsTable.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      productsQuery = db
        .select({
          id: productsTable.id,
          name: productsTable.name,
          description: productsTable.description,
          createdAt: productsTable.createdAt,
          updatedAt: productsTable.updatedAt,
          price: productsTable.price,
          quantity: productsTable.quantity,
        quantityUnit: productsTable.quantityUnit,
        packaging: productsTable.packaging,
          availableStock: productsTable.availableStock,
          minimumOrder: productsTable.minimumOrder,
          deliveryOptions: productsTable.deliveryOptions,
          paymentTerms: productsTable.paymentTerms,
          additionalNotes: productsTable.additionalNotes,
          sellerType: productsTable.sellerType,
          sellerName: productsTable.sellerName,
          imageData: productImages.imageData,
          sellerId: users.id,
          sellerNameFromUser: users.name,
          userType: users.userType,
          accountType: users.accountType,
          category: categories.name,
          categoryId: productsTable.categoryId,
          location: sql<string>`CASE 
            WHEN seller_locations.city IS NOT NULL AND seller_locations.region IS NOT NULL THEN seller_locations.city || ', ' || seller_locations.region
            WHEN seller_locations.city IS NOT NULL THEN seller_locations.city
            ELSE 'Myanmar'
          END`,
          region: sql<string>`COALESCE(seller_locations.region, '')`,
          city: sql<string>`COALESCE(seller_locations.city, '')`,
          profileImage: userProfiles.profileImage,
          verified: userVerification.verified,
          phoneVerified: userVerification.phoneVerified,
          verificationStatus: userVerification.verificationStatus,
          rating: userRatings.rating,
          totalReviews: userRatings.totalReviews,
        })
        .from(productsTable)
        .innerJoin(categories, eq(productsTable.categoryId, categories.id))
        .leftJoin(users, eq(productsTable.sellerId, users.id))
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .leftJoin(sql`locations seller_locations`, eq(userProfiles.locationId, sql`seller_locations.id`))
        .leftJoin(userVerification, eq(users.id, userVerification.userId))
        .leftJoin(userRatings, eq(users.id, userRatings.userId))
        .leftJoin(productImages, and(eq(productImages.productId, productsTable.id), eq(productImages.isPrimary, true)))
        .where(eq(productsTable.isActive, true))
        .orderBy(desc(productsTable.createdAt))
        .limit(limit)
        .offset(offset);
    }

    const products = await productsQuery;

    // Calculate actual available quantity by subtracting pending/accepted offers
    const productsWithCalculatedStock = await Promise.all(products.map(async (product) => {
      // Get pending and accepted offers for this product
      const pendingOffersResult = await db
      .select({ total_offered: sql<number>`COALESCE(SUM(quantity), 0)` })
      .from(offers)
      .where(
        and(
        eq(offers.productId, product.id),
        inArray(offers.status, ['pending', 'accepted']))
      );
      
      const totalOffered = Number(pendingOffersResult[0]?.total_offered) || 0;
      
      // Calculate actual available quantity
      const availableStock = product.availableStock ? parseInt(product.availableStock) : 0;
      const actualAvailable = Math.max(0, availableStock - totalOffered);
      
      return {
        ...product,
        actualAvailableQuantity: actualAvailable,
        totalOffered: totalOffered
      };
    }));

    // Resolve delivery options and payment terms UUIDs to names for all products
    const transformedProducts = await Promise.all(productsWithCalculatedStock.map(async (product) => {
      // Resolve delivery options
      let deliveryOptionNames: string[] = [];
      if (product.deliveryOptions && product.deliveryOptions.length > 0) {
        // Get standard delivery options
        const standardDeliveryResults = await db
          .select({ name: deliveryOptionsTable.name })
          .from(deliveryOptionsTable)
          .where(inArray(deliveryOptionsTable.id, product.deliveryOptions));
        
        // Get custom delivery options for this seller
        const customDeliveryResults = await sql`
          SELECT name FROM seller_custom_delivery_options
          WHERE id = ANY(${product.deliveryOptions})
        `;
        
        // Combine both results - ensure customDeliveryResults is an array
        deliveryOptionNames = [...standardDeliveryResults.map(r => r.name), ...(Array.isArray(customDeliveryResults) ? customDeliveryResults.map(r => r.name) : [])];
      }

      // Resolve payment terms
      let paymentTermNames: string[] = [];
      if (product.paymentTerms && product.paymentTerms.length > 0) {
        // Get standard payment terms
        const standardPaymentResults = await db
          .select({ name: paymentTermsTable.name })
          .from(paymentTermsTable)
          .where(inArray(paymentTermsTable.id, product.paymentTerms));
        
        // Get custom payment terms for this seller
        const customPaymentResults = await sql`
          SELECT name FROM seller_custom_payment_terms
          WHERE id = ANY(${product.paymentTerms})
        `;
        
        // Combine both results - ensure customPaymentResults is an array
        paymentTermNames = [...standardPaymentResults.map(r => r.name), ...(Array.isArray(customPaymentResults) ? customPaymentResults.map(r => r.name) : [])];
      }

      return {
      id: product.id,
      name: product.name,
      category: product.category, // No fallback - show actual value
      categoryId: product.categoryId, // Include categoryId
      description: product.description,
      availableQuantity: product.actualAvailableQuantity?.toString() || product.availableStock, // Use calculated available quantity
      createdAt: product.createdAt,
      updatedAt: product.updatedAt || product.createdAt, // Use updatedAt, fallback to createdAt
      lastUpdated: product.updatedAt || product.createdAt, // Also include lastUpdated for backward compatibility
      price: parseFloat(product.price?.toString() || '0') || 0,
      quantity: product.quantity, // No fallback - show actual value (null if not set)
      quantityUnit: product.quantityUnit, // No fallback - show actual value (null if not set)
      packaging: product.packaging, // No fallback - show actual value (null if not set)
      // Legacy field for backward compatibility - format without / separator
      unit: product.quantity && product.quantityUnit 
        ? product.packaging 
          ? `${product.quantity}${product.quantityUnit} ${product.packaging}` 
          : `${product.quantity}${product.quantityUnit}`
        : null,
      location: product.location, // Use seller location
      region: product.region, // Use seller region
      city: product.city, // Use seller city
      imageUrl: product.imageData,
      image: product.imageData, // Add legacy image field for compatibility
      images: product.imageData ? [product.imageData] : [],
      seller: {
        id: product.sellerId,
        name: product.sellerNameFromUser || product.sellerName, // No fallback - show actual value
        userType: product.userType, // No fallback - show actual value
        accountType: product.accountType, // No fallback - show actual value
          location: product.location, // Use seller location
          region: product.region, // Use seller region
          city: product.city, // Use seller city
        profileImage: product.profileImage, // No fallback - show actual value
        verified: product.verified || false,
        phoneVerified: product.phoneVerified || false,
        verificationStatus: product.verificationStatus, // No fallback - show actual value
        rating: parseFloat(product.rating?.toString() || '0') || 0,
        totalReviews: product.totalReviews || 0,
      },
      deliveryOptions: deliveryOptionNames,
      paymentTerms: paymentTermNames,
      additionalNotes: product.additionalNotes, // No fallback - show actual value (null if not set)
      };
    }));

    const response = NextResponse.json({
      products: transformedProducts,
      total: transformedProducts.length,
      message: 'Products fetched successfully from Neon database!'
    });

    // Add caching headers for better performance
    // But disable caching for seller-specific queries to avoid stale data after deletions
    if (sellerId) {
      // No caching for seller-specific queries to ensure fresh data after deletions
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      // Cache general product listings for better performance
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    }
    
    return response;

  } catch (error: any) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Product creation API called');
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    const userId = user.id;

    const body = await request.json();
    const {
      name,
      category,
      description,
      price,
      quantity,
      quantityUnit,
      packaging,
      unit, // Legacy field for backward compatibility
      imageUrl,
      images,
      availableQuantity,
      minimumOrder,
      location,
      region,
      additionalNotes,
      deliveryOptions = [],
      paymentTerms = []
    } = body;

    // Validate required fields
    if (!name || !category || !price) {
      console.log('❌ Missing required fields:', { name: !!name, category: !!category, price: !!price });
      return NextResponse.json(
        { error: 'Name, category, and price are required' },
        { status: 400 }
      );
    }

    console.log('🔄 Creating product with data:', {
      name,
      category,
      price,
      quantity,
      quantityUnit,
      packaging,
      unit, // Legacy field
      availableQuantity,
      minimumOrder,
      location,
      region,
      additionalNotes,
      deliveryOptions: deliveryOptions?.length || 0,
      paymentTerms: paymentTerms?.length || 0
    });

    // Find categoryId from categories table
    let categoryId = null;
    if (category) {
      const categoryResult = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.name, category))
        .limit(1);

      if (categoryResult.length > 0) {
        categoryId = categoryResult[0].id;
        console.log('✅ Found category:', category, 'ID:', categoryId);
      } else {
        console.log('❌ Category not found:', category);
        return NextResponse.json(
          { error: `Category "${category}" not found` },
          { status: 400 }
        );
      }
    } else {
      console.log('❌ No category provided');
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    // Find or create locationId from locations table
    let locationId = null;
    if (location && region) {
      try {
        // First, try to find existing location by both city and region
        const existingLocation = await db
          .select({ id: locations.id })
          .from(locations)
          .where(and(eq(locations.city, location), eq(locations.region, region)))
          .limit(1);

        if (existingLocation.length > 0) {
          locationId = existingLocation[0].id;
          console.log('📍 Found existing location:', locationId);
        } else {
          // Create new location
          const newLocation = await db
            .insert(locations)
            .values({
              city: location,
              region: region
            })
            .returning({ id: locations.id });
          
          locationId = newLocation[0].id;
          console.log('📍 Created new location:', locationId);
        }
      } catch (error) {
        console.error('❌ Error handling location:', error);
      }
    }

    // Handle delivery options and payment terms
    let deliveryOptionIds = null;
    let paymentTermIds = null;
    
    console.log('🔍 Delivery options received:', deliveryOptions, 'Type:', typeof deliveryOptions);
    console.log('🔍 Payment terms received:', paymentTerms, 'Type:', typeof paymentTerms);
    
    // Convert empty arrays to null for database storage
    let processedDeliveryOptions = deliveryOptions;
    let processedPaymentTerms = paymentTerms;
    
    if (deliveryOptions && deliveryOptions.length === 0) {
      processedDeliveryOptions = null;
    }
    if (paymentTerms && paymentTerms.length === 0) {
      processedPaymentTerms = null;
    }
    
    // Look up delivery option IDs (both standard and custom)
    if (processedDeliveryOptions && Array.isArray(processedDeliveryOptions) && processedDeliveryOptions.length > 0) {
      // Convert single value to array if needed
      const deliveryArray = Array.isArray(processedDeliveryOptions) ? processedDeliveryOptions : [processedDeliveryOptions];
      
      console.log('🔍 Looking up delivery options:', deliveryArray);
      
      // Look up standard delivery options
      const standardDeliveryResults = await db
        .select({ id: deliveryOptionsTable.id, name: deliveryOptionsTable.name })
        .from(deliveryOptionsTable)
        .where(inArray(deliveryOptionsTable.name, deliveryArray));
      
      // Look up custom delivery options for this seller (using same approach as edit endpoint)
      const customDeliveryResults = await db
        .select({ id: sellerCustomDeliveryOptions.id, name: sellerCustomDeliveryOptions.name })
        .from(sellerCustomDeliveryOptions)
        .where(and(
          eq(sellerCustomDeliveryOptions.sellerId, userId),
          inArray(sellerCustomDeliveryOptions.name, deliveryArray)
        ));
      
      console.log('🔍 Standard delivery options found:', standardDeliveryResults);
      console.log('🔍 Custom delivery options found:', customDeliveryResults);
      
      // Combine both results
      const allDeliveryResults = [...standardDeliveryResults, ...customDeliveryResults];
      
      if (allDeliveryResults.length > 0) {
        deliveryOptionIds = allDeliveryResults.map(r => r.id);
      }
    }

    // Look up payment term IDs (both standard and custom)
    if (processedPaymentTerms && Array.isArray(processedPaymentTerms) && processedPaymentTerms.length > 0) {
      // Convert single value to array if needed
      const paymentArray = Array.isArray(processedPaymentTerms) ? processedPaymentTerms : [processedPaymentTerms];
      
      console.log('🔍 Looking up payment terms:', paymentArray);
      
      // Look up standard payment terms
      const standardPaymentResults = await db
        .select({ id: paymentTermsTable.id, name: paymentTermsTable.name })
        .from(paymentTermsTable)
        .where(inArray(paymentTermsTable.name, paymentArray));
      
      // Look up custom payment terms for this seller (using same approach as edit endpoint)
      const customPaymentResults = await db
        .select({ id: sellerCustomPaymentTerms.id, name: sellerCustomPaymentTerms.name })
        .from(sellerCustomPaymentTerms)
        .where(and(
          eq(sellerCustomPaymentTerms.sellerId, userId),
          inArray(sellerCustomPaymentTerms.name, paymentArray)
        ));
      
      console.log('🔍 Standard payment terms found:', standardPaymentResults);
      console.log('🔍 Custom payment terms found:', customPaymentResults);
      
      // Combine both results
      const allPaymentResults = [...standardPaymentResults, ...customPaymentResults];
      
      if (allPaymentResults.length > 0) {
        paymentTermIds = allPaymentResults.map(r => r.id);
      }
    }

    // Create product with normalized structure
    let newProduct;
    try {
      const productData = {
        name,
        description,
        price: price.toString(),
        quantity: quantity || null,
        quantityUnit: quantityUnit || null,
        packaging: packaging || null,
        availableStock: availableQuantity || null,
        minimumOrder: minimumOrder || null,
        deliveryOptions: deliveryOptionIds || [],
        paymentTerms: paymentTermIds || [],
        additionalNotes: additionalNotes || '',
        categoryId: categoryId || null,
        locationId: locationId || null,
        sellerId: userId,
        isActive: true,
      };
      
      console.log('🔍 Product data being inserted:', JSON.stringify(productData, null, 2));
      
      newProduct = await db.insert(productsTable).values(productData).returning({
        id: productsTable.id,
        name: productsTable.name,
        createdAt: productsTable.createdAt,
      });

      console.log('✅ Product created with ID:', newProduct[0].id);
    } catch (dbError) {
      console.error('❌ Database error creating product:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to create product in database', 
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'},
        { status: 500 }
      );
    }

    // Upload images to S3 and insert into database
    if (images && Array.isArray(images) && images.length > 0) {
      console.log('📤 Uploading product images to S3...');
      console.log('📊 Images array length:', images.length);
      console.log('📊 First image preview:', images[0]?.substring(0, 50) + '...');
      
      for (let i = 0; i < images.length; i++) {
        const imageData = images[i];
        if (imageData && imageData.startsWith('data:')) {
          try {
            console.log(`📤 Uploading image ${i + 1}/${images.length} to S3 (base64 length: ${imageData.length})`);
            const uploadedFile = await uploadBase64Image(
              imageData, 
              'products', 
              `product-${newProduct[0].id}-${i + 1}.jpg`
            );
            console.log(`✅ S3 upload successful:`, uploadedFile);
            
            await db.insert(productImages).values({
              productId: newProduct[0].id,
              imageData: uploadedFile.filepath, // S3 key
              isPrimary: i === 0,
            });
            
            console.log(`✅ Image ${i + 1} uploaded to S3:`, uploadedFile.filepath);
          } catch (error) {
            console.error(`❌ Failed to upload image ${i + 1}:`, error);
            // Continue with other images even if one fails
          }
        }
      }
    } else if (imageUrl && imageUrl.startsWith('data:')) {
      // Handle legacy single image upload
      try {
        console.log('📤 Uploading legacy image to S3...');
        const uploadedFile = await uploadBase64Image(
          imageUrl, 
          'products', 
          `product-${newProduct[0].id}.jpg`
        );
        
        await db.insert(productImages).values({
          productId: newProduct[0].id,
          imageData: uploadedFile.filepath, // S3 key
          isPrimary: true,
        });
        
        console.log('✅ Legacy image uploaded to S3:', uploadedFile.filepath);
      } catch (error) {
        console.error('❌ Failed to upload legacy image:', error);
      }
    }

    return NextResponse.json({
      success: true,
      productId: newProduct[0].id,
      message: 'Product created successfully!'
    });

  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}