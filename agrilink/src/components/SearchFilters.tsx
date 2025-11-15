"use client";

import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { myanmarRegions } from "../utils/regions";

interface FilterState {
  search: string;
  category: string;
  location: string; // Keep for backward compatibility
  region: string;
  city: string;
  sellerType: string;
  verifiedStatus: string;
  priceRange: string;
  sortBy: string;
}

interface SearchFiltersProps {
  products: any[];
  onFilterChange: (filteredProducts: any[]) => void;
  currentUser?: any; // Add currentUser to filter out own products
}

export function SearchFilters({ products, onFilterChange, currentUser }: SearchFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    location: '',
    region: '',
    city: '',
    sellerType: '',
    verifiedStatus: '',
    priceRange: '',
    sortBy: 'newest'
  });

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters };
    
    // If region changes, clear city selection
    if (key === 'region') {
      newFilters[key] = value;
      newFilters.city = '';
    } else {
      newFilters[key] = value;
    }
    
    setFilters(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      location: '',
      region: '',
      city: '',
      sellerType: '',
      verifiedStatus: '',
      priceRange: '',
      sortBy: 'newest'
    };
    setFilters(clearedFilters);
  };

  // Get available cities based on selected region
  const getAvailableCities = () => {
    if (!filters.region || filters.region === 'all') {
      return [];
    }
    return myanmarRegions[filters.region as keyof typeof myanmarRegions]?.cities || [];
  };

  // Get unique categories from products
  const availableCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Apply filters whenever filters change
  useEffect(() => {
    let filtered = [...products];

    // Filter out current user's own products from marketplace
    if (currentUser?.id) {
      filtered = filtered.filter(product => product.sellerId !== currentUser.id);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        (product.description && product.description.toLowerCase().includes(searchLower)) ||
        product.category.toLowerCase().includes(searchLower) ||
        product.seller.name.toLowerCase().includes(searchLower) ||
        (product.seller.location && product.seller.location.toLowerCase().includes(searchLower))
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Region filter
    if (filters.region) {
      const regionData = myanmarRegions[filters.region as keyof typeof myanmarRegions];
      const regionName = regionData?.name || '';
      
      filtered = filtered.filter(product => {
        const location = product.seller.location || '';
        // Check if location contains the region name
        return location.includes(regionName);
      });
    }

    // City filter
    if (filters.city) {
      filtered = filtered.filter(product => {
        const location = product.seller.location || '';
        // Check if location starts with the city name (since format is "City, Region")
        return location.startsWith(filters.city) || 
               location.includes(`, ${filters.city},`) ||
               location.endsWith(`, ${filters.city}`);
      });
    }

    // Seller type filter
    if (filters.sellerType) {
      filtered = filtered.filter(product => product.seller.userType === filters.sellerType);
    }

    // Verification status filter
    if (filters.verifiedStatus) {
      if (filters.verifiedStatus === 'verified') {
        filtered = filtered.filter(product => product.seller.verified);
      } else if (filters.verifiedStatus === 'business-verified') {
        filtered = filtered.filter(product => 
          product.seller.verified && product.seller.accountType === 'business'
        );
      } else if (filters.verifiedStatus === 'unverified') {
        filtered = filtered.filter(product => !product.seller.verified);
      }
    }

    // Price range filter
    if (filters.priceRange) {
      if (filters.priceRange.includes('+')) {
        const min = parseInt(filters.priceRange.replace('+', ''));
        filtered = filtered.filter(product => product.price >= min);
      } else {
        const [min, max] = filters.priceRange.split('-').map(p => parseInt(p));
        filtered = filtered.filter(product => product.price >= min && product.price <= max);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'location':
          return a.seller.location.localeCompare(b.seller.location);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    onFilterChange(filtered);
  }, [products, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(value => 
    value && value !== 'all' && value !== 'newest'
  ).length;

  return (
    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-6 shadow-sm">
      {/* Mobile-First Search Row */}
      <div className="space-y-4">
        {/* Search Bar - Always Visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search products, categories, or locations..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10 h-11 bg-background border-primary/20"
          />
        </div>

        {/* Primary Filters - Mobile: Stack, Desktop: Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select value={filters.category || "all"} onValueChange={(value) => updateFilter('category', value === "all" ? "" : value)}>
            <SelectTrigger className="h-11 bg-background border-primary/20">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
              <SelectItem value="all">All Categories</SelectItem>
              {availableCategories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filters.region || "all"} onValueChange={(value) => updateFilter('region', value === "all" ? "" : value)}>
            <SelectTrigger className="h-11 bg-background border-primary/20">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent className="max-h-64 overflow-y-auto" position="popper" side="bottom" align="start" sideOffset={4}>
              <SelectItem value="all">All Regions</SelectItem>
              {Object.entries(myanmarRegions).map(([key, region]) => (
                <SelectItem key={key} value={key}>{region.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={filters.city || "all"} 
            onValueChange={(value) => updateFilter('city', value === "all" ? "" : value)}
            disabled={!filters.region || filters.region === 'all'}
          >
            <SelectTrigger className="h-11 bg-background border-primary/20">
              <SelectValue placeholder={!filters.region ? "Select Region First" : "All Cities"} />
            </SelectTrigger>
            <SelectContent className="max-h-64 overflow-y-auto" position="popper" side="bottom" align="start" sideOffset={4}>
              <SelectItem value="all">All Cities</SelectItem>
              {getAvailableCities().map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger className="h-11 bg-background border-primary/20">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="location">By Location</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
            {showAdvancedFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </Button>
          

          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
              </Badge>
              <Button variant="outline" size="sm" onClick={clearFilters} className="h-8 px-3">
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Advanced Filters - Collapsible */}
        {showAdvancedFilters && (
          <div className="space-y-3 pt-3 border-t border-border/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Select value={filters.sellerType || "all"} onValueChange={(value) => updateFilter('sellerType', value === "all" ? "" : value)}>
                <SelectTrigger className="h-10 bg-background border-primary/20">
                  <SelectValue placeholder="All Sellers" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
                  <SelectItem value="all">All Sellers</SelectItem>
                  <SelectItem value="farmer">Farmers</SelectItem>
                  <SelectItem value="trader">Traders</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.verifiedStatus || "all"} onValueChange={(value) => updateFilter('verifiedStatus', value === "all" ? "" : value)}>
                <SelectTrigger className="h-10 bg-background border-primary/20">
                  <SelectValue placeholder="Any Verification" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
                  <SelectItem value="all">Any Verification</SelectItem>
                  <SelectItem value="verified">Verified Sellers</SelectItem>
                  <SelectItem value="business-verified">Business Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.priceRange || "all"} onValueChange={(value) => updateFilter('priceRange', value === "all" ? "" : value)}>
                <SelectTrigger className="h-10 bg-background border-primary/20">
                  <SelectValue placeholder="Any Price Range" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
                  <SelectItem value="all">Any Price Range</SelectItem>
                  <SelectItem value="0-50000">Under 50,000 MMK</SelectItem>
                  <SelectItem value="50000-100000">50K - 100K MMK</SelectItem>
                  <SelectItem value="100000-200000">100K - 200K MMK</SelectItem>
                  <SelectItem value="200000+">200K+ MMK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}