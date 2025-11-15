import { useState, useCallback, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'farmer' | 'trader' | 'buyer' | 'admin';
  accountType?: 'individual' | 'business';
  location: string;
  region?: string;
  verified: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  businessVerified?: boolean;
  phone?: string;
  businessName?: string;
  businessDescription?: string;
  businessLicenseNumber?: string;
  qualityCertifications?: string[];
  farmingMethods?: string[];
  profileImage?: string;
  storefrontImage?: string;
  joinedDate?: string;
  rating?: number;
  totalReviews?: number;
  verificationStatus?: 'not_started' | 'in_progress' | 'under_review' | 'verified' | 'rejected';
  verificationDocuments?: {
    idCard?: {
      status?: 'pending' | 'uploaded' | 'under_review' | 'verified' | 'rejected';
      name?: string;
      size?: number;
      type?: string;
      uploadedAt?: string;
      data?: string;
    };
    businessLicense?: {
      status?: 'pending' | 'uploaded' | 'under_review' | 'verified' | 'rejected';
      name?: string;
      size?: number;
      type?: string;
      uploadedAt?: string;
      data?: string;
    };
    farmCertification?: {
      status?: 'pending' | 'uploaded' | 'under_review' | 'verified' | 'rejected';
      name?: string;
      size?: number;
      type?: string;
      uploadedAt?: string;
      data?: string;
    };
  };
  phoneVerifiedAt?: string;
  verifiedAt?: string;
  agriLinkVerificationRequested?: boolean;
  agriLinkVerificationRequestedAt?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const signUp = useCallback(async (userData: {
    email: string;
    password: string;
    name: string;
    userType: 'farmer' | 'trader' | 'buyer';
    accountType?: 'individual' | 'business';
    location: string;
    region?: string;
    phone?: string;
    businessName?: string;
    businessDescription?: string;
  }) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      
      // Store token
      localStorage.setItem('auth-token', data.token);
      
      // Set user
      setUser(data.user);
      
      return data;
    } catch (error) {
      console.error('❌ Signup failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store token
      localStorage.setItem('auth-token', data.token);
      
      // Set user
      setUser(data.user);
      
      return data;
    } catch (error) {
      console.error('❌ Signin failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Remove token
      localStorage.removeItem('auth-token');
      
      // Clear user
      setUser(null);
    } catch (error) {
      console.error('❌ Signout failed:', error);
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Profile update failed');
      }

      const data = await response.json();
      const updatedUser: User = { ...user, ...updates };
      setUser(updatedUser);
      
      return data;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  }, [user]);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('auth-token');
    if (!token) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return data.user;
      }
    } catch (error) {
      console.error('❌ User refresh failed:', error);
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      try {
        setLoading(true);
        
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('auth-token');
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        localStorage.removeItem('auth-token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshUser
  };
};
