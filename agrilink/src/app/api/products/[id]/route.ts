import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';
import { uploadBase64Image } from '@/lib/file-upload';

import jwt from 'jsonwebtoken';
import { 
  products as productsTable, 
  productImages, 
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
  offers as offersTable
} from '@/lib/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';



export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    
    // Get product with seller info using normalized structure
    const productResult = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        isActive: productsTable.isActive,
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
        sellerId: users.id,
        sellerNameFromUser: users.name,
        userType: users.userType,
        accountType: users.accountType,
        category: categories.name,
        categoryId: productsTable.categoryId,
        sellerLocation: sql<string>`CASE 
          WHEN seller_locations.city IS NOT NULL AND seller_locations.region IS NOT NULL THEN seller_locations.city || ', ' || seller_locations.region
          WHEN seller_locations.city IS NOT NULL THEN seller_locations.city
          ELSE 'Myanmar'
        END`,
        sellerRegion: sql<string>`COALESCE(seller_locations.region, '')`,
        sellerCity: sql<string>`COALESCE(seller_locations.city, '')`,
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
      .where(and(eq(productsTable.id, productId), eq(productsTable.isActive, true)))
      .limit(1);

    if (productResult.length === 0) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    const product = productResult[0];

    // Calculate actual available quantity by subtracting pending/accepted offers
    let actualAvailableQuantity = product.availableStock;
    
    if (product.availableStock && !isNaN(parseInt(product.availableStock))) {
      // Get pending and accepted offers for this product
      const pendingOffersResult = await sql`
        SELECT COALESCE(SUM(quantity), 0) as total_offered
        FROM offers 
        WHERE "productId" = ${productId} 
        AND status IN ('pending', 'accepted')
      `;
      
      const totalOffered = pendingOffersResult[0]?.total_offered || 0;
      
      // Calculate actual available quantity
      const availableStock = parseInt(product.availableStock);
      const actualAvailable = Math.max(0, availableStock - totalOffered);
      
      actualAvailableQuantity = actualAvailable.toString();
    }

    // Fetch product images
    const productImagesResult = await db
      .select({
        id: productImages.id,
        imageData: productImages.imageData,
        isPrimary: productImages.isPrimary,
        createdAt: productImages.createdAt
      })
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(sql`${productImages.isPrimary} DESC, ${productImages.createdAt} ASC`);

    // Resolve delivery options and payment terms UUIDs to names
    let deliveryOptionNames: string[] = [];
    let paymentTermNames: string[] = [];


    if (product.deliveryOptions && product.deliveryOptions.length > 0) {
      // Get standard delivery options
      const standardDeliveryResults = await db
        .select({ name: deliveryOptionsTable.name })
        .from(deliveryOptionsTable)
        .where(inArray(deliveryOptionsTable.id, product.deliveryOptions));
      
      // Get custom delivery options for this seller
      const customDeliveryResults = await db
        .select({ name: sellerCustomDeliveryOptions.name })
        .from(sellerCustomDeliveryOptions)
        .where(inArray(sellerCustomDeliveryOptions.id, product.deliveryOptions));
      
      // Combine both results
      deliveryOptionNames = [...standardDeliveryResults.map(r => r.name), ...customDeliveryResults.map(r => r.name)];
    }

    if (product.paymentTerms && product.paymentTerms.length > 0) {
      // Get standard payment terms
      const standardPaymentResults = await db
        .select({ name: paymentTermsTable.name })
        .from(paymentTermsTable)
        .where(inArray(paymentTermsTable.id, product.paymentTerms));
      
      // Get custom payment terms for this seller
      const customPaymentResults = await db
        .select({ name: sellerCustomPaymentTerms.name })
        .from(sellerCustomPaymentTerms)
        .where(inArray(sellerCustomPaymentTerms.id, product.paymentTerms));
      
      // Combine both results
      paymentTermNames = [...standardPaymentResults.map(r => r.name), ...customPaymentResults.map(r => r.name)];
    }

    console.log('🖼️ Found images for product:', productImagesResult.length);

    // Transform the data to match the expected format
    const primaryImage = productImagesResult.find(img => img.isPrimary);
    const allImageUrls = productImagesResult.map(img => img.imageData);
    
    const transformedProduct = {
      id: product.id,
      name: product.name,
      category: product.category, // No fallback - show actual value
      categoryId: product.categoryId, // Include categoryId
      description: product.description,
      price: product.price ? parseFloat(product.price.toString()) : 0,
      quantity: product.quantity, // No fallback - show actual value (null if not set)
      quantityUnit: product.quantityUnit, // No fallback - show actual value (null if not set)
      packaging: product.packaging, // No fallback - show actual value (null if not set)
      // Legacy field for backward compatibility - format without / separator
      unit: product.quantity && product.quantityUnit 
        ? product.packaging 
          ? `${product.quantity}${product.quantityUnit} ${product.packaging}` 
          : `${product.quantity}${product.quantityUnit}`
        : null,
      imageUrl: primaryImage?.imageData || allImageUrls[0] || null,
      image: primaryImage?.imageData || allImageUrls[0] || null, // Add legacy image field for compatibility
      images: allImageUrls,
      sellerId: product.sellerId,
      sellerName: product.sellerNameFromUser || product.sellerName, // No fallback - show actual value
      sellerType: product.userType, // No fallback - show actual value
      location: product.sellerLocation, // Use seller location
      region: product.sellerRegion, // Use seller region
      city: product.sellerCity, // Use seller city
      lastUpdated: product.updatedAt || product.createdAt, // Use updatedAt, fallback to createdAt
      updatedAt: product.updatedAt || product.createdAt, // Also include updatedAt field for components
      availableStock: product.availableStock || null, // Raw stock value (for editing)
      availableQuantity: actualAvailableQuantity ? actualAvailableQuantity.toString() : '0', // Calculated available quantity (for display)
      minimumOrder: product.minimumOrder, // No fallback - show actual value (null if not set)
      deliveryOptions: deliveryOptionNames,
      paymentTerms: paymentTermNames,
      additionalNotes: product.additionalNotes, // No fallback - show actual value (null if not set)
      sellerVerificationStatus: {
        accountType: product.accountType || 'individual',
        trustLevel: product.verified ? (product.accountType === 'business' ? 'business-verified' : 'id-verified') : 'unverified',
        businessVerified: product.verified && product.accountType === 'business',
      },
    };


    return NextResponse.json({
      product: transformedProduct,
    });
  } catch (error: any) {
    console.error("❌ Error fetching product:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error.message,
        details: {
          code: error.code,
          detail: error.detail,
          hint: error.hint
        }
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 PUT /api/products/[id] - Request received');
  try {
    const { id: productId } = await params;
    console.log('📝 Product ID from params:', productId);
    
    let body;
    try {
      body = await request.json();
      console.log('📦 Request body parsed successfully');
      console.log('📥 Request body details:', {
        hasImages: !!(body.images && body.images.length > 0),
        imagesLength: body.images?.length || 0,
        hasImage: !!body.image,
        bodyKeys: Object.keys(body),
        imagesPreview: body.images?.map(img => ({
          length: img?.length || 0,
          isBase64: img?.startsWith('data:') || false,
          preview: img?.substring(0, 50) + '...' || 'null'
        }))
      });
    } catch (bodyError) {
      console.error('❌ Failed to parse request body:', bodyError);
      return NextResponse.json(
        { message: "Invalid JSON in request body", error: bodyError.message },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { message: "Product name is required" },
        { status: 400 }
      );
    }
    
    if (!body.category || !body.category.trim()) {
      return NextResponse.json(
        { message: "Product category is required" },
        { status: 400 }
      );
    }
    
    if (body.price === undefined || body.price === null || body.price < 0) {
      return NextResponse.json(
        { message: "Valid price is required" },
        { status: 400 }
      );
    }

    console.log('🔄 PUT /api/products/[id] - Received data:', {
      productId,
      body: {
        id: body.id,
        name: body.name,
        category: body.category,
        description: body.description,
        price: body.price,
        quantity: body.quantity,
        quantityUnit: body.quantityUnit,
        packaging: body.packaging || null,
        location: body.location,
        region: body.region,
        availableQuantity: body.availableQuantity,
        availableQuantityType: typeof body.availableQuantity,
        availableQuantityValue: body.availableQuantity,
        minimumOrder: body.minimumOrder,
        deliveryOptions: body.deliveryOptions,
        paymentTerms: body.paymentTerms,
        additionalNotes: body.additionalNotes,
        images: body.images,
        image: body.image
      }
    });

    // Verify user authentication
    const authHeader = request.headers.get('authorization');
    console.log('🔐 Auth header:', authHeader ? 'present' : 'missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth header provided');
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔐 Token extracted:', token ? 'yes' : 'no');
    
    // Verify JWT token (production practice)
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Validate that userId exists in the token
      if (!decoded.userId) {
        console.log('❌ Token missing userId');
        return NextResponse.json(
          { message: "Invalid token: missing user ID" },
          { status: 401 }
        );
      }
      
      console.log('✅ Token verified for user:', decoded.userId);
    } catch (error) {
      console.log('❌ Invalid token:', error);
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    // Verify user owns this product (authorization check)
    try {
      const productOwnershipCheck = await db
        .select({ sellerId: productsTable.sellerId })
        .from(productsTable)
        .where(eq(productsTable.id, productId))
        .limit(1);
      
      if (productOwnershipCheck.length === 0) {
        console.log('❌ Product not found:', productId);
        return NextResponse.json(
          { message: "Product not found" },
          { status: 404 }
        );
      }
      
      if (productOwnershipCheck[0].sellerId !== decoded.userId) {
        console.log('❌ User does not own this product:', {
          userId: decoded.userId,
          productSellerId: productOwnershipCheck[0].sellerId
        });
        return NextResponse.json(
          { message: "Unauthorized: You can only update your own products" },
          { status: 403 }
        );
      }
      
      console.log('✅ User authorized to update product');
    } catch (error) {
      console.error('❌ Error checking product ownership:', error);
      return NextResponse.json(
        { message: "Internal server error" },
        { status: 500 }
      );
    }

    // Start a transaction to update all related tables
    console.log('🔄 Starting database updates...');

    // Helper function to convert empty strings to null for database storage
    const toDbValue = (value: any) => {
      if (value === '' || value === null || value === undefined) {
        return null;
      }
      // Convert string numbers to actual numbers for numeric fields
      if (typeof value === 'string' && !isNaN(Number(value))) {
        return Number(value);
      }
      return value;
    };
    

    // Convert delivery option names to UUIDs for main products table
    let deliveryOptionUuids: string[] = [];
    if (body.deliveryOptions && body.deliveryOptions.length > 0) {
      try {
        console.log('🔄 Converting delivery options to UUIDs:', body.deliveryOptions);
        
        // Get standard delivery option UUIDs
        const standardDeliveryResults = await db
          .select({ id: deliveryOptionsTable.id, name: deliveryOptionsTable.name })
          .from(deliveryOptionsTable)
          .where(inArray(deliveryOptionsTable.name, body.deliveryOptions));
        
        console.log('📦 Standard delivery options found:', standardDeliveryResults);
        
        // Get custom delivery option UUIDs for this seller
        const customDeliveryResults = await db
          .select({ id: sellerCustomDeliveryOptions.id, name: sellerCustomDeliveryOptions.name })
          .from(sellerCustomDeliveryOptions)
          .where(and(
            eq(sellerCustomDeliveryOptions.sellerId, decoded.userId),
            inArray(sellerCustomDeliveryOptions.name, body.deliveryOptions)
          ));
        
        console.log('🔧 Custom delivery options found:', customDeliveryResults);
        
        // Combine both results
        deliveryOptionUuids = [
          ...standardDeliveryResults.map(r => r.id),
          ...customDeliveryResults.map(r => r.id)
        ];
        
        console.log('✅ Final delivery option UUIDs:', deliveryOptionUuids);
      } catch (error) {
        console.error('❌ Error converting delivery options to UUIDs:', error);
        // Continue with empty array rather than failing
        deliveryOptionUuids = [];
      }
    }
    
    // Convert payment term names to UUIDs for main products table
    let paymentTermUuids: string[] = [];
    if (body.paymentTerms && body.paymentTerms.length > 0) {
      try {
        console.log('🔄 Converting payment terms to UUIDs:', body.paymentTerms);
        
        // Get standard payment term UUIDs
        const standardPaymentResults = await db
          .select({ id: paymentTermsTable.id, name: paymentTermsTable.name })
          .from(paymentTermsTable)
          .where(inArray(paymentTermsTable.name, body.paymentTerms));
        
        console.log('💳 Standard payment terms found:', standardPaymentResults);
        
        // Get custom payment term UUIDs for this seller
        const customPaymentResults = await db
          .select({ id: sellerCustomPaymentTerms.id, name: sellerCustomPaymentTerms.name })
          .from(sellerCustomPaymentTerms)
          .where(and(
            eq(sellerCustomPaymentTerms.sellerId, decoded.userId),
            inArray(sellerCustomPaymentTerms.name, body.paymentTerms)
          ));
        
        console.log('🔧 Custom payment terms found:', customPaymentResults);
        
        // Combine both results
        paymentTermUuids = [
          ...standardPaymentResults.map(r => r.id),
          ...customPaymentResults.map(r => r.id)
        ];
        
        console.log('✅ Final payment term UUIDs:', paymentTermUuids);
      } catch (error) {
        console.error('❌ Error converting payment terms to UUIDs:', error);
        // Continue with empty array rather than failing
        paymentTermUuids = [];
      }
    }

    // Update main product table
    let updatedProduct;
    try {
      // For availableStock, keep as string (text field in DB) - don't convert to number
      const availableStockValue = body.availableQuantity === '' || body.availableQuantity === null || body.availableQuantity === undefined
        ? null
        : String(body.availableQuantity);
      console.log('📊 Available stock value conversion:', {
        input: body.availableQuantity,
        inputType: typeof body.availableQuantity,
        converted: availableStockValue,
        convertedType: typeof availableStockValue
      });
      
      // Handle empty arrays - use empty array instead of null for PostgreSQL UUID arrays
      // PostgreSQL UUID array columns work better with empty arrays than null
      const deliveryOptionsValue = deliveryOptionUuids.length > 0 ? deliveryOptionUuids : [];
      const paymentTermsValue = paymentTermUuids.length > 0 ? paymentTermUuids : [];
      
      console.log('📊 Values for SQL update:', {
        deliveryOptionsValue,
        deliveryOptionsLength: deliveryOptionsValue.length,
        paymentTermsValue,
        paymentTermsLength: paymentTermsValue.length,
        availableStockValue,
        availableStockType: typeof availableStockValue
      });
      
      // Use drizzle ORM update instead of raw SQL for better type handling
      try {
        const updateData: any = {
          name: body.name || '',
          description: body.description || '',
          price: body.price || 0,
          quantity: toDbValue(body.quantity),
          quantityUnit: toDbValue(body.quantityUnit),
          packaging: toDbValue(body.packaging),
          availableStock: availableStockValue,
          minimumOrder: toDbValue(body.minimumOrder),
          deliveryOptions: deliveryOptionsValue.length > 0 ? deliveryOptionsValue : null,
          paymentTerms: paymentTermsValue.length > 0 ? paymentTermsValue : null,
          additionalNotes: toDbValue(body.additionalNotes),
          updatedAt: new Date()
        };
        
        console.log('📊 Update data prepared:', {
          ...updateData,
          deliveryOptionsLength: updateData.deliveryOptions?.length || 0,
          paymentTermsLength: updateData.paymentTerms?.length || 0
        });
        
        const updateResult = await db
          .update(productsTable)
          .set(updateData)
          .where(eq(productsTable.id, productId))
          .returning();
        
        if (!updateResult || updateResult.length === 0) {
          console.log('❌ Product update failed - no rows affected');
          return NextResponse.json(
            { message: "Product update failed - no rows affected" },
            { status: 500 }
          );
        }
        
        updatedProduct = updateResult;
        console.log('✅ Main product table updated successfully');
        console.log('📊 Updated product availableStock:', {
          availableStock: updatedProduct[0]?.availableStock,
          availableStockType: typeof updatedProduct[0]?.availableStock,
          productId: updatedProduct[0]?.id
        });
      } catch (dbError: any) {
        console.error('❌ Database update error:', dbError);
        throw dbError; // Re-throw to be caught by outer catch
      }
    } catch (error: any) {
      console.error('❌ Error updating main product table:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        hint: error?.hint,
        stack: error?.stack
      });
      return NextResponse.json(
        { 
          message: "Failed to update product",
          error: error?.message || 'Unknown error',
          code: error?.code,
          detail: error?.detail
        },
        { status: 500 }
      );
    }

    console.log('✅ Updated product:', updatedProduct[0] || 'No product returned');

    // Update pricing if provided (UPSERT - Insert or Update)
    if (body.price !== undefined && body.price !== null) {
      const pricingResult = await sql`
        INSERT INTO product_pricing ("productId", price, unit, "createdAt", "updatedAt")
        VALUES (${productId}, ${body.price}, ${body.unit || 'kg'}, NOW(), NOW())
        ON CONFLICT ("productId") 
        DO UPDATE SET
          price = ${body.price},
          unit = ${body.unit || 'kg'},
          "updatedAt" = NOW()
        RETURNING *
      `;
      console.log('✅ Updated pricing:', pricingResult[0]);
    }

    // Update inventory if provided (UPSERT - Insert or Update)
    if (body.availableQuantity || body.minimumOrder) {
      const inventoryResult = await sql`
        INSERT INTO product_inventory ("productId", "availableQuantity", "minimumOrder", "quantity", "createdAt", "updatedAt")
        VALUES (${productId}, ${body.availableQuantity || ''}, ${body.minimumOrder || ''}, ${body.availableQuantity || ''}, NOW(), NOW())
        ON CONFLICT ("productId") 
        DO UPDATE SET
          "availableQuantity" = ${body.availableQuantity || ''},
          "minimumOrder" = ${body.minimumOrder || ''},
          "quantity" = ${body.availableQuantity || ''},
          "updatedAt" = NOW()
        RETURNING *
      `;
      console.log('✅ Updated inventory:', inventoryResult[0]);
    }

    // Handle location data - find or create location and update product
    if (body.location || body.region) {
      console.log('📍 Processing location data:', { location: body.location, region: body.region });
      
      let locationId = null;
      
      if (body.location && body.region) {
        try {
          // First, try to find existing location using Drizzle ORM
          const existingLocation = await db
            .select({ id: locations.id })
            .from(locations)
            .where(and(eq(locations.city, body.location), eq(locations.region, body.region)))
            .limit(1);
          
          if (existingLocation.length > 0) {
            locationId = existingLocation[0].id;
            console.log('📍 Found existing location:', locationId);
          } else {
            // Create new location using Drizzle ORM
            const newLocation = await db
              .insert(locations)
              .values({
                city: body.location,
                region: body.region
              })
              .returning({ id: locations.id });
            locationId = newLocation[0].id;
            console.log('📍 Created new location:', locationId);
          }
        } catch (error) {
          console.error('❌ Error handling location:', error);
        }
      }
      
      // Update product's locationId using Drizzle ORM
      if (locationId) {
        const productLocationUpdate = await db
          .update(productsTable)
          .set({
            locationId: locationId,
            updatedAt: new Date()
          })
          .where(eq(productsTable.id, productId))
          .returning();
        console.log('✅ Updated product locationId:', productLocationUpdate[0]);
      }
      
      // Also update user profile location for consistency
      const productWithSeller = await sql`
        SELECT "sellerId" FROM products WHERE id = ${productId}
      `;

      if (productWithSeller.length > 0) {
        const sellerId = productWithSeller[0].sellerId;
        
        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];
        
        if (body.location) {
          updateFields.push('location = $' + (updateValues.length + 1));
          updateValues.push(body.location);
        }
        
        if (body.region) {
          updateFields.push('region = $' + (updateValues.length + 1));
          updateValues.push(body.region);
        }
        
        updateFields.push('"updatedAt" = NOW()');
        updateValues.push(sellerId);
        
        const query = `
          UPDATE user_profiles 
          SET ${updateFields.join(', ')}
          WHERE "userId" = $${updateValues.length}
          RETURNING *
        `;
        
        const profileResult = await sql.unsafe(query, updateValues);
        console.log('✅ Updated user profile:', profileResult[0]);
      }
    }

    // Update product images if provided (UPSERT - Insert or Update)
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      console.log('🖼️ Processing images array:', body.images.length, 'images');
      console.log('📊 First image preview:', body.images[0]?.substring(0, 50) + '...');
      console.log('🖼️ Image data preview:', body.images.map(img => ({
        length: img?.length || 0,
        isBase64: img?.startsWith('data:') || false,
        preview: img?.substring(0, 50) + '...' || 'null'
      })));
      
      try {
        // Delete existing images for this product
        console.log('🗑️ Deleting existing images for product:', productId);
        await db.delete(productImages).where(eq(productImages.productId, productId));
        console.log('✅ Deleted existing images');
        
        // Insert new images
        for (let i = 0; i < body.images.length; i++) {
          const imageUrl = body.images[i];
          if (imageUrl) {
            console.log(`🖼️ Processing image ${i + 1}:`, {
              length: imageUrl.length,
              isBase64: imageUrl.startsWith('data:'),
              preview: imageUrl.substring(0, 50) + '...'
            });
            
            try {
              // Check if image URL is too long (base64 images can be very large)
              if (imageUrl.length > 1000000) { // 1MB limit for base64
                console.log('⚠️ Image too large, skipping:', imageUrl.length, 'characters');
                continue;
              }
              
              console.log(`🔍 About to upload image ${i + 1} to S3 with ${imageUrl.length} characters`);
              
              // Upload to S3 if it's base64 data
              if (imageUrl.startsWith('data:')) {
                console.log(`📤 Uploading image ${i + 1} to S3 (base64 length: ${imageUrl.length})`);
                const uploadedFile = await uploadBase64Image(
                  imageUrl, 
                  'products', 
                  `product-${productId}-${i + 1}.jpg`
                );
                console.log(`✅ S3 upload successful:`, uploadedFile);
                
                // Use Drizzle insert with S3 key
                const insertResult = await db.insert(productImages).values({
                  productId: productId,
                  imageData: uploadedFile.filepath, // S3 key
                  isPrimary: i === 0,
                }).returning();
                console.log(`✅ Uploaded and inserted image ${i + 1} with S3 key:`, uploadedFile.filepath);
              } else {
                // If it's already an S3 key or URL, store it directly
                const insertResult = await db.insert(productImages).values({
                  productId: productId,
                  imageData: imageUrl,
                  isPrimary: i === 0,
                }).returning();
                console.log(`✅ Inserted image ${i + 1} with ID:`, insertResult[0]?.id);
              }
            } catch (imageError) {
              console.error(`❌ Failed to upload/insert image ${i + 1}:`, imageError);
              // Continue with other images even if one fails
            }
          }
        }
        console.log('✅ Updated product images:', body.images.length, 'images');
        
        // Verify images were actually saved
        const verifyImages = await db.select({ count: sql<number>`count(*)` })
          .from(productImages)
          .where(eq(productImages.productId, productId));
        console.log('🔍 Verification - Images in database:', verifyImages[0]?.count || 0);
      } catch (imageUpdateError) {
        console.error('❌ Failed to update product images:', imageUpdateError);
        // Don't throw error, continue with other updates
      }
    } else if (body.image) {
      console.log('🖼️ Processing single image (legacy)');
      
      // Handle single image (legacy support)
      try {
        // Check if image URL is too long
        if (body.image.length > 1000000) { // 1MB limit for base64
          console.log('⚠️ Single image too large, skipping:', body.image.length, 'characters');
        } else {
          // Delete existing images
          await sql`DELETE FROM product_images WHERE "productId" = ${productId}`;
          
          // Upload to S3 if it's base64 data
          if (body.image.startsWith('data:')) {
            const uploadedFile = await uploadBase64Image(
              body.image, 
              'products', 
              `product-${productId}.jpg`
            );
            
            await sql`
              INSERT INTO product_images ("productId", "imageData", "isPrimary", "createdAt")
              VALUES (${productId}, ${uploadedFile.filepath}, true, NOW())
            `;
            console.log('✅ Updated product image (legacy) with S3 key:', uploadedFile.filepath);
          } else {
            // If it's already an S3 key or URL, store it directly
            await sql`
              INSERT INTO product_images ("productId", "imageData", "isPrimary", "createdAt")
              VALUES (${productId}, ${body.image}, true, NOW())
            `;
            console.log('✅ Updated product image (legacy)');
          }
        }
      } catch (imageError) {
        console.error('❌ Failed to upload/insert single image:', imageError);
        // Don't fail the entire request if image insertion fails
      }
    }

    // Update product delivery information if provided - save directly to products table
    // Note: This is a duplicate update - the main SQL update above already handles these fields
    // Keeping this for backward compatibility but it should not be necessary
    if (body.deliveryOptions || body.paymentTerms || body.additionalNotes !== undefined) {
      console.log('🔄 Updating product delivery options and payment terms in products table (duplicate update)');
      
      // Handle empty arrays - convert to null for database
      const deliveryOptionsForUpdate = deliveryOptionUuids.length > 0 ? deliveryOptionUuids : null;
      const paymentTermsForUpdate = paymentTermUuids.length > 0 ? paymentTermUuids : null;
      
      try {
        // Update the products table directly with the UUIDs
        const updateResult = await db
          .update(productsTable)
          .set({
            deliveryOptions: deliveryOptionsForUpdate,
            paymentTerms: paymentTermsForUpdate,
            additionalNotes: toDbValue(body.additionalNotes),
            updatedAt: new Date()
          })
          .where(eq(productsTable.id, productId))
          .returning();
        
        console.log('✅ Updated product delivery options and payment terms:', updateResult[0]);
      } catch (error: any) {
        console.error('❌ Error in duplicate update (non-critical):', error);
        // Don't fail the entire request - the main update already handled this
      }
    }

    console.log('✅ Product update completed successfully');

    // Get the updated product with images for response
    const updatedProductWithImages = await sql`
      SELECT "imageData", "isPrimary", "createdAt"
      FROM product_images 
      WHERE "productId" = ${productId}
      ORDER BY "createdAt" ASC
    `;

    if (!updatedProduct || updatedProduct.length === 0) {
      console.error('❌ No product returned from update');
      return NextResponse.json(
        { message: "Product update completed but no product data returned" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: "Product updated successfully",
      product: updatedProduct[0],
      updated: true,
      imagesProcessed: {
        imagesReceived: body.images?.length || 0,
        imageReceived: body.image ? 1 : 0,
        imagesSaved: updatedProductWithImages.length,
        imageDetails: updatedProductWithImages
      }
    });
  } catch (error: any) {
    console.error("❌ Error updating product:", error);
    console.error("❌ Error details:", {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint,
      name: error?.name,
      toString: String(error)
    });
    
    // Ensure we always return a valid error message
    const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
    const errorCode = error?.code || 'UNKNOWN_ERROR';
    
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: errorMessage,
        code: errorCode,
        detail: error?.detail || null,
        hint: error?.hint || null
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🗑️ DELETE /api/products/[id] - Request received');
  try {
    const { id: productId } = await params;
    console.log('📝 Product ID from params:', productId);

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log('🔐 Token received:', token ? 'present' : 'missing');

    // Verify JWT token
    let decodedToken;
    try {
      if (process.env.NODE_ENV === 'development') {
        // For development, allow any token
        decodedToken = { userId: 'dev-user' };
        console.log('🔧 Development mode - bypassing JWT verification');
      } else {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
        console.log('✅ JWT token verified:', { userId: decodedToken.userId });
      }
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError);
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    // First, check if the product exists and get the seller ID
    const productCheck = await db
      .select({ sellerId: productsTable.sellerId })
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (productCheck.length === 0) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    const productSellerId = productCheck[0].sellerId;

    // In development mode, allow deletion of any product
    // In production, verify that the user owns the product
    if (process.env.NODE_ENV !== 'development') {
      if (decodedToken.userId !== productSellerId) {
        return NextResponse.json(
          { message: "Unauthorized - you can only delete your own products" },
          { status: 403 }
        );
      }
    }

    console.log('🗑️ Deleting product and related data:', productId);

    // Delete related data first (due to foreign key constraints)
    // In normalized structure, we only need to delete product_images
    // Other data is stored directly in the products table
    await db.delete(productImages).where(eq(productImages.productId, productId));
    console.log('✅ Deleted product images');

    // Delete the product itself (this will cascade delete related data)
    const deleteResult = await db.delete(productsTable)
      .where(eq(productsTable.id, productId))
      .returning({
        id: productsTable.id,
        name: productsTable.name
      });

    if (deleteResult.length === 0) {
      return NextResponse.json(
        { message: "Product not found or already deleted" },
        { status: 404 }
      );
    }

    console.log('✅ Product deleted successfully:', deleteResult[0]);

    return NextResponse.json({
      message: "Product deleted successfully",
      deletedProduct: deleteResult[0]
    });

  } catch (error: any) {
    console.error("❌ Error deleting product:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error.message,
        details: {
          code: error.code,
          detail: error.detail,
          hint: error.hint
        }
      },
      { status: 500 }
    );
  }
}
