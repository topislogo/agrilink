"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PriceComparison } from "@/components/PriceComparison";
import { AppHeader } from "@/components/AppHeader";
import { ChevronLeft } from "lucide-react";

interface PriceData {
  id: string;
  sellerName: string;
  sellerType: 'farmer' | 'trader';
  price: number;
  location: string;
  quantity: string;
  lastUpdated: string;
  seller: {
    id: string;
    name: string;
    userType: string;
    location: string;
    profileImage?: string;
    verified: boolean;
    phoneVerified: boolean;
    verificationStatus: string;
    rating: number;
    totalReviews: number;
  };
}

interface PriceComparisonData {
  productName: string;
  unit: string;
  currentProduct: {
    id: string;
    price: number;
    unit: string;
  };
  priceData: PriceData[];
}

export default function PriceComparisonPage() {
  const [data, setData] = useState<PriceComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

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

    loadPriceComparisonData();
  }, [productId]);

  const loadPriceComparisonData = async () => {
    try {
      console.log('🔍 Loading price comparison data for product:', productId);
      const response = await fetch(`/api/products/${productId}/price-comparison`);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('📊 Price comparison data loaded:', responseData);
        setData(responseData);
      } else {
        console.error("Failed to load price comparison data");
        router.push(`/product/${productId}`);
      }
    } catch (error) {
      console.error("Error loading price comparison data:", error);
      router.push(`/product/${productId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const handleBack = () => {
    router.push(`/product/${productId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading price comparison...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load price comparison data</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Product
          </Button>
        </div>
      </div>
    );
  }

  // Check if current user is the seller of this product
  const isOwnProduct = user && data.currentProduct && user.id === data.priceData.find(p => p.id === productId)?.seller.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader currentUser={user} onLogout={handleLogout} />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PriceComparison
          productName={data.productName}
          priceData={data.priceData as any}
          unit={data.unit}
          onBack={handleBack}
          isOwnProduct={isOwnProduct}
        />
      </div>
    </div>
  );
}
