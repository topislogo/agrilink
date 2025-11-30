import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Leaf, Mail, CheckCircle } from "lucide-react";

interface ForgotPasswordProps {
  onBack: () => void;
  onReturnToLogin: () => void;
}

type Step = 'email' | 'success';

export function ForgotPassword({ onBack, onReturnToLogin }: ForgotPasswordProps) {
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!email.includes('@')) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentStep('success');
      } else {
        setErrors({ email: data.message || 'Failed to send reset email' });
      }
    } catch (error) {
      console.error('Password reset request failed:', error);
      setErrors({ email: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold flex items-center justify-center gap-2 mb-2">
          <Leaf className="w-6 h-6 text-primary" />
          Forgot Your Password
        </h1>
        <p className="text-muted-foreground">We'll help you reset your password securely</p>
      </div>

      <Card className="w-full">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              {currentStep === 'email' && <Mail className="w-6 h-6 text-primary-foreground" />}
              {currentStep === 'success' && <CheckCircle className="w-6 h-6 text-primary-foreground" />}
            </div>
          </div>
          
          <CardTitle className="text-xl text-center">
            {currentStep === 'email' && 'Enter Your Email'}
            {currentStep === 'success' && 'Check Your Email'}
          </CardTitle>
          
          <CardDescription className="text-center">
            {currentStep === 'email' && 'We\'ll send you a password reset link to your email address'}
            {currentStep === 'success' && 'We\'ve sent a password reset link to your email'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Email Input Step */}
          {currentStep === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="mb-2">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          {/* Success Step */}
          {currentStep === 'success' && (
            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                <Mail className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-primary">Reset Link Sent!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Check your email at <strong>{email}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click the link in the email to reset your password.
                </p>
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep('email');
                    setErrors({});
                  }}
                  className="w-full"
                >
                  Try Another Email
                </Button>
              </div>
            </div>
          )}

          {/* Back to Login */}
          <div className="text-center pt-4">
            <Button
              variant="ghost"
              onClick={onReturnToLogin}
              className="text-sm"
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}