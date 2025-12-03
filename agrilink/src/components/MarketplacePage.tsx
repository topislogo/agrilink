'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Package, MapPin, Star, CheckCircle } from 'lucide-react';
import { S3Image } from './S3Image';

interface Product {
  id: string;
  name: string;
  category?: string;
  description?: string;
  price: number;
  unit: string;
  image?: string;
  seller: {
    id: string;
    name: string;
    userType: string;
    location: string;
    profileImage?: string;
    verified: boolean;
    phoneVerified: boolean;
    rating: number;
    totalReviews: number;
  };
}

interface MarketplacePageProps {
  products: Product[];
}

export function MarketplacePage({ products: initialProducts }: MarketplacePageProps) {
  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesLocation = !selectedLocation || 
      (product.seller.location || '').toLowerCase().includes(selectedLocation.toLowerCase());

    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Get unique categories and locations
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const locations = [...new Set(products.map(p => p.seller.location).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AgriLink Marketplace</h1>
              <p className="text-gray-600 mt-1">Connect with farmers and traders</p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              <Package className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedLocation('');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="p-0">
                <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                  {product.image ? (
                    <S3Image
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Product Info */}
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
                    {product.category && (
                      <Badge variant="secondary" className="mt-1">
                        {product.category}
                      </Badge>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-green-600">
                        ${product.price}
                      </span>
                      <span className="text-gray-500 ml-1">/{product.unit}</span>
                    </div>
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {product.seller.profileImage ? (
                          <S3Image
                            src={product.seller.profileImage}
                            alt={product.seller.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {product.seller.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{product.seller.name}</p>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{product.seller.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {product.seller.verified && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
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
                  </div>

                  {/* Rating */}
                  {product.seller.rating && !isNaN(Number(product.seller.rating)) && Number(product.seller.rating) > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">
                        {Number(product.seller.rating).toFixed(1)} ({product.seller.totalReviews} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
