import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Leaf,
  Users,
  Target,
  Heart,
  Sprout,
  Globe,
  Award,
  ChevronLeft,
  Building2,
  GraduationCap,
  Clock,
  CheckCircle
} from "lucide-react";

interface AboutUsProps {
  onBack: () => void;
}

export function AboutUs({ onBack }: AboutUsProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4 mb-8">
        {/* Back button row */}
        <Button variant="ghost" onClick={onBack} className="h-9 px-3 -ml-3">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        {/* Title section - aligned with content */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">About AgriLink</h1>
          <p className="text-muted-foreground">Connecting Myanmar's Agricultural Community</p>
        </div>
      </div>

      {/* Mission Statement */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>Our Mission</CardTitle>
              <CardDescription>Empowering Myanmar's agricultural ecosystem</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed">
            AgriLink is dedicated to creating transparent, efficient connections between farmers, traders, 
            and buyers across Myanmar. We believe in fair pricing, quality products, and building trust 
            through verified partnerships that strengthen our agricultural community.
          </p>
        </CardContent>
      </Card>

      {/* Core Values */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Transparency</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Clear pricing, honest product descriptions, and verified seller information 
                to build trust in every transaction.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Community</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Supporting local farmers and building connections that strengthen 
                Myanmar's agricultural network.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Quality</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Promoting high-quality agricultural products and sustainable 
                farming practices across Myanmar.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Innovation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Using technology to modernize agricultural trade while respecting 
                traditional farming values and practices.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Project Information */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Project Background</h2>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <GraduationCap className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Academic Partnership Project</CardTitle>
                <CardDescription>6th Semester IBS Project</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="font-medium">External Client</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  Infinity Success Co. Ltd.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium">Timeline</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  12-week development cycle
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Key Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm">Price transparency system</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm">Seller verification system</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm">Mobile-first design</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm">Myanmar agricultural context</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target Users */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Who We Serve</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center">
            <CardHeader>
              <Sprout className="w-8 h-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Farmers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Connect directly with buyers, get fair prices for your products, 
                and expand your market reach across Myanmar.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Globe className="w-8 h-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Traders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Source quality products from verified farmers and efficiently 
                distribute to buyers throughout the region.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Buyers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access fresh, quality agricultural products directly from verified 
                sources with transparent pricing.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>



      {/* Contact Information */}
      <div className="text-center pt-6">
        <p className="text-sm text-muted-foreground">
          For more information about this project or partnership opportunities,
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          please contact us through our support channels.
        </p>
      </div>
    </div>
  );
}