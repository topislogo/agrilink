import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";

import { Eye, EyeOff, Leaf, Mail, Lock, User, Phone, MapPin, Info, Building2 } from "lucide-react";
import { myanmarRegions } from "../utils/regions";
import { CountryCodeSelector } from "./CountryCodeSelector";
import { AccountTypeGuide } from "./AccountTypeGuide";

interface RegisterProps {
  onRegister: (userData: any) => Promise<void>;
  onSwitchToLogin: () => void;
  onClose: () => void;
}

export function Register({ onRegister, onSwitchToLogin, onClose }: RegisterProps) {
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
    location: '' // This will be the city/town
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAccountTypeGuide, setShowAccountTypeGuide] = useState(false);

  // Show guide page if requested - break out of container for full width
  if (showAccountTypeGuide) {
    return (
      <div className="absolute inset-0 bg-background">
        <AccountTypeGuide onBack={() => setShowAccountTypeGuide(false)} userType={formData.userType} />
      </div>
    );
  }

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
    // Basic info validation (phone is now optional)
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields in the Personal Information section');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    // Account type and location validation
    if (!formData.userType || !formData.accountType || !formData.region || !formData.location) {
      setError('Please select your user role, account type, region, and city');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
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

      await onRegister(userData);
      // Don't call onClose() - let handleRegister handle the redirect
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            placeholder="Create a password (min. 6 characters)"
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

      {/* Account Type Selection - Always visible */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Account Type *</Label>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAccountTypeGuide(true)}
            className="text-primary hover:text-primary/80 h-auto p-1"
          >
            <Info className="w-4 h-4 mr-1" />
            Learn More
          </Button>
        </div>
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold flex items-center justify-center gap-2 mb-2">
          <Leaf className="w-6 h-6 text-primary" />
          Join AgriLink
        </h1>
        <p className="text-muted-foreground">Create your account to connect with Myanmar's agricultural community</p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
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
                    onClick={onSwitchToLogin}
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
  );
}