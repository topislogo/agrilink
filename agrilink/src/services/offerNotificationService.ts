// Offer Status Notification Service
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export interface OfferNotification {
  id: string;
  userId: string;
  offerId: string;
  title: string;
  message: string;
  type: 'offer_accepted' | 'offer_rejected' | 'offer_expired' | 'offer_created';
  read: boolean;
  createdAt: Date;
}

class OfferNotificationService {
  // Create notification for offer status change
  async createOfferNotification(
    userId: string,
    offerId: string,
    type: 'offer_accepted' | 'offer_rejected' | 'offer_expired' | 'offer_created',
    offerTitle: string,
    otherPartyName: string,
    customTitle?: string,
    customMessage?: string
  ) {
    const notificationId = crypto.randomUUID();
    
    let title = '';
    let message = '';
    
    // Use custom title and message if provided, otherwise use default logic
    if (customTitle && customMessage) {
      title = customTitle;
      message = customMessage;
    } else {
      switch (type) {
        case 'offer_accepted':
          title = 'Offer Accepted';
          message = `${otherPartyName} accepted your offer for "${offerTitle}"`;
          break;
        case 'offer_rejected':
          title = 'Offer Rejected';
          message = `${otherPartyName} rejected your offer for "${offerTitle}"`;
          break;
        case 'offer_expired':
          title = 'Offer Expired';
          message = `Your offer for "${offerTitle}" has expired`;
          break;
        case 'offer_created':
          title = 'New Offer Received';
          message = `${otherPartyName} sent you an offer for "${offerTitle}"`;
          break;
      }
    }

    try {
      await db.insert(notifications).values({
        id: notificationId,
        userId: userId,
        title: title,
        body: message,
        type: 'in-app',
        read: false,
        link: `/offers/${offerId}`,
        createdAt: new Date(),
      });

      console.log(`🔔 Offer notification created: ${type} for user ${userId}`);
      return notificationId;
    } catch (error) {
      console.error('❌ Failed to create offer notification:', error);
      throw error;
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId: string) {
    try {
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));

      return userNotifications;
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, notificationId));
      
      console.log(`✅ Notification ${notificationId} marked as read`);
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
    }
  }

  // Mark all unread notifications as read for a user
  async markAllAsRead(userId: string) {
    try {
      await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.read, false)
          )
        );
      
      console.log(`✅ All unread notifications marked as read for user ${userId}`);
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount(userId: string) {
    try {
      const unreadNotifications = await db
        .select()
        .from(notifications)
        .where(
          eq(notifications.userId, userId) && 
          eq(notifications.read, false)
        );

      return unreadNotifications.length;
    } catch (error) {
      console.error('❌ Failed to get unread count:', error);
      return 0;
    }
  }
}

export const offerNotificationService = new OfferNotificationService();
