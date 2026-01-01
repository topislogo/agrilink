"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { CountryCodeSelector } from "@/components/CountryCodeSelector";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { validatePassword } from "@/utils/password-strength";
import { Eye, EyeOff, Leaf, Mail, Lock, User, Phone, MapPin, Building2, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { myanmarRegions } from "@/utils/regions";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Account Type & Location
    userType: '',
    accountType: '', // 'individual' or 'business'
    region: '',
    location: '', // This will be the city/town
    
    // Terms and Privacy
    acceptedTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [termsError, setTermsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Get available cities based on selected region
  const getAvailableCities = () => {
    if (!formData.region) {
      return [];
    }
    return myanmarRegions[formData.region as keyof typeof myanmarRegions]?.cities || [];
  };

  const userTypeOptions = [
    {
      value: 'farmer',
      label: 'Farmer',
      description: 'I grow and produce fresh agricultural products to sell',
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    {
      value: 'trader',
      label: 'Trader',
      description: 'I connect farmers with buyers through distribution and trading',
      color: 'bg-primary/10 text-primary border-primary/20'
    },
    {
      value: 'buyer',
      label: 'Buyer',
      description: 'I purchase agricultural products for my business or personal consumption',
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    }
  ];

  const validateForm = () => {
    const isValidEmail = (email: string) => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email.trim());
    };
    // Basic info validation (phone is now optional)
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields in the Personal Information section');
      return false;
    }
    if (!isValidEmail(formData.email)) {
      setError('Invalid email format');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Use password strength validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || 'Password does not meet requirements');
      return false;
    }

    // Email format validation
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    // Account type and location validation
    if (!formData.userType || !formData.accountType || !formData.region || !formData.location) {
      setError('Please select your user role, account type, region, and city');
      return false;
    }

    // Terms acceptance validation
    if (!formData.acceptedTerms) {
      setTermsError(true);
      // Clear general error to show only inline message
      setError('');
      // Scroll to terms section for better UX
      setTimeout(() => {
        const termsCard = document.getElementById('terms-card');
        if (termsCard) {
          termsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return false;
    } else {
      setTermsError(false);
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any default browser validation
    
    // Clear all errors first
    setError('');
    setTermsError(false);
    
    // Validate form - this will set appropriate error states
    if (!validateForm()) {
      // Prevent form submission
      return;
    }
    
    // Prevent duplicate submissions
    if (isLoading) return;
    
    setIsLoading(true);

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        userType: formData.userType as 'farmer' | 'trader' | 'buyer',
        accountType: formData.accountType as 'individual' | 'business',
        location: formData.location,
        region: formData.region, // Add region field to save both region and city
        phone: formData.phone,
        businessName: '', // Will be filled later during profile completion
        businessDescription: '',
        qualityCertifications: [],
        farmingMethods: formData.userType === 'farmer' ? ['Traditional'] : []
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Check if verification email was sent
        if (data.verificationEmailSent) {
          // Redirect to email verification page with user info
          router.push(`/verify-email?email=${encodeURIComponent(data.user.email)}&name=${encodeURIComponent(data.user.name)}&newUser=true`);
        } else {
          // Fallback to dashboard if no verification needed
          router.push("/dashboard");
        }
      } else {
        setError(data.message || data.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    router.push("/login");
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <CountryCodeSelector
          value={formData.phone}
          onChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
          placeholder="9 123 456 789"
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Select your country and enter your phone number
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="pl-10 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <PasswordStrengthIndicator password={formData.password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            className="pl-10 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* User Role Selection */}
      <div className="space-y-3">
        <Label>Your Role *</Label>
        <div className="space-y-2">
          {userTypeOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => setFormData(prev => ({ ...prev, userType: option.value }))}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                formData.userType === option.value
                  ? 'border-primary/80 bg-primary/8'
                  : 'border-primary/50 hover:border-primary/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  formData.userType === option.value
                    ? 'border-primary bg-primary'
                    : 'border-primary/50'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Type Selection */}
      <div className="space-y-4">
        <Label>Account Type *</Label>
        <p className="text-sm text-muted-foreground">
          Choose the account type that best fits your operation and available documents.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Individual Account */}
          <div
            onClick={() => setFormData(prev => ({ ...prev, accountType: 'individual' }))}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              formData.accountType === 'individual'
                ? 'border-primary/80 bg-primary/8'
                : 'border-primary/50 hover:border-primary/70'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <span className="font-medium">Individual Account</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${
                formData.accountType === 'individual'
                  ? 'border-primary bg-primary'
                  : 'border-primary/50'
              }`}>
                {formData.accountType === 'individual' && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {formData.userType === 'buyer' 
                ? 'Perfect for individual consumers, small restaurants, and personal purchases.' 
                : formData.userType
                ? 'Perfect for individual farmers, small operations, and personal trading.'
                : 'Perfect for individual farmers, traders, and personal operations.'}
            </p>
          </div>

          {/* Business Account */}
          <div
            onClick={() => setFormData(prev => ({ ...prev, accountType: 'business' }))}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              formData.accountType === 'business'
                ? 'border-primary/80 bg-primary/8'
                : 'border-primary/50 hover:border-primary/70'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="font-medium">Business Account</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${
                formData.accountType === 'business'
                  ? 'border-primary bg-primary'
                  : 'border-primary/50'
              }`}>
                {formData.accountType === 'business' && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {formData.userType === 'buyer' 
                ? 'For hotels, restaurants, distributors, and large-scale purchasing operations.' 
                : formData.userType
                ? 'For registered businesses, companies, and formal operations.'
                : 'For registered businesses, companies, and formal operations.'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Location *</Label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
            <Select 
              value={formData.region} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, region: value, location: '' }))}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Select your region" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                {Object.entries(myanmarRegions).map(([key, region]) => (
                  <SelectItem key={key} value={key}>{region.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
            <Select 
              value={formData.location} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
              disabled={!formData.region}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Select your city/town" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                {getAvailableCities().map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {!formData.region && (
          <p className="text-xs text-muted-foreground">Please select a region first</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBackToHome}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold flex items-center justify-center gap-2 mb-2">
            <Leaf className="w-6 h-6 text-primary" />
            Join AgriLink
          </h1>
          <p className="text-muted-foreground">Create your account to connect with Myanmar's agricultural community</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderStep1()}
            </CardContent>
          </Card>

          {/* Step 2: Account Type & Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Role, Account Type & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderStep2()}
            </CardContent>
          </Card>

          {/* Terms and Privacy Consent */}
          <Card id="terms-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-5 h-5" />
                Terms & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                termsError ? 'border-orange-500 bg-orange-50' : 'border-transparent'
              }`}>
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={formData.acceptedTerms}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, acceptedTerms: e.target.checked }));
                    if (e.target.checked) {
                      setTermsError(false);
                      setError('');
                    }
                  }}
                  className={`mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary ${
                    termsError ? 'border-orange-500' : ''
                  }`}
                />
                <div className="flex-1">
                  <label htmlFor="acceptTerms" className="text-sm text-muted-foreground cursor-pointer block">
                    I have read and agree to the{' '}
                    <Link href="/terms" target="_blank" className="text-primary hover:underline font-medium">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" target="_blank" className="text-primary hover:underline font-medium">
                      Privacy Policy
                    </Link>
                    <span className="text-red-500"> *</span>
                  </label>
                  {termsError && (
                    <div className="mt-2 flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
                      <span className="text-orange-600 mt-0.5 font-bold">⚠</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-orange-800">
                          Terms Acceptance Required
                        </p>
                        <p className="text-sm text-orange-700 mt-1">
                          Please accept the Terms of Service and Privacy Policy to create your account. You can review them by clicking the links above.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                By creating an account, you acknowledge that AgriLink is a marketplace facilitator and not a party to transactions. 
                You agree to perform due diligence before entering into transactions.
              </p>
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
                
                {/* Sign In Link */}
                <div className="text-center">
                  <span className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={handleSwitchToLogin}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign in here
                    </button>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
      <AppFooter />
    </div>
  );
}