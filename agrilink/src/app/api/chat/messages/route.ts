import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { messages as messagesTable, conversations as conversationsTable } from '@/lib/db/schema';
import { eq, and, desc, ne } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  try {
    // For development mode, allow any token
    if (process.env.NODE_ENV === 'development') {
      try {
        const user = jwt.verify(token, process.env.JWT_SECRET!) as any;
        return user;
      } catch (error) {
        // If token verification fails in development, return null to force re-authentication
        return null;
      }
    }
    
    return jwt.verify(token, process.env.JWT_SECRET!) as any;
  } catch (error: any) {
    return null;
  }
}

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
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Get messages for the conversation using Drizzle ORM
    const messages = await db
      .select({
        id: messagesTable.id,
        conversationId: messagesTable.conversationId,
        senderId: messagesTable.senderId,
        content: messagesTable.content,
        timestamp: messagesTable.createdAt,
        type: messagesTable.messageType,
        isRead: messagesTable.isRead
      })
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conversationId))
      .orderBy(messagesTable.createdAt);

    return NextResponse.json({
      messages: messages,
      message: 'Messages fetched successfully'
    });

  } catch (error: any) {
    console.error('Messages API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

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
    const { conversationId, content, senderId, type = 'text', offerDetails } = body;

    if (!conversationId || !content || !senderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert new message using Drizzle
    const [newMessage] = await db
      .insert(messagesTable)
      .values({
        conversationId,
        senderId,
        content,
        messageType: type,
        isRead: false
      })
      .returning();

    // Get conversation details to determine recipient
    const conversation = await db
      .select({
        buyerId: conversationsTable.buyerId,
        sellerId: conversationsTable.sellerId,
        unreadCount: conversationsTable.unreadCount
      })
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const conv = conversation[0];
    const recipientId = conv.buyerId === senderId ? conv.sellerId : conv.buyerId;
    const isRecipient = recipientId !== senderId;

    // Update conversation last message and unread count using Drizzle
    await db
      .update(conversationsTable)
      .set({
        lastMessage: content,
        lastMessageTime: new Date(),
        unreadCount: isRecipient ? (conv.unreadCount || 0) + 1 : conv.unreadCount || 0,
        updatedAt: new Date()
      })
      .where(eq(conversationsTable.id, conversationId));

    const message = {
      id: newMessage.id,
      conversationId: newMessage.conversationId,
      senderId: newMessage.senderId,
      content: newMessage.content,
      timestamp: newMessage.createdAt,
      type: newMessage.messageType,
      isRead: newMessage.isRead
    };

    return NextResponse.json({
      message: message,
      success: true
    });

  } catch (error: any) {
    console.error('Send message API error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// PATCH /api/chat/messages - Mark messages as read
export async function PATCH(request: NextRequest) {
  try {
    const user = verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId' },
        { status: 400 }
      );
    }

    // Mark all messages in the conversation as read for the current user
    // Only mark messages that are not from the current user as read
    await db
      .update(messagesTable)
      .set({ isRead: true })
      .where(
        and(
          eq(messagesTable.conversationId, conversationId),
          ne(messagesTable.senderId, user.id) // Only mark messages from other users as read
        )
      );

    // Reset unread count for the conversation
    await db
      .update(conversationsTable)
      .set({
        unreadCount: 0,
        updatedAt: new Date()
      })
      .where(eq(conversationsTable.id, conversationId));

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}