"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { UserProfile } from "@/components/UserProfile";
import { SellerStorefront } from "@/components/SellerStorefront";
import { ChatInterface } from "@/components/ChatInterface";

interface UserProfileData {
  id: string;
  name: string;
  userType: string;
  accountType: string;
  joinedDate: string;
  location: string;
  profileImage?: string;
  phone?: string;
  website?: string;
  businessName?: string;
  businessDescription?: string;
  businessHours?: string;
  specialties?: string[];
  policies?: {
    returns?: string;
    delivery?: string;
    payment?: string;
  };
  social?: {
    facebook?: string;
    instagram?: string;
    telegram?: string;
    whatsapp?: string;
    tiktok?: string;
  };
  verification?: {
    verified: boolean;
    phoneVerified: boolean;
    verificationStatus: string;
  };
  ratings?: {
    rating: number;
    totalReviews: number;
    responseTime?: string;
    qualityCertifications?: string[];
    farmingMethods?: string[];
  };
  products?: any[];
  reviews?: any[];
}

export default function UserProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`/api/user/${userId}/public`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        
        // For sellers, also load their products
        if (data.user.userType === 'farmer' || data.user.userType === 'trader') {
          const productsResponse = await fetch(`/api/products?sellerId=${userId}`);
          if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            const mergedData = { 
              ...data.user, 
              products: productsData.products || []
            };
            setUserProfile(mergedData);
          }
        }
      } else {
        console.error("Failed to load user profile");
        router.push("/");
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
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

  // Preview mode toggle handler
  const handleTogglePreviewMode = (mode: boolean) => {
    setPreviewMode(mode);
  };

  // Handle profile updates
  const handleUpdateProfile = async (updates: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // Update local state
        setUserProfile(prev => prev ? { ...prev, ...updates } : null);
        setCurrentUser((prev: any) => prev ? { ...prev, ...updates } : null);
        alert('Profile updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update profile: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">User profile not found</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === userProfile.id;

  const isSeller = userProfile.userType === 'farmer' || userProfile.userType === 'trader';

  const handleChat = (productId: string) => {
    const product = userProfile.products?.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setIsChatOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader currentUser={currentUser} onLogout={handleLogout} />
      
      {isSeller ? (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <SellerStorefront
          seller={{
            id: userProfile.id,
            name: userProfile.name,
            email: userProfile.email || '',
            type: userProfile.userType as "farmer" | "trader",
            accountType: userProfile.accountType,
            location: userProfile.location || '',
            description: (userProfile as any).description || '',
            image: userProfile.profileImage || '',
            storefrontImage: userProfile.storefrontImage || '',
            rating: userProfile.ratings?.rating || 0,
            totalReviews: userProfile.ratings?.totalReviews || 0,
            yearsActive: 0,
            responseTime: userProfile.ratings?.responseTime || '',
            certifications: userProfile.ratings?.qualityCertifications || [],
            joinedDate: userProfile.joinedDate,
            verified: userProfile.verification?.verified || false
          }}
          products={userProfile.products || []}
          onBack={() => router.push("/")}
          onViewProduct={(productId) => router.push(`/product/${productId}`)}
          onChat={handleChat}
          onEditProduct={(productId) => router.push(`/product/${productId}/edit`)}
          isOwnStorefront={isOwnProfile}
          onEditStorefrontImage={() => {
            // TODO: Implement image editing
            console.log('Edit storefront image');
          }}
          onUpdateStorefront={async (updates) => {
            // TODO: Implement storefront updates
            console.log('Update storefront:', updates);
          }}
          previewMode={false}
          onTogglePreviewMode={(mode) => {
            // TODO: Implement preview mode
            console.log('Toggle preview mode:', mode);
          }}
          currentUser={currentUser}
          />
        </div>
        ) : (
        <UserProfile
          userProfile={userProfile as any}
          currentUser={currentUser}
          onBack={() => router.push("/")}
          isOwnProfile={isOwnProfile}
          previewMode={previewMode}
          onTogglePreviewMode={handleTogglePreviewMode}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {/* Chat Popup */}
      {isChatOpen && selectedProduct && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200">
            <ChatInterface
              otherPartyName={userProfile.name}
              otherPartyType={userProfile.userType}
              otherPartyAccountType={userProfile.accountType}
              otherPartyLocation={userProfile.location || ''}
              otherPartyRating={userProfile.ratings?.rating || 0}
              productName={selectedProduct.name}
              productId={selectedProduct.id}
              otherPartyId={userProfile.id}
              onClose={() => {
                setIsChatOpen(false);
                setSelectedProduct(null);
              }}
              otherPartyVerified={userProfile.verification?.verified || false}
              currentUserVerified={currentUser?.verified || false}
              currentUserType={currentUser?.userType || 'buyer'}
              otherPartyProfileImage={userProfile.profileImage}
              otherPartyVerificationStatus={{
                trustLevel: userProfile.verification?.verified ? (userProfile.accountType === 'business' ? 'business-verified' : 'id-verified') : 'unverified',
                tierLabel: userProfile.verification?.verified ? (userProfile.accountType === 'business' ? 'Business ✓' : 'Verified') : 'Unverified',
                levelBadge: userProfile.verification?.verified ? (userProfile.accountType === 'business' ? '✓' : '✓') : '⚠'
              }}
              product={{
                id: selectedProduct.id,
                name: selectedProduct.name,
                price: selectedProduct.price,
                unit: selectedProduct.unit,
                image: selectedProduct.imageUrl,
                sellerId: userProfile.id,
                availableQuantity: selectedProduct.availableQuantity || '0'
              }}
              currentUser={currentUser}
            />
          </div>
        </div>
      )}
    </div>
  );
}
