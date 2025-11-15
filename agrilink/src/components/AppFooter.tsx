"use client";

import { Leaf, Sprout, Truck, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

export function AppFooter() {
  const router = useRouter();

  const handleGoToAbout = () => {
    router.push("/about");
  };

  const handleGoToContact = () => {
    router.push("/contact");
  };

  const handleGoToFAQ = () => {
    router.push("/faq");
  };
  return (
    <footer className="border-t bg-card mt-8">
      <div className="w-full max-w-5xl mx-auto px-4 py-6">
        {/* Core Mission Statement */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm md:text-base font-semibold">
              Connecting Myanmar's Agricultural Community
            </span>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground max-w-xl mx-auto">
            Transparent pricing • Direct connections •
            Quality products • Trusted marketplace
          </p>
        </div>

        {/* Key Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-0">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sprout className="w-4 h-4 text-primary" />
              <span className="font-medium text-xs">
                For Farmers
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-tight">
              Direct sales • Fair pricing • Wider reach
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Truck className="w-4 h-4 text-primary" />
              <span className="font-medium text-xs">
                For Traders
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-tight">
              Quality sourcing • Efficient distribution • Growth
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <span className="font-medium text-xs">
                For Buyers
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-tight">
              Fresh products • Direct source • Fair pricing
            </p>
          </div>
        </div>
      </div>

      {/* Full-width separator */}
      <div className="border-t"></div>

      {/* Footer Links */}
      <div className="w-full max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Project Information */}
          <div className="text-xs text-muted-foreground text-center md:text-left">
            <p>
              © 2025 AgriLink - Academic Project developed
              in partnership with Infinity Success Co. Ltd.
            </p>
          </div>

          {/* Footer Links */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button
              onClick={handleGoToAbout}
              className="hover:text-primary transition-colors duration-200"
            >
              About Us
            </button>
            <span>•</span>
            <button
              onClick={handleGoToContact}
              className="hover:text-primary transition-colors duration-200"
            >
              Contact Us
            </button>
            <span>•</span>
            <button
              onClick={handleGoToFAQ}
              className="hover:text-primary transition-colors duration-200"
            >
              FAQ
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}