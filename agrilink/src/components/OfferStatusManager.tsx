"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Package, 
  CheckSquare, 
  Ban,
  AlertCircle,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  User,
  Calendar
} from 'lucide-react';

export interface OfferStatus {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'to_ship' | 'shipped' | 'delivered' | 'received' | 'completed' | 'cancelled' | 'expired';
  statusUpdatedAt: string;
  readyToShipAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  receivedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  deliveryOptions?: string[];
  buyerId: string;
  sellerId: string;
  currentUserId: string;
  isBuyer: boolean;
  isSeller: boolean;
}

interface OfferStatusManagerProps {
  offer: OfferStatus;
  onStatusUpdate: (newStatus: string, reason?: string) => Promise<void>;
  loading?: boolean;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    description: 'Waiting for seller response'
  },
  accepted: {
    label: 'Accepted',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
    description: 'Offer accepted, preparing for shipment'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    description: 'Offer rejected by seller'
  },
  to_ship: {
    label: 'To Ship',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Package,
    description: 'Ready to ship, seller preparing package'
  },
  shipped: {
    label: 'Shipped',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Truck,
    description: 'Package shipped, in transit'
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: CheckSquare,
    description: 'Package delivered, waiting for buyer confirmation'
  },
  received: {
    label: 'Received',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Package received by buyer, transaction completing...'
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Transaction completed successfully'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Ban,
    description: 'Offer cancelled'
  },
  expired: {
    label: 'Expired',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: AlertCircle,
    description: 'Offer expired'
  }
};

const statusFlow = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['to_ship', 'cancelled'], // Seller prepares to ship
  to_ship: ['shipped', 'cancelled'], // Seller ships the package
  shipped: ['delivered', 'cancelled'], // Seller marks as delivered
  delivered: ['received', 'cancelled'], // Buyer confirms receipt
  received: [], // This status auto-completes to completed
  completed: [], // Final state
  rejected: [], // Final state
  cancelled: [], // Final state
  expired: [] // Final state
};

export function OfferStatusManager({ offer, onStatusUpdate, loading = false }: OfferStatusManagerProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showComplaintDialog, setShowComplaintDialog] = useState(false);
  const [complaintReason, setComplaintReason] = useState('');
  const [complaintType, setComplaintType] = useState<'unfair_cancellation' | 'refund_request' | 'other'>('unfair_cancellation');

  const currentStatusConfig = statusConfig[offer.status];
  const StatusIcon = currentStatusConfig.icon;
  const availableTransitions = statusFlow[offer.status] || [];

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'cancelled') {
      setShowCancelDialog(true);
      return;
    }
    
    await onStatusUpdate(newStatus);
  };

  const handleCancel = async () => {
    await onStatusUpdate('cancelled', cancelReason);
    setShowCancelDialog(false);
    setCancelReason('');
  };

  const handleComplaint = async () => {
    if (!complaintReason.trim()) {
      alert('Please provide a reason for your complaint.');
      return;
    }

    try {
      // This would typically send the complaint to a backend API
      console.log('Complaint submitted:', {
        offerId: offer.id,
        type: complaintType,
        reason: complaintReason,
        userId: offer.currentUserId
      });
      
      alert('Complaint submitted successfully. Our support team will review your case within 24-48 hours.');
      setShowComplaintDialog(false);
      setComplaintReason('');
      setComplaintType('unfair_cancellation');
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Failed to submit complaint. Please try again or contact support directly.');
    }
  };

  const getActionButton = (status: string) => {
    const actions = {
      accepted: { 
        label: 'Mark Ready to Ship', 
        icon: Package 
      },
      to_ship: { label: 'Mark as Shipped', icon: Truck },
      shipped: { label: 'Mark as Delivered', icon: CheckSquare },
      delivered: { label: 'Mark as Received', icon: CheckCircle }
    };

    const action = actions[status as keyof typeof actions];
    if (!action) return null;

    const ActionIcon = action.icon;
    const nextStatus = getNextStatus(status);
    const hasPermission = canUpdateStatus(nextStatus);

    return (
      <Button
        onClick={() => handleStatusChange(nextStatus)}
        disabled={loading || !hasPermission}
        className="flex items-center gap-2"
        title={!hasPermission ? `You don't have permission to perform this action` : ''}
      >
        <ActionIcon className="w-4 h-4" />
        {action.label}
      </Button>
    );
  };

  const getNextStatus = (currentStatus: string): string => {
    const nextStatusMap = {
      accepted: 'to_ship',
      to_ship: 'shipped',
      shipped: 'delivered',
      delivered: 'received' // This will auto-complete to 'completed' in the API
    };
    return nextStatusMap[currentStatus as keyof typeof nextStatusMap] || currentStatus;
  };

  const canPerformAction = (status: string) => {
    if (status === 'pending') {
      return offer.isSeller; // Only seller can accept/reject
    }
    if (status === 'accepted' || status === 'to_ship' || status === 'shipped') {
      return offer.isSeller; // Only seller can mark ready to ship, ship, and delivered
    }
    if (status === 'delivered') {
      return offer.isBuyer; // Only buyer can mark as received (auto-completes)
    }
    return false;
  };

  const canCancelOffer = () => {
    const finalStates = ['completed', 'cancelled', 'expired', 'rejected'];
    
    if (finalStates.includes(offer.status)) {
      return false; // Can't cancel if already in final state
    }
    
    if (offer.status === 'pending') {
      return offer.isBuyer; // Only buyer can cancel pending offers
    }
    
    // After acceptance: Only seller can cancel, buyer is committed
    if (['accepted', 'to_ship', 'shipped', 'delivered'].includes(offer.status)) {
      return offer.isSeller; // Only seller can cancel after acceptance
    }
    
    return false;
  };

  const canRequestCancellation = () => {
    // Buyer can request cancellation after delivery issues (delivered status)
    // This would typically go through a dispute/refund process
    return offer.isBuyer && offer.status === 'delivered';
  };

  const canComplainAboutCancellation = () => {
    // Buyer can complain if seller cancelled the offer
    return offer.isBuyer && offer.status === 'cancelled' && offer.cancelledBy === offer.sellerId;
  };

  const canUpdateStatus = (newStatus: string) => {
    // Check if the user has permission to perform this specific status update
    if (newStatus === 'accepted' || newStatus === 'rejected') {
      return offer.isSeller && offer.status === 'pending';
    }
    if (newStatus === 'to_ship') {
      return offer.isSeller && offer.status === 'accepted';
    }
    if (newStatus === 'shipped') {
      return offer.isSeller && offer.status === 'to_ship';
    }
    if (newStatus === 'delivered') {
      return offer.isSeller && offer.status === 'shipped';
    }
    if (newStatus === 'received') {
      return offer.isBuyer && offer.status === 'delivered';
    }
    if (newStatus === 'completed') {
      // This is now handled automatically
      return false;
    }
    if (newStatus === 'cancelled') {
      return canCancelOffer();
    }
    return false;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StatusIcon className="w-5 h-5" />
          Offer Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={`${currentStatusConfig.color} border`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {currentStatusConfig.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {currentStatusConfig.description}
            </span>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="space-y-2">
          <div className="space-y-1">
            {offer.readyToShipAt && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-purple-600" />
                <span>Ready to Ship: {formatDate(offer.readyToShipAt)}</span>
              </div>
            )}
            {offer.shippedAt && (
              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>Shipped: {formatDate(offer.shippedAt)}</span>
              </div>
            )}
            {offer.deliveredAt && (
              <div className="flex items-center gap-2 text-sm">
                <CheckSquare className="w-4 h-4 text-orange-600" />
                <span>Delivered: {formatDate(offer.deliveredAt)}</span>
              </div>
            )}
            {offer.receivedAt && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Received: {formatDate(offer.receivedAt)}</span>
              </div>
            )}
            {offer.completedAt && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Completed: {formatDate(offer.completedAt)}</span>
              </div>
            )}
            {offer.cancelledAt && (
              <div className="flex items-center gap-2 text-sm">
                <Ban className="w-4 h-4 text-gray-600" />
                <span>Cancelled: {formatDate(offer.cancelledAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {availableTransitions.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Actions</div>
            <div className="flex flex-wrap gap-2">
              {availableTransitions.map((status) => {
                const hasPermission = canUpdateStatus(status);
                
                // Only render buttons if user has permission
                if (!hasPermission) {
                  return null;
                }
                
                if (status === 'cancelled') {
                  return (
                    <Button
                      key={status}
                      variant="outline"
                      onClick={() => handleStatusChange(status)}
                      disabled={loading}
                      className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Ban className="w-4 h-4" />
                      {offer.isSeller ? 'Cancel Order' : 'Cancel Offer'}
                    </Button>
                  );
                }

                if (status === 'accepted') {
                  return (
                    <Button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept Offer
                    </Button>
                  );
                }

                if (status === 'rejected') {
                  return (
                    <Button
                      key={status}
                      variant="outline"
                      onClick={() => handleStatusChange(status)}
                      disabled={loading}
                      className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Offer
                    </Button>
                  );
                }

                return null;
              })}

              {/* Dynamic action button based on current status */}
              {canPerformAction(offer.status) && getActionButton(offer.status)}
            </div>
          </div>
        )}

        {/* Request Cancellation for Buyers after Delivery Issues */}
        {canRequestCancellation() && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Dispute Resolution</div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // This would typically open a dispute/refund request form
                  alert('Dispute resolution feature coming soon. Please contact support for delivery issues.');
                }}
                className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <AlertCircle className="w-4 h-4" />
                Report Delivery Issue
              </Button>
            </div>
          </div>
        )}

        {/* Cancellation Reason */}
        {offer.status === 'cancelled' && offer.cancellationReason && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-1">Cancellation Reason:</div>
            <div className="text-sm text-gray-600">{offer.cancellationReason}</div>
          </div>
        )}

        {/* Complaint Section for Buyers when Seller Cancels */}
        {canComplainAboutCancellation() && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Dispute Resolution</div>
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-orange-800 mb-1">
                    Seller Cancelled This Order
                  </h4>
                  <p className="text-sm text-orange-700 mb-3">
                    The seller cancelled this order. If you believe this cancellation was unfair or violates our terms, you can file a complaint.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setComplaintType('unfair_cancellation');
                        setShowComplaintDialog(true);
                      }}
                      className="flex items-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-100"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      File Complaint
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setComplaintType('refund_request');
                        setShowComplaintDialog(true);
                      }}
                      className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      <DollarSign className="w-4 h-4" />
                      Request Refund
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {offer.isSeller ? 'Cancel Order' : 'Cancel Offer'}
            </h3>
            <div className="space-y-4">
              {offer.isSeller && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> Cancelling after acceptance may affect your seller rating. 
                    Please provide a valid reason for cancellation.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation {offer.isSeller ? '(required)' : '(optional)'}
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                  placeholder={
                    offer.isSeller 
                      ? "Please provide a detailed reason for cancelling this order (e.g., product unavailable, quality issues, etc.)..."
                      : "Please provide a reason for cancelling this offer..."
                  }
                  required={offer.isSeller}
                />
                {offer.isSeller && (!cancelReason.trim() || cancelReason.trim().length < 10) && (
                  <p className="text-sm text-red-600 mt-1">
                    Reason is required and must be at least 10 characters for seller cancellations
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCancelDialog(false);
                    setCancelReason('');
                  }}
                >
                  Keep {offer.isSeller ? 'Order' : 'Offer'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={loading || (offer.isSeller && (!cancelReason.trim() || cancelReason.trim().length < 10))}
                >
                  Cancel {offer.isSeller ? 'Order' : 'Offer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Dialog */}
      {showComplaintDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {complaintType === 'refund_request' ? 'Request Refund' : 'File Complaint'}
            </h3>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> {complaintType === 'refund_request' 
                    ? 'Refund requests will be reviewed by our support team. You may be eligible for a full or partial refund depending on the circumstances.'
                    : 'Complaints about unfair cancellations will be investigated. Sellers found to be cancelling orders unfairly may face penalties.'
                  }
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {complaintType === 'refund_request' ? 'Refund Request Details' : 'Complaint Details'} (required)
                </label>
                <textarea
                  value={complaintReason}
                  onChange={(e) => setComplaintReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={4}
                  placeholder={
                    complaintType === 'refund_request'
                      ? "Please explain why you're requesting a refund (e.g., seller cancelled without valid reason, product not as described, etc.)..."
                      : "Please describe why you believe this cancellation was unfair (e.g., seller cancelled after accepting, no valid reason provided, etc.)..."
                  }
                  required
                />
                {!complaintReason.trim() && (
                  <p className="text-sm text-red-600 mt-1">
                    Please provide details for your {complaintType === 'refund_request' ? 'refund request' : 'complaint'}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowComplaintDialog(false);
                    setComplaintReason('');
                    setComplaintType('unfair_cancellation');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleComplaint}
                  disabled={loading || !complaintReason.trim()}
                  className={complaintType === 'refund_request' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}
                >
                  {loading ? 'Submitting...' : (complaintType === 'refund_request' ? 'Submit Refund Request' : 'Submit Complaint')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
