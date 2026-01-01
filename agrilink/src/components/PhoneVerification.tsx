import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Phone, CheckCircle, Clock, AlertCircle, Shield, Edit } from 'lucide-react';

interface PhoneVerificationProps {
  currentUser: any;
  onVerificationComplete: (phoneNumber: string) => void;
  onBack?: () => void;
}

export function PhoneVerification({ currentUser, onVerificationComplete, onBack }: PhoneVerificationProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phone || '');
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState(currentUser.phone || null);
  
  // Update phone number when currentUser changes
  useEffect(() => {
    if (currentUser.phone) {
      setPhoneNumber(currentUser.phone);
      setOriginalPhoneNumber(currentUser.phone);
    } else {
      setPhoneNumber('');
      setOriginalPhoneNumber(null);
    }
  }, [currentUser.phone]);

  // Reset phone number to current user's phone when component opens
  useEffect(() => {
    console.log('🔄 PhoneVerification component opened');
    console.log('🔄 Current user phone:', currentUser.phone);
    console.log('🔄 Current phoneNumber state:', phoneNumber);
    if (currentUser.phone) {
      setPhoneNumber(currentUser.phone);
      setOriginalPhoneNumber(currentUser.phone);
      console.log('🔄 Set phoneNumber to:', currentUser.phone);
    } else {
      setPhoneNumber('');
      setOriginalPhoneNumber(null);
      console.log('🔄 No existing phone, setting originalPhoneNumber to null');
    }
  }, []);
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isTwilioConfigured, setIsTwilioConfigured] = useState(false);
  const [verificationSid, setVerificationSid] = useState<string | null>(null);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [mvpOtpCode, setMvpOtpCode] = useState<string | null>(null); // Store OTP from API response for MVP phase

  // Check Twilio configuration on component mount
  useEffect(() => {
    // Twilio configuration is handled server-side only
    setIsTwilioConfigured(true);
  }, []);

  // Start countdown timer
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid phone number with country code (e.g., +959123456789)');
      return;
    }

    setIsLoading(true);
    setError('');
    
    // Exit edit mode when sending code
    setIsEditingPhone(false);

    try {
      console.log('📱 Sending verification SMS via API...');
      console.log('📱 Phone number being sent:', phoneNumber);
      console.log('📱 Current user phone:', currentUser.phone);
      
      // Send OTP via Next.js API
      const token = localStorage.getItem('token');
      const response = await fetch('/api/send-verification-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ phoneNumber }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response:', text);
        throw new Error('Server returned an invalid response. Please try again.');
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Handle rate limiting with a more user-friendly message
        const errorMessage = result.message || result.error || 'Failed to send verification code';
        if (errorMessage.includes('wait a minute') || 
            errorMessage.includes('Max send attempts reached') ||
            errorMessage.includes('rate limit') ||
            errorMessage.includes('too many requests') ||
            errorMessage.includes('429')) {
          setCountdown(60); // Start countdown for rate limiting
          throw new Error('Please wait 60 seconds before requesting another verification code. This helps prevent spam.');
        }
        throw new Error(errorMessage);
      }

      setVerificationSid(result.verificationSid || null);
      
      // Store MVP OTP code if provided (for MVP phase)
      // In post-MVP, OTP will be sent via SMS and not shown here
      if (result.code && result.mvpMode) {
        setMvpOtpCode(result.code);
        console.log('📱 MVP OTP code received:', result.code);
      } else {
        setMvpOtpCode(null);
      }
      
      setStep('otp');
      startCountdown();
      
      console.log('✅ Verification SMS sent successfully');
    } catch (err: any) {
      console.error('❌ Send OTP error:', err);
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Verifying OTP code...');
      
      // Verify OTP via Next.js API
      const token = localStorage.getItem('token');
      const response = await fetch('/api/verify-sms-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          phoneNumber,
          code: otpCode,
          verificationSid 
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response:', text);
        throw new Error('Server returned an invalid response. Please try again.');
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Invalid verification code');
      }

      console.log('✅ Phone verification successful');
      
      // Fetch fresh user data from API to ensure we have the latest verification status
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const updatedUser = data.user;
            
            // Update localStorage with fresh data from API
            localStorage.setItem('user', JSON.stringify(updatedUser));
            console.log('✅ Updated user data from API after phone verification');
          }
        }
      } catch (error) {
        console.warn('Failed to fetch updated user data:', error);
        
        // Fallback: update localStorage manually
        const currentUserData = localStorage.getItem('user');
        if (currentUserData) {
          const user = JSON.parse(currentUserData);
          user.phoneVerified = true;
          user.phone = phoneNumber;
          localStorage.setItem('user', JSON.stringify(user));
          console.log('✅ Updated user data in localStorage (fallback)');
        }
      }

      // Call completion callback
      onVerificationComplete(phoneNumber);
      
    } catch (err: any) {
      console.error('❌ Verify OTP error:', err);
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    // Clear previous MVP OTP when resending
    setMvpOtpCode(null);
    if (countdown > 0) return;
    
    setError('');
    await handleSendOTP();
  };

  const handleEditPhone = () => {
    setIsEditingPhone(true);
    setStep('phone');
    setOtpCode('');
    setError('');
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display (e.g., +959 123 456 789)
    if (phone.startsWith('+')) {
      const countryCode = phone.substring(0, 3);
      const number = phone.substring(3);
      const formatted = number.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
      return `${countryCode} ${formatted}`;
    }
    return phone;
  };

  if (step === 'phone') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Phone Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              We'll send a verification code to your phone number to confirm your identity.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            {!isEditingPhone ? (
              // Display mode - show phone number with edit button
              <div className="flex items-center gap-2 p-3 bg-gray-50 border rounded-md">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="flex-1 text-sm font-medium">{phoneNumber || 'No phone number'}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Enter edit mode without resetting phone number
                    console.log('🔄 User clicked Edit button');
                    console.log('🔄 Current phoneNumber:', phoneNumber);
                    setIsEditingPhone(true);
                  }}
                  disabled={isLoading}
                  className="h-8 px-3"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>
            ) : (
              // Edit mode - show input field with save/cancel buttons
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+959123456789"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1"
                      disabled={isLoading}
                      autoFocus
                    />
                    {phoneNumber !== originalPhoneNumber && phoneNumber.trim() && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingPhone(false);
                      // Reset to original phone number if user cancels
                      setPhoneNumber(originalPhoneNumber || '');
                    }}
                    disabled={isLoading}
                    className="h-10 px-3"
                  >
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +959 for Myanmar)
                </p>
                {isEditingPhone && phoneNumber === originalPhoneNumber && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                    💡 Change the phone number above to enable "Save & Send Code"
                  </p>
                )}
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {onBack && (
              <Button variant="outline" onClick={onBack} className="flex-1">
                Back
              </Button>
            )}
            <Button 
              onClick={handleSendOTP} 
              disabled={isLoading || !phoneNumber.trim() || countdown > 0 || (isEditingPhone && phoneNumber === originalPhoneNumber)}
              className="flex-1"
            >
              {isLoading ? 'Sending...' : 
               countdown > 0 ? `Wait ${countdown}s` : 
               (isEditingPhone ? 'Save & Send Code' : 'Send Code')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          Enter Verification Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            We've sent a 6-digit verification code to{' '}
            <span className="font-medium">{formatPhoneNumber(phoneNumber)}</span>
          </AlertDescription>
        </Alert>

        {/* Display MVP OTP code for testing during MVP phase */}
        {/* In post-MVP, OTP will be sent directly via SMS to mobile phone */}
        {mvpOtpCode && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-amber-900">📱 MVP Phase:</span>
                <span className="text-amber-800">Your verification code is:</span>
                <span className="font-mono font-bold text-lg text-amber-900 bg-amber-100 px-3 py-1 rounded">
                  {mvpOtpCode}
                </span>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                Note: In post-MVP, the code will be sent directly to your mobile phone via SMS.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            id="otp"
            type="text"
            placeholder="Enter 6-digit code"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center text-lg tracking-widest"
            disabled={isLoading}
            maxLength={6}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditPhone}
              disabled={isLoading}
              className="h-auto p-0 text-xs"
            >
              <Edit className="w-3 h-3 mr-1" />
              Change Number
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {countdown > 0 ? (
              <>
                <Clock className="w-3 h-3" />
                <span className="text-muted-foreground">
                  Resend in {countdown}s
                </span>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResendOTP}
                disabled={isLoading}
                className="h-auto p-0 text-xs"
              >
                Resend Code
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleVerifyOTP} 
          disabled={isLoading || otpCode.length !== 6}
          className="w-full"
        >
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </Button>
      </CardContent>
    </Card>
  );
}