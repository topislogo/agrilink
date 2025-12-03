import { NextRequest, NextResponse } from 'next/server';
import { offerNotificationService } from '@/services/offerNotificationService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const notifications = await offerNotificationService.getUserNotifications(userId);
    
    return NextResponse.json({ 
      notifications,
      count: notifications.length 
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
