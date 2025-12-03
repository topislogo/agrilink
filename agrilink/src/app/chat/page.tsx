'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  ArrowLeft, 
  User, 
  CheckCircle,
  Package,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

interface UserData {
  id: string;
  name: string;
  email: string;
  userType: string;
  accountType: string;
  location: string;
  verified: boolean;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  productId: string;
  productName: string;
  otherPartyName: string;
  otherPartyType: string;
  otherPartyVerified: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function ChatPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadConversations();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [router]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: newMessage.trim()
        })
      });

      if (response.ok) {
        setNewMessage('');
        // Reload messages
        loadMessages(selectedConversation.id);
        // Reload conversations to update last message
        loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/marketplace" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Marketplace
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-6 h-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Conversations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">Loading conversations...</p>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center">
                      <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No conversations yet</p>
                      <p className="text-xs text-gray-400">Start chatting from the marketplace</p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => handleConversationSelect(conversation)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                          selectedConversation?.id === conversation.id ? 'bg-green-50 border-green-200' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {conversation.otherPartyName}
                              </h3>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="default" className="text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {conversation.productName}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={conversation.otherPartyType === 'farmer' ? 'default' : 'secondary'}>
                                {conversation.otherPartyType}
                              </Badge>
                              {conversation.otherPartyVerified && (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              )}
                            </div>
                            {conversation.lastMessage && (
                              <p className="text-xs text-gray-400 mt-1 truncate">
                                {conversation.lastMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              {selectedConversation ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {selectedConversation.otherPartyName}
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge variant={selectedConversation.otherPartyType === 'farmer' ? 'default' : 'secondary'}>
                              {selectedConversation.otherPartyType}
                            </Badge>
                            {selectedConversation.otherPartyVerified && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {selectedConversation.productName}
                        </p>
                        <div className="flex items-center text-xs text-gray-400">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span>Location</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 flex flex-col h-full">
                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto max-h-[400px]">
                      {messages.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No messages yet</p>
                          <p className="text-xs text-gray-400">Say hello to start the conversation!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.senderId === user.id ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  message.senderId === user.id
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-900'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <p className={`text-xs mt-1 ${
                                  message.senderId === user.id ? 'text-green-100' : 'text-gray-500'
                                }`}>
                                  {new Date(message.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="border-t p-4">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          disabled={sending}
                        />
                        <Button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || sending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {sending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-500">Choose a conversation from the list to start chatting</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
