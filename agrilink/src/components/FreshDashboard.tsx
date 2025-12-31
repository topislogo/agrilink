"use client";

import { useState, useEffect } from "react";
import { formatMemberSinceDate, getRelativeTime } from "../utils/dates";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { UserBadge, getUserVerificationLevel, getUserAccountType } from "./UserBadgeSystem";
import { Alert, AlertDescription } from "./ui/alert";
import { EmailVerificationPrompt } from "./EmailVerificationPrompt";
import { S3Image } from './S3Image';
import { 
  Plus, 
  Eye, 
  Edit3,
  Trash2,
  Store,
  ArrowRight,
  Package,
  MessageSquare,
  TrendingUp,
  Users,
  Shield,
  Star,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  availableQuantity?: string;
  imageUrl?: string;
  seller: {
    id: string;
    name: string;
    userType: string;
    location: string;
    verified?: boolean;
    phoneVerified?: boolean;
    verificationStatus?: string;
    accountType?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface FreshDashboardProps {
  user: any;
  userProducts?: Product[];
  onAddListing?: () => void;
  onEditListing?: (product: Product) => void;
  onDeleteListing?: (productId: string) => void;
  onViewStorefront?: () => void;
  onGoToMarketplace?: () => void;
  onViewProduct?: (productId: string) => void;
  onShowVerification?: () => void;
  onViewMessages?: () => void;
}

export function FreshDashboard({ 
  user, 
  userProducts = [], 
  onAddListing, 
  onEditListing, 
  onDeleteListing,
  onViewStorefront,
  onGoToMarketplace,
  onViewProduct,
  onShowVerification,
  onViewMessages
}: FreshDashboardProps) {
  
  const [analytics, setAnalytics] = useState({
    monthlyInquiries: 0,
    monthlyProfileViews: 0,
    monthlyProductViews: 0
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        // Simulate analytics data based on user products
        const mockAnalytics = {
          monthlyInquiries: Math.floor(userProducts.length * (user.verified ? 8 : 3)),
          monthlyProfileViews: Math.floor(userProducts.length * (user.verified ? 25 : 12)),
          monthlyProductViews: Math.floor(userProducts.length * (user.verified ? 15 : 8))
        };
        setAnalytics(mockAnalytics);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    if (user.id) {
      fetchAnalytics();
    }
  }, [user.id, userProducts.length, user.verified]);

  const totalProducts = userProducts.length;
  const recentProducts = userProducts.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-6 border border-primary/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome back, {user.name.split(' ')[0]}!
                </h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {user.businessName || `${user.name}'s ${user.userType === 'farmer' ? 'Farm' : 'Trading'}`} • {user.location}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Member since {formatMemberSinceDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserBadge 
                  userType={user.userType}
                  accountType={getUserAccountType(user)}
                  verificationLevel={getUserVerificationLevel(user)}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Verification Prompt */}
              <EmailVerificationPrompt 
                user={user}
                onResendVerification={async () => {
                  const token = localStorage.getItem('token');
                  if (!token) {
                    console.error('No token found for resend verification');
                    throw new Error('No authentication token found');
                  }
                  
                  try {
                    console.log('🔄 Attempting to resend verification email...');
                    const response = await fetch('/api/auth/resend-verification', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    });
                    
                    console.log('📧 Resend verification response status:', response.status);
                    console.log('📧 Resend verification response headers:', Object.fromEntries(response.headers.entries()));
                    
                    if (!response.ok) {
                      let errorData;
                      try {
                        const responseText = await response.text();
                        console.log('📧 Resend verification response body:', responseText);
                        errorData = responseText ? JSON.parse(responseText) : { error: 'Empty response' };
                      } catch (parseError) {
                        console.error('❌ Failed to parse error response:', parseError);
                        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
                      }
                      
                      // Handle rate limiting gracefully
                      if (response.status === 429 && errorData.recentlySent) {
                        console.log('⏰ Rate limited - email was recently sent');
                        // Instead of throwing an error, we'll handle this in the calling component
                        return { 
                          success: false, 
                          rateLimited: true, 
                          message: 'Please wait 10 seconds before requesting another verification email.' 
                        };
                      }
                      
                      console.error('❌ Resend verification failed:', errorData);
                      throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const result = await response.json();
                    console.log('✅ Resend verification successful:', result);
                    return { success: true, message: result.message };
                  } catch (error) {
                    console.error('❌ Error resending verification email:', error);
                    throw error;
                  }
                }}
                variant="banner"
                className="mb-6"
              />

      {/* Verification Status Alerts */}
      {(() => {
        // Helper function to determine verification progress
        const getVerificationProgress = () => {
          console.log('🔍 Dashboard verification status check:', {
            verified: user.verified,
            phoneVerified: user.phoneVerified,
            verificationStatus: user.verificationStatus,
            verificationSubmitted: user.verificationSubmitted,
            userType: user.userType,
            accountType: user.accountType
          });

          if (user.verified) return 'verified';
          
          // Check for rejection status first
          if (user.verificationStatus === 'rejected') {
            return 'rejected';
          }
          
          // Check for under-review status (support both formats for backward compatibility)
          if (user.verificationStatus === 'under-review' || 
              user.verificationStatus === 'under_review' || 
              user.verificationSubmitted) {
            return 'under-review';
          }
          
          // Check if user has started verification process
          const hasPhoneVerification = user.phoneVerified === true;
          
          // For individual buyers, only phone verification is needed
          // For business buyers, full verification is needed (same as farmers/traders)
          if (user.userType === 'buyer') {
            if (user.accountType === 'business') {
              // Business buyers need full verification like business farmers/traders
              return hasPhoneVerification ? 'in-progress' : 'not-started';
            } else {
              // Individual buyers only need phone verification
              return hasPhoneVerification ? 'verified' : 'not-started';
            }
          }
          
          // For farmers/traders, check overall progress
          if (hasPhoneVerification) {
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
                      console.log('🔄 View Rejection Details clicked');
                      window.location.href = '/verify';
                    }}
                  >
                    View Rejection Details
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
        
        // Default: not-started
        return (
          <Alert className="border-red-200 bg-gradient-to-r from-red-50 to-red-100">
            <Shield className="h-5 w-5" style={{ color: '#dc2626' }} />
            <AlertDescription>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-red-700">Boost Your Sales with Verification!</span>
                  </div>
                  <p className="text-sm text-red-600">
                    Verified {user.userType}s get 3x more inquiries, featured listings, and buyer trust
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Products</p>
                <p className="text-3xl font-bold text-primary">{totalProducts}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalProducts > 0 ? 'Great inventory!' : 'Add your first product'}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Inquiries</p>
                <p className="text-3xl font-bold text-primary">
                  {analyticsLoading ? '...' : analytics.monthlyInquiries}
                </p>
                <p className="text-xs text-primary/80 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {analyticsLoading ? 'Loading...' : 
                   analytics.monthlyInquiries > 0 ? 'This month' : 'Add products to start'
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profile Views</p>
                <p className="text-3xl font-bold text-primary">
                  {analyticsLoading ? '...' : analytics.monthlyProfileViews}
                </p>
                <p className="text-xs text-primary/80 mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {analyticsLoading ? 'Loading...' : 'This month'}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Mobile First */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('✨ Quick Add Product clicked');
            onAddListing?.();
          }}
          disabled={!user || user.isRestricted}
          className={`h-12 justify-start gap-3 bg-primary hover:bg-primary/90`}>
          <Plus className="w-5 h-5" />
          Add New Product
        </Button>
        
        <Button 
          onClick={() => {
            console.log('👁️ View Storefront clicked');
            onViewStorefront?.();
          }}
          variant="outline"
          className="h-12 justify-start gap-3"
        >
          <Store className="w-5 h-5" />
          View Storefront
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
      </div>

      {/* Products Section */}
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                My Products ({totalProducts})
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your product listings and track performance
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {totalProducts === 0 ? (
            /* Empty State */
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                <Package className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Ready to start selling?</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Add your first product to connect with buyers across Myanmar. 
                  {user.userType === 'farmer' 
                    ? ' Share your fresh produce with customers who value quality.'
                    : ' Start distributing quality agricultural products to retailers and businesses.'
                  }
                </p>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🎯 Add First Product clicked');
                    onAddListing?.();
                  }}
                  disabled={!user || user.isRestricted}
                  size="lg"
                  className="h-12 px-8"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Product
                </Button>
                <p className="text-xs text-muted-foreground">
                  Takes less than 5 minutes to create your first listing
                </p>
              </div>
            </div>
          ) : (
            /* Products List */
            <div className="space-y-4">
              {userProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  {/* Product Image */}
                  <div className="shrink-0">
                    <S3Image 
                      src={product.imageUrl || "/api/placeholder/400/300"} 
                      alt={product.name}
                      className="w-full sm:w-20 h-48 sm:h-20 object-cover rounded-lg"
                    />
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-lg">{product.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium text-primary text-base">
                            {product.price ? `${product.price.toLocaleString()} MMK` : 'Contact for price'}
                          </span>
                          {product.unit && (
                            <>
                              <span>/</span>
                              <span>{product.unit}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions - Mobile First */}
                      <div className="flex gap-2 sm:shrink-0">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            console.log('👁️ View Product:', product.id);
                            onViewProduct?.(product.id);
                          }}
                          className="h-9"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline ml-2">View</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            console.log('✏️ Edit Product:', product.id);
                            onEditListing?.(product);
                          }}
                          className="h-9"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span className="hidden sm:inline ml-2">Edit</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            console.log('🗑️ Delete Product:', product.id);
                            if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
                              onDeleteListing?.(product.id);
                            }
                          }}
                          className="text-destructive hover:text-destructive h-9"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline ml-2">Delete</span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {parseInt(product.availableQuantity || '0') === 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Out of Stock
                          </span>
                        ) : (
                          `Available: ${product.availableQuantity || 'N/A'}`
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {product.seller.location}
                      </span>
                      <span>Updated {getRelativeTime(product.updatedAt || product.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Show More Button if many products */}
              {totalProducts > 5 && (
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      console.log('🔍 View All Products clicked');
                      onViewStorefront?.();
                    }}
                  >
                    View All {totalProducts} Products
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}