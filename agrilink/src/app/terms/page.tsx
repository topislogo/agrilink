"use client";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function TermsOfServicePage() {
  const router = useRouter();

  const handleBack = () => {
    // Try to go back, but if it fails or there's no history, go to home
    if (typeof window !== 'undefined' && document.referrer && document.referrer !== window.location.href) {
      router.back();
    } else {
      // Fallback to home page
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Last Updated: December 2024
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div className="space-y-6 text-sm">
              <section>
                <h2 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using AgriLink ("the Platform"), you accept and agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use the Platform.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">2. Platform Description</h2>
                <p className="text-muted-foreground">
                  AgriLink is a marketplace platform that facilitates connections between farmers, traders, and buyers of agricultural products. 
                  The Platform serves as a facilitator and is not a party to transactions between users.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">3. User Responsibilities</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>You must provide accurate and complete information when creating an account</li>
                  <li>You are responsible for maintaining the security of your account</li>
                  <li>You must comply with all applicable laws and regulations</li>
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>You must not use the Platform for any illegal or unauthorized purpose</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">4. Marketplace Facilitator</h2>
                <p className="text-muted-foreground">
                  AgriLink acts as a marketplace facilitator. We are not a party to transactions between buyers and sellers. 
                  We do not own, sell, or take possession of products listed on the Platform. All transactions are between users, 
                  and users are solely responsible for their transactions.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">5. Liability Limitations</h2>
                <p className="text-muted-foreground">
                  To the maximum extent permitted by law, AgriLink shall not be liable for any indirect, incidental, special, 
                  consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, 
                  or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Platform.
                </p>
                <p className="text-muted-foreground mt-2">
                  Users are advised to perform due diligence before entering into transactions. Verification status on the Platform 
                  reduces risk but does not eliminate it.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">6. Product Listings and Offers</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Sellers are responsible for accurate product descriptions and pricing</li>
                  <li>Buyers are responsible for verifying product quality and seller credibility</li>
                  <li>All offers and transactions are subject to agreement between buyer and seller</li>
                  <li>The Platform does not guarantee product quality or transaction completion</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">7. Account Termination</h2>
                <p className="text-muted-foreground">
                  We reserve the right to suspend or terminate your account at any time for violation of these Terms of Service 
                  or for any other reason we deem necessary to protect the Platform and its users.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">8. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these Terms of Service at any time. We will notify users of significant changes. 
                  Continued use of the Platform after changes constitutes acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">9. Contact Information</h2>
                <p className="text-muted-foreground">
                  If you have questions about these Terms of Service, please contact us through the Contact Us page on the Platform.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>

      <AppFooter />
    </div>
  );
}

