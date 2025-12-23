import { useState } from 'react';
import { S3Image } from './S3Image';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { UserBadge, getUserVerificationLevel, AccountTypeBadge } from "./UserBadgeSystem";
import { ReviewSliderModal } from "./ReviewSliderModal";
import { User, MapPin, Calendar, Star, MessageCircle, Package, Store, Phone, Globe, Facebook, Instagram, MessageSquare, Edit, Eye, Save,  X, Camera, ChevronLeft, Info } from "lucide-react";

interface UserProfileData {
  id: string;
  email: string;
  aboutme?: string;
  name: string;
  userType: 'farmer' | 'trader' | 'buyer' | 'admin';
  accountType?: 'individual' | 'business';
  joinedDate: string;
  location?: string;
  profileImage?: string;
  phone?: string;
  website?: string;
  businessName?: string;
  businessDescription?: string;
  businessHours?: string;
  specialties?: string[];
  policies?: {
    returns?: string;
    delivery?: string;
    payment?: string;
  };
  social?: {
    facebook?: string;
    instagram?: string;
    telegram?: string;
    whatsapp?: string;
    tiktok?: string;
  };
  verification?: {
    verified: boolean;
    phoneVerified: boolean;
    verificationStatus: string;
  };
  ratings?: {
    rating: number;
    totalReviews: number;
    responseTime?: string;
    qualityCertifications?: string[];
    farmingMethods?: string[];
  };
  products?: any[];
  reviews?: any[];
}

interface UserProfileProps {
  userProfile: UserProfileData;
  currentUser?: any;
  onBack?: () => void;
  onEdit?: (updates: any) => void;
  onUpdateProfile: (updates: any, fieldEdit: string) => void;
  isOwnProfile?: boolean;
  previewMode?: boolean;
  onTogglePreviewMode?: (mode: boolean) => void;
}

export function UserProfile({ 
  userProfile, 
  currentUser, 
  onBack, 
  onEdit, 
  onUpdateProfile,
  isOwnProfile = false,
  previewMode = false,
  onTogglePreviewMode
}: UserProfileProps) {
  
  // Editing states
  const [editing, setEditing] = useState<{
    field: string;
    value: string;
  } | null>(null);
  
  // Profile data state - directly use userProfile prop data
  const [profileData, setProfileData] = useState(() => ({
    businessHours: userProfile.businessHours || '',
    businessName: userProfile.businessName || '',
    businessDescription: userProfile.businessDescription || '',
    aboutme: userProfile.aboutme || '',
    phone: userProfile.phone || '',
    email: userProfile.email || '',
    website: userProfile.website || '',
    facebook: userProfile.social?.facebook || '',
    instagram: userProfile.social?.instagram || '',
    telegram: userProfile.social?.telegram || '',
    whatsapp: userProfile.social?.whatsapp || '',
    tiktok: userProfile.social?.tiktok || '',
    specialties: userProfile.specialties || [],
    policies: userProfile.policies || {
      returns: '',
      delivery: '',
      payment: ''
    }
  }));

  // Review modal state
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [allReviews, setAllReviews] = useState<any[]>([]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'farmer': return 'Farmer';
      case 'trader': return 'Trader';
      case 'buyer': return 'Buyer';
      case 'admin': return 'Admin';
      default: return userType;
    }
  };

  const handleEditField = async (field: string, currentValue: string) => {
    setEditing({ field, value: currentValue });
  };

  const handleSaveField = async (fieldEdit: string) => {
    if (!editing) return;
    
    const updates = {
      [editing.field]: editing.value
    };
    
    setProfileData(prev => ({ ...prev, ...updates }));
    await onUpdateProfile(updates, fieldEdit);
    setEditing(null);
  };

  const handleCancelEdit = () => {
    setEditing(null);
  };

  const isSeller = userProfile.userType === 'farmer' || userProfile.userType === 'trader';
  const isBuyer = userProfile.userType === 'buyer';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="space-y-4 mb-8">
        {/* Back button row */}
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="h-9 px-3 -ml-3">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        
        {/* Title section - aligned with content */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{userProfile.name}</h1>
            <p className="text-muted-foreground">
              {getUserTypeLabel(userProfile.userType)} Profile
            </p>
          </div>

          {/* Preview Mode Toggle - Only show for profile owners */}
          {isOwnProfile && onTogglePreviewMode && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Preview Mode</span>
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
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Customer View</span>
                </div>
              )}
            </div>
          )}
          
          {!isOwnProfile && (
            <Button 
              onClick={() => window.open(`/messages?userId=${userProfile.id}`, '_blank')}
              className="h-10 px-6"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact
            </Button>
          )}
        </div>
      </div>

      {/* Preview Mode Banner */}
      {previewMode && isOwnProfile && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-medium text-primary">Customer Preview Mode</h3>
              <p className="text-sm text-primary/80">
                This is exactly how customers see your profile. Toggle off to return to editing mode.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* User Profile */}
        <div className="lg:col-span-1 space-y-4">
          {/* Main Profile Card */}
          <Card className="border-primary/30">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* User Image */}
                <div className="relative group">
                  <div className="w-full h-48 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
                    {userProfile.profileImage ? (
                      <S3Image 
                        src={userProfile.profileImage} 
                        alt={userProfile.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <User className="w-16 h-16 text-primary" />
                    )}
                  </div>
                  {isOwnProfile && !previewMode && userProfile.userType !== 'buyer' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white shadow-md"
                      onClick={() => {/* Handle image upload */}}
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      Edit Photo
                    </Button>
                  )}
                </div>

                {/* Basic Info */}
                <div className="group">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{userProfile.name}</h2>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{userProfile.location || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <UserBadge 
                      userType={userProfile.userType}
                      accountType={userProfile.accountType || 'individual'}
                      verificationLevel={getUserVerificationLevel(userProfile.verification)}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {userProfile.ratings && userProfile.ratings.totalReviews > 0 ? (
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(userProfile.ratings!.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm font-medium ml-2">
                          {Number(userProfile.ratings.rating).toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({userProfile.ratings.totalReviews} {userProfile.ratings.totalReviews === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-gray-300" />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">No reviews yet</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Contact Information</span>
                  </div>
                  
                  {userProfile.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{userProfile.phone}</span>
                    </div>
                  )}
                  
                  {userProfile.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a 
                        href={userProfile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {userProfile.website}
                      </a>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Member Since */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Member Since</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(userProfile.joinedDate)}</span>
                  </div>
                </div>

                {/* Social Media */}
                {userProfile.social && Object.values(userProfile.social).some(Boolean) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Connect</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {userProfile.social.facebook && (
                          <a 
                            href={userProfile.social.facebook} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Facebook className="w-5 h-5" />
                          </a>
                        )}
                        {userProfile.social.instagram && (
                          <a 
                            href={userProfile.social.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Instagram className="w-5 h-5" />
                          </a>
                        )}
                        {userProfile.social.telegram && (
                          <a 
                            href={userProfile.social.telegram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <MessageSquare className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section - Only show if has content or in edit mode */}
          {(!previewMode || profileData.aboutme) && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  {isBuyer ? 'About Me' : isSeller ? 'Experience' : 'About'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editing?.field === 'aboutme' ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editing.value}
                      onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                      placeholder={isBuyer ? 'Tell us about yourself...' : 'Describe your experience...'}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveField('profile')}>
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-muted-foreground flex-1">
                      {profileData.aboutme || (isBuyer ? 'No description provided' : 'No experience listed')}
                    </p>
                    {isOwnProfile && !previewMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditField('aboutme', profileData.aboutme)}
                        className="ml-2"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Business Information (for business accounts) */}
          {userProfile.accountType === 'business' && (userProfile.businessName || userProfile.businessDescription) && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="font-medium"> Business Name </label>
                {editing?.field === 'businessName' ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editing.value}
                      onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                      placeholder={'Tell us about your business name...'}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveField('business_details')}>
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-muted-foreground flex-1"> {profileData.businessName || 'Not provided'} </p>
                    {isOwnProfile && !previewMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditField('businessName', profileData.businessName)}
                        className="ml-2">
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
                
                <label className="font-medium"> Business Description </label>
                {editing?.field === 'businessDescription' ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editing.value}
                      onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                      placeholder={'Tell us about your business...'}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveField('business_details')}>
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-muted-foreground flex-1"> {profileData.businessDescription || 'Not provided'} </p>
                    {isOwnProfile && !previewMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditField('businessDescription', profileData.businessDescription)}
                        className="ml-2">
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}

                <label className="font-medium"> Business Hours </label>
                {editing?.field === 'businessHours' ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editing.value}
                      onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                      placeholder={'9AM - 5PM...'}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveField('business_details')}>
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-muted-foreground flex-1"> {profileData.businessHours || 'Not provided'} </p>
                    {isOwnProfile && !previewMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditField('businessHours', profileData.businessHours)}
                        className="ml-2">
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Social Media - Only show in edit mode or if there's actual content */}
          {(!previewMode || (profileData.facebook || profileData.instagram || profileData.telegram || profileData.whatsapp)) && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Social Media
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {/* Facebook - Only show if has content or in edit mode */}
                    {(!previewMode || profileData.facebook) && (
                      <div>
                        <label className="text-sm font-medium">Facebook</label>
                        {editing?.field === 'facebook' ? (
                          <div className="space-y-2 mt-1">
                            <Input
                              value={editing.value}
                              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                              placeholder="Facebook profile URL"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveField('socialmedia')}>
                                <Save className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                <X className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-muted-foreground">
                              {profileData.facebook || 'Not provided'}
                            </p>
                            {isOwnProfile && !previewMode && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditField('facebook', profileData.facebook)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Instagram - Only show if has content or in edit mode */}
                    {(!previewMode || profileData.instagram) && (
                      <div>
                        <label className="text-sm font-medium">Instagram</label>
                        {editing?.field === 'instagram' ? (
                          <div className="space-y-2 mt-1">
                            <Input
                              value={editing.value}
                              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                              placeholder="Instagram profile URL"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveField('socialmedia')}>
                                <Save className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                <X className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-muted-foreground">
                              {profileData.instagram || 'Not provided'}
                            </p>
                            {isOwnProfile && !previewMode && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditField('instagram', profileData.instagram)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {/* Telegram - Only show if has content or in edit mode */}
                    {(!previewMode || profileData.telegram) && (
                      <div>
                        <label className="text-sm font-medium">Telegram</label>
                        {editing?.field === 'telegram' ? (
                          <div className="space-y-2 mt-1">
                            <Input
                              value={editing.value}
                              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                              placeholder="Telegram username"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveField('socialmedia')}>
                                <Save className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                <X className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-muted-foreground">
                              {profileData.telegram || 'Not provided'}
                            </p>
                            {isOwnProfile && !previewMode && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditField('telegram', profileData.telegram)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* WhatsApp - Only show if has content or in edit mode */}
                    {(!previewMode || profileData.whatsapp) && (
                      <div>
                        <label className="text-sm font-medium">WhatsApp</label>
                        {editing?.field === 'whatsapp' ? (
                          <div className="space-y-2 mt-1">
                            <Input
                              value={editing.value}
                              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                              placeholder="WhatsApp number"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveField('socialmedia')}>
                                <Save className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                <X className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-muted-foreground">
                              {profileData.whatsapp || 'Not provided'}
                            </p>
                            {isOwnProfile && !previewMode && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditField('whatsapp', profileData.whatsapp)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Products (for sellers) */}
          {isSeller && userProfile.products && userProfile.products.length > 0 && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Products ({userProfile.products.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {userProfile.products.slice(0, 6).map((product) => (
                    <div key={product.id} className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <div className="flex gap-3">
                        <div className="w-16 h-16 bg-muted rounded-lg shrink-0">
                          {product.imageUrl ? (
                            <S3Image 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-muted-foreground m-auto" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{product.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">{product.category}</p>
                          <p className="text-sm font-medium">
                            {product.price ? `${product.price} MMK per ${product.unit}` : 'Contact for price'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={() => window.open(`/product/${product.id}`, '_blank')}
                      >
                        View Product
                      </Button>
                    </div>
                  ))}
                </div>
                {userProfile.products.length > 6 && (
                  <div className="text-center mt-4">
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`/user/${userProfile.id}`, '_blank')}
                    >
                      View All Products
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reviews Section - Only show if there are reviews */}
          {userProfile.reviews && userProfile.reviews.length > 0 && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Reviews ({userProfile.reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userProfile.reviews.slice(0, 3).map((review: any) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-primary">
                          {review.reviewer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{review.reviewer.name}</span>
                          <AccountTypeBadge 
                            userType={review.reviewer.userType}
                            accountType={review.reviewer.accountType}
                            size="sm"
                          />
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-sm text-gray-600">
                            {review.rating === 1 ? 'Poor' : 
                             review.rating === 2 ? 'Fair' : 
                             review.rating === 3 ? 'Good' : 
                             review.rating === 4 ? 'Very Good' : 'Excellent'}
                          </span>
                        </div>

                        {review.comment && (
                          <p className="text-gray-700 text-sm leading-relaxed">
                            "{review.comment}"
                          </p>
                        )}

                        {review.productName && (
                          <p className="text-xs text-gray-500 mt-2">
                            Product: {review.productName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {userProfile.reviews.length > 3 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAllReviews(userProfile.reviews ? userProfile.reviews : []);
                        setShowAllReviewsModal(true);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground h-auto p-1"
                    >
                      +{userProfile.reviews.length - 3} more reviews
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Review Slider Modal */}
      {allReviews.length > 0 && (
        <ReviewSliderModal
          isOpen={showAllReviewsModal}
          onClose={() => setShowAllReviewsModal(false)}
          reviews={allReviews}
          totalReviews={allReviews.length}
          averageRating={userProfile.ratings?.rating || 0}
        />
      )}
    </div>
  );
}