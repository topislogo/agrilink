"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AccountTypeVerification } from "@/components/AccountTypeVerification";
import { AppHeader } from "@/components/AppHeader";

export default function VerifyPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUserData = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        router.push("/login");
        return;
      }

      try {
        // First load from localStorage for immediate display
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Then fetch fresh data from API to get latest verification documents
        console.log('🔄 Fetching latest user profile with verification documents...');
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const latestUserData = await response.json();
          console.log('✅ Latest user data with verification documents:', latestUserData);
          
          // Update localStorage and state with fresh data
          localStorage.setItem("user", JSON.stringify(latestUserData.user));
          setUser(latestUserData.user);
          
          console.log('✅ Verification page: User data refreshed from API');
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  const handleBack = () => {
    router.push("/dashboard");
  };

  const refreshUserData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/api/user/profile", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const updatedUser = data.user;
        
        // Update localStorage with fresh data
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Update component state
        setUser(updatedUser);
        
        console.log("✅ User data refreshed from API");
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  const handleVerificationComplete = () => {
    // Refresh user data after verification
    refreshUserData();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        currentUser={user} 
        onLogout={handleLogout}
      />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <AccountTypeVerification
          currentUser={user}
          onBack={handleBack}
          onVerificationComplete={handleVerificationComplete}
        />
      </div>
    </div>
  );
}