"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { SellerStorefront } from "@/components/SellerStorefront";
import { ChatInterface } from "@/components/ChatInterface";
import { updateStorefront } from "@/lib/storefront-utils";
import { toast, Toaster } from "sonner";

export default function SellerStorefrontPage() {
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [imageMessage, setImageMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();
  const params = useParams();
  const sellerId = params.id as string;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    loadSellerData();
  }, [sellerId]);

  const loadSellerData = async () => {
    try {
      const [sellerResponse, productsResponse] = await Promise.all([
        fetch(`/api/user/${sellerId}/public`),
        fetch(`/api/products?sellerId=${sellerId}`)
      ]);
      const sellerData = await sellerResponse.json();
      if (sellerResponse.ok) {
        setSeller(sellerData.user);
      }

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.products || []);
      }
    } catch (error) {
      console.error("Error loading seller data:", error);
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

  const handleChat = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setIsChatOpen(true);
    }
  };

  // Check if current user is the storefront owner
  const isOwnStorefront = user && seller && user.id === seller.id;

  // Preview mode toggle handler
  const handleTogglePreviewMode = (mode: boolean) => {
    setPreviewMode(mode);
  };

  // Handle storefront image upload
  const handleEditStorefrontImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Clear any previous messages
      setImageMessage(null);
      
      // Validate file
      if (!file.type.startsWith('image/')) {
        setImageMessage({ type: 'error', text: 'Please select a valid image file' });
        setTimeout(() => setImageMessage(null), 5000);
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setImageMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        setTimeout(() => setImageMessage(null), 5000);
        return;
      }

      try {
        // Convert to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          
          // Update via API
          const token = localStorage.getItem('token');
          const requestBody = {
            storefrontImage: dataUrl
          };
          
          console.log('🖼️ Uploading storefront image:', {
            hasToken: !!token,
            dataUrlLength: dataUrl.length,
            dataUrlPreview: dataUrl.substring(0, 50) + '...'
          });
          
          const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            throw new Error(`Failed to update storefront image: ${response.status}`);
          }

          const responseData = await response.json();
          console.log('✅ API Response:', responseData);

          // Update local state with the S3 key returned from API
          setSeller((prev: any) => ({
            ...prev,
            storefrontImage: responseData.user?.storefrontImage || responseData.storefrontImage || dataUrl
          }));

          setImageMessage({ type: 'success', text: 'Storefront image updated successfully!' });
          setTimeout(() => setImageMessage(null), 5000);
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Failed to upload image:', error);
        setImageMessage({ type: 'error', text: 'Failed to upload image. Please try again.' });
        setTimeout(() => setImageMessage(null), 5000);
      }
    };
    input.click();
  };

  // Handle storefront updates - use the shared updateStorefront utility
  const handleUpdateStorefront = async (updates: any) => {
    try {
      const responseData = await updateStorefront(updates, async () => {
        // Wait a bit to ensure database commit completes
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadSellerData();
      });

      // Update seller state immediately with the response data if available
      if (responseData?.user) {
        setSeller((prev: any) => ({
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
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading storefront...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Storefront not found</p>
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
        <SellerStorefront
          seller={seller}
          products={products}
          onBack={() => router.back()}
          onViewProduct={(productId) => router.push(`/product/${productId}`)}
          onChat={handleChat}
          onEditProduct={(productId) => router.push(`/product/${productId}/edit`)}
          isOwnStorefront={isOwnStorefront}
          onEditStorefrontImage={handleEditStorefrontImage}
          onUpdateStorefront={handleUpdateStorefront}
          previewMode={previewMode}
          onTogglePreviewMode={handleTogglePreviewMode}
          currentUser={user}
          imageMessage={imageMessage}
        />
      </div>

      {/* Chat Popup */}
      {isChatOpen && selectedProduct && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200">
            <ChatInterface key={`${selectedProduct.id}-${seller.id}`}
              otherPartyName={seller.name}
              otherPartyType={seller.userType}
              otherPartyAccountType={seller.accountType}
              otherPartyLocation={seller.location}
              otherPartyRating={seller.ratings?.rating || 0}
              productName={selectedProduct.name}
              productId={selectedProduct.id}
              otherPartyId={seller.id}
              onClose={() => {
                setIsChatOpen(false);
                setSelectedProduct(null);
              }}
              otherPartyVerified={seller.verified || false}
              currentUserVerified={user?.verified || false}
              currentUserType={user?.userType || 'buyer'}
              otherPartyProfileImage={seller.profileImage}
              otherPartyVerificationStatus={{
                trustLevel: seller.verified ? (seller.accountType === 'business' ? 'business-verified' : 'id-verified') : 'unverified',
                tierLabel: seller.verified ? (seller.accountType === 'business' ? 'Business ✓' : 'Verified') : 'Unverified',
                levelBadge: seller.verified ? (seller.accountType === 'business' ? '✓' : '✓') : '⚠'
              }}
              product={{
                id: selectedProduct.id,
                name: selectedProduct.name,
                price: selectedProduct.price,
                unit: selectedProduct.unit,
                image: selectedProduct.imageUrl,
                sellerId: seller.id,
                availableQuantity: selectedProduct.availableQuantity || '0'
              }}
              currentUser={user}
            />
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
}