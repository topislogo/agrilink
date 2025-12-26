import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { UserBadge, getUserVerificationLevel, getUserAccountType, VERIFICATION_LEVELS } from "./UserBadgeSystem";
import { myanmarRegions, getRegionFromCity } from "../utils/regions";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { S3Image, clearS3ImageCache } from './S3Image';
import { useState, useRef, useEffect } from "react";
import { 
  User, 
  MapPin, 
  Phone, 
  Store, 
  Shield, 
  Mail,
  Calendar,
  Star,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Edit,
  Save,
  X,
  Camera,
  Trash2,
  Clock,
  Key,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { formatMemberSinceDate } from "../utils/dates";
import { AddressManagement } from "./AddressManagement";
import { PhoneVerification } from "./PhoneVerification";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { validatePassword } from "../utils/password-strength";

interface ProfileProps {
  user: any;
  onBack: () => void;
  onEditProfile: () => void;
  onShowVerification: (initialStep?: number) => void;
  onUpdate?: (updates: any) => Promise<void>;
  onViewStorefront?: (sellerId: string) => void;
}

interface EditingField {
  field: string;
  value: string;
}

export function Profile({ user, onBack, onEditProfile, onShowVerification, onUpdate, onViewStorefront }: ProfileProps) {
  const [editing, setEditing] = useState<EditingField | null>(null);
  const [editingImage, setEditingImage] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageSuccess, setImageSuccess] = useState('');
  const [imageError, setImageError] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);

  // Check for pending email changes on component mount
  useEffect(() => {
    const checkPendingEmail = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.pendingEmail) {
            setPendingEmail(userData.pendingEmail);
          }
        }
      } catch (error) {
        console.error('Error checking pending email:', error);
      }
    };

    checkPendingEmail();
  }, []);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-8">
          <p className="text-muted-foreground">User data not available</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const handleEmailChange = async () => {
    if (!newEmail || !emailPassword) {
      setEmailError('Please enter both new email and current password');
      return;
    }

    setEmailLoading(true);
    setEmailError('');
    setEmailSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setEmailError('Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch('/api/auth/update-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail, currentPassword: emailPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setPendingEmail(newEmail);
        setEmailSuccess(`We've sent a verification email to ${newEmail}. Please check your inbox and click the verification link.`);
        setNewEmail('');
        setEmailPassword('');
        setEditingEmail(false);
      } else {
        setEmailError(data.message || 'Failed to update email address');
      }
    } catch (error) {
      setEmailError('Network error. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };
  const [formData, setFormData] = useState<{[key: string]: any;
    }>({
      name: user.name || '',
      phone: user.phone || '',
      location: user.location || '',
      profileImage: user.profileImage || '',
      region: user.region || '',
      businessName: user.businessName || '',
  });
  
  // State for location editing (region + city)
  const [editingLocation, setEditingLocation] = useState({
    region: '',
    city: ''
  });

  // Update formData when user prop changes, but only if we're not currently editing
  useEffect(() => {
    // Only update formData if we're not currently editing a field
    // This prevents race conditions where user updates are overridden
    if (!editing) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        location: user.location || '',
        profileImage: user.profileImage || '',
        region: user.region || '',
        businessName: user.businessName || '',
      });
    }
  }, [user, editing]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (field: string, value: string) => {
    try {
      // Update local state immediately for responsive UI
      setFormData(prev => ({ ...prev, [field]: value }));
      setEditing(null);
      
      if (onUpdate) {
        // Map field names to API expected format
        const apiField = field === 'businessName' ? 'business_name' : field;
        await onUpdate({ [apiField]: value });
        
        // After successful update, ensure formData reflects the latest user data
        // This handles cases where the API response might have different formatting
        console.log('✅ Save completed, ensuring formData is in sync');
        setFormData(prev => ({
          ...prev,
          [field]: user[field] || value // Use user data if available, fallback to saved value
        }));
      }
    } catch (error) {
      console.error('Failed to save:', error);
      // Revert to original value on error
      setFormData(prev => ({ ...prev, [field]: formData[field] }));
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageSuccess('');
      setImageError('Please select a valid image file');
      setTimeout(() => setImageError(''), 5000);
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setImageSuccess('');
      setImageError('Image size must be less than 10MB');
      setTimeout(() => setImageError(''), 5000);
      return;
    }

    try {
      setImageUploading(true);
      setImageError('');
      setEditingImage(false);
      
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      if (onUpdate) {
        const result = await onUpdate({ profileImage: dataUrl }) as any;
        // Use the S3 key returned from API, fallback to dataUrl if not available
        const imageKey = result?.user?.profileImage || result?.profileImage || dataUrl;
        console.log('🖼️ Profile component - Image upload result:', result);
        console.log('🖼️ Profile component - Extracted imageKey:', imageKey);
        
        // Clear S3Image cache to force reload of new image
        clearS3ImageCache();
        
        // Directly update formData with the S3 key (like storefront does)
        setFormData(prev => ({
          ...prev,
          profileImage: imageKey
        }));
        
        setImageSuccess('✅ Profile image updated successfully!');
        setTimeout(() => setImageSuccess(''), 5000);
      }
    } catch (error) {
      console.error('Failed to process image:', error);
      setImageSuccess('');
      setImageError('Failed to process image. Please try a different image.');
      setTimeout(() => setImageError(''), 5000);
    } finally {
      setImageUploading(false);
    }
  };


  const startEditing = (field: string, currentValue: string) => {
    setEditing({ field, value: currentValue });
  };

  const cancelEditing = () => {
    setEditing(null);
    setEditingImage(false);
    setEditingLocation({ region: '', city: '' });
  };

  const getAvailableCities = () => {
    if (!formData.region) return [];
    const region = myanmarRegions[formData.region as keyof typeof myanmarRegions];
    return region ? region.cities : [];
  };
  
  // Get available cities for editing location
  const getAvailableCitiesForEditing = () => {
    if (!editingLocation.region) return [];
    const region = myanmarRegions[editingLocation.region as keyof typeof myanmarRegions];
    return region ? region.cities : [];
  };
  
  // Initialize location editing state
  const initializeLocationEditing = () => {
    const regionKey = getRegionFromCity(formData.location);
    setEditingLocation({
      region: regionKey || '',
      city: formData.location || ''
    });
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    // Use password strength validation
    const passwordValidation = validatePassword(passwordData.newPassword);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message || 'Password does not meet requirements');
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setPasswordError('Your session has expired. Please log in again.');
        } else if (response.status === 404) {
          setPasswordError('User not found. Please refresh the page and try again.');
        } else {
          setPasswordError(data.message || 'Failed to change password. Please try again.');
        }
        return;
      }

      setPasswordSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordChange(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordError('An error occurred. Please try again.');
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const cancelPasswordChange = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
    setShowPasswordChange(false);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="h-9 px-3 -ml-3">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">View and manage your account information</p>
        </div>
      </div>



      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden border-primary/30">
            <CardHeader className="text-center pb-6">
              {/* Profile Picture */}
              <div className="flex justify-center mb-6">
                <div className="relative group">
                  {formData.profileImage ? (
                    <S3Image
                      key={formData.profileImage} // Force re-render when image changes
                      src={formData.profileImage}
                      alt={`${formData.name}'s profile picture`}
                      className="w-28 h-28 rounded-full object-cover border-4 border-border shadow-lg"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full border-4 border-border shadow-lg bg-muted flex items-center justify-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  )}
                  
                  {imageUploading && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                      <div className="text-white text-sm flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </div>
                    </div>
                  )}
                  
                  <div 
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => setEditingImage(true)}
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  
                  {user.verified && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-card">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Image upload success message */}
              {imageSuccess && (
                <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {imageSuccess}
                </div>
              )}
              
              {/* Image upload error message */}
              {imageError && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  {imageError}
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                id="profile-image-upload"
                name="profile-image-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="hidden"
              />
              
              {editingImage && (
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">Update your profile picture</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Camera className="w-4 h-4 mr-2" />
                      Choose Photo
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingImage(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Name and Type */}
              <div className="space-y-3 mb-6">
                {editing?.field === 'name' ? (
                  <div className="space-y-2">
                    <Input
                      value={editing.value}
                      onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                      className="text-center text-xl font-bold"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave('name', editing.value);
                        if (e.key === 'Escape') cancelEditing();
                      }}
                    />
                    <div className="flex justify-center gap-2">
                      <Button size="sm" onClick={() => handleSave('name', editing.value)}>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <CardTitle className="text-2xl font-bold">
                      {formData.name}
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing('name', formData.name)}
                      className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="flex justify-center gap-2 flex-wrap">
                  <UserBadge 
                    userType={user.userType}
                    accountType={getUserAccountType(user)}
                    verificationLevel={getUserVerificationLevel(user)}
                    size="md"
                  />
                </div>
              </div>
              
              {/* Verification Actions */}
              {user.userType !== 'admin' && (() => {
                const verificationLevel = getUserVerificationLevel(user);
                const verificationConfig = VERIFICATION_LEVELS[verificationLevel] || VERIFICATION_LEVELS.unverified;
                
                return (
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                      className={`w-full h-11 font-medium ${verificationConfig.borderColor} ${verificationConfig.color} hover:${verificationConfig.bgColor}`}
                    onClick={() => onShowVerification(1)}
                  >
                      <Shield className={`w-4 h-4 mr-2 ${verificationConfig.color}`} />
                    View Verification Details
                  </Button>
                </div>
                );
              })()}
            </CardHeader>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6 border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg">Account Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Member Since</span>
                </div>
                <span className="text-sm font-medium">{formatMemberSinceDate(user.joinedDate)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  {user.rating && !isNaN(Number(user.rating)) && Number(user.rating) > 0 ? (
                    <>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round(user.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">
                        {Number(user.rating).toFixed(1)} ({user.totalReviews} reviews)
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">No ratings yet</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <div className="lg:col-span-2 space-y-6">

          {/* Contact Information */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6 md:gap-x-10 md:gap-y-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </div>
                  
                  {!editingEmail ? (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="font-medium flex-1">
                          {user.email}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingEmail(true)}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                      {user.emailVerified ? (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                      
                      {/* Pending Email Change Status */}
                      {pendingEmail && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              <Mail className="w-3 h-3 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-900">
                                Email Change Pending
                              </p>
                              <p className="text-sm text-blue-700 mt-1">
                                We've sent a verification email to <span className="font-medium">{pendingEmail}</span>. 
                                Please check your inbox and click the verification link to complete the change.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="new-email">New Email Address</Label>
                        <Input
                          id="new-email"
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Enter new email address"
                          disabled={emailLoading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email-password">Current Password</Label>
                        <Input
                          id="email-password"
                          type="password"
                          value={emailPassword}
                          onChange={(e) => setEmailPassword(e.target.value)}
                          placeholder="Enter your current password"
                          disabled={emailLoading}
                        />
                      </div>
                      
                      {emailError && (
                        <Alert variant="destructive">
                          <AlertDescription>{emailError}</AlertDescription>
                        </Alert>
                      )}
                      
                      {emailSuccess && (
                        <Alert className="border-green-200 bg-green-50 text-green-800">
                          <AlertDescription>{emailSuccess}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={handleEmailChange}
                          disabled={emailLoading || !newEmail || !emailPassword}
                          className="flex-1"
                        >
                          {emailLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            'Send Verification Email'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingEmail(false);
                            setNewEmail('');
                            setEmailPassword('');
                            setEmailError('');
                            setEmailSuccess('');
                          }}
                          disabled={emailLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium flex-1">
                      {formData.phone || 'Add phone number'}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPhoneVerification(true)}
                      className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                  {user.phoneVerified ? (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Unverified
                    </Badge>
                  )}
                </div>
                
                {/* Business Name / Farm Name - Only for farmers and traders */}
                {(user.userType === 'farmer' || user.userType === 'trader') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Store className="w-4 h-4" />
                      {user.userType === 'farmer' ? 'Farm Name' : 'Store Name'}
                    </div>
                    {editing?.field === 'businessName' ? (
                      <div className="space-y-2">
                        <Input
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          placeholder={`Enter your ${user.userType === 'farmer' ? 'farm' : 'store'} name`}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave('businessName', editing.value);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => handleSave('businessName', editing.value)}>
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="font-medium flex-1">
                          {formData.businessName || `Add your ${user.userType === 'farmer' ? 'farm' : 'store'} name`}
                        </p>
                        {!user.verified && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditing({ field: 'businessName', value: formData.businessName })}
                            className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                    {user.verified && formData.businessName && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Locked after verification
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    Location
                  </div>
                  {editing?.field === 'location' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
                          <Select
                            value={editingLocation.region}
                            onValueChange={(value) => {
                              setEditingLocation(prev => ({ 
                                region: value, 
                                city: '' // Reset city when region changes
                              }));
                            }}
                          >
                            <SelectTrigger className="pl-10">
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64 overflow-y-auto">
                              {Object.entries(myanmarRegions).map(([key, region]) => (
                                <SelectItem key={key} value={key}>{region.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
                          <Select
                            value={editingLocation.city}
                            onValueChange={(value) => setEditingLocation(prev => ({ ...prev, city: value }))}
                            disabled={!editingLocation.region}
                          >
                            <SelectTrigger className="pl-10">
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64 overflow-y-auto">
                              {getAvailableCitiesForEditing().map((city) => (
                                <SelectItem key={city} value={city}>{city}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {!editingLocation.region && (
                        <p className="text-xs text-muted-foreground">Please select a region first</p>
                      )}
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleSave('location', editingLocation.city)}
                          disabled={!editingLocation.region || !editingLocation.city}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-medium flex-1">
                        {formData.location ? (() => {
                          // Find the region for this city
                          const regionKey = getRegionFromCity(formData.location);
                          const regionName = regionKey ? myanmarRegions[regionKey as keyof typeof myanmarRegions]?.name : '';
                          return regionName ? `${formData.location}, ${regionName}` : formData.location;
                        })() : 'Add location'}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                        onClick={() => {
                          initializeLocationEditing();
                          startEditing('location', formData.location);
                        }}
                      className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showPasswordChange ? (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">
                      Change your account password
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordChange(true)}
                    className="flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Change Password
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Change Password</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelPasswordChange}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Success Message */}
                  {passwordSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{passwordSuccess}</span>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {passwordError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{passwordError}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="pr-10"
                          placeholder="Enter your current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('current')}
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="pr-10"
                          placeholder="Enter your new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('new')}
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <PasswordStrengthIndicator password={passwordData.newPassword} />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="pr-10"
                          placeholder="Confirm your new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('confirm')}
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handlePasswordChange}
                        className="flex-1"
                        disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Update Password
                      </Button>
                      <Button
                        variant="outline"
                        onClick={cancelPasswordChange}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>


          {/* Address Management */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address Management
              </CardTitle>
              <CardDescription>
                Manage your delivery addresses for orders and offers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddressManagement userId={user.id} />
            </CardContent>
          </Card>

          {/* Storefront Management */}
          {(user.userType === 'farmer' || user.userType === 'trader') && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Business Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Store className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Manage Your Storefront</h4>
                    <p className="text-sm text-muted-foreground">
                      Set up your business description, product categories, and customer information in your dedicated storefront.
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      if (onViewStorefront && user?.id) {
                        onViewStorefront(user.id);
                      }
                    }}
                    className="w-full"
                  >
                    View My Storefront
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Public Profile Management for Buyers */}
          {user.userType === 'buyer' && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Public Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Manage Your Public Profile</h4>
                    <p className="text-sm text-muted-foreground">
                      Set up your personal information, preferences, and social media links in your dedicated public profile.
                    </p>
                  </div>
                  <Button 
                    onClick={() => window.open(`/user/${user.id}`, '_blank')}
                    className="w-full"
                  >
                    View My Public Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Phone Verification Modal */}
      {showPhoneVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <PhoneVerification
              currentUser={user}
              onVerificationComplete={async (phoneNumber) => {
                // Update the user's phone number after successful verification
                setShowPhoneVerification(false);
                
                // Update the form data
                setFormData(prev => ({ ...prev, phone: phoneNumber }));
                
                // Use onUpdate callback if available
                if (onUpdate) {
                  await onUpdate({ phone: phoneNumber, phoneVerified: true });
                }
              }}
              onBack={() => setShowPhoneVerification(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}