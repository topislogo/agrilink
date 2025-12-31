"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { FreshDashboard } from "@/components/FreshDashboard";
import { BuyerDashboard } from "@/components/BuyerDashboard";
import { AppHeader } from "@/components/AppHeader";
import { User } from "@/hooks/useAuth";
import { ChatInterface } from "@/components/ChatInterface";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  imageUrl?: string;
  sellerId?: string;
  availableQuantity?: string;
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
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const router = useRouter();

  const fetchUserProducts = async (userId: string) => {
    try {
      console.log('🔄 Fetching user products for:', userId);
      const response = await fetch(`/api/products?sellerId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📥 User products fetched:', data.products?.length || 0, 'products');
        setUserProducts(data.products || []);
      } else {
        console.error('❌ Failed to fetch user products:', response.status, response.statusText);
        setUserProducts([]);
      }
    } catch (error) {
      console.error("❌ Error fetching user products:", error);
      setUserProducts([]);
    }
  };

  const fetchSavedProducts = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/saved-products?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSavedProducts(data.savedProducts || []);
      }
    } catch (error) {
      console.error("Error fetching saved products:", error);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setAllProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching all products:", error);
    }
  };

  const refreshProductsList = async () => {
    if (user?.id) {
      console.log('🔄 Refreshing products list...');
      await fetchUserProducts(user.id);
    }
  };

  const refreshUserData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/api/user/profile", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const updatedUser = data.user;
        
        // Update localStorage with fresh data
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Update component state
        setUser(updatedUser);
        
        console.log("✅ Dashboard: User data refreshed from API");
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

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
      
      // Fetch data based on user type
      if (parsedUser.id) {
        if (parsedUser.userType === 'buyer') {
          fetchSavedProducts(parsedUser.id);
          fetchAllProducts();
        } else {
          fetchUserProducts(parsedUser.id);
        }
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    } finally {
      setIsLoading(false);
    }

    // Refresh user data when page becomes visible (user navigates back from verification)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page became visible, refreshing data...');
        refreshUserData();
        refreshProductsList();
      }
    };

    const handleFocus = () => {
      console.log('🔄 Page focused, refreshing data...');
      refreshUserData();
      refreshProductsList();
    };

    // Listen for offer status changes to refresh available quantities
    const handleOfferStatusChange = (event: CustomEvent) => {
      console.log('🔄 Dashboard: Offer status changed, refreshing products...', event.detail);
      refreshProductsList();
    };

    // Listen for page focus and visibility changes
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('offerStatusChanged', handleOfferStatusChange as EventListener);

    // Also refresh user data on mount to ensure we have the latest data
    refreshUserData();

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('offerStatusChanged', handleOfferStatusChange as EventListener);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getVerificationStatus = () => {
    if (user.verified && user.phoneVerified) {
      return { status: "verified", color: "bg-green-100 text-green-800", icon: CheckCircle };
    } else if (user.verificationStatus === "under_review") {
      return { status: "under_review", color: "bg-blue-100 text-blue-800", icon: Clock };
    } else {
      return { status: "unverified", color: "bg-red-100 text-red-800", icon: AlertCircle };
    }
  };

  const verificationInfo = getVerificationStatus();
  const VerificationIcon = verificationInfo.icon;

  const handleOpenChat = async (productId: string, sellerId: string) => {
    // Find the product and seller data
    //const product = savedProducts.find(p => p.id === productId);
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    // Open chat immediately with available product data
    setSelectedProduct(product);
    setIsChatOpen(true);
    
    // Set initial seller data from product (may not have profileImage)
    setSelectedSeller({
      id: sellerId,
      name: product.seller.name,
      userType: product.seller.userType,
      location: product.seller.location,
      verified: product.seller.verified,
      accountType: product.seller.accountType,
      ratings: { rating: 0 },
      profileImage: null // Will be updated below
    });
    console.log('💬 Opening chat for product:', productId, 'with seller:', sellerId);
    // Fetch full seller profile in background to get profileImage and other details
    // Use the same approach as notification handler
    try {
      // Determine which API endpoint to use based on user type
      const isSeller = product.seller.userType === 'farmer' || product.seller.userType === 'trader';
      const profileRoute = `/api/user/${sellerId}/public`;
      
      const profileResponse = await fetch(profileRoute);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const fullSellerData = profileData.stats || profileData.user || profileData;
        
        // Update seller data with full profile including profileImage
        setSelectedSeller({
          id: sellerId,
          name: fullSellerData.name || product.seller.name,
          userType: fullSellerData.userType || product.seller.userType,
          location: fullSellerData.location || product.seller.location,
          verified: fullSellerData.verified ?? product.seller.verified,
          accountType: fullSellerData.accountType || product.seller.accountType,
          ratings: fullSellerData.ratings || { rating: 0 },
          profileImage: fullSellerData.profileImage || null
        });
        console.log('✅ Fetched full seller profile with profileImage:', fullSellerData.profileImage ? 'Yes' : 'No');
      } else {
        console.warn('⚠️ Failed to fetch full seller profile, using product data');
      }
    } catch (error) {
      console.error('Error fetching seller profile:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader currentUser={user} onLogout={handleLogout} />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {user.userType === 'buyer' ? (
          <BuyerDashboard
            user={user as any}
            allProducts={allProducts}
            savedProducts={savedProducts}
            onGoToMarketplace={() => router.push("/")}
            onViewProduct={(productId) => router.push(`/product/${productId}`)}
            onStartChat = {(productId, sellerId) => handleOpenChat(productId, sellerId)}
            onViewMessages={() => router.push("/messages")}
            onShowVerification={() => router.push("/verify")}
          />
        ) : (
          <FreshDashboard
            user={user}
            userProducts={userProducts}
            onAddListing={() => router.push("/products/new")}
            onEditListing={(product) => router.push(`/product/${product.id}/edit`)}
            onDeleteListing={async (productId) => {
              console.log('🗑️ Starting delete process for product:', productId);
              
              // First, check if the product exists in our local state
              const product = userProducts.find(p => p.id === productId);
              console.log('🔍 Product found in local state:', product);
              
              if (!product) {
                console.warn('⚠️ Product not found in local state, but proceeding with delete attempt');
              }
              
              try {
                const token = localStorage.getItem("token") || localStorage.getItem("auth-token");
                console.log('🔐 Token status:', token ? 'present' : 'missing');
                
                if (!token) {
                  throw new Error('No authentication token found. Please log in again.');
                }

                console.log('🚀 Making DELETE request to:', `/api/products/${productId}`);
                
                const response = await fetch(`/api/products/${productId}`, {
                  method: "DELETE",
                  headers: {
                    "Authorization": `Bearer ${token}`,
                  },
                });

                console.log('📡 DELETE API Response:', {
                  status: response.status,
                  statusText: response.statusText,
                  ok: response.ok,
                  url: response.url
                });

                let result;
                try {
                  result = await response.json();
                } catch (parseError) {
                  console.error('❌ Failed to parse API response:', parseError);
                  result = {};
                }

                console.log('📥 DELETE API Result:', result);

                if (!response.ok) {
                  console.error("❌ Delete API Error Response:", {
                    status: response.status,
                    statusText: response.statusText,
                    result: result,
                    isEmpty: Object.keys(result).length === 0,
                    productId: productId,
                    productName: product?.name
                  });
                  
                  // Provide more specific error messages based on status code
                  let errorMessage = "Failed to delete product";
                  if (response.status === 404) {
                    errorMessage = `Product "${product?.name || productId}" not found. It may have already been deleted.`;
                  } else if (response.status === 401) {
                    errorMessage = "Authentication failed. Please log in again.";
                  } else if (response.status === 403) {
                    errorMessage = "You don't have permission to delete this product.";
                  } else if (response.status === 500) {
                    errorMessage = "Server error. Please try again later.";
                  }
                  
                  throw new Error(result.message || errorMessage);
                }

                console.log("✅ Product deleted successfully:", result);
                
                // Remove the product from the local state immediately
                setUserProducts(prev => prev.filter(p => p.id !== productId));
                
                // Add a small delay before refreshing to ensure database consistency
                setTimeout(async () => {
                  console.log('🔄 Refreshing products list after successful deletion...');
                  await refreshProductsList();
                }, 500);
                
                // Show success message
                const productName = product?.name || 'Product';
                alert(`Product "${productName}" deleted successfully!`);
                
              } catch (err) {
                console.error("❌ Error deleting product:", err);
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                alert(`Failed to delete product: ${errorMessage}`);
                
                // Refresh the products list to sync with server state
                console.log('🔄 Refreshing products list due to delete error...');
                if (user?.id) {
                  fetchUserProducts(user.id);
                }
              }
            }}
            onViewStorefront={() => router.push(`/seller/${user.id}`)}
            onGoToMarketplace={() => router.push("/")}
            onViewProduct={(productId) => router.push(`/product/${productId}`)}
            onShowVerification={() => router.push("/verify")}
            onViewMessages={() => router.push("/messages")}
          />
        )}
      </div>

      {/* Chat Popup */}
        {isChatOpen && selectedProduct && selectedSeller && user && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200">
              <ChatInterface key={`${selectedProduct.id}-${selectedSeller.id}`}
                otherPartyName={selectedSeller.name}
                otherPartyType={selectedSeller.userType}
                otherPartyAccountType={selectedSeller.accountType || 'individual'}
                otherPartyLocation={selectedSeller.location || ''}
                otherPartyRating={selectedSeller.ratings?.rating || 0}
                productName={selectedProduct.name}
                productId={selectedProduct.id}
                otherPartyId={selectedSeller.id}
                onClose={() => {
                  setIsChatOpen(false);
                  setSelectedProduct(null);
                  setSelectedSeller(null);
                }}
                otherPartyVerified={selectedSeller.verified || false}
                otherPartyProfileImage={selectedSeller.profileImage}
                otherPartyVerificationStatus={{
                  trustLevel: selectedSeller.verified ? (selectedSeller.accountType === 'business' ? 'business-verified' : 'id-verified') : 'unverified',
                  tierLabel: selectedSeller.verified ? (selectedSeller.accountType === 'business' ? 'Business ✓' : 'Verified') : 'Unverified',
                  levelBadge: selectedSeller.verified ? (selectedSeller.accountType === 'business' ? '✓' : '✓') : '⚠'
                }}
                product={{
                  id: selectedProduct.id,
                  name: selectedProduct.name,
                  price: selectedProduct.price,
                  unit: selectedProduct.unit,
                  image: selectedProduct.imageUrl,
                  sellerId: selectedSeller.id,
                  availableQuantity: selectedProduct.availableQuantity || '0'
                }}
                currentUser={user}
              />
            </div>
          </div>
        )}
    </div>
  );
}