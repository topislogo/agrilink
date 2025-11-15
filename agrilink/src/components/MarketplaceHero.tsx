"use client";

import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface MarketplaceHeroProps {
  currentUser?: any;
  allProducts?: any[];
}

export function MarketplaceHero({
  currentUser,
  allProducts = [],
}: MarketplaceHeroProps) {
  const router = useRouter();

  const handleGoToRegister = () => {
    router.push("/register");
  };

  const handleGoToLogin = () => {
    router.push("/login");
  };

  const handleShowAddListing = () => {
    router.push("/products/new");
  };

  return (
    <section className="relative py-8 lg:py-12 overflow-hidden">
      {/* Background Elements - More grounded/earthy */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/8 to-primary/12"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/8 to-transparent"></div>
      <div className="absolute top-6 right-6 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
      <div className="absolute bottom-6 left-6 w-40 h-40 bg-primary/25 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/15 rounded-full blur-3xl"></div>

      <div className="relative max-w-5xl mx-auto text-center space-y-6">

        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
            <span className="text-foreground">
              Connect.{" "}
            </span>
            <span className="text-primary">
              Discover.{" "}
            </span>
            <span className="text-foreground">
              Thrive.
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Connecting producers, distributors,
            businesses, and consumers across
            Myanmar. Quality products, transparent
            pricing, and trusted partnerships for
            all.
          </p>
        </div>

        {/* Action Buttons */}
        {!currentUser ? (
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              size="lg"
              onClick={handleGoToRegister}
              className="px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Get Started{" "}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleGoToLogin}
              className="px-6 py-4 rounded-xl"
            >
              Sign In
            </Button>
          </div>
        ) : (
          <div className="bg-card border rounded-2xl p-4 max-w-2xl mx-auto">
            <p className="text-foreground mb-2">
              Welcome back,{" "}
              <span className="font-semibold text-primary">
                {currentUser.name.split(" ")[0]}
              </span>
              !
            </p>
            <p className="text-muted-foreground mb-3 text-sm">
              {currentUser.userType === "farmer"
                ? "Ready to share your fresh products with customers across Myanmar?"
                : currentUser.userType === "trader"
                  ? "Ready to connect buyers with quality agricultural products?"
                  : "Discover fresh products and connect directly with local farmers and suppliers."}
            </p>
            {(currentUser.userType === "farmer" ||
              currentUser.userType ===
                "trader") && (
              <Button
                size="lg"
                onClick={handleShowAddListing}
                className="px-6 py-3 rounded-xl"
              >
                List Your Products{" "}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Platform Features - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto pt-6">
          <div className="bg-card border rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-foreground">
              {allProducts.length}+
            </div>
            <div className="text-xs text-muted-foreground">
              Fresh Products
            </div>
          </div>

          <div className="bg-card border rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-foreground">
              Connected
            </div>
            <div className="text-xs text-muted-foreground">
              Supply Network
            </div>
          </div>

          <div className="bg-card border rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-foreground">
              Fair
            </div>
            <div className="text-xs text-muted-foreground">
              Transparent Pricing
            </div>
          </div>

          <div className="bg-card border rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-foreground">
              Local
            </div>
            <div className="text-xs text-muted-foreground">
              Myanmar Grown
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}