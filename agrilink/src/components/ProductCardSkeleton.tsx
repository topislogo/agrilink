"use client";

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gray-200"></div>
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        
        {/* Price skeleton */}
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        
        {/* Location skeleton */}
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        
        {/* Seller info skeleton */}
        <div className="flex items-center space-x-2 pt-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="space-y-1 flex-1">
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-2 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
        
        {/* Buttons skeleton */}
        <div className="flex space-x-2 pt-2">
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
          <div className="h-8 bg-gray-200 rounded w-8"></div>
        </div>
      </div>
    </div>
  );
}
