"use client";

import { useRouter } from "next/navigation";
import { FAQ } from "@/components/FAQ";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

export default function FAQPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleShowContactUs = () => {
    router.push("/contact");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <FAQ onBack={handleBack} onShowContactUs={handleShowContactUs} />
      </main>
      <AppFooter />
    </div>
  );
}
