'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, CheckCircle, XCircle, Clock, FileText, Truck, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ChatInterface } from './ChatInterface';
import { useAuth } from '../hooks/useAuth';

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

interface OfferNotificationCenterProps {
  userId: string;
  currentUser?: any; // Pass currentUser as prop instead of using useAuth
}

export function OfferNotificationCenter({ userId, currentUser: propCurrentUser }: OfferNotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const hasAutoMarkedRef = useRef(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [chatData, setChatData] = useState<any>(null);
  const { user: authUser } = useAuth();
  
  // Use prop currentUser if available, otherwise fallback to authUser
  const currentUser = propCurrentUser || authUser;
  
  // Debug chat popup state
  useEffect(() => {
    if (showChatPopup) {
      console.log('🔔 Chat popup state:', {
        showChatPopup,
        hasChatData: !!chatData,
        hasCurrentUser: !!currentUser,
        hasPropUser: !!propCurrentUser,
        hasAuthUser: !!authUser
      });
    }
  }, [showChatPopup, chatData, currentUser, propCurrentUser, authUser]);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      
      // Set up polling to check for new notifications every 5 seconds
      const pollInterval = setInterval(() => {
        fetchNotifications();
      }, 5000); // Poll every 5 seconds
      
      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [userId]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
      } else {
        console.error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications/read-all?userId=${userId}`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      } else {
        console.error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userId]);

  // Auto-mark all as read when notification center is opened (only once per open)
  useEffect(() => {
    if (isOpen && unreadCount > 0 && !hasAutoMarkedRef.current) {
      hasAutoMarkedRef.current = true;
      markAllAsRead();
    }
    // Reset the flag when the popover closes
    if (!isOpen) {
      hasAutoMarkedRef.current = false;
    }
  }, [isOpen, unreadCount, markAllAsRead]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Check if this is a chat message notification
    if (notification.link && notification.link.includes('/messages?conversation=')) {
      // Extract conversation ID from the link
      const conversationIdMatch = notification.link.match(/conversation=([^&]+)/);
      const conversationId = conversationIdMatch ? conversationIdMatch[1] : null;
      
      if (conversationId) {
        try {
          // Fetch conversation details to get product and other party info
          const response = await fetch(`/api/chat/conversations`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const conversation = data.conversations?.find((c: any) => c.id === conversationId);
            
            if (conversation && conversation.otherParty) {
              // Open popup immediately with conversation data (instant)
              const initialChatData = {
                conversationId: conversationId,
                otherPartyId: conversation.otherParty.id,
                otherPartyName: conversation.otherParty.name,
                otherPartyType: conversation.otherParty.type,
                otherPartyAccountType: conversation.otherParty.accountType || 'individual',
                otherPartyLocation: conversation.otherParty.location || '',
                otherPartyRating: conversation.otherParty.rating || 0,
                otherPartyVerified: conversation.otherParty.verified || false,
                otherPartyProfileImage: conversation.otherParty.profileImage, // Use from conversation first
                otherPartyVerificationStatus: {
                  trustLevel: conversation.otherParty.verified 
                    ? (conversation.otherParty.accountType === 'business' ? 'business-verified' : 'id-verified')
                    : 'unverified',
                  tierLabel: conversation.otherParty.verified 
                    ? (conversation.otherParty.accountType === 'business' ? 'Business ✓' : 'Verified')
                    : 'Unverified',
                  levelBadge: conversation.otherParty.verified ? '✓' : '⚠'
                },
                productId: conversation.productId,
                productName: conversation.productName,
                productImage: conversation.productImage,
                productPrice: 0,
                productUnit: 'units',
                productAvailableQuantity: '0'
              };
              
              // Open popup immediately (no waiting)
              setChatData(initialChatData);
              setShowChatPopup(true);
              setIsOpen(false);
              
              // Fetch additional data in parallel (non-blocking, updates in background)
              Promise.all([
                // Fetch other party's full profile to get better profile image
                (async () => {
                  try {
                    const profileRoute = (conversation.otherParty.type === 'farmer' || conversation.otherParty.type === 'trader')
                      ? `/api/seller/${conversation.otherParty.id}`
                      : `/api/user/${conversation.otherParty.id}`;
                    
                    const profileResponse = await fetch(profileRoute);
                    if (profileResponse.ok) {
                      return await profileResponse.json();
                    }
                  } catch (error) {
                    console.error('Error fetching other party profile:', error);
                  }
                  return null;
                })(),
                // Fetch product details
                (async () => {
                  try {
                    const productResponse = await fetch(`/api/products/${conversation.productId}`);
                    if (productResponse.ok) {
                      const productData = await productResponse.json();
                      return productData.product;
                    }
                  } catch (error) {
                    console.error('Error fetching product details:', error);
                  }
                  return null;
                })()
              ]).then(([otherPartyFullData, productDetails]) => {
                // Update chat data with fetched information (always update, even if popup closed)
                if (otherPartyFullData || productDetails) {
                  setChatData(prev => {
                    if (!prev) return prev; // Don't update if chat data was cleared
                    return {
                      ...prev,
                      otherPartyRating: otherPartyFullData?.ratings?.rating || prev.otherPartyRating,
                      otherPartyVerified: otherPartyFullData?.verified ?? prev.otherPartyVerified,
                      otherPartyProfileImage: otherPartyFullData?.profileImage || otherPartyFullData?.seller?.profileImage || prev.otherPartyProfileImage,
                      productPrice: productDetails?.price || prev.productPrice,
                      productUnit: productDetails?.quantityUnit || prev.productUnit,
                      productAvailableQuantity: productDetails?.availableQuantity || prev.productAvailableQuantity
                    };
                  });
                }
              });
              
              return; // Don't navigate, we're opening popup instead
            }
          }
        } catch (error) {
          console.error('Error fetching conversation details:', error);
          // Fallback to navigation if fetch fails
        }
      }
    }
    
    // For other notification types or if chat popup failed, navigate normally
    if (notification.link) {
      window.location.href = notification.link;
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (title: string) => {
    if (title.includes('New Message')) return <MessageSquare className="w-4 h-4 text-blue-500" />;
    if (title.includes('Accepted')) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (title.includes('Rejected')) return <XCircle className="w-4 h-4 text-red-500" />;
    if (title.includes('Expired')) return <Clock className="w-4 h-4 text-yellow-500" />;
    if (title.includes('New Offer')) return <FileText className="w-4 h-4 text-blue-500" />;
    if (title.includes('Shipped')) return <Truck className="w-4 h-4 text-blue-500" />;
    if (title.includes('Delivered')) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (title.includes('Completed')) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (title.includes('Cancelled')) return <XCircle className="w-4 h-4 text-red-500" />;
    return <Bell className="w-4 h-4 text-gray-500" />;
  };

  return (
    <>
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium text-sm">Offer Notifications</h4>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No notifications yet</p>
              <p className="text-xs text-gray-400">You'll see offer updates here</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.title)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.body}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
    
    {/* Chat Popup */}
    {showChatPopup && chatData && (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200">
          {currentUser ? (
            <ChatInterface
            otherPartyName={chatData.otherPartyName}
            otherPartyType={chatData.otherPartyType}
            otherPartyAccountType={chatData.otherPartyAccountType}
            otherPartyLocation={chatData.otherPartyLocation}
            otherPartyRating={chatData.otherPartyRating}
            productName={chatData.productName}
            productId={chatData.productId}
            otherPartyId={chatData.otherPartyId}
            conversationId={chatData.conversationId}
            onClose={() => {
              setShowChatPopup(false);
              setChatData(null);
            }}
            otherPartyVerified={chatData.otherPartyVerified}
            currentUserVerified={currentUser.verified || false}
            currentUserType={currentUser.userType || 'buyer'}
            otherPartyProfileImage={chatData.otherPartyProfileImage}
            otherPartyVerificationStatus={chatData.otherPartyVerificationStatus}
            product={{
              id: chatData.productId,
              name: chatData.productName,
              price: chatData.productPrice || 0,
              unit: chatData.productUnit || 'units',
              image: chatData.productImage,
              sellerId: chatData.otherPartyId,
              availableQuantity: chatData.productAvailableQuantity || '0'
            }}
            currentUser={currentUser}
          />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-500">Loading user data...</p>
            </div>
          )}
        </div>
      </div>
    )}
  </>
  );
}
