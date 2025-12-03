import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';
import { 
  products as productsTable, 
  users,
  userProfiles,
  userVerification,
  userRatings,
  categories
} from '@/lib/db/schema';
import { eq, and, sql, ne } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    console.log('🔍 Price Comparison API - Fetching price data for product:', productId);

    // Get the current product details first
    const currentProductResult = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        category: categories.name,
        createdAt: productsTable.createdAt,
        price: productsTable.price,
        quantity: productsTable.quantity,
        quantityUnit: productsTable.quantityUnit,
        packaging: productsTable.packaging,
      })
      .from(productsTable)
      .leftJoin(categories, eq(productsTable.categoryId, categories.id))
      .where(and(eq(productsTable.id, productId), eq(productsTable.isActive, true)))
      .limit(1);

    if (currentProductResult.length === 0) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    const product = currentProductResult[0];

    // Get all products with pricing data using our current schema
    const allProductsWithPricing = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        createdAt: productsTable.createdAt,
        price: productsTable.price,
        quantity: productsTable.quantity,
        quantityUnit: productsTable.quantityUnit,
        packaging: productsTable.packaging,
        availableStock: productsTable.availableStock,
        minimumOrder: productsTable.minimumOrder,
        sellerId: users.id,
        sellerName: users.name,
        sellerType: users.userType,
        location: sql<string>`CASE 
          WHEN seller_locations.city IS NOT NULL AND seller_locations.region IS NOT NULL THEN seller_locations.city || ', ' || seller_locations.region
          WHEN seller_locations.city IS NOT NULL THEN seller_locations.city
          ELSE 'Myanmar'
        END`,
        profileImage: userProfiles.profileImage,
        verified: userVerification.verified,
        phoneVerified: userVerification.phoneVerified,
        verificationStatus: userVerification.verificationStatus,
        rating: userRatings.rating,
        totalReviews: userRatings.totalReviews,
      })
      .from(productsTable)
      .leftJoin(users, eq(productsTable.sellerId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .leftJoin(sql`locations seller_locations`, eq(userProfiles.locationId, sql`seller_locations.id`))
      .leftJoin(userVerification, eq(users.id, userVerification.userId))
      .leftJoin(userRatings, eq(users.id, userRatings.userId))
      .where(and(
        eq(productsTable.isActive, true),
        ne(productsTable.id, productId),
        sql`${productsTable.price} IS NOT NULL`
      ))
      .orderBy(productsTable.price);

    // Filter products with similar names using JavaScript (more reliable)
    const searchTerm = product.name.toLowerCase();
    const priceComparisonData = allProductsWithPricing.filter(item => {
      const itemName = item.name.toLowerCase();
      
      // Exact match
      if (itemName === searchTerm) return true;
      
      // One contains the other
      if (itemName.includes(searchTerm) || searchTerm.includes(itemName)) return true;
      
      // Check for meaningful word matches (exclude common words like "fresh", "organic", "premium")
      const commonWords = ['fresh', 'organic', 'premium', 'quality', 'grade', 'a', 'the', 'and', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by'];
      const searchWords = searchTerm.split(' ').filter((word: string) => word.length > 2 && !commonWords.includes(word));
      const itemWords = itemName.split(' ').filter((word: string) => word.length > 2 && !commonWords.includes(word));
      
      // Must have at least one meaningful word in common
      const hasCommonWords = searchWords.some((searchWord: string) => 
        itemWords.some((itemWord: string) => 
          searchWord.includes(itemWord) || itemWord.includes(searchWord)
        )
      );
      
      return hasCommonWords;
    });

    console.log('📊 Price Comparison API - Total products with pricing:', allProductsWithPricing.length);
    console.log('📊 Price Comparison API - Found', priceComparisonData.length, 'similar products');
    console.log('🔍 Search product name:', product.name);
    console.log('🔍 Search term:', searchTerm);
    console.log('🔍 All product names:', allProductsWithPricing.map(p => p.name));
    console.log('🔍 Found products:', priceComparisonData.map(p => ({ id: p.id, name: p.name, seller: p.seller_name, price: p.price })));

    // Helper function to convert price to per kg using new field structure
    const convertToPerKg = (price: number, quantity: number, quantityUnit: string, packaging: string) => {
      if (!quantity || !quantityUnit) return { pricePerKg: price, conversionFactor: 1 };
      
      const unitLower = quantityUnit.toLowerCase();
      const totalQuantity = quantity; // This is already the total quantity
      
      // Convert to kg based on quantity unit
      let kgAmount = totalQuantity;
      
      if (unitLower === 'g' || unitLower === 'gram') {
        kgAmount = totalQuantity / 1000; // Convert grams to kg
      } else if (unitLower === 'lb' || unitLower === 'pound') {
        kgAmount = totalQuantity * 0.453592; // Convert pounds to kg
      } else if (unitLower === 'tons' || unitLower === 'ton') {
        kgAmount = totalQuantity * 1000; // Convert tons to kg
      } else if (unitLower === 'kg' || unitLower === 'kilogram') {
        kgAmount = totalQuantity; // Already in kg
      } else {
        // For other units, assume 1:1 conversion
        kgAmount = totalQuantity;
      }
      
      return { 
        pricePerKg: kgAmount > 0 ? price / kgAmount : price, 
        conversionFactor: kgAmount 
      };
    };

    // Convert all prices to per kg for comparison
    const dataWithPerKgPrices = priceComparisonData.map(item => {
      const originalPrice = parseFloat(item.price) || 0;
      const { pricePerKg, conversionFactor } = convertToPerKg(
        originalPrice, 
        item.quantity || 1, 
        item.quantityUnit || 'kg', 
        item.packaging || 'bag'
      );
      
      // Create display unit from new fields without / separator
      const displayUnit = item.packaging 
        ? `${item.quantity || 1}${item.quantityUnit || 'kg'} ${item.packaging}`
        : `${item.quantity || 1}${item.quantityUnit || 'kg'}`;
      
      return {
        ...item,
        originalPrice,
        pricePerKg,
        conversionFactor,
        displayUnit
      };
    });

    // Sort by per kg price for comparison
    const sortedByPerKg = dataWithPerKgPrices.sort((a, b) => a.pricePerKg - b.pricePerKg);

    // Transform the data to match PriceComparison component expectations
    const transformedData = sortedByPerKg.map(item => ({
      id: item.id,
      name: item.name, // Full product name
      sellerName: item.sellerName || 'Unknown Seller',
      sellerType: item.sellerType || 'farmer',
      price: item.pricePerKg, // Use converted per kg price for comparison
      originalPrice: item.originalPrice, // Keep original price for display
      unit: 'kg', // Standardized to kg for comparison
      originalUnit: item.displayUnit, // Keep original unit for display
      displayUnit: item.displayUnit, // Calculated display unit
      conversionFactor: item.conversionFactor,
      location: item.location || 'Unknown Location',
      quantity: item.availableStock || item.minimumOrder || 'Inquire for quantity',
      availableQuantity: item.availableStock,
      minimumOrder: item.minimumOrder,
      lastUpdated: item.createdAt,
      seller: {
        id: item.sellerId,
        name: item.sellerName,
        userType: item.sellerType,
        location: item.location,
        profileImage: item.profileImage,
        verified: item.verified,
        phoneVerified: item.phoneVerified,
        verificationStatus: item.verificationStatus,
        rating: parseFloat(item.rating) || 0,
        totalReviews: item.totalReviews || 0,
      }
    }));

    // Calculate price range from converted prices
    const prices = transformedData.map(item => item.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Also convert current product to per kg for comparison
    const currentProductOriginalPrice = parseFloat(product.price) || 0;
    const { pricePerKg: currentProductPerKg } = convertToPerKg(
      currentProductOriginalPrice, 
      product.quantity || 1, 
      product.quantityUnit || 'kg', 
      product.packaging || 'bag'
    );

    // Create display unit for current product without / separator
    const currentProductDisplayUnit = product.packaging 
      ? `${product.quantity || 1}${product.quantityUnit || 'kg'} ${product.packaging}`
      : `${product.quantity || 1}${product.quantityUnit || 'kg'}`;

    return NextResponse.json({
      productName: product.name,
      unit: 'kg', // Standardized unit for comparison
      originalUnit: currentProductDisplayUnit, // Keep original unit
      priceRange: {
        min: minPrice,
        max: maxPrice,
        currency: 'MMK'
      },
      currentProduct: {
        id: product.id,
        price: currentProductPerKg, // Converted to per kg
        originalPrice: currentProductOriginalPrice,
        unit: 'kg',
        originalUnit: currentProductDisplayUnit
      },
      priceData: transformedData,
      message: 'Price comparison data fetched successfully with per kg conversion'
    });

  } catch (error: any) {
    console.error("❌ Price Comparison API Error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
