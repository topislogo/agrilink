"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccountTypeBadge, PublicVerificationStatus, getUserAccountType } from "@/components/UserBadgeSystem";
import { S3Image } from "@/components/S3Image";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AppHeader } from "@/components/AppHeader";
import { ChatInterface } from "@/components/ChatInterface";
import { useAuth } from "@/hooks/useAuth";
import { 
  ChevronLeft,
  MessageSquare,
  Search,
  MoreVertical,
  Clock,
  Package,
  MapPin,
  Star,
  AlertTriangle,
  Trash2
} from "lucide-react";

// Helper function to get verification level for other party (public view only)
function getOtherPartyVerificationLevel(otherParty: any): "unverified" | "business-verified" | "id-verified" | "under-review" {
  // Only consider fully verified users (not just phone verified)
  const isVerified = otherParty.verified;
  
  if (!isVerified) {
    return 'unverified';
  }
  
  // If verified, check account type to determine the appropriate badge
  if (otherParty.accountType === 'business') {
    return 'business-verified'; // This will display as "Business" badge
  }
  
  return 'id-verified'; // This will display as "Verified" for individual accounts
}

interface Conversation {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  productUnit: string;
  productAvailableQuantity?: string;
  otherParty: {
    id: string;
    name: string;
    type: 'farmer' | 'trader' | 'buyer';
    accountType: 'individual' | 'business';
    location: string;
    rating: number;
    verified: boolean;
    profileImage?: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    isOwn: boolean;
  };
  unreadCount: number;
  status: 'active' | 'archived';
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'active' | 'archived'>('all');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { user: authUser } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadConversations();
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/chat/conversations", {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string, conversationName: string) => {
    if (!confirm(`Are you sure you want to delete the conversation with ${conversationName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        if (selectedConversation === conversationId) {
          setSelectedConversation(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const formatTimeAgo = (timestamp: string) => {
    if (!timestamp) return 'Just now';
    
    const date = new Date(timestamp);
    
    if (isNaN(date.getTime())) {
      return 'Just now';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredConversations = conversations.filter(conv => {
    // Apply search filter
    if (searchQuery) {
      const matchesSearch = 
        conv.otherParty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
    }

    // Apply type filter
    switch (filterType) {
      case 'unread':
        return conv.unreadCount > 0;
      case 'active':
        return conv.status === 'active';
      case 'archived':
        return conv.status === 'archived';
      default:
        return true;
    }
  }).sort((a, b) => 
    new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader currentUser={user} onLogout={handleLogout} />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push("/dashboard")} className="h-9 px-3 -ml-3">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">
              {totalUnread > 0 ? `${totalUnread} unread messages` : 'All caught up!'}
              {user ? ` • Logged in as ${user.name}` : ' • Not authenticated'}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="search-conversations"
                  name="search-conversations"
                  className="w-full pl-10"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All', count: conversations.length },
                  { key: 'unread', label: 'Unread', count: totalUnread },
                  { key: 'active', label: 'Active', count: conversations.filter(c => c.status === 'active').length }
                ].map(filter => (
                  <Button
                    key={filter.key}
                    variant={filterType === filter.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType(filter.key as any)}
                    className="gap-2"
                  >
                    {filter.label}
                    {filter.count > 0 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        {filter.count}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversations List */}
        <div className="space-y-4">
          {filteredConversations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No conversations found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? `No conversations match "${searchQuery}"`
                    : filterType === 'unread' 
                      ? "You're all caught up! No unread messages."
                      : "Start chatting with sellers and buyers to see conversations here."
                  }
                </p>
                {!searchQuery && filterType === 'all' && (
                  <Button variant="outline" onClick={() => router.push("/")}>
                    Browse Products
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredConversations.map((conversation) => (
              <Card 
                key={conversation.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  conversation.unreadCount > 0 ? 'ring-2 ring-primary/20' : ''
                }`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Profile Image */}
                    <div className="shrink-0">
                      <S3Image 
                        src={conversation.otherParty.profileImage || '/api/placeholder/400/300'}
                        alt={conversation.otherParty.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    </div>

                    {/* Conversation Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{conversation.otherParty.name}</h3>
                          <AccountTypeBadge 
                            userType={conversation.otherParty.type}
                            accountType={getUserAccountType(conversation.otherParty)}
                            size="sm"
                          />
                          <PublicVerificationStatus 
                            verificationLevel={getOtherPartyVerificationLevel(conversation.otherParty)}
                            size="xs"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(conversation.lastMessage.timestamp)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Package className="w-3 h-3" />
                        <span className="truncate">{conversation.productName}</span>
                        <span>•</span>
                        <MapPin className="w-3 h-3" />
                        <span>{conversation.otherParty.location}</span>
                        {conversation.otherParty.rating && !isNaN(Number(conversation.otherParty.rating)) && Number(conversation.otherParty.rating) > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span>{Number(conversation.otherParty.rating).toFixed(1)}</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate flex-1 mr-4">
                          {conversation.lastMessage.isOwn ? 'You: ' : ''}
                          {conversation.lastMessage.content || 'No message content'}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="bg-primary text-primary-foreground px-2 py-1 text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="p-1">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleDeleteConversation(conversation.id, conversation.otherParty.name)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Conversation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Chat Popup - Facebook Messenger Style */}
        {selectedConversation && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200">
              {(() => {
                const conversation = conversations.find(c => c.id === selectedConversation);
                if (!conversation) return null;
                
                return (
                  <ChatInterface
                    otherPartyName={conversation.otherParty.name}
                    otherPartyType={conversation.otherParty.type}
                    otherPartyAccountType={conversation.otherParty.accountType || 'individual'}
                    otherPartyLocation={conversation.otherParty.location}
                    otherPartyRating={conversation.otherParty.rating}
                    productName={conversation.productName}
                    productId={conversation.productId}
                    otherPartyId={conversation.otherParty.id}
                    conversationId={conversation.id}
                    onClose={() => setSelectedConversation(null)}
                    onMessagesRead={(conversationId) => {
                      console.log('🔄 Messages read callback triggered for:', conversationId);
                      console.log('🔄 Refreshing conversations from callback...');
                      loadConversations();
                    }}
                    otherPartyVerified={conversation.otherParty.verified}
                    otherPartyProfileImage={conversation.otherParty.profileImage}
                    otherPartyVerificationStatus={{
                      trustLevel: getOtherPartyVerificationLevel(conversation.otherParty),
                      tierLabel: getOtherPartyVerificationLevel(conversation.otherParty) === 'id-verified' ? 'Verified' : 'Unverified',
                      levelBadge: getOtherPartyVerificationLevel(conversation.otherParty) === 'id-verified' ? '✓' : '!'
                    }}
                    currentUser={authUser || user}
                    product={{
                      id: conversation.productId,
                      name: conversation.productName,
                      price: conversation.productPrice,
                      unit: conversation.productUnit,
                      image: conversation.productImage,
                      sellerId: conversation.otherParty.id,
                      availableQuantity: conversation.productAvailableQuantity || '0'
                    }}
                  />
                );
              })()}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}