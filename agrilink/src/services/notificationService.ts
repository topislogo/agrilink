// Cost-effective notification service for AgriLink
export interface NotificationPreferences {
  userId: string;
  sms: { enabled: boolean; types: string[] };
  push: { enabled: boolean; types: string[] };
  email: { enabled: boolean; types: string[] };
  "in-app": { enabled: boolean; types: string[] };
}

export interface Notification {
  id: string;
  userId: string;
  type: 'critical' | 'important' | 'regular' | 'bulk';
  channel: 'sms' | 'push' | 'email' | 'in-app';
  title: string;
  message: string;
  data?: any;
  createdAt: Date;
  sentAt?: Date;
  cost?: number;
  read?: boolean;
}

class NotificationService {
  private rateLimits = {
    sms: { max: 5, window: 3600000 }, // 5 per hour
    push: { max: 50, window: 3600000 }, // 50 per hour
    email: { max: 20, window: 86400000 }, // 20 per day
    "in-app": { max: 100, window: 3600000 } // 100 per hour
  };

  private costs = {
    sms: 0.0732, // Myanmar rate
    push: 0.000001, // Twilio SMS
    email: 0.0001, // AWS SES
    "in-app": 0 // Free
  };

  // Get user notification preferences
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    // In real app, fetch from database
    return {
      userId,
      sms: { enabled: true, types: ['security', 'payments'] },
      push: { enabled: true, types: ['messages', 'orders'] },
      email: { enabled: true, types: ['marketing', 'updates'] },
      "in-app": { enabled: true, types: ['all'] }
    };
  }

  // Send notification with cost optimization
  async sendNotification(
    userId: string,
    type: 'critical' | 'important' | 'regular' | 'bulk',
    title: string,
    message: string,
    data?: any
  ): Promise<Notification> {
    const preferences = await this.getUserPreferences(userId);
    const channel = this.selectOptimalChannel(type, preferences);
    
    // Check rate limits
    if (!(await this.checkRateLimit(userId, channel))) {
      console.log(`Rate limit exceeded for ${channel}, falling back to in-app`);
      return this.sendInAppNotification(userId, title, message, data);
    }

    // Send notification
    const notification = await this.deliverNotification(userId, channel, title, message, data);
    
    // Log cost for monitoring
    console.log(`📊 Notification sent via ${channel}, cost: $${this.costs[channel]}`);
    
    return notification;
  }

  // Select the most cost-effective channel
  private selectOptimalChannel(
    type: string,
    preferences: NotificationPreferences
  ): 'sms' | 'push' | 'email' | 'in-app' {
    // Critical notifications: SMS if enabled, otherwise push
    if (type === 'critical') {
      return preferences.sms.enabled ? 'sms' : 'push';
    }
    
    // Important notifications: Push if enabled, otherwise email
    if (type === 'important') {
      return preferences.push.enabled ? 'push' : 'email';
    }
    
    // Regular notifications: In-app if enabled, otherwise email
    if (type === 'regular') {
      return preferences["in-app"].enabled ? 'in-app' : 'email';
    }
    
    // Bulk notifications: Email if enabled, otherwise in-app
    if (type === 'bulk') {
      return preferences.email.enabled ? 'email' : 'in-app';
    }
    
    return 'in-app'; // Default fallback
  }

  // Check rate limits
  private async checkRateLimit(userId: string, channel: string): Promise<boolean> {
    // In real app, check against Redis or database
    // For now, always return true
    return true;
  }

  // Send in-app notification (free)
  private async sendInAppNotification(
    userId: string,
    title: string,
    message: string,
    data?: any
  ): Promise<Notification> {
    // Store in database
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'regular',
      channel: 'in-app',
      title,
      message,
      data,
      createdAt: new Date(),
      cost: 0
    };

    // In real app, save to database
    console.log(`💾 In-app notification stored: ${title}`);
    
    return notification;
  }

  // Deliver notification via selected channel
  private async deliverNotification(
    userId: string,
    channel: string,
    title: string,
    message: string,
    data?: any
  ): Promise<Notification> {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'regular',
      channel: channel as any,
      title,
      message,
      data,
      createdAt: new Date(),
      sentAt: new Date(),
      cost: this.costs[channel as keyof typeof this.costs]
    };

    // In real app, integrate with actual services
    switch (channel) {
      case 'sms':
        console.log(`📱 SMS sent to ${userId}: ${title}`);
        break;
      case 'push':
        console.log(`🔔 Push notification sent to ${userId}: ${title}`);
        break;
      case 'email':
        console.log(`📧 Email sent to ${userId}: ${title}`);
        break;
      case 'in-app':
        console.log(`💾 In-app notification stored for ${userId}: ${title}`);
        break;
    }

    return notification;
  }

  // Get notification costs for monitoring
  async getMonthlyCosts(userId: string): Promise<{ channel: string; count: number; cost: number }[]> {
    // In real app, query database for actual costs
    return [
      { channel: 'sms', count: 0, cost: 0 },
      { channel: 'push', count: 0, cost: 0 },
      { channel: 'email', count: 0, cost: 0 },
      { channel: 'in-app', count: 0, cost: 0 }
    ];
  }
}

export const notificationService = new NotificationService();
