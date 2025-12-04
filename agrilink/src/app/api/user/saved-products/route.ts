import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { 
  savedProducts,
  products as productsTable,
  productImages,
  users,
  userProfiles
} from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded;
  } catch (error: any) {
    return null;
  }
}

// GET /api/user/saved-products - Get user's saved products
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.userId;

    console.log('🔍 Fetching saved products for userId:', userId);

    // Get saved products with product details using simplified structure
    const savedProductsResult = await db
      .select({
        id: savedProducts.id,
        productId: savedProducts.productId,
        createdAt: savedProducts.createdAt,
        productName: productsTable.name,
        description: productsTable.description,
        currentPrice: productsTable.price,
        quantity: productsTable.quantity,
        quantityUnit: productsTable.quantityUnit,
        packaging: productsTable.packaging,
        imageUrl: productImages.imageData,
        sellerId: users.id,
        sellerName: users.name,
        userType: users.userType,
        accountType: users.accountType,
        sellerLocation: userProfiles.phone, // Using phone as location placeholder
      })
      .from(savedProducts)
      .leftJoin(productsTable, eq(savedProducts.productId, productsTable.id))
      .leftJoin(productImages, and(eq(productImages.productId, productsTable.id), eq(productImages.isPrimary, true)))
      .leftJoin(users, eq(productsTable.sellerId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(savedProducts.userId, userId))
      .orderBy(desc(savedProducts.createdAt));

    console.log('✅ Found saved products:', savedProductsResult.length);

    return NextResponse.json({
      savedProducts: savedProductsResult.map(sp => ({
        id: sp.id,
        productId: sp.productId,
        createdAt: sp.createdAt,
        product: {
          id: sp.productId,
          name: sp.productName,
          description: sp.description,
          price: parseFloat(sp.currentPrice?.toString() || '0') || 0,
          unit: sp.quantity && sp.quantityUnit ? 
            `${sp.quantity}${sp.quantityUnit}${sp.packaging ? ` ${sp.packaging}` : ''}` : 
            'kg',
          imageUrl: sp.imageUrl,
          seller: {
            id: sp.sellerId,
            name: sp.sellerName,
            userType: sp.userType || 'farmer',
            accountType: sp.accountType || 'individual',
            location: sp.sellerLocation || 'Myanmar'
          }
        }
      }))
    });

  } catch (error: any) {
    console.error('Error fetching saved products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/user/saved-products - Save a product
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    console.log('💾 Saving product for user:', { userId: user.userId, productId });

    // Check if product exists
    const productResult = await db
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (productResult.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if already saved
    const existing = await db
      .select({ id: savedProducts.id })
      .from(savedProducts)
      .where(and(eq(savedProducts.userId, user.userId), eq(savedProducts.productId, productId)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Product already saved' },
        { status: 409 }
      );
    }

    // Save the product (simplified)
    const result = await db.insert(savedProducts).values({
      userId: user.userId,
      productId: productId,
    }).returning();

    console.log('✅ Product saved successfully');

    return NextResponse.json({
      message: 'Product saved successfully',
      savedProduct: result[0]
    });

  } catch (error: any) {
    console.error('Error saving product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/saved-products - Unsave a product
export async function DELETE(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Unsaving product for user:', { userId: user.userId, productId });

    // Remove the saved product
    const result = await db
      .delete(savedProducts)
      .where(and(eq(savedProducts.userId, user.userId), eq(savedProducts.productId, productId)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Saved product not found' },
        { status: 404 }
      );
    }

    console.log('✅ Product unsaved successfully');

    return NextResponse.json({
      message: 'Product unsaved successfully'
    });

  } catch (error: any) {
    console.error('Error unsaving product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
