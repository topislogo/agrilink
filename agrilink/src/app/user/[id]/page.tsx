"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { UserProfile } from "@/components/UserProfile";
import { SellerStorefront } from "@/components/SellerStorefront";
import { ChatInterface } from "@/components/ChatInterface";
import { updateStorefront } from "@/lib/storefront-utils";
import { toast, Toaster } from "sonner";

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  userType: "farmer" | "trader" | "buyer";
  accountType: "individual" | "business";
  joinedDate: string;
  location: string;
  profileImage?: string;
  phone?: string;
  website?: string;
  businessName?: string;
  businessDescription?: string;
  businessHours?: string;
  specialties?: string[];
  storefrontImage?: string;
  aboutme?: string;
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
      setIsLoading(true);
      const response = await fetch(`/api/user/${userId}/public`);
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Loaded user profile:', {
          businessDescription: data.user.businessDescription,
          description: data.user.description,
          website: data.user.website,
          facebook: data.user.facebook,
          instagram: data.user.instagram,
          whatsapp: data.user.whatsapp,
          tiktok: data.user.tiktok,
          allKeys: Object.keys(data.user || {})
        });
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
            console.log('📥 Merged user profile with products:', {
              businessDescription: mergedData.businessDescription,
              description: mergedData.description
            });
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
  const handleUpdateProfile = async (updates: any, fieldEdit: string) => {
    try {
      const token = localStorage.getItem('token');
      if (fieldEdit === 'socialmedia') {
        const response = await fetch(`/api/user/${userId}/social`, {
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
          toast.success('Profile updated successfully!');
        } else {
          const error = await response.json();
          toast.error(`Failed to update profile: ${error.message || "Unknown error"}`);
        }
      } else if (fieldEdit === 'profile') {
        const response = await fetch(`/api/user/${userId}/profile`, {
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
          toast.success("Profile updated successfully!");
        } else {
          const error = await response.json();
          toast.error(`Failed to update profile: ${error.message || "Unknown error"}`);
        }
      } else if (fieldEdit === 'business_details') {
        const updateKey = Object.keys(updates)[0];
        if (['returns', 'delivery', 'payment'].includes(updateKey)) {
          updates = { policies: { ...updates } };
        }

        const response = await fetch(`/api/user/${userId}/business_details`, {
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
          toast.success("Profile updated successfully!");
        } else {
          const error = await response.json();
          toast.error(`Failed to update profile: ${error.message || "Unknown error"}`);
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
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
            phone: userProfile.phone || '',
            userType: userProfile.userType as "farmer" | "trader",
            accountType: userProfile.accountType,
            location: userProfile.location || '',
            description: (userProfile as any).storefrontDescription || (userProfile as any).businessDescription || '',
            businessDescription: userProfile.businessDescription || '',
            storefrontDelivery: (userProfile as any).storefrontDelivery || '',
            storefrontPaymentMethods: (userProfile as any).storefrontPaymentMethods || '',
            storefrontReturnPolicy: (userProfile as any).storefrontReturnPolicy || '',
            image: userProfile.profileImage || '',
            storefrontImage: userProfile.storefrontImage || '',
            rating: userProfile.ratings?.rating || 0,
            totalReviews: userProfile.ratings?.totalReviews || 0,
            yearsActive: 0,
            website: userProfile.website || '',
            social: userProfile.social || {},
            specialties: userProfile.specialties || [],
            businessName: userProfile.businessName || '',
            responseTime: userProfile.ratings?.responseTime || '',
            joinedDate: userProfile.joinedDate,
            verified: userProfile.verification?.verified || false,
            facebook: (userProfile as any).facebook || '',
            instagram: (userProfile as any).instagram || '',
            whatsapp: (userProfile as any).whatsapp || '',
            tiktok: (userProfile as any).tiktok || ''
          }}
          products={userProfile.products || []}
          onBack={() => router.back()}
          onViewProduct={(productId) => router.push(`/product/${productId}`)}
          onChat={handleChat}
          onEditProduct={(productId) => router.push(`/product/${productId}/edit`)}
          isOwnStorefront={isOwnProfile}
          onEditStorefrontImage={() => {
            console.log('Edit storefront image');
          }}
          onUpdateStorefront={async (updates) => {
            try {
              const responseData = await updateStorefront(updates, async () => {
                // Wait a bit to ensure database commit completes
                await new Promise(resolve => setTimeout(resolve, 500));
                await loadUserProfile();
              });

              // Update userProfile immediately with the response data if available
              if (responseData?.user) {
                setUserProfile((prev: any) => ({
                  ...prev,
                  storefrontDescription: responseData.user.storefrontDescription,
                  storefrontDelivery: responseData.user.storefrontDelivery,
                  storefrontPaymentMethods: responseData.user.storefrontPaymentMethods,
                  storefrontReturnPolicy: responseData.user.storefrontReturnPolicy,
                  storefrontBusinessHours: responseData.user.storefrontBusinessHours,
                  website: responseData.user.website,
                  facebook: responseData.user.facebook,
                  instagram: responseData.user.instagram,
                  whatsapp: responseData.user.whatsapp,
                  tiktok: responseData.user.tiktok
                }));
              }
              toast.success('Storefront updated successfully!');
            } catch (error: any) {
              console.error('❌ Error updating storefront:', error);
              toast.error(`Failed to update storefront: ${error.message || "Unknown error"}`);
              throw error;
            }
          }}
          previewMode={false}
          onTogglePreviewMode={(mode) => {
            console.log('Toggle preview mode:', mode);
          }}
          currentUser={currentUser}
          />
        </div>
        ) : (
        <UserProfile
          userProfile={userProfile as any}
          currentUser={currentUser}
          onBack={() => router.back()}
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
      <AppFooter />
      <Toaster />
    </div>
  );
}
