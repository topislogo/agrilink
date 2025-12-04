import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import {
  ChevronLeft,
  HelpCircle,
  Sprout,
  Shield,
  CreditCard,
  Truck,
  MessageSquare,
  Settings
} from "lucide-react";

interface FAQProps {
  onBack: () => void;
  onShowContactUs: () => void;
}

const faqCategories = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Sprout,
    color: "bg-green-100 text-green-700",
    questions: [
      {
        question: "How do I create an account on AgriLink?",
        answer: "Click the 'Register' button in the top navigation. Choose between Individual Account (for individual farmers/buyers) or Business Account (for registered businesses). Fill in the required information and verify your account through the steps provided."
      },
      {
        question: "What's the difference between Individual and Business accounts?",
        answer: "Individual accounts are for personal farmers, small-scale producers, and individual buyers. Business accounts are for registered companies, cooperatives, and formal trading businesses. Each has different verification requirements that respect Myanmar's agricultural context."
      },
      {
        question: "How do I add my first product listing?",
        answer: "After logging in as a farmer or trader, go to your Dashboard and click 'Add Listing'. Fill in product details including name, category, price, quantity, and location. Add clear photos and a detailed description to attract buyers."
      },
      {
        question: "Is AgriLink free to use?",
        answer: "Yes, AgriLink is completely free to use for all farmers, traders, and buyers. There are no listing fees, transaction fees, or subscription costs. Our goal is to make agricultural trade accessible to everyone in Myanmar."
      }
    ]
  },
  {
    id: "verification",
    title: "Verification & Trust",
    icon: Shield,
    color: "bg-blue-100 text-blue-700",
    questions: [
      {
        question: "What is the verification system?",
        answer: "Our verification system helps build trust by confirming seller identities and business legitimacy. Individual accounts verify personal ID and farming credentials, while Business accounts verify business registration and certifications."
      },
      {
        question: "Do I need a business license to sell on AgriLink?",
        answer: "No, you don't need a business license for an Individual Account. We understand many farmers in Myanmar operate informally. Business licenses are only required for Business Account verification."
      },
      {
        question: "How long does verification take?",
        answer: "Individual verification typically takes 1-2 business days. Business verification can take 3-5 business days as we review business documents. You can start listing products immediately, but verified status helps build buyer trust."
      },
      {
        question: "What documents do I need for verification?",
        answer: "For Individual accounts: Only Myanmar National ID/NRC is required - we respect that many farmers operate informally and don't require business licenses. For Business accounts: Business registration documents plus personal ID verification are required. All documents can be uploaded securely through the app."
      },
      {
        question: "Why do verification badges have different colors?",
        answer: "We use a color-coded system to make verification status clear at a glance: Red indicates unverified status, Yellow shows phone verification in progress, Blue means documents are under admin review, and Green indicates full verification complete. This helps users quickly assess trust levels when browsing products."
      }
    ]
  },
  {
    id: "buying-selling",
    title: "Buying & Selling",
    icon: CreditCard,
    color: "bg-purple-100 text-purple-700",
    questions: [
      {
        question: "How do I contact a seller?",
        answer: "Click the 'Chat' button on any product listing to start a conversation with the seller. You can discuss pricing, quantity, quality, and delivery arrangements directly through our messaging system."
      },
      {
        question: "How are prices determined?",
        answer: "Sellers set their own prices based on quality, quantity, location, and market conditions. Use our price comparison feature to see how prices compare across different sellers for the same product."
      },
      {
        question: "Can I negotiate prices?",
        answer: "Yes! Most sellers are open to price negotiations, especially for bulk orders. Use the chat feature to discuss pricing, and remember to be respectful and fair in your negotiations."
      },
      {
        question: "How do payments work?",
        answer: "AgriLink facilitates connections but doesn't process payments directly. Buyers and sellers arrange payment methods that work for them - cash on delivery, bank transfer, or mobile payment systems popular in Myanmar."
      }
    ]
  },
  {
    id: "delivery",
    title: "Delivery & Logistics",
    icon: Truck,
    color: "bg-orange-100 text-orange-700",
    questions: [
      {
        question: "Does AgriLink provide delivery services?",
        answer: "AgriLink connects buyers and sellers, but delivery arrangements are made directly between parties. Sellers often provide delivery within their local area, or buyers can arrange pickup."
      },
      {
        question: "How do I arrange product pickup or delivery?",
        answer: "Discuss delivery options through the chat feature with your seller. Many farmers offer local delivery, while others prefer farm pickup. For long-distance orders, you may need to arrange third-party transport."
      },
      {
        question: "What if products are damaged during transport?",
        answer: "Inspect products upon delivery and communicate any issues immediately with the seller. Most verified sellers will work with you to resolve quality issues fairly."
      }
    ]
  },
  {
    id: "badges",
    title: "Badges & Trust System",
    icon: Shield,
    color: "bg-primary/10 text-primary",
    questions: [
      {
        question: "What do the different user type badges mean?",
        answer: "AgriLink uses badges to help identify different types of users: Farmer (green badge - grows and harvests agricultural products), Trader (orange badge - distributes and trades agricultural products), and Buyer (blue badge - purchases products for business or personal use). Each badge also shows an icon indicating account type: a person icon for Individual accounts or building icon for Business accounts."
      },
      {
        question: "What are the verification levels and what do they mean?",
        answer: "AgriLink has four verification levels with color-coded badges: Unverified (red - no verification started), Phone Verified (yellow - phone confirmed but ID still needed), Under Review (blue - documents submitted, awaiting admin review), and Verified (green - verification complete). Both Individual and Business account types go through these same levels and reach the same final 'Verified' status."
      },
      {
        question: "Does verification guarantee a seller is trustworthy?",
        answer: "Verification helps build trust by confirming identity and legitimacy, but it doesn't guarantee transaction success or product quality. We encourage all users to communicate clearly, ask questions, and use good judgment when making transactions. Think of verification as one helpful factor in building confidence, not a complete guarantee."
      },
      {
        question: "Do I need to be verified to use AgriLink?",
        answer: "No, verification is completely voluntary. You can browse products, contact sellers, and make transactions without verification. However, many buyers prefer to work with verified sellers as it helps build confidence in the transaction."
      },
      {
        question: "Can verification status change?",
        answer: "Once verified, your status remains verified unless there are policy violations. If you're unverified, you can start the verification process anytime by choosing either Individual or Business account verification and submitting the required documents. The verification progresses through stages: Phone Verification (yellow) → Under Review (blue) → Verified (green)."
      },
      {
        question: "What's the difference between Individual and Business account verification?",
        answer: "Individual Account verification is designed for farmers, traders, and buyers who operate informally - requiring only Myanmar National ID/NRC for verification. Business Account verification is for registered companies, cooperatives, and formal businesses - requiring both business registration documents AND personal ID verification. This system respects Myanmar's agricultural context where many farmers don't have business licenses."
      },
      {
        question: "How can I tell if someone has an Individual or Business account?",
        answer: "Look at the icon in their user badge: Individual accounts show a person icon, while Business accounts show a building icon. This appears next to their user type (Farmer, Trader, or Buyer) and helps you understand whether you're dealing with an individual seller or a formal business."
      }
    ]
  },
  {
    id: "account",
    title: "Account Management",
    icon: Settings,
    color: "bg-gray-100 text-gray-700",
    questions: [
      {
        question: "How do I edit my profile information?",
        answer: "Go to your profile page and click the edit icon next to any section you want to update. You can change your contact information, business description, and other details anytime."
      },
      {
        question: "Can I delete my account?",
        answer: "Yes, you can delete your account by contacting our support team. Note that this will remove all your listings and chat history permanently."
      },
      {
        question: "How do I change my password?",
        answer: "Go to your profile settings and look for the 'Change Password' option. You'll need to enter your current password and choose a new secure password."
      },
      {
        question: "I forgot my password. How do I reset it?",
        answer: "Click 'Forgot Password' on the login page and enter your email address. We'll send you instructions to reset your password securely."
      }
    ]
  },
  {
    id: "technical",
    title: "Technical Support",
    icon: MessageSquare,
    color: "bg-red-100 text-red-700",
    questions: [
      {
        question: "The app is running slowly. What can I do?",
        answer: "Try refreshing your browser or restarting the app. Clear your browser cache if issues persist. AgriLink is optimized for mobile devices and works best with a stable internet connection."
      },
      {
        question: "Why can't I upload photos?",
        answer: "Check your internet connection and ensure your photos are under 5MB each. Supported formats are JPG, PNG, and WebP. Try refreshing the page and uploading again."
      },
      {
        question: "Messages aren't sending. What's wrong?",
        answer: "Check your internet connection first. If you're in a rural area with poor connectivity, messages may take longer to send. Try refreshing the page or restarting the app."
      },
      {
        question: "Can I use AgriLink offline?",
        answer: "AgriLink requires an internet connection for most features. However, you can view previously loaded content offline, and messages will send once you're back online."
      }
    ]
  }
];

export function FAQ({ onBack, onShowContactUs }: FAQProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>("getting-started");

  // Filter categories based on selected category
  const filteredCategories = selectedCategory 
    ? faqCategories.filter(category => category.id === selectedCategory)
    : faqCategories;

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
          <h1 className="text-2xl md:text-3xl font-bold">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">Find answers to common questions about AgriLink</p>
        </div>
      </div>



      {/* Category Filter */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => setSelectedCategory(null)}
          className="text-xs h-auto py-2"
        >
          All Topics
        </Button>
        {faqCategories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.id)}
            className="text-xs h-auto py-2"
          >
            {category.title}
          </Button>
        ))}
      </div>

      {/* FAQ Categories */}
      <div className="space-y-8">
        {filteredCategories.map((category) => (
          <Card key={category.id} className="shadow-sm border-gray-200 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${category.color}`}>
                  <category.icon className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {category.questions.length} question{category.questions.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 space-y-3">
              {category.questions.map((faq, index) => (
                <Accordion key={index} type="single" collapsible className="w-full">
                  <AccordionItem 
                    value={`${category.id}-${index}`} 
                    className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors bg-white"
                  >
                    <AccordionTrigger className="text-left hover:no-underline px-6 py-4 hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-sm md:text-base pr-4">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2 border-t border-gray-200">
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>



      {/* Contact Support */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3 className="font-medium">Still need help?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <Button className="mt-3" onClick={onShowContactUs}>
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}