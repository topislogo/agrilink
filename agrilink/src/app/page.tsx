"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { MarketplaceHero } from "@/components/MarketplaceHero";
import { SearchFilters } from "@/components/SearchFilters";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { AppFooter } from "@/components/AppFooter";
import { Pagination } from "@/components/Pagination";
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

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  // Chat popup state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    // Fetch products from API
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
          setFilteredProducts(data.products || []);
        } else {
          console.error('Failed to fetch products:', response.status);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter out current user's products when both products and currentUser are available
  useEffect(() => {
    if (products.length > 0) {
      if (currentUser?.id) {
        // Filter out current user's own products
        const filtered = products.filter(product => product.sellerId !== currentUser.id);
        setFilteredProducts(filtered);
      } else {
        // No current user, show all products
        setFilteredProducts(products);
      }
    }
  }, [products, currentUser]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    router.push("/login");
  };

  const handleGoToLogin = () => {
    router.push("/login");
  };

  const handleGoToRegister = () => {
    router.push("/register");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  const handleViewMessages = () => {
    router.push("/messages");
  };

  const handleViewProfile = () => {
    router.push("/profile");
  };

  const handleEditProfile = () => {
    router.push("/profile");
  };

  const handleShowVerification = () => {
    router.push("/verify");
  };

  const handleViewStorefront = (sellerId: string) => {
    router.push(`/seller/${sellerId}`);
  };

  const handleOpenChat = async (sellerId: string, productId: string) => {
    // Find the product and seller data
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Fetch seller details
    try {
      const response = await fetch(`/api/seller/${sellerId}`);
      if (response.ok) {
        const sellerData = await response.json();
        setSelectedSeller(sellerData);
        setSelectedProduct(product);
        setIsChatOpen(true);
      } else {
        // Fallback to basic seller data from product
        setSelectedSeller({
          id: sellerId,
          name: product.seller.name,
          userType: product.seller.userType,
          location: product.seller.location,
          verified: product.seller.verified,
          accountType: product.seller.accountType,
          ratings: { rating: 0 }
        });
        setSelectedProduct(product);
        setIsChatOpen(true);
      }
    } catch (error) {
      console.error('Error fetching seller data:', error);
      // Fallback to basic seller data from product
      setSelectedSeller({
        id: sellerId,
        name: product.seller.name,
        userType: product.seller.userType,
        location: product.seller.location,
        verified: product.seller.verified,
        accountType: product.seller.accountType,
        ratings: { rating: 0 }
      });
      setSelectedProduct(product);
      setIsChatOpen(true);
    }
  };

  const handleShowAdminVerification = () => {
    router.push("/admin/verification");
  };

  const handleUpdateUser = (updates: any) => {
    console.log("Update user:", updates);
  };

  const handleFilterChange = (filteredProducts: Product[]) => {
    setFilteredProducts(filteredProducts);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleProductClick = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const handleSellerClick = (sellerId: string) => {
    router.push(`/seller/${sellerId}`);
  };

  const handleChatClick = async (sellerId: string) => {
    // Find a product from this seller to use for the chat
    const sellerProduct = products.find(p => p.seller.id === sellerId);
    if (sellerProduct) {
      await handleOpenChat(sellerId, sellerProduct.id);
    } else {
      // If no product found, navigate to messages
      router.push(`/messages?sellerId=${sellerId}`);
    }
  };

  const handleOfferClick = (productId: string) => {
    router.push(`/offers/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        currentUser={currentUser}
        onLogout={handleLogout}
        onGoToLogin={handleGoToLogin}
        onGoToRegister={handleGoToRegister}
        onGoToDashboard={handleGoToDashboard}
        onViewMessages={handleViewMessages}
        onViewProfile={handleViewProfile}
        onEditProfile={handleEditProfile}
        onShowVerification={handleShowVerification}
        onShowAdminVerification={handleShowAdminVerification}
        onUpdateUser={handleUpdateUser}
      />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <MarketplaceHero 
          currentUser={currentUser}
          allProducts={isLoading ? [] : products}
        />
        
        <div className="mt-6">
          <SearchFilters 
            products={products}
            onFilterChange={handleFilterChange}
            currentUser={currentUser}
          />
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : (() => {
          // Calculate pagination
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const currentProducts = filteredProducts.slice(startIndex, endIndex);

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currentUser={currentUser}
                  onProductClick={handleProductClick}
                  onSellerClick={handleSellerClick}
                  onChatClick={(sellerId) => handleOpenChat(sellerId, product.id)}
                  onOfferClick={handleOfferClick}
                />
              ))}
            </div>
          );
        })()}
        
        {filteredProducts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600">No products found matching your criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredProducts.length / itemsPerPage)}
              totalItems={filteredProducts.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1); // Reset to first page when changing items per page
              }}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <AppFooter />

      {/* Chat Popup */}
      {isChatOpen && selectedProduct && selectedSeller && currentUser && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200">
            <ChatInterface
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
              currentUser={currentUser}
            />
          </div>
        </div>
      )}
    </div>
  );
}
