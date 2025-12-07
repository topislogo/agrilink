import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { BasicOTPInput } from "./BasicOTPInput";
import { 
  ArrowLeft, 
  Phone, 
  Clock, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";

interface OTPVerificationProps {
  phoneNumber: string;
  onVerificationComplete: () => void;
  onBack: () => void;
  isDemo?: boolean;
}

export function OTPVerification({ 
  phoneNumber, 
  onVerificationComplete, 
  onBack, 
  isDemo = true 
}: OTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState("");

  // Format phone number for display (mask some digits)
  const formatPhoneDisplay = (phone: string) => {
    if (phone.startsWith('+95')) {
      const digits = phone.replace('+95', '').replace(/\s/g, '');
      if (digits.length >= 7) {
        return `+95 ${digits.substring(0, 1)} *** *** ${digits.substring(digits.length - 3)}`;
      }
    }
    return phone.replace(/\d(?=\d{3})/g, '*');
  };

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining > 0 && !isExpired) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      setIsExpired(true);
      setCanResend(true);
    }
  }, [timeRemaining, isExpired]);

  // Format time remaining for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP input change
  const handleOtpChange = useCallback((value: string) => {
    setOtp(value);
    setError("");
    // Remove auto-submit - user must click verify button
  }, []);

  // Verify OTP
  const handleVerifyOtp = async (otpValue: string = otp) => {
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    if (isExpired) {
      setError("This code has expired. Please request a new one.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (isDemo) {
        // In demo mode, accept specific demo codes or any code ending in certain digits
        const demoValidCodes = ['123456', '000000'];
        const isDemoValid = demoValidCodes.includes(otpValue) || 
                           otpValue.endsWith('00') || 
                           otpValue === '111111';

        if (!isDemoValid && attemptCount < 2) {
          // Allow a few attempts before accepting any code
          setAttemptCount(prev => prev + 1);
          setError("Invalid code. Please try again.");
          setOtp("");
          toast.error("Invalid verification code");
          return;
        }
      }

      // Success
      toast.success("Phone number verified successfully!");
      onVerificationComplete();

    } catch (error) {
      setError("Verification failed. Please try again.");
      toast.error("Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Reset timer and states
      setTimeRemaining(300);
      setIsExpired(false);
      setCanResend(false);
      setOtp("");
      setAttemptCount(0);
      
      toast.success("New verification code sent!");
      
    } catch (error) {
      setError("Failed to resend code. Please try again.");
      toast.error("Failed to resend code");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background md:min-h-0">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="p-2 h-10 w-10 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Phone Verification</h1>
            <p className="text-sm text-muted-foreground">
              Enter the code we sent to your phone
            </p>
          </div>
        </div>

        {/* Phone Number Display */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Code sent to</p>
                <p className="font-medium">{formatPhoneDisplay(phoneNumber)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OTP Input */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <label className="block text-sm font-medium mb-4">
                  Enter 6-digit verification code
                </label>
                
                <div className="flex justify-center mb-4">
                  <BasicOTPInput
                    length={6}
                    value={otp}
                    onChange={handleOtpChange}
                    disabled={isSubmitting || isExpired}
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="flex items-center gap-2 justify-center text-destructive text-sm mb-4">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Timer Display */}
                {!isExpired ? (
                  <div className="flex items-center gap-2 justify-center text-muted-foreground text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Code expires in {formatTime(timeRemaining)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center text-destructive text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Code has expired</span>
                  </div>
                )}
              </div>

              {/* Verify Button (always shown when OTP has content) */}
              {otp.length > 0 && (
                <Button 
                  onClick={() => handleVerifyOtp()}
                  disabled={otp.length !== 6 || isSubmitting || isExpired}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify Code
                    </>
                  )}
                </Button>
              )}

              {/* Resend Button */}
              <div className="text-center">
                {canResend || isExpired ? (
                  <Button 
                    variant="outline" 
                    onClick={handleResendOtp}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Send New Code
                      </>
                    )}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the code? You can resend in {formatTime(timeRemaining)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Mode Info */}
        {isDemo && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center mt-0.5 shrink-0">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div className="space-y-2">
                  <p className="text-blue-800 font-medium text-sm">Demo Mode</p>
                  <div className="text-blue-700 text-xs space-y-1">
                    <p>• Use code <strong>123456</strong> for instant verification</p>
                    <p>• Any code ending in <strong>00</strong> will work</p>
                    <p>• Other codes will work after 2 attempts</p>
                    <p>• <strong>Click "Verify Code" button</strong> after entering the code</p>
                    <p>• SMS sending is simulated</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Make sure to check your messages for the verification code
          </p>
          <p className="text-xs text-muted-foreground">
            If you don't receive the code, check your spam folder or try resending
          </p>
        </div>
      </div>
    </div>
  );
}