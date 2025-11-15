"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle
} from 'lucide-react';
import { getVerificationPromptData, User } from '@/lib/email-verification';

interface EmailVerificationPromptProps {
  user: User | null;
  onResendVerification?: () => Promise<void>;
  variant?: 'card' | 'alert' | 'banner';
  showRestrictions?: boolean;
  className?: string;
}

export function EmailVerificationPrompt({ 
  user, 
  onResendVerification,
  variant = 'card',
  showRestrictions = true,
  className = ''
}: EmailVerificationPromptProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error' | 'rate_limited'>('idle');
  const [rateLimitMessage, setRateLimitMessage] = useState<string>('');

  const promptData = getVerificationPromptData(user);

  // Don't render if user is verified
  if (!promptData) {
    return null;
  }

  const handleResendVerification = async () => {
    if (!onResendVerification) return;
    
    setIsResending(true);
    setResendStatus('idle');
    setRateLimitMessage('');
    
    try {
      const result = await onResendVerification();
      
      // Handle the new return format
      if (result && typeof result === 'object') {
        if (result.success) {
          setResendStatus('success');
        } else if (result.rateLimited) {
          setResendStatus('rate_limited');
          setRateLimitMessage(result.message);
        } else {
          setResendStatus('error');
          setRateLimitMessage(result.message || 'Failed to send verification email');
        }
      } else {
        // Fallback for old format (if function doesn't return anything)
        setResendStatus('success');
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if it's a rate limiting error
      if (errorMessage.includes('wait') && (errorMessage.includes('second') || errorMessage.includes('minute'))) {
        setResendStatus('rate_limited');
        setRateLimitMessage(errorMessage);
      } else {
        setResendStatus('error');
      }
    } finally {
      setIsResending(false);
    }
  };


  const renderContent = () => (
    <div className="space-y-3">
      {/* Email Icon + Title + Message */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 mb-1">
            Verify your email address
          </h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              We have sent a verification link to <span className="font-medium text-gray-900">{user?.email}</span>. 
              Click on the link to complete the verification process. 
              You might need to check your <span className="font-semibold">spam folder</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {onResendVerification && (
        <div className="ml-11">
          <Button 
            onClick={handleResendVerification}
            size="sm"
            disabled={isResending}
            className="w-full sm:w-auto"
          >
            {isResending ? 'Sending...' : 'Resend email'}
          </Button>
        </div>
      )}

      {/* Status Messages */}
      {resendStatus === 'success' && (
        <div className="ml-11 bg-green-50 border border-green-200 rounded-lg p-2">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Verification email sent! Please check your inbox.</span>
          </div>
        </div>
      )}

      {resendStatus === 'rate_limited' && (
        <div className="ml-11 bg-amber-50 border border-amber-200 rounded-lg p-2">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{rateLimitMessage}</span>
          </div>
        </div>
      )}

      {resendStatus === 'error' && (
        <div className="ml-11 bg-red-50 border border-red-200 rounded-lg p-2">
          <div className="flex items-center gap-2 text-red-800">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Failed to resend verification email. Please try again.</span>
          </div>
        </div>
      )}
    </div>
  );

  if (variant === 'alert') {
    return (
      <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <AlertDescription>
          {renderContent()}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3 ${className}`}>
        {renderContent()}
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={`border-gray-200 bg-white shadow-sm ${className}`}>
      <CardContent className="px-4 py-3">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

/**
 * Compact email verification status indicator
 */
export function EmailVerificationStatus({ user, size = 'sm' }: { user: User | null; size?: 'sm' | 'md' | 'lg' }) {
  if (!user) return null;

  const isVerified = user.emailVerified;
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';

  return (
    <Badge 
      variant={isVerified ? 'default' : 'destructive'}
      className={`${textSize} flex items-center gap-1`}
    >
      {isVerified ? (
        <CheckCircle className={iconSize} />
      ) : (
        <XCircle className={iconSize} />
      )}
      {isVerified ? 'Email Verified' : 'Email Not Verified'}
    </Badge>
  );
}