"use client";

import React from "react";
import { Badge } from "./ui/badge";
import { UserBadge, PublicVerificationStatus, AccountTypeBadge, getUserVerificationLevel, getUserAccountType } from "./UserBadgeSystem";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { MapPin, MessageCircle, Store, Package, Heart } from "lucide-react";
import { S3Image } from "./S3Image";
import { getRelativeTime } from "../utils/dates";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  quantity?: string | number;
  imageUrl?: string;
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
  updatedAt?: string
}

interface ProductCardProps {
  product: Product;
  currentUser?: any;
  onProductClick: (productId: string) => void;
  onSellerClick: (sellerId: string) => void;
  onChatClick: (sellerId: string) => void;
  onOfferClick: (productId: string) => void;
  onSaveProduct?: (productId: string, price: number) => void;
  savedProductIds?: string[];
}

export function ProductCard({ 
  product, 
  currentUser, 
  onProductClick, 
  onSellerClick, 
  onChatClick, 
  onOfferClick,
  onSaveProduct,
  savedProductIds = []
}: ProductCardProps) {
  // Check if current user is the seller of this product
  const isOwnProduct = currentUser && product.seller.id === currentUser.id;
  
  // Check if product is saved by current user
  const isSaved = savedProductIds.includes(product.id);

  const handleSaveToggle = () => {
    if (onSaveProduct && currentUser && !isOwnProduct) {
      onSaveProduct(product.id, product.price);
    }
  };

  // Get verification level for the seller
  const getSellerVerificationLevel = () => {
    if (product.seller.verified && product.seller.accountType === 'business') {
      return 'business-verified';
    } else if (product.seller.verified) {
      return 'id-verified';
    } else if (product.seller.phoneVerified) {
      return 'phone-verified';
    } else if (product.seller.verificationStatus === 'pending') {
      return 'under-review';
    }
    return 'unverified';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onProductClick(product.id)}>
      <CardContent className="p-3">
        <div className="relative mb-2">
          {/* Main Product Image */}
          <div className="w-full h-48 rounded-lg overflow-hidden">
            <S3Image
              src={product.imageUrl || "/api/placeholder/400/300"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Account type badge in top-right corner */}
          <div className="absolute top-2 right-2">
            <AccountTypeBadge 
              userType={product.seller.userType}
              accountType={product.seller.accountType || "individual"}
              size="sm"
            />
          </div>
          
          {/* Save/Heart button for buyers (not on own products) */}
          {!isOwnProduct && onSaveProduct && currentUser && currentUser.userType === 'buyer' && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 left-2 h-8 w-8 p-0 z-10 bg-white/90 hover:bg-white shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleSaveToggle();
              }}
            >
              <Heart 
                className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'}`}
              />
            </Button>
          )}
        </div>
        
        <h3 className="font-medium mb-1 text-sm line-clamp-2">{product.name}</h3>
        
        <div className="flex items-center gap-2 mb-1">
          {product.price && product.price > 0 ? (
            <>
              <span className="text-lg font-semibold">{product.price.toLocaleString()} MMK</span>
              <span className="text-xs text-muted-foreground">per {product.unit}</span>
            </>
          ) : (
            <>
              <span className="text-lg font-semibold">Contact</span>
              <span className="text-xs text-muted-foreground">for price</span>
            </>
          )}
        </div>
        
        {/* Available Stock */}
        {product.availableQuantity && product.availableQuantity !== 'Contact seller' && (
          <div className="text-xs text-muted-foreground mb-1">
            {parseInt(product.availableQuantity) === 0 ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Out of Stock
              </span>
            ) : (
              `Available: ${product.availableQuantity}`
            )}
          </div>
        )}
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{product.seller.location}</span>
        </div>
        
        <div className="text-xs text-muted-foreground mb-2">
          <div className="flex items-center gap-1 mb-1">
            {/* Store icon for all users - represents seller/storefront */}
            <Store className="w-3 h-3" />
            <button 
              className="text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onSellerClick(product.seller.id);
              }}
            >
              {product.seller.name}
            </button>
            {/* Show verification status beside seller name */}
            <PublicVerificationStatus 
              verificationLevel={getSellerVerificationLevel()}
              size="xs"
            />
          </div>
          <p className="truncate">Updated: {getRelativeTime(product.updatedAt || product.createdAt)}</p>
        </div>
      </CardContent>
      
      <CardFooter className="p-3 pt-0 flex gap-2">
        <Button 
          size="sm" 
          className={`h-8 text-xs ${isOwnProduct ? "w-full" : "flex-1"}`}
          onClick={(e) => {
            e.stopPropagation();
            onProductClick(product.id);
          }}
        >
          View Details
        </Button>
        {!isOwnProduct && (
          <Button 
            variant="outline" 
            size="sm" 
            className={`flex-1 h-8 text-xs`}
            disabled={!currentUser || currentUser.isRestricted}
            onClick={(e) => {
              e.stopPropagation();
              if (!currentUser) {
                // Redirect to login
                window.location.href = '/login';
                return;
              }
              if (currentUser.isRestricted) {
                return;
              }
              onChatClick(product.seller.id);
            }}
          >
            <MessageCircle className="w-3 h-3 mr-1" />
            {!currentUser ? 'Sign in to chat' : currentUser.isRestricted
              ? 'You are restricted'
              : 'Chat'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}