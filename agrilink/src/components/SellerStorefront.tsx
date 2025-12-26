import { S3Image } from './S3Image';
import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { formatMemberSinceDate, getRelativeTime } from "../utils/dates";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { S3Avatar } from "./S3Avatar";
import { UserBadge, PublicVerificationStatus, getUserVerificationLevel, getUserAccountType, AccountTypeBadge } from "./UserBadgeSystem";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ReviewsService, type SellerStats } from "../services/reviews";
import { ReviewSliderModal } from "./ReviewSliderModal";
import { analyticsAPI } from "../services/analytics";
import { 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Package, 
  Star,
  MessageCircle,
  Eye,
  Save,
  X,
  Edit,
  Loader2,
  Store,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Camera,
  Plus,
  Phone,
  Mail,
  ExternalLink,
  Shield,
  Building,
  Truck,
  Leaf,
  Facebook,
  Instagram,
  Music,
  Video,
  Globe
} from "lucide-react";

interface Product {
  id: string;
  sellerId: string;
  name: string;
  price: number;
  unit: string;
  location: string;
  sellerType: 'farmer' | 'trader';
  sellerName: string;
  image?: string;
  imageUrl?: string;
  quantity: number;
  lastUpdated: string;
}

interface Seller {
  id: string;
  name: string;
  type: 'farmer' | 'trader';
  accountType?: string;
  location: string;
  description: string;
  image: string;
  rating: number;
  totalReviews: number;
  yearsActive: number;
  responseTime: string;
  joinedDate: string;
  businessName?: string;
  profileImage?: string;
  storefrontImage?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  verified?: boolean;
}

interface SellerStorefrontProps {
  seller: Seller;
  products: Product[];
  onBack: () => void;
  onViewProduct: (productId: string) => void;
  onChat: (productId: string) => void;
  onEditProduct?: (productId: string) => void;
  isOwnStorefront?: boolean;
  onEditStorefrontImage?: () => void;
  onUpdateStorefront?: (updates: any) => Promise<void>;
  previewMode?: boolean;
  onTogglePreviewMode?: (mode: boolean) => void;
  currentUser?: any;
  imageMessage?: { type: 'success' | 'error', text: string } | null;
}

export function SellerStorefront({ 
  seller, 
  products, 
  onBack, 
  onViewProduct, 
  onChat,
  onEditProduct,
  isOwnStorefront = false,
  onEditStorefrontImage,
  onUpdateStorefront,
  previewMode = false,
  onTogglePreviewMode,
  currentUser,
  imageMessage
}: SellerStorefrontProps) {
  // Editing states
  const [editing, setEditing] = useState<{
    field: string;
    value: string;
  } | null>(null);
  const [editingFarmName, setEditingFarmName] = useState(false);
  const [farmName, setFarmName] = useState(seller.businessName || seller.name);
  const [savingFarmName, setSavingFarmName] = useState(false);
  
  // State for seller statistics
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Storefront data state - directly use seller prop data
  const [storefrontData, setStorefrontData] = useState(() => ({
      description: seller.description || '',
      businessHours: (seller as any).storefrontBusinessHours || (seller as any).businessHours || '',
      phone: (seller as any).phone || '',
      email: seller.email || (seller as any).email || '',
      website: (seller as any).website ?? '',
      facebook: (seller as any).facebook ?? '',
      instagram: (seller as any).instagram ?? '',
      whatsapp: (seller as any).whatsapp ?? '',
      tiktok: (seller as any).tiktok ?? '',
      policies: {
        returns: (seller as any).storefrontReturnPolicy || (seller as any).policies?.returns || '',
        delivery: (seller as any).storefrontDelivery || (seller as any).policies?.delivery || '',
        payment: (seller as any).storefrontPaymentMethods || (seller as any).policies?.payment || ''
      }
    }));

  // Modal state
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);

  // Track profile view when component mounts
  useEffect(() => {
    const trackProfileView = async () => {
      if (!seller.id || isOwnStorefront) return; // Don't track own profile views
      
      try {
        await analyticsAPI.trackProfileView(seller.id, currentUser?.id);
        console.log('📊 Profile view tracked for:', seller.name);
      } catch (error) {
        console.error('❌ Error tracking profile view:', error);
      }
    };

    trackProfileView();
  }, [seller.id, isOwnStorefront, currentUser?.id]);

  // Fetch seller statistics
  useEffect(() => {
    const fetchSellerStats = async () => {
      if (!seller.id) return;
      
      setLoadingStats(true);
      try {
        console.log('🔍 SellerStorefront: Fetching stats for sellerId:', seller.id);
        const stats = await ReviewsService.getSellerStats(seller.id);
        console.log('📊 SellerStorefront: Seller stats received:', stats);
        setSellerStats(stats);
      } catch (error) {
        console.error('❌ SellerStorefront: Error fetching seller stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchSellerStats();
  }, [seller.id]);

  // Update storefront data when seller prop changes (for real-time profile updates)
  // Use a ref to track if we just made an optimistic update to avoid overwriting it
  const justUpdatedRef = useRef<string | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Always update social fields from server data - they don't have optimistic updates
    // Only skip policy/description fields if we just made an optimistic update
    const policyFields = ['delivery', 'paymentMethods', 'returnPolicy', 'description'];
    const isPolicyField = justUpdatedRef.current && policyFields.includes(justUpdatedRef.current);
    
    if (isPolicyField) {
      console.log('⏸️ Skipping storefrontData update - just made optimistic update for:', justUpdatedRef.current);
      // Clear the flag after a delay to allow server data to come through
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        justUpdatedRef.current = null;
        console.log('✅ Cleared optimistic update flag, will update on next seller prop change');
      }, 2000); // 2 seconds should be enough for API call to complete
      return;
    }
    
    // Clear the flag if it was set for a social field (they update immediately from server)
    if (justUpdatedRef.current) {
      justUpdatedRef.current = null;
    }
    
    // Get description from seller prop - prioritize storefrontDescription, fallback to businessDescription
    const description = seller.description || (seller as any).storefrontDescription || (seller as any).businessDescription || '';
    
    // For social fields, prioritize seller prop value, but fallback to current storefrontData to preserve optimistic updates
    // This ensures that if the server hasn't returned the updated value yet, we keep the optimistic update
    const newStorefrontData = {
      description: description,
      businessHours: (seller as any).storefrontBusinessHours || (seller as any).businessHours || '',
      phone: (seller as any).phone ?? storefrontData.phone ?? '',
      email: (seller as any).email ?? storefrontData.email ?? '',
      website: (seller as any).website ?? storefrontData.website ?? '',
      facebook: (seller as any).facebook ?? storefrontData.facebook ?? '',
      instagram: (seller as any).instagram ?? storefrontData.instagram ?? '',
      whatsapp: (seller as any).whatsapp ?? storefrontData.whatsapp ?? '',
      tiktok: (seller as any).tiktok ?? storefrontData.tiktok ?? '',
      policies: {
        returns: (seller as any).storefrontReturnPolicy || (seller as any).policies?.returns || '',
        delivery: (seller as any).storefrontDelivery || (seller as any).policies?.delivery || '',
        payment: (seller as any).storefrontPaymentMethods || (seller as any).policies?.payment || ''
      }
    };
    
    console.log('🔄 SellerStorefront: Updating storefrontData from seller prop:', {
      sellerId: seller.id,
      sellerDescription: seller.description,
      sellerStorefrontDescription: (seller as any).storefrontDescription,
      sellerBusinessDescription: (seller as any).businessDescription,
      storefrontDelivery: (seller as any).storefrontDelivery,
      storefrontPaymentMethods: (seller as any).storefrontPaymentMethods,
      storefrontReturnPolicy: (seller as any).storefrontReturnPolicy,
      sellerWebsite: (seller as any).website,
      sellerWebsiteType: typeof (seller as any).website,
      sellerFacebook: (seller as any).facebook,
      sellerFacebookType: typeof (seller as any).facebook,
      sellerInstagram: (seller as any).instagram,
      sellerInstagramType: typeof (seller as any).instagram,
      sellerWhatsapp: (seller as any).whatsapp,
      sellerWhatsappType: typeof (seller as any).whatsapp,
      sellerTiktok: (seller as any).tiktok,
      sellerTiktokType: typeof (seller as any).tiktok,
      sellerAllKeys: Object.keys(seller as any),
      finalDescription: newStorefrontData.description,
      finalPolicies: newStorefrontData.policies,
      finalWebsite: newStorefrontData.website,
      finalFacebook: newStorefrontData.facebook,
      finalInstagram: newStorefrontData.instagram,
      finalWhatsapp: newStorefrontData.whatsapp,
      finalTiktok: newStorefrontData.tiktok
    });
    
    setStorefrontData(newStorefrontData);
  }, [seller]);

  const startEditing = (field: string, value: string) => {
    setEditing({ field, value });
  };

  const cancelEditing = () => {
    setEditing(null);
  };

  const handleSave = async (field: string, value: string) => {
    console.log('💾 handleSave called:', { field, value, hasCallback: !!onUpdateStorefront });
    try {
      const updates = { [field]: value };
      console.log('🔍 handleSave created updates object:', updates);
      console.log('🔍 updates keys:', Object.keys(updates));
      console.log('🔍 updates.delivery:', updates.delivery);
      console.log('🔍 updates.paymentMethods:', updates.paymentMethods);
      console.log('🔍 updates.returnPolicy:', updates.returnPolicy);
      
      // Set flag to prevent useEffect from overwriting our optimistic update
      // Only for policy fields - social fields update directly from server
      const policyFields = ['delivery', 'paymentMethods', 'returnPolicy', 'description'];
      if (policyFields.includes(field)) {
        justUpdatedRef.current = field;
      }
      
      // Optimistically update the UI immediately
      if (field === 'delivery') {
        setStorefrontData(prev => ({
          ...prev,
          policies: { ...prev.policies, delivery: value }
        }));
      } else if (field === 'paymentMethods') {
        setStorefrontData(prev => ({
          ...prev,
          policies: { ...prev.policies, payment: value }
        }));
      } else if (field === 'returnPolicy') {
        setStorefrontData(prev => ({
          ...prev,
          policies: { ...prev.policies, returns: value }
        }));
      } else if (field === 'description') {
        setStorefrontData(prev => ({
          ...prev,
          description: value
        }));
      } else if (field === 'businessHours') {
        setStorefrontData(prev => ({
          ...prev,
          businessHours: value
        }));
      } else if (field === 'website' || field === 'facebook' || field === 'instagram' || field === 'whatsapp' || field === 'tiktok') {
        console.log(`💾 Optimistically updating ${field} to:`, value);
        setStorefrontData(prev => {
          const updated = {
            ...prev,
            [field]: value
          };
          console.log(`✅ Updated storefrontData.${field}:`, updated[field]);
          return updated;
        });
      }
      
      setEditing(null);
      
      if (onUpdateStorefront) {
        console.log('📞 Calling onUpdateStorefront with:', updates);
        await onUpdateStorefront(updates);
        console.log('✅ onUpdateStorefront completed');
        // Clear the flag after API call completes so useEffect can update with fresh data
        setTimeout(() => {
          justUpdatedRef.current = null;
          console.log('🔄 Cleared optimistic update flag, useEffect can now update with server data');
        }, 500);
      } else {
        console.error('❌ onUpdateStorefront is not defined!');
        alert('Error: Update function not available. Please refresh the page.');
      }
    } catch (error) {
      console.error('❌ Failed to save:', error);
      // Clear the flag on error so useEffect can restore the correct data
      justUpdatedRef.current = null;
      // Restore editing state on error
      setEditing({ field, value });
      // Revert the optimistic update by triggering useEffect with current seller prop
      // The useEffect will restore the correct values from the seller prop
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSaveFarmName = async () => {
    if (!farmName.trim()) {
      alert('Please enter a farm name');
      return;
    }

    setSavingFarmName(true);
    try {
      // Update farm name via API
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          business_name: farmName.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save farm name');
      }

      // Update local state
      setEditingFarmName(false);
      
      // Update the seller object to reflect the change
      seller.businessName = farmName.trim();
      
      // Call onUpdateStorefront if available to refresh parent component
      if (onUpdateStorefront) {
        await onUpdateStorefront({ businessName: farmName.trim() });
      }
      
    } catch (error) {
      console.error('Failed to save farm name:', error);
      alert('Failed to save farm name. Please try again.');
    } finally {
      setSavingFarmName(false);
    }
  };

  // Safety check for seller data
  if (!seller || !seller.name) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Seller information not available.</p>
        </div>
      </div>
    );
  }
  const formatPrice = (price: number) => {
    // Format price with proper Myanmar currency formatting
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : [];
  
  const totalProducts = safeProducts.length;
  const averagePrice = safeProducts.length > 0 
    ? Math.round(safeProducts.reduce((sum, p) => sum + p.price, 0) / safeProducts.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4 mb-8">
        {/* Back button row */}
        <Button variant="ghost" onClick={onBack} className="h-9 px-3 -ml-3">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        {/* Storefront Header - Business Name and Preview Toggle */}
        <div className="flex items-center justify-between">
          {/* Business Name Section */}
          <div className="flex-1">
            {editingFarmName ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="text-2xl md:text-3xl font-bold h-12 px-3"
                    placeholder={`Enter your ${seller.userType === 'farmer' ? 'farm' : 'store'} name`}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveFarmName();
                      if (e.key === 'Escape') {
                        setEditingFarmName(false);
                        setFarmName(seller.businessName || seller.name);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveFarmName}
                    disabled={savingFarmName || !farmName.trim()}
                    className="h-8 px-3"
                  >
                    {savingFarmName ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingFarmName(false);
                      setFarmName(seller.businessName || seller.name);
                    }}
                    disabled={savingFarmName}
                    className="h-8 px-3"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  {farmName || seller.businessName || seller.name}
                </h1>
              </div>
            )}
            <p className="text-gray-600 text-sm">
              {seller.userType === 'farmer' ? 'Farm' : 'Trading'} Storefront
            </p>
          </div>

          {/* Preview Mode Toggle - Only show for storefront owners */}
          {isOwnStorefront && onTogglePreviewMode && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                <span className="text-sm text-gray-600">Preview Mode</span>
                <button
                  onClick={() => onTogglePreviewMode(!previewMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    previewMode ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      previewMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {previewMode && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-100 border border-green-300 rounded-lg">
                  <Eye className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Customer View</span>
                </div>
              )}
            </div>
          )}
        </div>
        
      </div>

      {/* Preview Mode Banner */}
      {isOwnStorefront && previewMode && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-medium text-green-800">Customer Preview Mode</h3>
              <p className="text-sm text-green-600">
                This is exactly how customers see your storefront. Toggle off to return to editing mode.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Seller Profile */}
        <div className="lg:col-span-1 space-y-4">
          {/* Main Profile Card */}
          <Card className="border-primary/30">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Seller Image */}
                <div className="relative group">
                  {seller.storefrontImage ? (
                    <S3Image 
                      src={seller.storefrontImage} 
                      alt={seller.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Building className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">{seller.name}</p>
                      </div>
                    </div>
                  )}
                  {isOwnStorefront && !previewMode && onEditStorefrontImage && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white shadow-md"
                      onClick={onEditStorefrontImage}
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      Edit Photo
                    </Button>
                  )}
                </div>

                {/* Image upload message */}
                {imageMessage && (
                  <div className={`text-sm p-3 rounded-md border flex items-center gap-2 ${
                    imageMessage.type === 'success' 
                      ? 'text-green-600 bg-green-50 border-green-200' 
                      : 'text-red-600 bg-red-50 border-red-200'
                  }`}>
                    {imageMessage.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    {imageMessage.text}
                  </div>
                )}

                {/* Basic Info */}
                <div className="group">
                  {editingFarmName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={farmName}
                        onChange={(e) => setFarmName(e.target.value)}
                        className="text-xl font-semibold h-8 px-2"
                        placeholder="Enter farm name"
                        disabled={savingFarmName}
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveFarmName}
                        disabled={savingFarmName || !farmName.trim()}
                        className="h-8 px-2"
                      >
                        {savingFarmName ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingFarmName(false);
                          setFarmName(seller.businessName || seller.name);
                        }}
                        disabled={savingFarmName}
                        className="h-8 px-2"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Profile section - no title needed since business name is at the top */}
                      
                      {/* Show owner name for transparency - always show for farmers and traders */}
                      {(seller.userType === 'farmer' || seller.userType === 'trader') && (
                        <div className="flex items-center gap-2 mt-2">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Owner: {seller.name}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {seller.location || 'Location not specified'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {/* Show different verification badges for owners vs non-owners */}
                    {/* In preview mode, always show public view */}
                    {isOwnStorefront && !previewMode ? (
                      // Owner view (not in preview): Show detailed UserBadge with progress
                      <UserBadge 
                        userType={seller.type}
                        accountType={getUserAccountType(seller)}
                        verificationLevel={getUserVerificationLevel(seller)}
                        size="sm"
                      />
                    ) : (
                      // Non-owner view OR preview mode: Show simplified badges with icons
                      <div className="flex items-center gap-2">
                        <AccountTypeBadge 
                          userType={seller.userType}
                          accountType={getUserAccountType(seller)}
                          size="sm"
                        />
                        <PublicVerificationStatus 
                          verificationLevel={getUserVerificationLevel(seller)}
                          size="sm"
                          title={seller.businessName && seller.businessName !== seller.name 
                            ? `Individual verification - Owner: ${seller.name}` 
                            : undefined}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating - Show dynamic data or loading state */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {loadingStats ? (
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    ) : (
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(sellerStats?.averageRating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm font-medium ml-2">
                          {sellerStats?.averageRating ? sellerStats.averageRating.toFixed(1) : '0.0'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({sellerStats?.totalReviews || 0} {sellerStats?.totalReviews === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Business Hours */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Business Hours</span>
                    </div>
                    {isOwnStorefront && !previewMode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing('businessHours', storefrontData.businessHours)}
                        className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {editing?.field === 'businessHours' ? (
                    <div className="space-y-2">
                      <Input
                        value={editing.value}
                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                        placeholder="e.g., 9 AM - 6 PM, Mon-Sat"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSave('businessHours', editing.value)}>
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {storefrontData.businessHours || (isOwnStorefront && !previewMode ? 'Add your business hours' : 'Business hours not specified')}
                    </p>
                  )}
                </div>

                {/* Member Since & Response Time */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Joined {formatMemberSinceDate(seller.joinedDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      Response time: {loadingStats ? 'Loading...' : (sellerStats?.responseTime || 'Within 24 hours')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Section - Only show if there are reviews */}
          {sellerStats && sellerStats.recentReviews && sellerStats.recentReviews.length > 0 && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Reviews ({sellerStats.totalReviews})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sellerStats.recentReviews.slice(0, 3).map((review: any) => (
                  <div key={review.id || `review-${Math.random()}`} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <S3Avatar 
                        src={review.reviewer_image || review.reviewer?.profileImage}
                        alt={review.reviewer_name || review.reviewer?.name || 'User'}
                        className="w-8 h-8"
                        fallback={
                          <span className="text-xs font-medium">
                            {(review.reviewer_name || review.reviewer?.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        }
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="font-medium text-sm truncate">{review.reviewer_name || review.reviewer?.name || 'Anonymous'}</span>
                          <span className="text-xs text-gray-500">
                            {getRelativeTime(review.created_at || new Date())}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < (review.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>

                        {review.comment && (
                          <p className="text-gray-700 text-xs leading-relaxed line-clamp-2">
                            "{review.comment || 'No comment'}"
                          </p>
                        )}

                        {review.productName && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-md">
                            <div className="flex items-center gap-1">
                              <Package className="w-3 h-3 text-gray-500" />
                              <span className="text-xs font-medium text-gray-600">Product:</span>
                              <span className="text-xs text-gray-700">{review.productName}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {sellerStats.totalReviews > 3 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('🔍 Opening reviews modal, sellerStats:', sellerStats);
                        console.log('🔍 recentReviews:', sellerStats.recentReviews);
                        setShowAllReviewsModal(true);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground h-auto p-1"
                    >
                      +{sellerStats.totalReviews - 3} more reviews
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contact Information Card - Only show if there's data or if owner in edit mode */}
          {(!previewMode || storefrontData.phone || storefrontData.email || storefrontData.website) && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Phone - Read-only from profile */}
                {storefrontData.phone && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Phone</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {storefrontData.phone}
                    </p>
                    {isOwnStorefront && !previewMode && (
                      <p className="text-xs text-muted-foreground italic">
                        Edit from your profile page
                      </p>
                    )}
                  </div>
                )}

                {/* Email - Read-only from profile */}
                {storefrontData.email && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {storefrontData.email}
                    </p>
                    {isOwnStorefront && !previewMode && (
                      <p className="text-xs text-muted-foreground italic">
                        Edit from your profile page
                      </p>
                    )}
                  </div>
                )}

                {/* Business Hours - Only show if has data or owner in edit mode */}
                {(!previewMode || storefrontData.businessHours) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Business Hours</span>
                      </div>
                      {isOwnStorefront && !previewMode && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing('businessHours', storefrontData.businessHours)}
                          className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {editing?.field === 'businessHours' ? (
                      <div className="space-y-2">
                        <Input
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          placeholder="e.g., Mon-Fri: 9AM-5PM, Sat: 10AM-2PM"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSave('businessHours', editing.value)}>
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {storefrontData.businessHours || (isOwnStorefront && !previewMode ? 'Add business hours' : null)}
                      </p>
                    )}
                  </div>
                )}

                {/* Website - Only show if has data or owner in edit mode */}
                {(storefrontData.website || (isOwnStorefront && !previewMode)) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Website</span>
                      </div>
                      {isOwnStorefront && !previewMode && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing('website', storefrontData.website)}
                          className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {editing?.field === 'website' ? (
                      <div className="space-y-2">
                        <Input
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          placeholder="https://example.com"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSave('website', editing.value)}>
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : storefrontData.website ? (
                      <a 
                        href={storefrontData.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {storefrontData.website}
                      </a>
                    ) : (
                      isOwnStorefront && !previewMode && (
                        <p className="text-sm text-muted-foreground">Add website URL</p>
                      )
                    )}
                  </div>
                )}

                {/* Social Media Links - Always show for own storefront, or if there are existing links */}
                {((storefrontData.facebook || storefrontData.instagram || storefrontData.whatsapp || storefrontData.tiktok) || (isOwnStorefront && !previewMode)) && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Social Media & Online Presence
                      </h4>
                      
                      <div className="flex flex-col gap-3">
                        {/* Facebook */}
                        {(storefrontData.facebook || (isOwnStorefront && !previewMode)) && (
                          <>
                            {editing?.field === 'facebook' ? (
                              <div className="flex-1 space-y-2">
                                <Input
                                  value={editing.value}
                                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                  placeholder="facebook.com/yourpage"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSave('facebook', editing.value)}>
                                    <Save className="w-4 h-4 mr-1" />
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : storefrontData.facebook ? (
                              <div className="flex items-center gap-2">
                                <a 
                                  href={storefrontData.facebook.startsWith('http') ? storefrontData.facebook : `https://facebook.com/${storefrontData.facebook.replace('facebook.com/', '').replace('@', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors group"
                                  title={storefrontData.facebook}
                                >
                                  <Facebook className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                                </a>
                                <span className="text-sm text-muted-foreground flex-1 truncate" title={storefrontData.facebook}>
                                  {storefrontData.facebook}
                                </span>
                                {isOwnStorefront && !previewMode && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing('facebook', storefrontData.facebook)}
                                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 border border-blue-200">
                                  <Facebook className="w-5 h-5 text-blue-600" />
                                </div>
                                {isOwnStorefront && !previewMode && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing('facebook', storefrontData.facebook || '')}
                                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </>
                        )}

                        {/* Instagram */}
                        {(storefrontData.instagram || (isOwnStorefront && !previewMode)) && (
                          <>
                            {editing?.field === 'instagram' ? (
                              <div className="flex-1 space-y-2">
                                <Input
                                  value={editing.value}
                                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                  placeholder="instagram.com/yourprofile"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSave('instagram', editing.value)}>
                                    <Save className="w-4 h-4 mr-1" />
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : storefrontData.instagram ? (
                              <div className="flex items-center gap-2">
                                <a 
                                  href={storefrontData.instagram.startsWith('http') ? storefrontData.instagram : `https://instagram.com/${storefrontData.instagram.replace('instagram.com/', '').replace('@', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-50 hover:bg-pink-100 transition-colors group"
                                  title={storefrontData.instagram}
                                >
                                  <Instagram className="w-5 h-5 text-pink-600 group-hover:text-pink-700" />
                                </a>
                                <span className="text-sm text-muted-foreground flex-1 truncate" title={storefrontData.instagram}>
                                  {storefrontData.instagram}
                                </span>
                                {isOwnStorefront && !previewMode && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing('instagram', storefrontData.instagram)}
                                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-50 border border-pink-200">
                                  <Instagram className="w-5 h-5 text-pink-600" />
                                </div>
                                {isOwnStorefront && !previewMode && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing('instagram', storefrontData.instagram || '')}
                                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </>
                        )}

                        {/* WhatsApp */}
                        {(storefrontData.whatsapp || (isOwnStorefront && !previewMode)) && (
                          <>
                            {editing?.field === 'whatsapp' ? (
                              <div className="flex-1 space-y-2">
                                <Input
                                  value={editing.value}
                                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                  placeholder="+1234567890 or wa.me/1234567890"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSave('whatsapp', editing.value)}>
                                    <Save className="w-4 h-4 mr-1" />
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : storefrontData.whatsapp ? (
                              <div className="flex items-center gap-2">
                                <a 
                                  href={storefrontData.whatsapp.startsWith('http') ? storefrontData.whatsapp : `https://wa.me/${storefrontData.whatsapp.replace('+', '').replace('whatsapp.com/', '').replace('wa.me/', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 hover:bg-green-100 transition-colors group"
                                  title={storefrontData.whatsapp}
                                >
                                  <MessageCircle className="w-5 h-5 text-green-600 group-hover:text-green-700" />
                                </a>
                                <span className="text-sm text-muted-foreground flex-1 truncate" title={storefrontData.whatsapp}>
                                  {storefrontData.whatsapp}
                                </span>
                                {isOwnStorefront && !previewMode && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing('whatsapp', storefrontData.whatsapp)}
                                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 border border-green-200">
                                  <MessageCircle className="w-5 h-5 text-green-600" />
                                </div>
                                {isOwnStorefront && !previewMode && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing('whatsapp', storefrontData.whatsapp || '')}
                                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </>
                        )}

                        {/* TikTok */}
                        {(storefrontData.tiktok || (isOwnStorefront && !previewMode)) && (
                          <>
                            {editing?.field === 'tiktok' ? (
                              <div className="flex-1 space-y-2">
                                <Input
                                  value={editing.value}
                                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                  placeholder="Enter TikTok username or URL"
                                  className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSave('tiktok', editing.value)}>
                                    <Save className="w-3 h-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : storefrontData.tiktok ? (
                              <div className="flex items-center gap-2">
                                <a 
                                  href={storefrontData.tiktok.startsWith('http') ? storefrontData.tiktok : `https://tiktok.com/@${storefrontData.tiktok.replace('@', '').replace('tiktok.com/', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center w-10 h-10 rounded-full bg-black hover:bg-gray-800 transition-colors group"
                                  title={storefrontData.tiktok}
                                >
                                  <Music className="w-5 h-5 text-white group-hover:text-gray-200" />
                                </a>
                                <span className="text-sm text-muted-foreground flex-1 truncate" title={storefrontData.tiktok}>
                                  {storefrontData.tiktok}
                                </span>
                                {isOwnStorefront && !previewMode && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing('tiktok', storefrontData.tiktok)}
                                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black border border-gray-300">
                                  <Music className="w-5 h-5 text-white" />
                                </div>
                                {isOwnStorefront && !previewMode && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing('tiktok', storefrontData.tiktok || '')}
                                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Empty state for edit mode */}
                {isOwnStorefront && !previewMode && !storefrontData.phone && !storefrontData.email && !storefrontData.website && !storefrontData.facebook && !storefrontData.instagram && !storefrontData.whatsapp && !storefrontData.tiktok && (
                  <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                    <Phone className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium">Add contact information</p>
                    <p>Help customers reach you easily</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>

        {/* Products and Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Description */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                About {seller.businessName || seller.name}
                {isOwnStorefront && !previewMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing('description', storefrontData.description)}
                    className="opacity-60 hover:opacity-100"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit Description
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing?.field === 'description' ? (
                <div className="space-y-3">
                  <Textarea
                    value={editing.value}
                    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                    placeholder="Tell customers about your business, experience, farming methods, quality standards, and what makes you unique..."
                    rows={6}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => handleSave('description', editing.value)}>
                      <Save className="w-4 h-4 mr-1" />
                      Save Description
                    </Button>
                    <Button variant="outline" onClick={cancelEditing}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {storefrontData.description || (isOwnStorefront && !previewMode
                      ? 'Tell customers about your business. Click "Edit Description" to add information about your farming experience, quality standards, and what makes your products special.'
                      : 'No description available.'
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Policies - Only show if has content or if owner in edit mode */}
          {(storefrontData.policies.delivery || storefrontData.policies.payment || storefrontData.policies.returns || (isOwnStorefront && !previewMode)) && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Business Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Delivery Policy - Only show if has content or owner in edit mode */}
                {(storefrontData.policies.delivery || (isOwnStorefront && !previewMode)) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Delivery & Shipping</span>
                      {isOwnStorefront && !previewMode && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing('delivery', storefrontData.policies.delivery)}
                          className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {editing?.field === 'delivery' ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          placeholder="Describe your delivery options, areas covered, delivery times, and shipping costs..."
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => {
                            handleSave('delivery', editing!.value);
                          }}>
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {storefrontData.policies.delivery || (isOwnStorefront && !previewMode && 'Add your delivery and shipping information')}
                      </p>
                    )}
                  </div>
                )}

                {/* Payment Policy - Only show if has content or owner in edit mode */}
                {(storefrontData.policies.payment || (isOwnStorefront && !previewMode)) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Payment Methods</span>
                      {isOwnStorefront && !previewMode && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing('payment', storefrontData.policies.payment)}
                          className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {editing?.field === 'payment' ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          placeholder="List accepted payment methods: Cash on delivery, bank transfer, mobile payments, etc..."
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => {
                            handleSave('paymentMethods', editing!.value);
                          }}>
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {storefrontData.policies.payment || (isOwnStorefront && !previewMode && 'Add your accepted payment methods')}
                      </p>
                    )}
                  </div>
                )}

                {/* Returns Policy - Only show if has content or owner in edit mode */}
                {(storefrontData.policies.returns || (isOwnStorefront && !previewMode)) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Returns & Quality Guarantee</span>
                      {isOwnStorefront && !previewMode && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing('returns', storefrontData.policies.returns)}
                          className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {editing?.field === 'returns' ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          placeholder="Describe your quality guarantee, return policy, and how you handle customer concerns..."
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => {
                            handleSave('returnPolicy', editing!.value);
                          }}>
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {storefrontData.policies.returns || (isOwnStorefront && !previewMode && 'Add your quality guarantee and return policy')}
                      </p>
                    )}
                  </div>
                )}

                {isOwnStorefront && !previewMode && !storefrontData.policies.delivery && !storefrontData.policies.payment && !storefrontData.policies.returns && (
                  <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                    <Building className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium">Build customer trust</p>
                    <p>Add your business policies to help customers understand your services</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}


          {/* Products */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle>
                Products ({totalProducts} {totalProducts === 1 ? 'item' : 'items'})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {isOwnStorefront 
                      ? "You haven't listed any products yet. Go to your Dashboard to add and manage products."
                      : "No products available at the moment."
                    }
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {safeProducts.map((product) => (
                    <Card 
                      key={product.id} 
                      className="hover:shadow-md transition-shadow border-primary/30 cursor-pointer"
                      onClick={() => onViewProduct(product.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <S3Image 
                            src={product.imageUrl || product.image || undefined} 
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1 space-y-2">
                            <div>
                              <h3 className="font-medium">{product.name}</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold">
                                  {formatPrice(product.price)} MMK
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  per {product.unit}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Package className="w-3 h-3" />
                              <span>{product.quantity} available</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {getRelativeTime(product.updatedAt || product.createdAt)}
                              </span>
                            </div>

                            {/* Chat button for non-owners */}
                            {!isOwnStorefront && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="w-full h-8 text-xs mt-2"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click
                                  onChat(product.id);
                                }}
                              >
                                <MessageCircle className="w-3 h-3 mr-1" />
                                {currentUser ? 'Chat with seller' : 'Sign in to chat'}
                              </Button>
                            )}

                            {/* Edit button for storefront owner (not in preview mode) */}
                            {isOwnStorefront && !previewMode && onEditProduct && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="w-full h-8 text-xs mt-2"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click
                                  onEditProduct(product.id);
                                }}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit Product
                              </Button>
                            )}

                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Slider Modal */}
      {sellerStats && sellerStats.recentReviews && (
        <ReviewSliderModal
          isOpen={showAllReviewsModal}
          onClose={() => {
            console.log('🔍 Closing reviews modal');
            setShowAllReviewsModal(false);
          }}
          reviews={sellerStats.recentReviews}
          totalReviews={sellerStats.totalReviews}
          averageRating={sellerStats.averageRating}
        />
      )}
    </div>
  );
}