"use client";

import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  Package, 
  DollarSign, 
  Truck, 
  MapPin, 
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

interface OfferCardCompactProps {
  offer: {
    id: string;
    productName: string;
    productImage?: string;
    offerPrice: number;
    quantity: number;
    message?: string;
    status: string;
    deliveryAddress?: any;
    deliveryOptions: string[];
    paymentTerms: string[];
    expiresAt?: string;
    createdAt: string;
    buyer?: { id: string; name: string; userType: string };
    seller?: { id: string; name: string; userType: string };
  };
  isFromCurrentUser?: boolean;
  onViewOffer?: (offerId: string) => void;
}

export function OfferCardCompact({ 
  offer, 
  isFromCurrentUser = false, 
  onViewOffer
}: OfferCardCompactProps) {
  
  const handleCardClick = () => {
    onViewOffer?.(offer.id);
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'accepted': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'declined': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'expired': return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = offer.expiresAt && new Date(offer.expiresAt) < new Date();

  return (
    <Card 
      className={`w-full max-w-md cursor-pointer hover:shadow-md transition-shadow ${
        isFromCurrentUser ? 'ml-auto bg-blue-50 border-blue-200' : 'mr-auto bg-white'
      }`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Offer for {offer.productName}</h4>
              <p className="text-xs text-muted-foreground">
                {isFromCurrentUser ? 'You sent' : 'Received'} • {formatDate(offer.createdAt)}
              </p>
            </div>
          </div>
          <Badge className={`text-xs ${getStatusColor(offer.status)}`}>
            {getStatusIcon(offer.status)}
            <span className="ml-1">{formatStatus(offer.status)}</span>
          </Badge>
        </div>

        {/* Offer Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-medium">
                {(offer.offerPrice * offer.quantity).toLocaleString()} MMK
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {offer.quantity} × {offer.offerPrice.toLocaleString()} MMK
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="w-4 h-4" />
            <span>{(offer.deliveryOptions || [])[0] || 'Not specified'}</span>
          </div>

          {offer.deliveryAddress && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5" />
              <div>
                <p className="font-medium">{offer.deliveryAddress.label}</p>
                <p className="text-xs">
                  {[
                    offer.deliveryAddress.addressLine1,
                    offer.deliveryAddress.addressLine2,
                    offer.deliveryAddress.city,
                    offer.deliveryAddress.state,
                    offer.deliveryAddress.postalCode
                  ].filter(field => field && field !== '').join(', ')}
                </p>
              </div>
            </div>
          )}

          {offer.message && (
            <div className="text-sm text-muted-foreground bg-gray-50 rounded p-2">
              <p className="line-clamp-2">"{offer.message}"</p>
            </div>
          )}

          {isExpired && (
            <div className="text-xs text-red-600 bg-red-50 rounded p-2">
              ⚠️ This offer has expired
            </div>
          )}
        </div>

        {/* No action buttons - card is fully clickable */}
      </CardContent>
    </Card>
  );
}