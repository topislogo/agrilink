"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatInterface } from "@/components/ChatInterface";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { S3Image } from "@/components/S3Image";
import { 
  ChevronLeft,
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  MapPin,
  MessageSquare,
  Eye,
  DollarSign,
  Calendar,
  User,
  Mail,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { OfferStatusManager } from "@/components/OfferStatusManager";
import { ReviewSection } from "@/components/ReviewSection";
import { AccountTypeBadge, PublicVerificationStatus } from "@/components/UserBadgeSystem";

interface TimelineEvent {
  id: string;
  eventType: string;
  eventDescription: string;
  eventData: any;
  createdAt: string;
  userName?: string;
}

interface OfferDetails {
  id: string;
  conversationId?: string;
  productId: string;
  productName: string;
  productImage?: string;
  productCategory?: string;
  buyerId: string;
  buyerName: string;
  buyerImage?: string;
  buyerEmail?: string;
  buyerUserType?: string;
  buyerAccountType?: string;
  buyerVerificationLevel?: string;
  buyer?: {
    id: string;
    name: string;
    userType: string;
    accountType: string;
    profileImage?: string;
    verificationLevel?: string;
  };
  sellerId: string;
  sellerName: string;
  sellerImage?: string;
  sellerEmail?: string;
  sellerUserType?: string;
  sellerAccountType?: string;
  sellerVerificationLevel?: string;
  seller?: {
    id: string;
    name: string;
    userType: string;
    accountType: string;
    profileImage?: string;
    verificationLevel?: string;
  };
  offerPrice: number;
  quantity: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'to_ship' | 'shipped' | 'delivered' | 'received' | 'completed' | 'cancelled' | 'expired';
  deliveryOptions: string[];
  deliveryAddress?: any;
  paymentTerms?: string[];
  expiresAt: string;
  acceptedAt?: string;
  confirmedAt?: string;
  readyToShipAt?: string;
  readyToPickupAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  autoCompleteAt?: string;
  createdAt: string;
  updatedAt: string;
  statusUpdatedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  timeline?: TimelineEvent[];
}

export default function OfferDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [offer, setOffer] = useState<OfferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChats, setActiveChats] = useState<any[]>([]);

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
      fetchOfferDetails(params.id as string);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [params.id, router]);

  // Chat popup functionality
  useEffect(() => {
    const handleOpenChatEvent = (event: CustomEvent) => {
      const { userId, userName, productId, productName, conversationId } = event.detail;
      
      // Check if chat is already open
      const existingChat = activeChats.find(chat => 
        chat.otherPartyId === userId && chat.productId === productId
      );
      
      if (existingChat) {
        // Chat already open, bring it to front
        return;
      }

      // Create new chat popup
      const newChat = {
        id: conversationId || `chat_${userId}_${productId}_${Date.now()}`,
        otherPartyId: userId,
        otherPartyName: userName,
        otherPartyType: 'user',
        otherPartyLocation: '',
        otherPartyRating: 0,
        productName: productName,
        productId: productId,
        otherPartyVerified: false,
        otherPartyProfileImage: '',
        otherPartyVerificationStatus: {
          trustLevel: 'unverified',
          tierLabel: 'Unverified',
          levelBadge: '!'
        }
      };

      setActiveChats(prev => [...prev, newChat]);
    };

    // Add event listener
    window.addEventListener('openChat', handleOpenChatEvent as EventListener);

    // Cleanup function
    return () => {
      window.removeEventListener('openChat', handleOpenChatEvent as EventListener);
    };
  }, [activeChats]);

  const handleCloseChat = (chatId: string) => {
    setActiveChats(prev => prev.filter(chat => chat.id !== chatId));
  };

  const fetchOfferDetails = async (offerId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/offers/${offerId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

          if (response.ok) {
            const data = await response.json();
            console.log('📊 Offer details API response:', data);
            console.log('📊 Timeline data:', data.offer?.timeline);
            setOffer(data.offer);
      } else if (response.status === 404) {
        setError("Offer not found");
      } else if (response.status === 403) {
        setError("You don't have permission to view this offer");
      } else {
        setError("Failed to load offer details");
      }
    } catch (error) {
      console.error("Error fetching offer details:", error);
      setError("Failed to load offer details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string, reason?: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/offers/${offer?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus, 
          cancellationReason: reason 
        })
      });

      if (response.ok) {
        // Refresh offer details
        await fetchOfferDetails(offer!.id);
        
        // Trigger dashboard refresh for available quantity updates
        if (newStatus === 'accepted' || newStatus === 'rejected' || newStatus === 'cancelled') {
          // Dispatch custom event to notify dashboard to refresh
          console.log('🔄 Offers: Dispatching offerStatusChanged event', {
            productId: offer!.productId,
            status: newStatus
          });
          window.dispatchEvent(new CustomEvent('offerStatusChanged', { 
            detail: { 
              productId: offer!.productId, 
              status: newStatus 
            } 
          }));
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to update offer: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating offer:", error);
      alert("Failed to update offer. Please try again.");
    }
  };

  const handleChatWithUser = () => {
    if (!offer) return;
    
    const otherPartyId = user.id === offer.buyerId ? offer.sellerId : offer.buyerId;
    const otherPartyName = user.id === offer.buyerId ? offer.sellerName : offer.buyerName;
    
    // Trigger chat popup
    window.dispatchEvent(new CustomEvent('openChat', {
      detail: {
        userId: otherPartyId,
        userName: otherPartyName,
        productId: offer.productId,
        productName: offer.productName,
        conversationId: offer.conversationId
      }
    }));
  };

  // Helper function to check if offer is expired and return correct status
  const getEffectiveStatus = (offer: OfferDetails) => {
    if (offer.status === 'pending' && offer.expiresAt && new Date(offer.expiresAt) < new Date()) {
      return 'expired';
    }
    return offer.status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'accepted': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'to_ship': return <Package className="w-4 h-4 text-purple-600" />;
      case 'shipped': return <Truck className="w-4 h-4 text-indigo-600" />;
      case 'to_receive': return <CheckCircle className="w-4 h-4 text-orange-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-600" />;
      case 'expired': return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'to_ship': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'to_receive': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading offer details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader 
          currentUser={user} 
          onLogout={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/");
          }}
        />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/offers")}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Offers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!offer || !user) {
    return null;
  }

  const isBuyer = user.id === offer.buyerId;
  const isSeller = user.id === offer.sellerId;
  const otherParty = isSeller ? {
    id: offer.buyerId,
    name: offer.buyerName,
    email: offer.buyerEmail,
    userType: offer.buyerUserType || 'buyer',
    accountType: offer.buyerAccountType || 'individual',
    verificationLevel: offer.buyerVerificationLevel || offer.buyer?.verificationLevel || 'unverified',
    image: offer.buyer?.profileImage || offer.buyerImage
  } : {
    id: offer.sellerId,
    name: offer.sellerName,
    email: offer.sellerEmail,
    userType: offer.sellerUserType || 'seller',
    accountType: offer.sellerAccountType || 'individual',
    verificationLevel: offer.sellerVerificationLevel || offer.seller?.verificationLevel || 'unverified',
    image: offer.seller?.profileImage || offer.sellerImage
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        currentUser={user} 
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/");
        }}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="space-y-4">
          {/* Back button row */}
          <Button 
            variant="ghost" 
            onClick={() => {
              // If admin, go back to complaints page, otherwise go to offers
              if (user.userType === 'admin') {
                router.push("/admin/complaints");
              } else {
                router.push("/offers");
              }
            }} 
            className="h-9 px-3 -ml-3"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {user.userType === 'admin' ? 'Back to Complaints' : 'Back'}
          </Button>
          
          {/* Title section */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Offer Details</h1>
            <p className="text-gray-600">
              {isBuyer ? 'Your offer' : 'Received offer'} for {offer.productName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            <Card 
              className="border-primary/30 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200"
              onClick={() => router.push(`/product/${offer.productId}`)}
              title="View product details"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  Product Information
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {offer.productImage ? (
                      <S3Image 
                        src={offer.productImage} 
                        alt={offer.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {offer.productName}
                    </h3>
                    {offer.productCategory && (
                      <p className="text-gray-600 mb-2">Category: {offer.productCategory}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Quantity: {offer.quantity}</span>
                      <span>Price: {offer.offerPrice.toLocaleString()} MMK per unit</span>
                      <span className="font-semibold text-lg">
                        Total: {(offer.offerPrice * offer.quantity).toLocaleString()} MMK
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Offer Details */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  Offer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {offer.expiresAt && getEffectiveStatus(offer) === 'pending' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Expires</label>
                    <p className="text-gray-900">{formatDate(offer.expiresAt)}</p>
                  </div>
                )}

                {offer.deliveryOptions && offer.deliveryOptions.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Delivery Options</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {offer.deliveryOptions.map((option, index) => (
                        <Badge key={index} variant="outline">{option}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {offer.paymentTerms && offer.paymentTerms.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Payment Terms</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {offer.paymentTerms.map((term, index) => (
                        <Badge key={index} variant="outline">{term}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {offer.deliveryAddress && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Delivery Address</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{offer.deliveryAddress.label || 'Delivery Address'}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {offer.deliveryAddress.fullName && (
                          <p className="font-medium">{offer.deliveryAddress.fullName}</p>
                        )}
                        <p>{offer.deliveryAddress.addressLine1}</p>
                        {offer.deliveryAddress.addressLine2 && offer.deliveryAddress.addressLine2.trim() !== '' && (
                          <p>{offer.deliveryAddress.addressLine2}</p>
                        )}
                        <p>
                          {[offer.deliveryAddress.city, offer.deliveryAddress.state]
                            .filter(field => field && field.trim() !== '')
                            .join(', ')}
                        </p>
                        {offer.deliveryAddress.postalCode && <p>{offer.deliveryAddress.postalCode}</p>}
                        <p>{offer.deliveryAddress.country || 'Myanmar'}</p>
                        {offer.deliveryAddress.phone && <p>{offer.deliveryAddress.phone}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {offer.message && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Message</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">"{offer.message}"</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Management */}
            {(isBuyer || isSeller) && (
              <OfferStatusManager
                offer={{
                  id: offer.id,
                  status: getEffectiveStatus(offer),
                  statusUpdatedAt: offer.statusUpdatedAt || offer.updatedAt,
                  shippedAt: offer.shippedAt,
                  receivedAt: offer.deliveredAt,
                  completedAt: offer.completedAt,
                  cancelledAt: offer.cancelledAt,
                  cancelledBy: offer.cancelledBy,
                  cancellationReason: offer.cancellationReason,
                  deliveryOptions: offer.deliveryOptions,
                  buyerId: offer.buyerId,
                  sellerId: offer.sellerId,
                  currentUserId: user.id,
                  isBuyer: isBuyer,
                  isSeller: isSeller
                }}
                onStatusUpdate={handleStatusUpdate}
              />
            )}

            {/* Reviews Section - Only for completed offers and not for admin */}
            {getEffectiveStatus(offer) === 'completed' && user.userType !== 'admin' && (
              <ReviewSection
                offerId={offer.id}
                currentUserId={user.id}
                isBuyer={isBuyer}
                otherParty={otherParty}
                onReviewSubmitted={() => {
                  // Optionally refresh offer details or show success message
                  console.log('Review submitted successfully');
                }}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Other Party Information */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  {isBuyer ? 'Seller' : 'Buyer'} Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {otherParty.image ? (
                      <S3Image 
                        src={otherParty.image} 
                        alt={otherParty.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        const targetUrl = isBuyer ? `/seller/${otherParty.id}` : `/user/${otherParty.id}`;
                        window.open(targetUrl, '_blank');
                      }}
                      className="font-semibold text-green-600 hover:text-green-700 hover:underline transition-colors cursor-pointer text-left flex items-center gap-1 group hover:bg-green-50 px-1 py-0.5 rounded"
                      title={`View ${isBuyer ? 'seller' : 'buyer'} profile`}
                    >
                      {otherParty.name}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <div className="flex items-center gap-2 mt-1">
                      <AccountTypeBadge 
                        userType={otherParty.userType}
                        accountType={otherParty.accountType}
                        size="sm"
                      />
                      <PublicVerificationStatus 
                        verificationLevel={otherParty.verificationLevel || 'unverified'}
                        size="xs"
                      />
                    </div>
                  </div>
                </div>

                {otherParty.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{otherParty.email}</span>
                  </div>
                )}

                <Separator />

                <Button
                  onClick={handleChatWithUser}
                  className="w-full"
                  variant="outline"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {isBuyer ? 'Contact Seller' : 'Contact Buyer'}
                </Button>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Timeline
          </CardTitle>
        </CardHeader>
              <CardContent className="space-y-2">
                {/* Show timeline events if available, otherwise fallback to individual timestamps */}
                {offer.timeline && offer.timeline.length > 0 ? (
                  offer.timeline.map((event, index) => {
                    const getEventIcon = (eventType: string) => {
                      switch (eventType) {
                        case 'created':
                          return <Clock className="w-3 h-3 text-gray-400" />;
                        case 'accepted':
                          return <CheckCircle className="w-3 h-3 text-green-600" />;
                        case 'rejected':
                          return <XCircle className="w-3 h-3 text-red-600" />;
                        case 'preparing':
                        case 'ready_to_pickup':
                          return <Package className="w-3 h-3 text-purple-600" />;
                        case 'shipped':
                          return <Truck className="w-3 h-3 text-indigo-600" />;
                        case 'delivered':
                          return <CheckCircle className="w-3 h-3 text-orange-600" />;
                        case 'picked_up':
                          return <CheckCircle className="w-3 h-3 text-green-600" />;
                        case 'completed':
                          return <CheckCircle className="w-3 h-3 text-green-600" />;
                        case 'cancelled':
                          return <XCircle className="w-3 h-3 text-red-600" />;
                        case 'expired':
                          return <AlertCircle className="w-3 h-3 text-yellow-600" />;
                        case 'message_sent':
                          return <MessageSquare className="w-3 h-3 text-blue-600" />;
                        case 'status_updated':
                          return <Clock className="w-3 h-3 text-gray-400" />;
                        default:
                          return <Clock className="w-3 h-3 text-gray-400" />;
                      }
                    };

                    return (
                      <div key={event.id} className="flex items-center gap-2 text-xs">
                        {getEventIcon(event.eventType)}
                        <span className="font-medium">
                          {event.eventDescription}
                        </span>
                        <span className="text-muted-foreground ml-auto text-xs">
                          {formatDate(event.createdAt)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  // Fallback to individual timestamp fields
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Created: {formatDate(offer.createdAt)}</span>
                    </div>
                    {offer.acceptedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Accepted: {formatDate(offer.acceptedAt)}</span>
                      </div>
                    )}
                    {offer.readyToShipAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-purple-600" />
                        <span>Ready to Ship: {formatDate(offer.readyToShipAt)}</span>
                      </div>
                    )}
                    {offer.readyToPickupAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-purple-600" />
                        <span>Ready to Pick Up: {formatDate(offer.readyToPickupAt)}</span>
                      </div>
                    )}
                    {offer.shippedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="w-4 h-4 text-indigo-600" />
                        <span>Shipped: {formatDate(offer.shippedAt)}</span>
                      </div>
                    )}
                    {offer.deliveredAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-orange-600" />
                        <span>Delivered: {formatDate(offer.deliveredAt)}</span>
                      </div>
                    )}
                    {offer.completedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Completed: {formatDate(offer.completedAt)}</span>
                      </div>
                    )}
                    {offer.cancelledAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Cancelled: {formatDate(offer.cancelledAt)}</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Chat Popups - Facebook Style */}
      {activeChats.map((chat, index) => (
        <div
          key={chat.id}
          className="fixed bottom-4 right-4 z-50"
          style={{ 
            right: `${16 + (index * 400)}px`, // Stack chats horizontally
            bottom: '16px'
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200">
            <ChatInterface
              conversationId={chat.id}
              otherPartyId={chat.otherPartyId}
              otherPartyName={chat.otherPartyName}
              otherPartyType={chat.otherPartyType}
              otherPartyLocation={chat.otherPartyLocation}
              otherPartyRating={chat.otherPartyRating}
              productName={chat.productName}
              productId={chat.productId}
              otherPartyVerified={chat.otherPartyVerified}
              otherPartyProfileImage={chat.otherPartyProfileImage}
              otherPartyVerificationStatus={chat.otherPartyVerificationStatus}
              onClose={() => handleCloseChat(chat.id)}
              currentUser={user}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
