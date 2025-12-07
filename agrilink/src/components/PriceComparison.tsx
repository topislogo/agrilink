import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ChevronLeft, Filter, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { getRelativeTime } from "../utils/dates";

interface PriceData {
  id: string;
  name: string; // Full product name
  sellerName: string;
  sellerType: 'farmer' | 'trader';
  price: number; // Per kg price for comparison
  originalPrice?: number; // Original price
  unit: string; // Standardized unit (kg)
  originalUnit?: string; // Original unit
  displayUnit?: string; // Calculated display unit
  conversionFactor?: number; // Conversion factor used
  location: string;
  quantity: string;
  availableQuantity?: string;
  minimumOrder?: string;
  lastUpdated: string;
}

interface PriceComparisonProps {
  productName: string;
  priceData: PriceData[];
  unit: string;
  onBack?: () => void;
  isOwnProduct?: boolean;
}

export function PriceComparison({ productName, priceData, unit, onBack, isOwnProduct }: PriceComparisonProps) {
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [sellerTypeFilter, setSellerTypeFilter] = useState<string>("all");

  // Get unique regions from data
  const uniqueRegions = Array.from(new Set(priceData.map(item => item.location))).sort();

  // Filter data based on selected filters
  const filteredData = priceData.filter(item => {
    const regionMatch = regionFilter === "all" || 
      item.location === regionFilter ||
      item.location.includes(regionFilter) ||
      regionFilter.includes(item.location);
    const sellerTypeMatch = sellerTypeFilter === "all" || item.sellerType === sellerTypeFilter;
    return regionMatch && sellerTypeMatch;
  });

  // Sort by price (lowest first)
  const sortedData = [...filteredData].sort((a, b) => a.price - b.price);

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      {onBack && (
        <div className="space-y-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="h-9 px-3 -ml-3">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              {isOwnProduct ? "Market Price Analysis" : "Price Comparison"}
            </h1>
            <p className="text-muted-foreground">Compare prices for {productName}</p>
          </div>
        </div>
      )}
      
      {/* Product Info Card */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6 border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold">{productName}</h2>
              <Badge variant="secondary" className="text-sm">
                Per {unit}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {isOwnProduct 
                ? `See how your pricing compares to ${priceData.length} other sellers`
                : `Compare prices from ${priceData.length} sellers across Myanmar`
              }
            </p>
          </div>
          {sortedData.length > 0 && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Price range</p>
              <p className="text-lg font-semibold">
                {sortedData[0]?.price?.toLocaleString()} - {sortedData[sortedData.length - 1]?.price?.toLocaleString()} MMK
              </p>
            </div>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{isOwnProduct ? "Market Competitors" : "Available Sellers"}</span>
            <Badge variant="outline">
              {sortedData.length} of {priceData.length} listings
            </Badge>
          </CardTitle>
          
          {/* Simplified Filters */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter by:</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {uniqueRegions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sellerTypeFilter} onValueChange={setSellerTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="farmer">Farmers</SelectItem>
                  <SelectItem value="trader">Traders</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {sortedData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No sellers found matching your filters.</p>
                <p className="text-sm mt-1">Try adjusting your selection above.</p>
              </div>
            ) : (
              sortedData.map((seller, index) => (
                <div 
                  key={seller.id}
                  className={`p-3 rounded-lg border transition-colors hover:bg-muted/30 ${
                    index === 0 ? 'bg-green-50 border-green-200' : 'bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={seller.sellerType === 'farmer' ? 'default' : 'secondary'}
                        className="capitalize text-xs"
                      >
                        {seller.sellerType}
                      </Badge>
                      <h3 className="font-medium text-sm">{seller.sellerName}</h3>
                      {index === 0 && (
                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 text-xs">
                          Lowest Price
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-semibold text-primary">
                        {seller.price.toLocaleString()} MMK
                      </p>
                      <p className="text-xs text-muted-foreground">per kg</p>
                      {seller.originalPrice && seller.originalPrice !== seller.price && (
                        <p className="text-xs text-muted-foreground">
                          ({seller.originalPrice.toLocaleString()} MMK per {seller.originalUnit || seller.displayUnit})
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Product Information */}
                  <div className="mb-2 p-2 bg-muted/20 rounded-md">
                    <h4 className="font-medium text-sm mb-1">{seller.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {seller.availableQuantity ? 
                        `${seller.availableQuantity} available` : 
                        seller.minimumOrder ? 
                          `Min order: ${seller.minimumOrder}` : 
                          'Inquire for quantity'
                      } {seller.displayUnit ? `• ${seller.displayUnit}` : ''}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs">{seller.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {seller.availableQuantity ? 
                          `${seller.availableQuantity} available` : 
                          seller.minimumOrder ? 
                            `Min: ${seller.minimumOrder}` : 
                            'Inquire'
                        }
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">Updated {getRelativeTime(seller.lastUpdated || seller.createdAt)}</span>
                    </div>

                    {/* View Detail Button - Horizontally aligned */}
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(`/product/${seller.id}`, '_blank')}
                        className="text-xs h-6 px-2"
                      >
                        View Detail
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Simple Information Footer */}
          {sortedData.length > 0 && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">
                {isOwnProduct ? "Understanding Market Pricing" : "How to Compare"}
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                {isOwnProduct ? (
                  <>
                    <p>• <strong>Market Position:</strong> See where your prices stand against competitors</p>
                    <p>• <strong>Pricing Strategy:</strong> Consider adjusting based on quality and service</p>
                    <p>• <strong>Location Advantage:</strong> Your local market may support different pricing</p>
                    <p>• <strong>Value Proposition:</strong> Highlight your unique selling points</p>
                  </>
                ) : (
                  <>
                    <p>• <strong>Farmers:</strong> Usually offer lower prices, direct from source</p>
                    <p>• <strong>Traders:</strong> May have higher prices but offer bulk quantities</p>
                    <p>• <strong>Location:</strong> Consider transport costs and delivery options</p>
                    <p>• <strong>Quantity:</strong> Check if available amount meets your needs</p>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}