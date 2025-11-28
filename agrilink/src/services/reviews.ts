// Reviews service for seller statistics
// Note: This is a simplified version for Next.js + Neon setup

export interface SellerStats {
  totalProducts: number;
  totalSales: number;
  averageRating: number;
  totalReviews: number;
  responseTime: string;
  completionRate: number;
  recentReviews: any[];
}

export class ReviewsService {
  static async getSellerStats(sellerId: string): Promise<SellerStats> {
    console.log(`📊 Getting seller stats for ${sellerId}`);
    
    try {
      // Fetch seller stats from the unified API
      const response = await fetch(`/api/user/${sellerId}/public`);

      if (response.ok) {
        const data = await response.json();
        // Transform the unified API response to match expected stats format
        const user = data.user;
        return {
          totalProducts: user.products?.length || 0,
          totalSales: 0, // TODO: Implement sales tracking
          averageRating: user.ratings?.rating || 0,
          totalReviews: user.ratings?.totalReviews || 0,
          responseTime: user.ratings?.responseTime || 'Within 24 hours',
          completionRate: 100, // TODO: Calculate based on profile completeness
          recentReviews: user.reviews || []
        };
      } else {
        console.warn('Failed to fetch seller stats, using defaults');
      }
    } catch (error) {
      console.error('Error fetching seller stats:', error);
    }

    // Fallback to default values if API fails
    return {
      totalProducts: 0,
      totalSales: 0,
      averageRating: 0,
      totalReviews: 0,
      responseTime: 'Within 24 hours',
      completionRate: 100,
      recentReviews: []
    };
  }
}