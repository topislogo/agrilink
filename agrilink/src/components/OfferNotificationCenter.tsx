'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, CheckCircle, XCircle, Clock, FileText, Truck } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';

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
}

export function OfferNotificationCenter({ userId }: OfferNotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const hasAutoMarkedRef = useRef(false);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
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

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (title: string) => {
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
  );
}
