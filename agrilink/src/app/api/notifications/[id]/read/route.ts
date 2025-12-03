import { NextRequest, NextResponse } from 'next/server';
import { offerNotificationService } from '@/services/offerNotificationService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: notificationId } = await params;

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    await offerNotificationService.markAsRead(notificationId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}
