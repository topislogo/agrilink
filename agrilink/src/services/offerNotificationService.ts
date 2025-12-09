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
    customMessage?: string,
    customLink?: string
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
        link: customLink || `/offers/${offerId}`,
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
          and(
            eq(notifications.userId, userId),
            eq(notifications.read, false)
          )
        );

      return unreadNotifications.length;
    } catch (error) {
      console.error('❌ Failed to get unread count:', error);
      return 0;
    }
  }

  // Find and update existing unread notification for a conversation (for grouping chat messages)
  async updateOrCreateChatNotification(
    userId: string,
    conversationId: string,
    senderName: string,
    productName: string,
    messagePreview: string
  ) {
    try {
      const conversationLink = `/messages?conversation=${conversationId}`;
      
      // Check if there's an existing unread notification for this conversation
      const existingNotification = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.read, false),
            eq(notifications.title, 'New Message'),
            eq(notifications.link, conversationLink)
          )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(1);

      if (existingNotification.length > 0) {
        // Update existing notification with new message preview and timestamp
        await db
          .update(notifications)
          .set({
            body: `${senderName} sent you a message about "${productName}": ${messagePreview}`,
            createdAt: new Date() // Update timestamp to show it's the latest
          })
          .where(eq(notifications.id, existingNotification[0].id));

        console.log(`🔄 Updated existing chat notification for conversation ${conversationId}`);
        return existingNotification[0].id;
      } else {
        // Create new notification if none exists
        const notificationId = crypto.randomUUID();
        await db.insert(notifications).values({
          id: notificationId,
          userId: userId,
          title: 'New Message',
          body: `${senderName} sent you a message about "${productName}": ${messagePreview}`,
          type: 'in-app',
          read: false,
          link: conversationLink,
          createdAt: new Date(),
        });

        console.log(`🔔 Created new chat notification for conversation ${conversationId}`);
        return notificationId;
      }
    } catch (error) {
      console.error('❌ Failed to update or create chat notification:', error);
      throw error;
    }
  }
}

export const offerNotificationService = new OfferNotificationService();
