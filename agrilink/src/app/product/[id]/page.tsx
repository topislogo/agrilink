"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getRelativeTime } from "@/utils/dates";
import { UserBadge, getUserVerificationLevel, getUserAccountType } from "@/components/UserBadgeSystem";
import { Separator } from "@/components/ui/separator";
import { AppHeader } from "@/components/AppHeader";
import { ChatInterface } from "@/components/ChatInterface";
import { S3Image } from "@/components/S3Image";
import { 
  ChevronLeft,
  ChevronRight, 
  MapPin, 
  Calendar, 
  Package, 
  TrendingUp, 
  TrendingDown,
  MessageCircle,
  BarChart3,
  User,
  Star,
  Store,
  Truck,
  Clock,
  Phone,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle,
  Edit,
  FileText,
  CreditCard,
  Eye
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  imageUrl?: string;
  images?: string[];
  sellerId: string;
  sellerName: string;
  sellerType: string;
  location: string;
  lastUpdated: string;
  availableQuantity?: number;
  minimumOrder?: string;
  deliveryOptions?: string[];
  paymentTerms?: string[];
  additionalNotes?: string;
  sellerVerificationStatus?: {
    accountType: string;
    trustLevel: string;
    businessVerified: boolean;
  };
}

export default function ProductDetailsPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sellerStats, setSellerStats] = useState<any>(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
        console.log('🔄 Loading product:', productId);
        const response = await fetch(`/api/products/${productId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Product loaded successfully:', data.product?.name);
          setProduct(data.product);
        
          // Fetch seller stats if we have a seller ID
          if (data.product?.sellerId) {
            console.log('🔍 Product detail - Fetching seller stats for:', data.product.sellerId);
            const statsResponse = await fetch(`/api/user/${data.product.sellerId}/public`);
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              console.log('📊 Product detail - Seller stats received:', statsData.stats);
              setSellerStats(statsData.stats);
            } else {
              console.error('❌ Product detail - Failed to fetch seller stats:', statsResponse.status);
            }
          } else {
            console.log('❌ Product detail - No seller ID found in product data');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error(`❌ Failed to load product (${response.status}):`, errorData.message || 'Unknown error');
          
          if (response.status === 404) {
            console.log('📦 Product not found - redirecting to marketplace');
            router.push("/marketplace");
          } else {
            console.log('🚫 Server error - redirecting to home');
            router.push("/");
          }
        }
    } catch (error) {
      console.error("❌ Error loading product:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const formatPrice = (price: number) => {
    // Format price with proper Myanmar currency formatting
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Check if current user is the seller of this product
  const isOwnProduct = user && product && user.id === product.sellerId;
  
  // Image navigation state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const productImages = product?.images && product.images.length > 0 ? product.images : (product?.imageUrl ? [product.imageUrl] : []);
  
  const visibleThumbnails = 5; // Number of thumbnails visible at once
  
  // Navigation functions
  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
  };
  
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
  };
  
  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
    // Auto-scroll thumbnails to keep selected thumbnail visible
    if (index < thumbnailStartIndex) {
      setThumbnailStartIndex(index);
    } else if (index >= thumbnailStartIndex + visibleThumbnails) {
      setThumbnailStartIndex(index - visibleThumbnails + 1);
    }
  };
  
  const handleThumbnailPrevious = () => {
    setThumbnailStartIndex((prev) => Math.max(0, prev - 1));
  };
  
  const handleThumbnailNext = () => {
    setThumbnailStartIndex((prev) => 
      Math.min(productImages.length - visibleThumbnails, prev + 1)
    );
  };
  
  // Touch/swipe support for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (productImages.length > 1) {
      if (isLeftSwipe) {
        handleNextImage();
      }
      if (isRightSwipe) {
        handlePreviousImage();
      }
    }
  };
  
  // Sync thumbnail navigation when current image changes
  useEffect(() => {
    if (currentImageIndex < thumbnailStartIndex) {
      setThumbnailStartIndex(currentImageIndex);
    } else if (currentImageIndex >= thumbnailStartIndex + visibleThumbnails) {
      setThumbnailStartIndex(Math.max(0, currentImageIndex - visibleThumbnails + 1));
    }
  }, [currentImageIndex, thumbnailStartIndex, visibleThumbnails]);
  
  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (productImages.length > 1) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          handlePreviousImage();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          handleNextImage();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productImages.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Product not found</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader currentUser={user} onLogout={handleLogout} />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="space-y-4">
          {/* Back button row */}
          <Button variant="ghost" onClick={() => router.push("/")} className="h-9 px-3 -ml-3">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {/* Title section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{product.name}</h1>
              <p className="text-muted-foreground">Product Details</p>
            </div>

            {/* Preview Toggle - Only show for product owners */}
            {user && product && user.id === product.sellerId && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Preview Mode</span>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      previewMode ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        previewMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {previewMode && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg">
                    <Eye className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Customer View</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview Mode Banner */}
        {user && product && user.id === product.sellerId && previewMode && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-medium text-primary">Customer Preview Mode</h3>
                <p className="text-sm text-primary/80">
                  This is exactly how customers see your product. Toggle off to return to editing mode.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Main Product Info */}
          <div className="lg:col-span-2 space-y-3 lg:space-y-4">
            {/* Product Image and Basic Info */}
            <Card className="border-primary/30">
              <CardContent className="p-3 lg:p-4">
                <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
                  <div>
                    {/* Dynamic Image Gallery with Navigation */}
                    {productImages.length > 0 ? (
                      <div className="space-y-3">
                        {/* Main Image Display with Navigation */}
                        <div className="relative">
                          <S3Image 
                            src={productImages[currentImageIndex]} 
                            alt={`${product.name} - Image ${currentImageIndex + 1}`}
                            className="w-full h-64 object-cover rounded-lg cursor-pointer select-none"
                          />
                          
                          {/* Image Counter - Only show when multiple images */}
                          {productImages.length > 1 && (
                            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                              {currentImageIndex + 1} / {productImages.length}
                            </div>
                          )}
                        </div>
                        
                        {/* Thumbnail Gallery with Navigation - Shopee style */}
                        {productImages.length > 1 && (
                          <div className="space-y-2">
                            <div className="relative">
                              {/* Thumbnail Container with Overlay Navigation */}
                              <div className="flex gap-2 overflow-hidden">
                                {productImages.slice(thumbnailStartIndex, thumbnailStartIndex + visibleThumbnails).map((image, displayIndex) => {
                                  const actualIndex = thumbnailStartIndex + displayIndex;
                                  const isFirst = displayIndex === 0;
                                  const isLast = displayIndex === visibleThumbnails - 1;
                                  const canScrollLeft = thumbnailStartIndex > 0;
                                  const canScrollRight = thumbnailStartIndex + visibleThumbnails < productImages.length;
                                  
                                  return (
                                    <div key={actualIndex} className="relative flex-shrink-0">
                                      <div
                                        onClick={() => handleThumbnailClick(actualIndex)}
                                        className="cursor-pointer"
                                      >
                                        <S3Image 
                                          src={image} 
                                          alt={`${product.name} - View ${actualIndex + 1}`}
                                          className={`w-16 h-16 object-cover rounded border-2 transition-all ${
                                            actualIndex === currentImageIndex 
                                              ? 'border-primary ring-2 ring-primary/20' 
                                              : 'border-border hover:border-primary'
                                          }`}
                                        />
                                      </div>
                                      
                                      {/* Left Chevron - Overlay on first thumbnail */}
                                      {isFirst && canScrollLeft && (
                                        <button
                                          onClick={handleThumbnailPrevious}
                                          className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 bg-white/90 hover:bg-white border border-black/20 rounded-sm shadow-sm flex items-center justify-center transition-all duration-200 z-10"
                                        >
                                          <ChevronLeft className="w-3 h-3 text-gray-700" />
                                        </button>
                                      )}
                                      
                                      {/* Right Chevron - Overlay on last thumbnail */}
                                      {isLast && canScrollRight && (
                                        <button
                                          onClick={handleThumbnailNext}
                                          className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 bg-white/90 hover:bg-white border border-black/20 rounded-sm shadow-sm flex items-center justify-center transition-all duration-200 z-10"
                                        >
                                          <ChevronRight className="w-3 h-3 text-gray-700" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* No images fallback */
                      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">No images available</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {(() => {
                          // Simplified pricing display
                          if (product.price && product.price > 0) {
                            return (
                              <>
                                <span className="text-xl md:text-2xl font-bold">{formatPrice(product.price)} MMK</span>
                                <span className="text-muted-foreground">per {product.unit}</span>
                              </>
                            );
                          } else {
                            return (
                              <>
                                <span className="text-xl md:text-2xl font-bold">Contact</span>
                                <span className="text-muted-foreground">for price</span>
                              </>
                            );
                          }
                        })()}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Available: {product.availableQuantity || 'Contact seller'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{product.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Updated {getRelativeTime(product.lastUpdated)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {(isOwnProduct && !previewMode) ? (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={() => router.push(`/product/${product.id}/edit`)}
                            className="flex-1 h-9 text-sm"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit Product
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => router.push(`/products/${product.id}/price-comparison`)}
                            className="flex-1 h-9 text-sm"
                          >
                            <BarChart3 className="w-3 h-3 mr-1" />
                            See Market Prices
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => setShowChatPopup(true)} className="flex-1 h-9 text-sm">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Contact Seller
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => router.push(`/products/${product.id}/price-comparison`)}
                            className="flex-1 h-9 text-sm"
                          >
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Compare Prices
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Description */}
            {product.description && (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Product Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">{product.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Order & Delivery Information */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order & Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Requirements */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Available Quantity */}
                  {product.availableQuantity && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        Available Stock
                      </h4>
                      <p className="text-sm text-muted-foreground">{product.availableQuantity}</p>
                    </div>
                  )}
                  
                  {/* Minimum Order */}
                  {product.minimumOrder && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        Minimum Order
                      </h4>
                      <p className="text-sm text-muted-foreground">{product.minimumOrder}</p>
                    </div>
                  )}
                </div>

                {/* Payment Terms - Always show for debugging */}
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    Payment Terms
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {product.paymentTerms && product.paymentTerms.length > 0 ? (
                      product.paymentTerms.map((term, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {term}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No payment terms specified</span>
                    )}
                  </div>
                </div>

                {/* Delivery Options - Always show for debugging */}
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    Delivery Options
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {product.deliveryOptions && product.deliveryOptions.length > 0 ? (
                      product.deliveryOptions.map((option, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {option}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No delivery options specified</span>
                    )}
                  </div>
                </div>


                {/* Additional Notes */}
                {product.additionalNotes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Info className="w-4 h-4 text-muted-foreground" />
                        Additional Information
                      </h4>
                      <div className="p-3 bg-muted/30 rounded-md border border-dashed border-muted-foreground/20">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">{product.additionalNotes}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Fallback message if no order info available */}
                {!product.availableQuantity && !product.minimumOrder && 
                 (!product.paymentTerms || product.paymentTerms.length === 0) && 
                 (!product.deliveryOptions || product.deliveryOptions.length === 0) && 
                 !product.additionalNotes && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p>Contact seller for detailed order information</p>
                    <p className="text-sm">Payment terms and delivery options available upon inquiry</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Seller Information Sidebar */}
          <div className="space-y-6">
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Seller Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="w-4 h-4 text-muted-foreground" />
                    <button 
                      className="font-medium text-primary hover:underline"
                      onClick={() => router.push(`/user/${product.sellerId}`)}
                    >
                      {product.sellerName}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserBadge 
                      userType={product.sellerType}
                      accountType={product.sellerVerificationStatus?.accountType || 'individual'}
                      verificationLevel={product.sellerVerificationStatus?.trustLevel || 'unverified'}
                      size="sm"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{product.location}</span>
                  </div>
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setShowReviewsModal(true)}
                  >
                    <div className="flex items-center">
                      {sellerStats && sellerStats.ratings && sellerStats.ratings.totalReviews > 0 ? (
                        Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(sellerStats.ratings.rating)
                                ? 'fill-yellow-500 text-yellow-500'
                                : i < sellerStats.ratings.rating
                                ? 'fill-yellow-500/50 text-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))
                      ) : (
                        <Star className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                    <span className="text-sm">
                      {sellerStats && sellerStats.ratings && sellerStats.ratings.totalReviews > 0 ? (
                        <>
                          {Number(sellerStats.ratings.rating).toFixed(1)} ({sellerStats.ratings.totalReviews} {sellerStats.ratings.totalReviews === 1 ? 'review' : 'reviews'})
                        </>
                      ) : sellerStats && sellerStats.ratings && sellerStats.ratings.totalReviews === 0 ? (
                        'No reviews yet'
                      ) : (
                        'Loading...'
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Usually responds within 24 hours</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {!isOwnProduct && (
                    <Button 
                      onClick={() => router.push(`/user/${product.sellerId}`)}
                      variant="outline" 
                      size="sm"
                      className="w-full"
                    >
                      <Store className="w-4 h-4 mr-2" />
                      View Full Storefront
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reviews Modal */}
      <Dialog open={showReviewsModal} onOpenChange={setShowReviewsModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Customer Reviews ({sellerStats?.ratings?.totalReviews || 0})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {sellerStats && sellerStats.reviews && sellerStats.reviews.length > 0 ? (
              sellerStats.reviews.map((review: any) => (
                <div key={review.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {review.reviewer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{review.reviewer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getRelativeTime(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm font-medium ml-1">
                        {review.rating}.0
                      </span>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No reviews yet</p>
                <p className="text-sm text-gray-400 mt-1">Be the first to leave a review!</p>
              </div>
            )}
            
            {sellerStats && sellerStats.ratings && sellerStats.ratings.totalReviews > sellerStats.reviews.length && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Showing {sellerStats.reviews.length} of {sellerStats.ratings.totalReviews} reviews
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Popup - Facebook Messenger Style (Same as Messages Page) */}
      {showChatPopup && user && product && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200">
            <ChatInterface
              otherPartyName={product.sellerName}
              otherPartyType={product.sellerType as 'farmer' | 'trader' | 'buyer'}
              otherPartyAccountType={product.sellerVerificationStatus?.accountType as 'individual' | 'business' || 'individual'}
              otherPartyLocation={product.location}
              otherPartyRating={sellerStats?.ratings?.rating || 0}
              productName={product.name}
              productId={product.id}
              otherPartyId={product.sellerId}
              onClose={() => setShowChatPopup(false)}
              otherPartyVerified={sellerStats?.verified || false}
              otherPartyProfileImage={sellerStats?.profileImage}
              otherPartyVerificationStatus={{
                trustLevel: (product.sellerVerificationStatus?.trustLevel as 'unverified' | 'under-review' | 'id-verified' | 'business-verified') || 'unverified',
                tierLabel: product.sellerVerificationStatus?.trustLevel === 'business-verified' ? 'Business ✓' : 
                          product.sellerVerificationStatus?.trustLevel === 'id-verified' ? 'Verified' : 'Unverified',
                levelBadge: product.sellerVerificationStatus?.trustLevel === 'unverified' ? '!' : '✓'
              }}
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit,
                image: product.imageUrl,
                sellerId: product.sellerId,
                availableQuantity: product.availableQuantity || '0'
              }}
              currentUser={user}
            />
          </div>
        </div>
      )}
    </div>
  );
}