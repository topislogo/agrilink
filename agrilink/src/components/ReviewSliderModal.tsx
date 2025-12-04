"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { S3Avatar } from "./S3Avatar";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Search, 
  Star, 
  Filter,
  User,
  Package
} from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  productName?: string;
  reviewer: {
    id: string;
    name: string;
    userType: string;
    accountType: string;
    profileImage?: string;
  };
}

interface ReviewSliderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: Review[];
  totalReviews: number;
  averageRating: number;
}

export function ReviewSliderModal({ 
  isOpen, 
  onClose, 
  reviews, 
  totalReviews, 
  averageRating 
}: ReviewSliderModalProps) {
  console.log('🔍 ReviewSliderModal props:', { isOpen, reviews: reviews?.length, totalReviews, averageRating });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>(reviews);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Filter and sort reviews
  useEffect(() => {
    let filtered = [...reviews];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.reviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (review.productName && review.productName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply rating filter
    if (ratingFilter !== "all") {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter(review => review.rating === rating);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    setFilteredReviews(filtered);
    setCurrentIndex(0); // Reset to first review when filters change
  }, [reviews, searchTerm, ratingFilter, sortBy]);

  const currentReview = filteredReviews[currentIndex];
  const hasReviews = filteredReviews.length > 0;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredReviews.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < filteredReviews.length - 1 ? prev + 1 : 0));
  };

  const goToReview = (index: number) => {
    setCurrentIndex(index);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType.toLowerCase()) {
      case "farmer":
        return "bg-green-100 text-green-800 border-green-200";
      case "trader":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "buyer":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            All Reviews ({totalReviews})
          </DialogTitle>
        </DialogHeader>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 border-b">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="highest">Highest</SelectItem>
                <SelectItem value="lowest">Lowest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Review Display */}
        <div className="flex-1 overflow-hidden">
          {!hasReviews ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No reviews match your filters</p>
                <p className="text-sm">Try adjusting your search or filter criteria</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Current Review */}
              <div className="flex-1 p-6">
                <Card className="h-full">
                  <CardContent className="p-6 h-full flex flex-col">
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <S3Avatar 
                          src={currentReview.reviewer.profileImage}
                          alt={currentReview.reviewer.name}
                          className="h-10 w-10"
                          fallback={
                            <span>
                              {currentReview.reviewer.name.charAt(0).toUpperCase()}
                            </span>
                          }
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{currentReview.reviewer.name}</p>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getUserTypeColor(currentReview.reviewer.userType)}`}
                            >
                              {currentReview.reviewer.userType}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDate(currentReview.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {renderStars(currentReview.rating)}
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="flex-1">
                      <p className="text-gray-700 leading-relaxed">
                        {currentReview.comment}
                      </p>
                      
                      {currentReview.productName && (
                        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Product:</span>
                            <span className="text-sm text-gray-600">{currentReview.productName}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  disabled={!hasReviews}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                {/* Review Counter */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {currentIndex + 1} of {filteredReviews.length}
                  </span>
                  {filteredReviews.length > 1 && (
                    <div className="flex space-x-1">
                      {filteredReviews.slice(0, Math.min(10, filteredReviews.length)).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => goToReview(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentIndex ? "bg-blue-500" : "bg-gray-300"
                          }`}
                        />
                      ))}
                      {filteredReviews.length > 10 && (
                        <span className="text-xs text-gray-500 ml-1">
                          +{filteredReviews.length - 10}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  disabled={!hasReviews}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Average Rating: {averageRating.toFixed(1)}</span>
              <span>Total Reviews: {totalReviews}</span>
            </div>
            <div className="flex items-center space-x-1">
              {renderStars(Math.round(averageRating))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
