"use client";

import { useRouter } from "next/navigation";
import { AboutUs } from "@/components/AboutUs";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

export default function AboutPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <AboutUs onBack={handleBack} />
      </main>
      <AppFooter />
    </div>
  );
}
