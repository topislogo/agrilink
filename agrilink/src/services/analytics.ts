// Analytics service for tracking and retrieving real dashboard data
// Note: This is a simplified version for Next.js + Neon setup

export interface UserAnalytics {
  monthlyInquiries: number;
  monthlyProfileViews: number;
  monthlyProductViews: number;
  totalInquiries: number;
  totalProfileViews: number;
  totalProductViews: number;
  conversionRate: number;
  topProducts: any[];
  recentActivity: any[];
}

export const analyticsAPI = {
  async trackProfileView(sellerId: string, viewerId?: string) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          eventType: 'profile_view',
          targetId: sellerId,
          metadata: viewerId ? { viewerId } : null
        })
      });

      if (!response.ok) {
        console.error('Failed to track profile view:', response.status);
        return { success: false };
      }

      const data = await response.json();
      return { success: true, event: data.event };
    } catch (error) {
      console.error('Error tracking profile view:', error);
      return { success: false };
    }
  },
  
  async trackProductView(productId: string, viewerId?: string) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          eventType: 'product_view',
          targetId: productId,
          metadata: viewerId ? { viewerId } : null
        })
      });

      if (!response.ok) {
        console.error('Failed to track product view:', response.status);
        return { success: false };
      }

      const data = await response.json();
      return { success: true, event: data.event };
    } catch (error) {
      console.error('Error tracking product view:', error);
      return { success: false };
    }
  },
  
  async trackInquiry(sellerId: string, productId: string, buyerId: string) {
    // Inquiries are automatically tracked via conversations table
    // This function is kept for API compatibility but doesn't need to do anything
    console.log(`📊 Inquiry tracked via conversation for product ${productId} from buyer ${buyerId} to seller ${sellerId}`);
    return Promise.resolve({ success: true });
  },
  
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/analytics/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const data = await response.json();
      return {
        monthlyInquiries: data.monthlyInquiries || 0,
        monthlyProfileViews: data.monthlyProfileViews || 0,
        monthlyProductViews: data.monthlyProductViews || 0,
        totalInquiries: 0, // TODO: Add total counts if needed
        totalProfileViews: 0,
        totalProductViews: 0,
        conversionRate: 0,
        topProducts: [],
        recentActivity: []
      };
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      return {
        monthlyInquiries: 0,
        monthlyProfileViews: 0,
        monthlyProductViews: 0,
        totalInquiries: 0,
        totalProfileViews: 0,
        totalProductViews: 0,
        conversionRate: 0,
        topProducts: [],
        recentActivity: []
      };
    }
  }
};