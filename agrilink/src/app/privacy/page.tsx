"use client";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
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
            <CardTitle className="text-2xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Last Updated: December 2024
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div className="space-y-6 text-sm">
              <section>
                <h2 className="text-lg font-semibold mb-3">1. Information We Collect</h2>
                <p className="text-muted-foreground mb-2">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Account information (name, email, phone number)</li>
                  <li>Profile information (location, business details, verification documents)</li>
                  <li>Product listings and transaction information</li>
                  <li>Messages and communications with other users</li>
                  <li>Payment and delivery information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">2. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-2">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Provide, maintain, and improve the Platform</li>
                  <li>Process transactions and facilitate communication between users</li>
                  <li>Verify user identities and maintain platform security</li>
                  <li>Send you notifications and updates about the Platform</li>
                  <li>Respond to your inquiries and provide customer support</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">3. Information Sharing</h2>
                <p className="text-muted-foreground">
                  We do not sell your personal information. We may share your information:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>With other users as necessary to facilitate transactions (e.g., sharing contact information with buyers/sellers)</li>
                  <li>With service providers who assist us in operating the Platform (e.g., email services, SMS services, cloud storage)</li>
                  <li>When required by law or to protect our rights and the safety of users</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">4. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate security measures to protect your personal information, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Encryption of data in transit (HTTPS/TLS)</li>
                  <li>Secure password hashing</li>
                  <li>Access controls and authentication</li>
                  <li>Regular security assessments</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">5. Your Rights</h2>
                <p className="text-muted-foreground">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Access and update your personal information through your account settings</li>
                  <li>Request deletion of your account and associated data</li>
                  <li>Opt out of certain communications</li>
                  <li>Request a copy of your personal data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">6. Cookies and Tracking</h2>
                <p className="text-muted-foreground">
                  We use cookies and similar technologies to maintain your session, remember your preferences, and improve the Platform. 
                  You can control cookies through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">7. Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your personal information for as long as your account is active or as needed to provide services. 
                  We may retain certain information for legal, regulatory, or business purposes even after account deletion.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">8. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  The Platform is not intended for users under the age of 18. We do not knowingly collect personal information from children.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">9. Changes to Privacy Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new 
                  Privacy Policy on this page and updating the "Last Updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">10. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have questions about this Privacy Policy or our data practices, please contact us through the Contact Us page on the Platform.
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

