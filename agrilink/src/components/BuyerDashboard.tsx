import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Heart, MessageCircle, TrendingDown, Bell, Eye, Shield, CheckCircle, MessageSquare, Store, XCircle } from "lucide-react";
import { Product } from "../data/products";

interface BuyerUser {
  id: string;
  name: string;
  email: string;
  userType: "buyer";
  location: string;
  region: string;
  phone?: string;
  joinedDate?: string;
  verified?: boolean;
  preferences?: {
    categories: string[];
    priceRange: string;
    deliveryRadius: number;
  };
}

interface BuyerDashboardProps {
  user: BuyerUser;
  allProducts: Product[];
  savedProducts: SavedProduct[];
  onGoToMarketplace: () => void;
  onViewProduct: (productId: string) => void;
  onStartChat: (productId: string, sellerId: string) => void;
  onViewMessages: () => void;
  onShowVerification?: () => void;
}

interface SavedProduct {
  productId: string;
  savedDate: string;
  priceWhenSaved: number;
  createdAt: string;
  alerts?: {
    priceAlert?: boolean;
    stockAlert?: boolean;
  };
}

export function BuyerDashboard({
  user,
  allProducts,
  savedProducts,
  onGoToMarketplace,
  onViewProduct,
  onStartChat,
  onViewMessages,
  onShowVerification
}: BuyerDashboardProps) {

  // Get saved products with current product data (simplified)
  const savedProductsWithData = useMemo(() => {
    return savedProducts.map(saved => {
      const product = allProducts.find(p => p.id === saved.productId);
      
      return {
        ...saved,
        product,
        currentPrice: product?.price || 0
      };
    });
  }, [allProducts, savedProducts]);

  // Simple dashboard stats focused on saved products
  const dashboardStats = useMemo(() => {
    const savedProductsCount = savedProducts.length;
    const priceAlertsActive = savedProducts.filter(sp => sp.alerts?.priceAlert).length;
    const priceDropsDetected = savedProductsWithData.filter(sp => sp.currentPrice < sp.priceWhenSaved).length;
    return {
      savedProductsCount, priceAlertsActive, priceDropsDetected
    };
  }, [savedProducts]);

  const formatPrice = (price: number) => {
    // Format price with proper Myanmar currency formatting
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price) + ' MMK';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl">Welcome back, {user.name}!</h1>
        <p className="text-muted-foreground">Your AgriLink buying dashboard</p>
      </div>

      {/* Verification Status Alert */}
      {(() => {
        // Helper function to determine verification progress for buyers
        const getVerificationProgress = () => {
          if (user.verified && (user as any).phoneVerified) {
            return 'verified';
          }
          
          // Check for rejection status first
          if ((user as any).verificationStatus === 'rejected') {
            return 'rejected';
          }
          
          // Check for under-review status (support both formats for backward compatibility)
          if ((user as any).verificationStatus === 'under-review' || 
              (user as any).verificationStatus === 'under_review' || 
              (user as any).verificationSubmitted) {
            return 'under-review';
          }
          
          // For buyers, phone verification is the main requirement
          if ((user as any).phoneVerified) {
            return 'in-progress';
          }
          
          return 'not-started';
        };

        const verificationStatus = getVerificationProgress();

        if (verificationStatus === 'verified') {
          return (
            <Alert className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100">
              <CheckCircle className="h-5 w-5" style={{ color: '#059669' }} />
              <AlertDescription>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-emerald-700">AgriLink Verification Complete</span>
                    </div>
                    <p className="text-sm text-emerald-600">
                      Your account is fully verified! You now have enhanced buyer trust and credibility on the platform.
                    </p>
                  </div>
                  <div className="flex justify-end sm:justify-start">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 shrink-0"
                      onClick={() => {
                        console.log('👀 View Verification clicked');
                        onShowVerification?.();
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          );
        }
        
        if (verificationStatus === 'under-review') {
          return (
            <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <Shield className="h-5 w-5" style={{ color: '#2563eb' }} />
              <AlertDescription>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-blue-700">Verification Under Review</span>
                    </div>
                    <p className="text-sm text-blue-600">
                      Your verification documents have been submitted. AgriLink team will review within 1-2 business days.
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 shrink-0"
                    onClick={() => {
                      console.log('🔍 Check Status clicked');
                      onShowVerification?.();
                    }}
                  >
                    Check Status
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          );
        }
        
        if (verificationStatus === 'rejected') {
          return (
            <Alert className="border-red-200 bg-gradient-to-r from-red-50 to-red-100">
              <XCircle className="h-5 w-5" style={{ color: '#dc2626' }} />
              <AlertDescription>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-red-700">Verification Rejected</span>
                    </div>
                    <p className="text-sm text-red-600">
                      Your verification documents were rejected. Please review the feedback and resubmit with corrected documents.
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-red-600 hover:bg-red-700 text-white shrink-0"
                    onClick={() => {
                      console.log('🔄 Redo Verification clicked');
                      onShowVerification?.();
                    }}
                  >
                    Redo Verification
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          );
        }
        
        if (verificationStatus === 'in-progress') {
          return (
            <Alert className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
              <Shield className="h-5 w-5" style={{ color: '#d97706' }} />
              <AlertDescription>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-yellow-700">Complete Your Verification</span>
                    </div>
                    <p className="text-sm text-yellow-600">
                      Your phone is verified! Complete ID verification to get the green verified badge and boost buyer trust.
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-yellow-600 hover:bg-yellow-700 text-white shrink-0"
                    onClick={() => {
                      console.log('📋 Continue Verification clicked');
                      onShowVerification?.();
                    }}
                  >
                    Continue Setup
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          );
        }
        
        // Default: Not started
        return (
          <Alert className="border-red-200 bg-gradient-to-r from-red-50 to-red-100">
            <Shield className="h-5 w-5" style={{ color: '#dc2626' }} />
            <AlertDescription>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-red-700">Boost Your Buying Experience!</span>
                  </div>
                  <p className="text-sm text-red-600">
                    Verified buyers get priority access to premium sellers and exclusive deals.
                  </p>
                </div>
                <Button 
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700 text-white shrink-0"
                  onClick={() => {
                    console.log('🚀 Start Verification clicked');
                    onShowVerification?.();
                  }}
                >
                  Start Verification
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );
      })()}

      {/* Simple Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saved Products</p>
                <p className="text-xl">{dashboardStats.savedProductsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price Alerts</p>
                <p className="text-xl text-orange-600">{dashboardStats.priceAlertsActive}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price Drops</p>
                <p className="text-xl text-green-600">{dashboardStats.priceDropsDetected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Button 
          onClick={() => {
            console.log('🏪 Browse Marketplace clicked');
            onGoToMarketplace?.();
          }}
          className="h-12 justify-start gap-3 bg-primary hover:bg-primary/90"
        >
          <Store className="w-5 h-5" />
          Browse Marketplace
        </Button>
        
        <Button 
          onClick={() => {
            console.log('💬 Check Messages clicked');
            onViewMessages?.();
          }}
          variant="outline"
          className="h-12 justify-start gap-3"
        >
          <MessageSquare className="w-5 h-5" />
          Check Messages
        </Button>
        
        <Button 
          onClick={() => {
            console.log('🔔 Price Alerts clicked');
            // Could open a price alerts management modal
          }}
          variant="outline"
          className="h-12 justify-start gap-3"
        >
          <Bell className="w-5 h-5" />
          Manage Alerts
        </Button>
      </div>

      {/* Saved Products - Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Your Saved Products ({savedProductsWithData.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Track prices and get alerts on products you're interested in
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {savedProductsWithData.map((saved) => (
              <div key={saved.productId} className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">{saved.product?.name || "Product Not Found"}</h3>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm text-muted-foreground">
                    <span>Current Price: {formatPrice(saved.currentPrice)}</span>
                    <span className="hidden md:inline">•</span>
                    <span>Saved: {new Date(saved.createdAt).toLocaleDateString()}</span>
                  </div>
                  {saved.product && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Seller: {(saved.product as any).sellerName} • {saved.product.location}
                    </p>
                  )}
                </div>
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full md:w-auto"
                    onClick={() => saved.product && onViewProduct(saved.productId)}
                    disabled={!saved.product}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Product
                  </Button>
                  <Button 
                    size="sm"
                    className="w-full md:w-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      saved.product && onStartChat(saved.productId, saved.product.seller.id)
                    }
                    }
                    disabled={!saved.product}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Contact Seller
                  </Button>
                </div>
              </div>
            ))}
            
            {savedProductsWithData.length === 0 && (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No saved products yet</h3>
                <p className="text-muted-foreground">
                  Start saving products to track their prices and get notified when prices drop. You can save products by clicking the heart icon on any product card in the marketplace.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}