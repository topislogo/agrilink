import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Phone, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface PhoneVerificationStatusProps {
  userId: string;
  onVerifyClick?: () => void;
  showButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PhoneVerificationStatus({ 
  userId, 
  onVerifyClick, 
  showButton = true,
  size = 'md'
}: PhoneVerificationStatusProps) {
  const [verificationStatus, setVerificationStatus] = useState<{
    phoneVerified: boolean;
    phoneNumber?: string;
    phoneVerifiedAt?: string;
  }>({ phoneVerified: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // For now, we'll use a simple mock status
        // In a real implementation, you would fetch from your API
        const status = {
          phoneVerified: false, // This would come from your user profile API
          phoneNumber: undefined,
          phoneVerifiedAt: undefined
        };
        setVerificationStatus(status);
      } catch (error) {
        console.error('Error fetching verification status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchStatus();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (verificationStatus.phoneVerified) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusText = () => {
    if (verificationStatus.phoneVerified) {
      return 'Phone Verified';
    }
    return 'Phone Not Verified';
  };

  const getStatusVariant = () => {
    if (verificationStatus.phoneVerified) {
      return 'default' as const;
    }
    return 'destructive' as const;
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'sm' as const;
      case 'lg': return 'lg' as const;
      default: return 'default' as const;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-3 h-3';
      case 'lg': return 'w-5 h-5';
      default: return 'w-4 h-4';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={getStatusVariant()} 
        className={`flex items-center gap-1 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}
      >
        {getStatusIcon()}
        {getStatusText()}
      </Badge>

      {verificationStatus.phoneNumber && (
        <span className={`text-muted-foreground ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
          {verificationStatus.phoneNumber}
        </span>
      )}

      {showButton && !verificationStatus.phoneVerified && onVerifyClick && (
        <Button
          size={getButtonSize()}
          variant="outline"
          onClick={onVerifyClick}
          className="flex items-center gap-1"
        >
          <Phone className={getIconSize()} />
          Verify Phone
        </Button>
      )}

      {verificationStatus.phoneVerified && verificationStatus.phoneVerifiedAt && (
        <span className={`text-muted-foreground ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'}`}>
          Verified {new Date(verificationStatus.phoneVerifiedAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
