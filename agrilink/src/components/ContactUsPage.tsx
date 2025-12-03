import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import {
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Building2,
  Send,
  MessageSquare,
  HelpCircle,
  User,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface ContactUsPageProps {
  onBack: () => void;
  currentUser?: any;
}

export function ContactUsPage({ onBack, currentUser }: ContactUsPageProps) {
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    subject: "",
    message: "",
    category: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In demo mode, just show success message
      toast.success("Message sent successfully! We'll get back to you soon.");
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        category: ""
      });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
          <h1 className="text-2xl md:text-3xl font-bold">Contact & Support</h1>
          <p className="text-muted-foreground">Get in touch with the AgriLink team for any questions or support</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Send us a Message
              </CardTitle>
              <CardDescription>
                Need help or have questions? Send us a message and we'll respond as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="verification">Account Verification</SelectItem>
                      <SelectItem value="dispute">Transaction Dispute</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Category-specific help text */}
                  {formData.category === "technical" && (
                    <p className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                      💡 For technical issues, please describe what you were doing when the problem occurred and any error messages you saw.
                    </p>
                  )}
                  {formData.category === "verification" && (
                    <p className="text-xs text-muted-foreground bg-green-50 p-2 rounded">
                      ✅ For verification help, please mention your account type (Individual/Business) and which step you need assistance with.
                    </p>
                  )}
                  {formData.category === "dispute" && (
                    <p className="text-xs text-muted-foreground bg-orange-50 p-2 rounded">
                      ⚖️ For transaction disputes, please include relevant details about the order, seller, and the issue you're experiencing.
                    </p>
                  )}
                  {formData.category === "partnership" && (
                    <p className="text-xs text-muted-foreground bg-purple-50 p-2 rounded">
                      🤝 For partnership inquiries, please describe your business and how you'd like to collaborate with AgriLink.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    placeholder="Brief description of your inquiry"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message *</label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    placeholder="Tell us how we can help you..."
                    className="min-h-32"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>


        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          {/* Project Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Information</CardTitle>
              <CardDescription>Academic project details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-sm">External Client</p>
                    <p className="text-sm text-muted-foreground">Infinity Success Co. Ltd.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-sm">Project Type</p>
                    <p className="text-sm text-muted-foreground">6th Semester IBS Project</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-sm">Development Period</p>
                    <p className="text-sm text-muted-foreground">12-week timeline</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Response Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">General inquiries: 1-2 business days</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Technical/Account support: Same day</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Partnership inquiries: 2-3 business days</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Transaction disputes: 1 business day</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}