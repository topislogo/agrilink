"use client";

import { useRouter } from "next/navigation";
import { ContactUsPage } from "@/components/ContactUsPage";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { useAuth } from "@/hooks/useAuth";

export default function ContactPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <ContactUsPage onBack={handleBack} currentUser={currentUser} />
      </main>
      <AppFooter />
    </div>
  );
}
