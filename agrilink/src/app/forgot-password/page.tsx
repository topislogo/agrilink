"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ForgotPassword } from "@/components/ForgotPassword";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    router.push("/");
  };

  const handleReturnToLogin = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ForgotPassword 
          onBack={handleBack}
          onReturnToLogin={handleReturnToLogin}
        />
      </div>
    </div>
  );
}
