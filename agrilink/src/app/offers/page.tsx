"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { S3Image } from "@/components/S3Image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
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
  User
} from "lucide-react";

interface Offer {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  product?: {
    id: string;
    name: string;
    category: string;
    image?: string;
  };
  buyerId: string;
  buyerName: string;
  buyerImage?: string;
  sellerId: string;
  sellerName: string;
  sellerImage?: string;
  buyer?: {
    id: string;
    name: string;
    userType: string;
    accountType: string;
    profileImage?: string;
  };
  seller?: {
    id: string;
    name: string;
    userType: string;
    accountType: string;
    profileImage?: string;
  };
  offerPrice: number;
  quantity: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'to_ship' | 'shipped' | 'delivered' | 'received' | 'completed' | 'cancelled' | 'expired';
  deliveryOptions: string[];
  deliveryAddress?: any;
  paymentTerms: string[];
  expiresAt: string;
  acceptedAt?: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OffersPage() {
  const [user, setUser] = useState<any>(null);
  const [offers, setOffers] = useState<{sent: Offer[], received: Offer[]}>({sent: [], received: []});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sent");
  const router = useRouter();

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
      
      // Set initial tab based on user type
      if (parsedUser.userType === 'farmer') {
        setActiveTab("received");
      } else if (parsedUser.userType === 'buyer') {
        setActiveTab("sent");
      } else if (parsedUser.userType === 'trader') {
        setActiveTab("sent"); // Default to sent for traders
      }
      
      fetchOffers(parsedUser.id);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);

  const fetchOffers = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch sent offers
      const sentResponse = await fetch("/api/offers?type=sent", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      // Fetch received offers
      const receivedResponse = await fetch("/api/offers?type=received", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (sentResponse.ok && receivedResponse.ok) {
        const sentData = await sentResponse.json();
        const receivedData = await receivedResponse.json();
        
        setOffers({
          sent: sentData.offers || [],
          received: receivedData.offers || []
        });
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if offer is expired and return correct status
  const getEffectiveStatus = (offer: Offer) => {
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewOffer = (offer: Offer) => {
    // Navigate to dedicated offer details page
    router.push(`/offers/${offer.id}`);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading offers...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentOffers = offers[activeTab as keyof typeof offers] || [];

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Offer Management</h1>
          <p className="text-gray-600">
            {user.userType === 'buyer' 
              ? 'Manage offers you have made to purchase products' 
              : user.userType === 'farmer'
              ? 'Manage offers received for your products'
              : user.userType === 'trader'
              ? 'Manage offers you have made and received'
              : 'Manage your offers'
            }
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${(user.userType === 'farmer' || user.userType === 'buyer') ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {(user.userType === 'buyer' || user.userType === 'trader') && (
              <TabsTrigger 
                value="sent" 
                className={`flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold transition-colors`}
              >
                <Package className="w-4 h-4" />
                {user.userType === 'buyer' ? 'My Offers' : 'Sent Offers'} ({offers.sent?.length || 0})
              </TabsTrigger>
            )}
            {(user.userType === 'farmer' || user.userType === 'trader') && (
              <TabsTrigger 
                value="received" 
                className={`flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold transition-colors`}
              >
                <MessageSquare className="w-4 h-4" />
                Received Offers ({offers.received?.length || 0})
              </TabsTrigger>
            )}
          </TabsList>

          {(user.userType === 'buyer' || user.userType === 'trader') && (
            <TabsContent value="sent" className="mt-6">
              <div className="space-y-4">
                {currentOffers.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {user.userType === 'buyer' ? 'No offers made' : 'No sent offers'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {user.userType === 'buyer' 
                        ? "You haven't made any offers to purchase products yet." 
                        : "You haven't sent any offers yet."
                      }
                    </p>
                      <Button onClick={() => router.push("/")}>
                        Browse Products
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                currentOffers.map((offer: Offer) => (
                  <Card key={offer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Product Image */}
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {offer.product?.image ? (
                              <S3Image 
                                src={offer.product.image} 
                                alt={offer.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-8 h-8 text-gray-400" />
                            )}
                          </div>

                          {/* Offer Details */}
                          <div className="flex-1">
                            <div className="mb-2">
                              <h3 className="font-semibold text-lg">{offer.product?.name}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <span>To: {offer.seller?.name || offer.sellerName || 'Unknown Seller'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4" />
                                  <span>{offer.offerPrice.toLocaleString()} MMK × {offer.quantity}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Truck className="w-4 h-4" />
                                  <span>{(offer.deliveryOptions || [])[0] || 'Not specified'}</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>Sent: {formatDate(offer.createdAt)}</span>
                                </div>
                                {offer.expiresAt && getEffectiveStatus(offer) === 'pending' && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Expires: {formatDate(offer.expiresAt)}</span>
                                  </div>
                                )}
                                {offer.message && (
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="w-4 h-4 mt-0.5" />
                                    <span className="line-clamp-2">{offer.message}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 ml-4">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(getEffectiveStatus(offer))}>
                              {getStatusIcon(getEffectiveStatus(offer))}
                              <span className="ml-1">{formatStatus(getEffectiveStatus(offer))}</span>
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewOffer(offer)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            </TabsContent>
          )}

          {(user.userType === 'farmer' || user.userType === 'trader') && (
            <TabsContent value="received" className="mt-6">
            <div className="space-y-4">
              {currentOffers.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No received offers</h3>
                    <p className="text-gray-600 mb-4">
                      {user.userType === 'farmer' 
                        ? "You haven't received any offers for your products yet." 
                        : "You haven't received any offers yet."
                      }
                    </p>
                    <Button onClick={() => router.push("/products/new")}>
                      List Your Products
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                currentOffers.map((offer: Offer) => (
                  <Card key={offer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Product Image */}
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {offer.product?.image ? (
                              <S3Image 
                                src={offer.product.image} 
                                alt={offer.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-8 h-8 text-gray-400" />
                            )}
                          </div>

                          {/* Offer Details */}
                          <div className="flex-1">
                            <div className="mb-2">
                              <h3 className="font-semibold text-lg">{offer.product?.name}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <span>From: {offer.buyer?.name || offer.buyerName || 'Unknown Buyer'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4" />
                                  <span>{offer.offerPrice.toLocaleString()} MMK × {offer.quantity}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Truck className="w-4 h-4" />
                                  <span>{(offer.deliveryOptions || [])[0] || 'Not specified'}</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>Received: {formatDate(offer.createdAt)}</span>
                                </div>
                                {offer.expiresAt && getEffectiveStatus(offer) === 'pending' && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Expires: {formatDate(offer.expiresAt)}</span>
                                  </div>
                                )}
                                {offer.message && (
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="w-4 h-4 mt-0.5" />
                                    <span className="line-clamp-2">{offer.message}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 ml-4">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(getEffectiveStatus(offer))}>
                              {getStatusIcon(getEffectiveStatus(offer))}
                              <span className="ml-1">{formatStatus(getEffectiveStatus(offer))}</span>
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewOffer(offer)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
