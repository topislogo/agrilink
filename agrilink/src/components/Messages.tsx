import React, { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AccountTypeBadge, PublicVerificationStatus, getUserAccountType } from "./UserBadgeSystem";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Input } from "./ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { ChatInterface } from "./ChatInterface";
import { useChat } from "../hooks/useChat";
// Chat demo utilities removed - using Neon database only
import { toast } from "sonner";
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

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  status: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  otherParty: {
    id: string;
    name: string;
    type: 'farmer' | 'trader' | 'buyer';
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

interface MessagesProps {
  currentUser: any;
  onBack: () => void;
  onStartChat?: (productId: string) => void;
}

// No localStorage cleanup needed - using Neon database

export function Messages({ currentUser, onBack, onStartChat }: MessagesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'active' | 'archived'>('all');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  // No debug state needed - using Neon database
  
  // Use currentUser directly from props (no localStorage fallback needed)
  const effectiveCurrentUser = currentUser;
  
  // Use real chat data with the effective current user
  const { conversations, messages, loading, loadConversations, loadMessages, deleteConversation, error } = useChat();
  
  // No debug logging needed - using Neon database authentication

  // Initialize conversations when component mounts
  useEffect(() => {
    if (effectiveCurrentUser?.id) {
      loadConversations(effectiveCurrentUser.id);
    }
  }, [effectiveCurrentUser?.id, loadConversations]);

  // Listen for conversation updates (e.g., when offers are submitted)
  useEffect(() => {
    console.log('🔧 Setting up conversation update event listener');
    
    const handleConversationUpdate = (event: CustomEvent) => {
      console.log('🔄 Conversation updated event received:', event.detail);
      console.log('🔄 Current user ID:', effectiveCurrentUser?.id);
      if (effectiveCurrentUser?.id) {
        console.log('🔄 Refreshing conversations list...');
        loadConversations(effectiveCurrentUser.id);
      } else {
        console.log('🔄 No current user, skipping conversation refresh');
      }
    };

    window.addEventListener('conversationUpdated', handleConversationUpdate as EventListener);
    console.log('✅ Event listener attached for conversationUpdated');
    
    return () => {
      console.log('🧹 Removing conversation update event listener');
      window.removeEventListener('conversationUpdated', handleConversationUpdate as EventListener);
    };
  }, [effectiveCurrentUser?.id, loadConversations]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation && effectiveCurrentUser?.id) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation, effectiveCurrentUser?.id, loadMessages]);

  // No storage statistics needed - using Neon database

  const formatTimeAgo = (timestamp: string) => {
    if (!timestamp) return 'Just now';
    
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp in Messages:', timestamp);
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

  const handleDeleteConversation = async (conversationId: string, conversationName: string) => {
    if (!confirm(`Are you sure you want to delete the conversation with ${conversationName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteConversation(conversationId);
      toast.success('Conversation deleted successfully');
      
      // Close the conversation if it's currently selected
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation. Please try again.');
    }
  };

  // Transform real conversations to match component interface
  const transformedConversations = useMemo(() => {
    if (!conversations?.length) {
      return [];
    }
    
    return conversations.map(conv => {
      // Debug conversation data structure
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Conversation data structure:', {
          convId: conv.id,
          buyerId: conv.buyerId,
          sellerId: conv.sellerId,
          currentUserId: effectiveCurrentUser?.id,
          sellerData: (conv as any).seller,
          buyerData: (conv as any).buyer,
          sellerProfileImage: (conv as any).seller?.profile_image,
          buyerProfileImage: (conv as any).buyer?.profile_image
        });
      }
      // The API returns conversations with an 'otherParty' object that already contains all the other party's info
      // Check if the API response has the new structure with 'otherParty'
      const hasOtherPartyStructure = (conv as any).otherParty;
      
      // Determine the other party (not the current user)
      const otherPartyId = hasOtherPartyStructure 
        ? (conv as any).otherParty.id 
        : (conv.buyerId === effectiveCurrentUser?.id ? conv.sellerId : conv.buyerId);
      
      // Get other party name from conversation data
      const otherPartyName = hasOtherPartyStructure 
        ? (conv as any).otherParty.name 
        : (conv.buyerId === effectiveCurrentUser?.id ? conv.sellerName : conv.buyerName);
      
      // Use unread count from Neon database conversation data
      const unreadCount = conv.unreadCount || 0;
      
      // Use last message from conversation data (from Neon database) for preview
      const lastMessageFromConv = conv.lastMessage;
      
      const finalConversation = {
        id: conv.id,
        productId: conv.productId,
        productName: hasOtherPartyStructure ? (conv as any).productName : (conv.productName || 'Unknown Product'),
        productImage: hasOtherPartyStructure ? (conv as any).productImage : (conv.productImage || 'https://images.unsplash.com/photo-1546470427-227c013b2b5f?w=400&h=300&fit=crop'),
        otherParty: {
          id: otherPartyId,
          name: otherPartyName || 'Unknown User',
          type: hasOtherPartyStructure 
            ? (conv as any).otherParty.type 
            : (conv.buyerId === effectiveCurrentUser?.id ? conv.sellerType : conv.buyerType),
          location: hasOtherPartyStructure 
            ? (conv as any).otherParty.location 
            : (conv.buyerId === effectiveCurrentUser?.id ? conv.sellerLocation : conv.buyerLocation || 'Unknown Location'),
          rating: hasOtherPartyStructure 
            ? (conv as any).otherParty.rating 
            : (conv.buyerId === effectiveCurrentUser?.id ? (conv as any).sellerRating : (conv as any).buyerRating),
          verified: hasOtherPartyStructure 
            ? (conv as any).otherParty.verified 
            : (conv.buyerId === effectiveCurrentUser?.id ? conv.sellerVerified : conv.buyerVerified),
          profileImage: hasOtherPartyStructure 
            ? (conv as any).otherParty.profileImage 
            : (conv.buyerId === effectiveCurrentUser?.id ? (conv as any).seller?.profile_image : (conv as any).buyer?.profile_image),
          // Add complete verification data for badge display
          accountType: hasOtherPartyStructure 
            ? (conv as any).otherParty.accountType 
            : (conv.buyerId === effectiveCurrentUser?.id ? conv.sellerAccountType : conv.buyerAccountType),
          phoneVerified: hasOtherPartyStructure 
            ? (conv as any).otherParty.phoneVerified 
            : (conv.buyerId === effectiveCurrentUser?.id ? conv.sellerPhoneVerified : conv.buyerPhoneVerified),
          verificationStatus: hasOtherPartyStructure 
            ? (conv as any).otherParty.verificationStatus 
            : (conv.buyerId === effectiveCurrentUser?.id ? conv.sellerVerificationStatus : conv.buyerVerificationStatus),
          verificationSubmitted: hasOtherPartyStructure 
            ? false // API doesn't return this in otherParty structure
            : (conv.buyerId === effectiveCurrentUser?.id ? conv.sellerVerificationSubmitted : conv.buyerVerificationSubmitted),
          businessVerified: hasOtherPartyStructure 
            ? ((conv as any).otherParty.accountType === 'business' && (conv as any).otherParty.verified)
            : (conv.buyerId === effectiveCurrentUser?.id ? 
              (conv.sellerAccountType === 'business' && conv.sellerVerified) : 
              (conv.buyerAccountType === 'business' && conv.buyerVerified))
        },
        lastMessage: lastMessageFromConv ? {
          content: lastMessageFromConv,
          timestamp: conv.lastMessageTime || conv.createdAt,
          isOwn: false // We don't know sender from conversation data, will be updated when messages load
        } : {
          content: 'No messages yet',
          timestamp: conv.lastMessageTime || conv.createdAt,
          isOwn: false
        },
        unreadCount,
        status: (conv as any).status === 'active' ? 'active' : 'archived'
      } as Conversation;
      
      return finalConversation;
    });
  }, [conversations?.length, Object.keys(messages).length, effectiveCurrentUser?.id]);

  const filteredConversations = useMemo(() => {
    let filtered = transformedConversations;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(conv => 
        conv.otherParty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    switch (filterType) {
      case 'unread':
        filtered = filtered.filter(conv => conv.unreadCount > 0);
        break;
      case 'active':
        filtered = filtered.filter(conv => conv.status === 'active');
        break;
      case 'archived':
        filtered = filtered.filter(conv => conv.status === 'archived');
        break;
    }

    // Sort by last message timestamp
    return filtered.sort((a, b) => 
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );
  }, [transformedConversations, searchQuery, filterType]);

  const totalUnread = transformedConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  // No cleanup needed - using Neon database

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4 mb-8">
        {/* Back button row */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="h-9 px-3 -ml-3">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {/* No development tools needed - using Neon database */}
        </div>
        
        {/* No debug panel needed - using Neon database */}
        
        {/* Title section - aligned with content */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            {totalUnread > 0 ? `${totalUnread} unread messages` : 'All caught up!'}
            {effectiveCurrentUser ? ` • Logged in as ${effectiveCurrentUser.name}` : ' • Not authenticated'}
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Error loading conversations</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadConversations(effectiveCurrentUser?.id)}
              className="mt-2"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Authentication Warning */}
      {!effectiveCurrentUser && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Authentication Issue</span>
            </div>
            <p className="text-primary/80 text-sm mt-1">
              No authenticated user found. Please log in to view messages.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBack}
              className="mt-2"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
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
                className="w-full pl-10"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All', count: transformedConversations.length },
                { key: 'unread', label: 'Unread', count: totalUnread },
                { key: 'active', label: 'Active', count: transformedConversations.filter(c => c.status === 'active').length }
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
                <Button variant="outline" onClick={onBack}>
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
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img 
                      src={conversation.productImage}
                      alt={conversation.productName}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1546470427-227c013b2b5f?w=400&h=300&fit=crop';
                      }}
                    />
                  </div>

                  {/* Conversation Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => window.open(`/user/${conversation.otherParty.id}`, '_blank')}
                          className="font-medium truncate hover:text-primary transition-colors text-left"
                        >
                          {conversation.otherParty.name}
                        </button>
                        <AccountTypeBadge 
                          userType={conversation.otherParty.type}
                          accountType={getUserAccountType(conversation.otherParty)}
                          size="sm"
                        />
                        <PublicVerificationStatus 
                          verificationLevel={conversation.otherParty.verified || conversation.otherParty.phoneVerified ? 'id-verified' : 'unverified'}
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

      {/* Empty State for No Messages */}
      {transformedConversations.length === 0 && !loading && effectiveCurrentUser && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start conversations with farmers, traders, and buyers by browsing products and clicking the chat button.
            </p>
            <div className="flex justify-center">
              <Button onClick={onBack}>
                Browse Products
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-pulse space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              <div className="h-3 bg-muted rounded w-1/3 mx-auto"></div>
            </div>
            <p className="text-muted-foreground mt-4">Loading conversations...</p>
          </CardContent>
        </Card>
      )}

      {/* Selected Conversation Chat Interface */}
      {selectedConversation && (() => {
        const conversation = transformedConversations.find(conv => conv.id === selectedConversation);
        if (!conversation) return null;

        // Removed debug logging

        return (
          <>
            {/* Mobile: Full screen overlay */}
            <div className="fixed inset-0 bg-card shadow-2xl border-l border-t z-50 transition-transform duration-300 md:hidden">
              <ChatInterface
                otherPartyName={conversation.otherParty.name}
                otherPartyType={conversation.otherParty.type}
                otherPartyLocation={conversation.otherParty.location}
                otherPartyRating={conversation.otherParty.rating}
                productName={conversation.productName}
                productId={conversation.productId}
                otherPartyId={conversation.otherParty.id}
                conversationId={conversation.id}
                onClose={() => setSelectedConversation(null)}
                otherPartyVerified={conversation.otherParty.verified}
                currentUserVerified={effectiveCurrentUser?.verified || false}
                currentUserType={effectiveCurrentUser?.userType}
                currentUser={effectiveCurrentUser}
                otherPartyProfileImage={conversation.otherParty.profileImage}
                otherPartyVerificationStatus={{
                  trustLevel: (conversation.otherParty.verified || conversation.otherParty.phoneVerified) ? 'id-verified' : 'unverified',
                  tierLabel: (conversation.otherParty.verified || conversation.otherParty.phoneVerified) ? 'Verified' : 'Unverified',
                  levelBadge: (conversation.otherParty.verified || conversation.otherParty.phoneVerified) ? 'Tier 1' : 'Unverified'
                } as any)}
                product={({
                  id: conversation.productId,
                  name: conversation.productName,
                  category: 'General',
                  description: '',
                  price: (conversation as any).productPrice || 0,
                  unit: (conversation as any).productUnit || 'units',
                  availableQuantity: (conversation as any).productAvailableQuantity || '0',
                  location: conversation.otherParty.location,
                  image: conversation.productImage,
                  sellerId: (conversation as any).productSellerId,
                  seller: {
                    id: conversation.otherParty.id,
                    name: conversation.otherParty.name,
                    userType: conversation.otherParty.type,
                    location: conversation.otherParty.location,
                    verified: conversation.otherParty.verified,
                    phoneVerified: false,
                    verificationStatus: 'unverified',
                    rating: 0,
                    totalReviews: 0
                  },
                  isActive: true,
                  createdAt: new Date().toISOString()
                } as any)}
              />
            </div>

            {/* Desktop: Side panel */}
            <div className="hidden md:block fixed right-0 bottom-0 h-[500px] w-96 bg-card shadow-2xl border-l border-t z-50 transition-transform duration-300">
              <ChatInterface
                otherPartyName={conversation.otherParty.name}
                otherPartyType={conversation.otherParty.type}
                otherPartyLocation={conversation.otherParty.location}
                otherPartyRating={conversation.otherParty.rating}
                productName={conversation.productName}
                productId={conversation.productId}
                otherPartyId={conversation.otherParty.id}
                conversationId={conversation.id}
                onClose={() => setSelectedConversation(null)}
                otherPartyVerified={conversation.otherParty.verified}
                currentUserVerified={effectiveCurrentUser?.verified || false}
                currentUserType={effectiveCurrentUser?.userType}
                currentUser={effectiveCurrentUser}
                otherPartyProfileImage={conversation.otherParty.profileImage}
                otherPartyVerificationStatus={{
                  trustLevel: (conversation.otherParty.verified || conversation.otherParty.phoneVerified) ? 'id-verified' : 'unverified',
                  tierLabel: (conversation.otherParty.verified || conversation.otherParty.phoneVerified) ? 'Verified' : 'Unverified',
                  levelBadge: (conversation.otherParty.verified || conversation.otherParty.phoneVerified) ? 'Tier 1' : 'Unverified'
                } as any)}
                product={({
                  id: conversation.productId,
                  name: conversation.productName,
                  category: 'General',
                  description: '',
                  price: (conversation as any).productPrice || 0,
                  unit: (conversation as any).productUnit || 'units',
                  availableQuantity: (conversation as any).productAvailableQuantity || '0',
                  location: conversation.otherParty.location,
                  image: conversation.productImage,
                  sellerId: (conversation as any).productSellerId,
                  seller: {
                    id: conversation.otherParty.id,
                    name: conversation.otherParty.name,
                    userType: conversation.otherParty.type,
                    location: conversation.otherParty.location,
                    verified: conversation.otherParty.verified,
                    phoneVerified: false,
                    verificationStatus: 'unverified',
                    rating: 0,
                    totalReviews: 0
                  },
                  isActive: true,
                  createdAt: new Date().toISOString()
                } as any)}
              />
            </div>
          </>
        );
      })()}
    </div>
  );
}