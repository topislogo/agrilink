"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SimpleSellerPage() {
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const params = useParams();
  const sellerId = params.id as string;

  useEffect(() => {
    console.log('🚀 Simple page useEffect triggered for sellerId:', sellerId);
    
    // Load user data
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    // Load seller data
    const loadData = async () => {
      try {
        console.log('🔍 Loading data for seller:', sellerId);
        
        const [sellerResponse, productsResponse] = await Promise.all([
          fetch(`/api/seller/${sellerId}`),
          fetch(`/api/products?sellerId=${sellerId}`)
        ]);

        console.log('📊 Responses:', sellerResponse.status, productsResponse.status);

        if (sellerResponse.ok) {
          const sellerData = await sellerResponse.json();
          console.log('✅ Seller loaded:', sellerData.seller.name);
          setSeller(sellerData.seller);
        }

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          console.log('✅ Products loaded:', productsData.products.length);
          setProducts(productsData.products || []);
        }
      } catch (error) {
        console.error("❌ Error loading data:", error);
      } finally {
        console.log('🏁 Setting loading to false');
        setIsLoading(false);
      }
    };

    loadData();
  }, [sellerId]);

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
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => router.push("/")} className="h-9 px-3 -ml-3">
              ← Back
            </Button>
            
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{seller.name}</h1>
              <p className="text-muted-foreground">
                {seller.type === 'farmer' ? 'Farm' : 'Trading'} Storefront
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Seller Profile */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="border-primary/30">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <img 
                      src={seller.image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop"} 
                      alt={seller.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    
                    <div>
                      <h2 className="text-xl font-semibold">{seller.name}</h2>
                      <p className="text-sm text-muted-foreground">{seller.location}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm">⭐ {seller.rating || 0} ({seller.totalReviews || 0} reviews)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Products */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle>Products ({products.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {products.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No products available.</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {products.map((product) => (
                        <Card key={product.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <img 
                                src={product.imageUrl || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop"} 
                                alt={product.name}
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                              <div className="flex-1 space-y-2">
                                <h3 className="font-medium">{product.name}</h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-semibold">
                                    {new Intl.NumberFormat('en-US').format(product.price)} MMK
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    per {product.unit}
                                  </span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="w-full h-8 text-xs"
                                  onClick={() => router.push(`/product/${product.id}`)}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
