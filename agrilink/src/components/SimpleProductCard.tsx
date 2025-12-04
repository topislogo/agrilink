"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { MapPin, MessageCircle, Package, CheckCircle } from "lucide-react";
import { SimpleChatModal } from "./SimpleChatModal";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  seller: {
    name: string;
    userType: string;
    location: string;
    verified?: boolean;
  };
}

interface SimpleProductCardProps {
  product: Product;
}

export function SimpleProductCard({ product }: SimpleProductCardProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
    <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="flex-grow p-4">
        <div className="flex items-center justify-between mb-3">
          <Link href={`/product/${product.id}`}>
            <h3 className="text-lg font-semibold text-gray-800 line-clamp-1 hover:text-green-600 cursor-pointer transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.category && (
            <Badge variant="secondary" className="ml-2">
              {product.category}
            </Badge>
          )}
        </div>
        
        <Link href={`/product/${product.id}`}>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 hover:text-gray-800 cursor-pointer transition-colors">
            {product.description}
          </p>
        </Link>
        
        <div className="flex items-center justify-between mb-3">
          <Link href={`/product/${product.id}`}>
            <span className="text-xl font-bold text-green-700 hover:text-green-800 cursor-pointer transition-colors">
              {product.price} MMK / {product.unit}
            </span>
          </Link>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <MapPin className="h-3 w-3 mr-1" />
          <span>{product.seller.location}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              {product.seller.name}
            </span>
            {product.seller.verified && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
          <Badge 
            variant="default" 
            className={`text-xs px-2 py-1 ${
              product.seller.userType === 'farmer' 
                ? 'text-white bg-green-600 border-green-600' 
                : product.seller.userType === 'trader'
                ? 'text-white bg-orange-600 border-orange-600'
                : 'text-blue-700 bg-blue-50 border-blue-200'
            }`}
            style={
              product.seller.userType === 'farmer' 
                ? { backgroundColor: '#16a34a', color: '#ffffff', borderColor: '#16a34a' }
                : product.seller.userType === 'trader'
                ? { backgroundColor: '#ea580c', color: '#ffffff', borderColor: '#ea580c' }
                : undefined
            }
          >
            {product.seller.userType}
          </Badge>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <div className="flex space-x-2 w-full">
          <Link href={`/product/${product.id}`} className="flex-1">
            <Button 
              variant="outline"
              className="w-full"
            >
              <Package className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => setIsChatOpen(true)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat
          </Button>
        </div>
      </CardFooter>
    </Card>
    
    <SimpleChatModal
      isOpen={isChatOpen}
      onClose={() => setIsChatOpen(false)}
      sellerName={product.seller.name}
      productName={product.name}
    />
    </>
  );
}
