'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const name = searchParams.get('name');
  const isNewUser = searchParams.get('newUser') === 'true';
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired' | 'waiting'>('loading');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else if (isNewUser && email && name) {
      // New user registration - show waiting for verification
      setStatus('waiting');
      setMessage(`Welcome ${name}! Please check your email to verify your account.`);
      setUser({ email, name, emailVerified: false });
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token, isNewUser, email, name]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        setUser(data.user);
      } else {
        if (data.message === 'Verification token has expired') {
          setStatus('expired');
        } else {
          setStatus('error');
        }
        setMessage(data.message);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to verify email. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('A new verification email has been sent to your email address.');
      } else {
        setMessage(data.message || 'Failed to resend verification email.');
      }
    } catch (error) {
      setMessage('Failed to resend verification email. Please try again.');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'waiting':
        return <Mail className="h-8 w-8 text-yellow-500" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Mail className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'waiting':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
      case 'expired':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Complete your AgriLink account setup
          </p>
        </div>

        <Card className={`${getStatusColor()}`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-xl">
              {status === 'loading' && 'Verifying Your Email...'}
              {status === 'success' && 'Welcome to AgriLink!'}
              {status === 'waiting' && 'Almost There!'}
              {status === 'error' && 'Verification Failed'}
              {status === 'expired' && 'Link Expired'}
            </CardTitle>
            <CardDescription className="text-center">
              {message}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {status === 'waiting' && (
              <div className="space-y-4">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    We've sent a welcome email to <strong>{email}</strong>. 
                    Please check your inbox and click the verification link to activate your account.
                  </AlertDescription>
                </Alert>
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Didn't receive the email? Check your spam folder or request a new one.
                  </p>
                  <p className="text-xs text-gray-500">
                    The verification link will expire in 24 hours.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => router.push('/login')} 
                    variant="outline"
                    className="flex-1"
                  >
                    Back to Login
                  </Button>
                  {user?.email && (
                    <Button 
                      onClick={handleResendVerification}
                      className="flex-1"
                    >
                      Resend Email
                    </Button>
                  )}
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your account has been successfully activated! You can now access all features of AgriLink and start connecting with the agricultural community.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => router.push('/login')} 
                    className="flex-1"
                  >
                    Sign In to Your Account
                  </Button>
                  <Button 
                    onClick={() => router.push('/')} 
                    variant="outline"
                    className="flex-1"
                  >
                    Explore AgriLink
                  </Button>
                </div>
              </div>
            )}

            {(status === 'error' || status === 'expired') && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {status === 'expired' 
                      ? 'Your verification link has expired. Please request a new one.'
                      : 'There was an error verifying your email. Please try again.'
                    }
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => router.push('/login')} 
                    variant="outline"
                    className="flex-1"
                  >
                    Back to Login
                  </Button>
                  {user?.email && (
                    <Button 
                      onClick={handleResendVerification}
                      className="flex-1"
                    >
                      Resend Email
                    </Button>
                  )}
                </div>
              </div>
            )}

            {status === 'loading' && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">
                  Please wait while we verify your email address...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
