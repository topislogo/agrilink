"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { S3Avatar } from './S3Avatar';
import { 
  Star, 
  MessageSquare, 
  User, 
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Eye
} from 'lucide-react';
import { AccountTypeBadge } from './UserBadgeSystem';
import { ReviewSliderModal } from './ReviewSliderModal';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  reviewer: {
    id: string;
    name: string;
    userType: string;
    accountType: string;
    profileImage?: string;
  };
  reviewee: {
    id: string;
    name: string;
    userType: string;
    accountType: string;
    profileImage?: string;
  };
}

interface ReviewSectionProps {
  offerId: string;
  currentUserId: string;
  isBuyer: boolean;
  otherParty: {
    id: string;
    name: string;
    userType: string;
    accountType: string;
    image?: string;
  };
  onReviewSubmitted?: () => void;
}

export function ReviewSection({ 
  offerId, 
  currentUserId, 
  isBuyer, 
  otherParty, 
  onReviewSubmitted 
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [offerId]);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reviews?offerId=${offerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const allReviews = data.reviews || [];
        
        // Only show the current user's review of the other party
        const userReview = allReviews.find((review: Review) => 
          review.reviewer.id === currentUserId
        );
        
        // Set only the current user's review for display
        setReviews(userReview ? [userReview] : []);
        setHasReviewed(!!userReview);
      }

      // Also fetch all reviews for the other party
      const allReviewsResponse = await fetch(`/api/reviews?revieweeId=${otherParty.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (allReviewsResponse.ok) {
        const allReviewsData = await allReviewsResponse.json();
        setAllReviews(allReviewsData.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          offerId,
          rating,
          comment: comment.trim() || null
        })
      });

      if (response.ok) {
        setShowReviewForm(false);
        setRating(0);
        setComment('');
        setHasReviewed(true);
        await fetchReviews(); // Refresh reviews
        onReviewSubmitted?.();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive ? () => onRatingChange?.(star) : undefined}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  const calculateAverageRating = () => {
    if (allReviews.length === 0) return 0;
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / allReviews.length;
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  if (loading) {
    return (
      <Card className="border-primary/30">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ThumbsUp className="w-5 h-5 text-green-600" />
          Your Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Review Form */}
        {!hasReviewed && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                Leave a review for {otherParty.name}
              </h3>
              {!showReviewForm && (
                <Button
                  onClick={() => setShowReviewForm(true)}
                  size="sm"
                >
                  Write Review
                </Button>
              )}
            </div>

            {showReviewForm && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating *
                  </label>
                  <div className="flex items-center gap-3">
                    {renderStars(rating, true, setRating)}
                    {rating > 0 && (
                      <span className="text-sm text-gray-600">
                        {getRatingLabel(rating)}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment (optional)
                  </label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this transaction..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submitting || rating === 0}
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReviewForm(false);
                      setRating(0);
                      setComment('');
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Reviews Section */}
        {allReviews.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                All Reviews for {otherParty.name}
              </h3>
              {allReviews.length > 10 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllReviewsModal(true)}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View All Reviews ({allReviews.length})
                </Button>
              )}
            </div>

            {/* Rating Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {calculateAverageRating().toFixed(1)}
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(Math.round(calculateAverageRating()))}
                  </div>
                  <div className="text-sm text-gray-600">
                    {allReviews.length} review{allReviews.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="space-y-1">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = getRatingDistribution()[rating as keyof ReturnType<typeof getRatingDistribution>];
                      const percentage = allReviews.length > 0 ? (count / allReviews.length) * 100 : 0;
                      return (
                        <div key={rating} className="flex items-center gap-2 text-sm">
                          <span className="w-3">{rating}</span>
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-400 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Reviews Preview (max 3) */}
            <div className="space-y-3">
              {allReviews.slice(0, 3).map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <S3Avatar 
                      src={review.reviewer.profileImage}
                      alt={review.reviewer.name}
                      className="w-8 h-8"
                      fallback={
                        <span>
                          {review.reviewer.name.charAt(0).toUpperCase()}
                        </span>
                      }
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{review.reviewer.name}</span>
                        <AccountTypeBadge 
                          userType={review.reviewer.userType}
                          accountType={review.reviewer.accountType}
                          size="sm"
                        />
                        <span className="text-xs text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(review.rating)}
                        <span className="text-xs text-gray-600">
                          {getRatingLabel(review.rating)}
                        </span>
                      </div>

                      {review.comment && (
                        <p className="text-gray-700 text-sm leading-relaxed">
                          "{review.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {allReviews.length > 3 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllReviewsModal(true)}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View All {allReviews.length} Reviews
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Your Review Display */}
        {reviews.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">
              Your Review
            </h3>
            {reviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <S3Avatar 
                    src={review.reviewer.profileImage}
                    alt={review.reviewer.name}
                    className="w-10 h-10"
                    fallback={
                      <User className="w-5 h-5" />
                    }
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{review.reviewer.name}</span>
                      <AccountTypeBadge 
                        userType={review.reviewer.userType}
                        accountType={review.reviewer.accountType}
                      />
                      <span className="text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-600">
                        {getRatingLabel(review.rating)}
                      </span>
                    </div>

                    {review.comment && (
                      <p className="text-gray-700 text-sm leading-relaxed">
                        "{review.comment}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No review submitted yet</p>
            <p className="text-sm">Leave a review for {otherParty.name} above</p>
          </div>
        )}
      </CardContent>

      {/* Review Slider Modal */}
      <ReviewSliderModal
        isOpen={showAllReviewsModal}
        onClose={() => setShowAllReviewsModal(false)}
        reviews={allReviews}
        totalReviews={allReviews.length}
        averageRating={calculateAverageRating()}
      />
    </Card>
  );
}
