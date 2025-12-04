import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { S3Image } from "./S3Image";
import { myanmarRegions } from "../utils/regions";
import { PhoneVerification } from "./PhoneVerification";

import { 
  ChevronLeft, 
  Save, 
  User, 
  MapPin, 
  Phone, 
  Store, 
  Camera,
  Edit,
  Plus,
  Trash2,
  CheckCircle
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  userType: 'farmer' | 'trader' | 'buyer';
  location: string;
  phone?: string;
  businessName?: string;
  businessDescription?: string;
  qualityCertifications?: string[];
  farmingMethods?: string[];
  verified: boolean;
  profileImage?: string;
  storefrontImage?: string;
}

interface EditProfileProps {
  user: User;
  onClose: () => void;
  onSave: (updates: Partial<User>) => Promise<void>;
}

export function EditProfile({ user, onClose, onSave }: EditProfileProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingImage, setLoadingImage] = useState<string | null>(null);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  
  // File input refs
  const profileFileRef = useRef<HTMLInputElement>(null);
  const storefrontFileRef = useRef<HTMLInputElement>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: user.name || '',
    location: user.location || '',
    phone: user.phone || '',
    businessName: user.businessName || '',
    businessDescription: user.businessDescription || '',
    qualityCertifications: user.qualityCertifications || [],
    farmingMethods: user.farmingMethods || [],
    profileImage: user.profileImage || '',
    storefrontImage: user.storefrontImage || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop'
  });

  const [newCertification, setNewCertification] = useState('');
  const [newFarmingMethod, setNewFarmingMethod] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (formData.phone && !/^(\+95|0)?[0-9\s\-]{8,}$/.test(formData.phone.replace(/\s|-/g, ''))) {
      newErrors.phone = 'Please enter a valid Myanmar phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      setErrors({ submit: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'profile' | 'storefront') => {
    try {
      setLoadingImage(type);
      
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image size must be less than 5MB');
      }
      
      // Convert to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const currentField = type === 'profile' ? 'profileImage' : 'storefrontImage';
        
        setFormData(prev => ({
          ...prev,
          [currentField]: dataUrl
        }));
        
        setSuccessMessage(`✅ ${type === 'profile' ? 'Profile' : 'Storefront'} image uploaded successfully! Click "Save Changes" to apply.`);
        setTimeout(() => setSuccessMessage(''), 5000);
        setLoadingImage(null);
      };
      
      reader.onerror = () => {
        throw new Error('Failed to read image file');
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload image:', error);
      setErrors({ image: error instanceof Error ? error.message : 'Failed to upload image. Please try again.' });
      setLoadingImage(null);
    }
  };

  const handleImageUpload = (type: 'profile' | 'storefront') => {
    setErrors({}); // Clear any previous errors when starting new upload
    const fileRef = type === 'profile' ? profileFileRef : storefrontFileRef;
    fileRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'storefront') => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, type);
    }
  };



  const addCertification = () => {
    if (newCertification.trim() && !formData.qualityCertifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        qualityCertifications: [...prev.qualityCertifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      qualityCertifications: prev.qualityCertifications.filter(c => c !== cert)
    }));
  };

  const addFarmingMethod = () => {
    if (newFarmingMethod.trim() && !formData.farmingMethods.includes(newFarmingMethod.trim())) {
      setFormData(prev => ({
        ...prev,
        farmingMethods: [...prev.farmingMethods, newFarmingMethod.trim()]
      }));
      setNewFarmingMethod('');
    }
  };

  const removeFarmingMethod = (method: string) => {
    setFormData(prev => ({
      ...prev,
      farmingMethods: prev.farmingMethods.filter(m => m !== method)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChevronLeft 
            className="w-5 h-5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors" 
            onClick={onClose}
          />
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <User className="w-6 h-6" />
              Edit Profile
            </h1>
            <p className="text-muted-foreground">Update your profile information and settings</p>
          </div>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Images */}
            <div className="space-y-4">
              <h3 className="font-medium">Profile Images</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Profile Picture */}
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="relative">
                    <S3Image
                      src={formData.profileImage}
                      alt="Profile"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {loadingImage === 'profile' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <div className="text-white text-sm flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </div>
                      </div>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleImageUpload('profile')}
                      disabled={loadingImage === 'profile'}
                      title="Edit image"
                    >
                      {loadingImage === 'profile' ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Edit className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <input
                    ref={profileFileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'profile')}
                    className="hidden"
                    id="edit-profile-image"
                    name="edit-profile-image"
                  />
                </div>

                {/* Storefront Image */}
                {(user.userType === 'farmer' || user.userType === 'trader') && (
                  <div className="space-y-2">
                    <Label>Storefront Image</Label>
                    <div className="relative">
                      <S3Image
                        src={formData.storefrontImage}
                        alt="Storefront"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      {loadingImage === 'storefront' && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                          <div className="text-white text-sm flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Uploading...
                          </div>
                        </div>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleImageUpload('storefront')}
                        disabled={loadingImage === 'storefront'}
                        title="Edit image"
                      >
                        {loadingImage === 'storefront' ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Edit className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    <input
                      ref={storefrontFileRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'storefront')}
                      className="hidden"
                      id="edit-storefront-image"
                      name="edit-storefront-image"
                    />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Basic Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                  >
                    <SelectTrigger className={errors.location ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(myanmarRegions).map((region) => (
                        <SelectItem key={region.name} value={region.name}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="phone"
                      value={formData.phone}
                      placeholder="+95 9 XXX XXX XXX"
                      className={errors.phone ? 'border-destructive' : ''}
                      readOnly
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPhoneVerification(true)}
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Verify
                    </Button>
                  </div>
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>

              </div>
            </div>

            {/* Business Information */}
            {(user.userType === 'farmer' || user.userType === 'trader') && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    Business Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                        placeholder="Your business or farm name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessDescription">Business Description</Label>
                      <Textarea
                        id="businessDescription"
                        value={formData.businessDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessDescription: e.target.value }))}
                        placeholder="Describe your business, farming practices, or specialties..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Farmer-specific fields */}
            {user.userType === 'farmer' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium">Farming Information</h3>
                  
                  {/* Quality Certifications */}
                  <div className="space-y-2">
                    <Label>Quality Certifications</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newCertification}
                        onChange={(e) => setNewCertification(e.target.value)}
                        placeholder="Add certification"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                      />
                      <Button type="button" onClick={addCertification} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.qualityCertifications.map((cert) => (
                        <Badge key={cert} variant="outline" className="gap-1">
                          {cert}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0"
                            onClick={() => removeCertification(cert)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Farming Methods */}
                  <div className="space-y-2">
                    <Label>Farming Methods</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newFarmingMethod}
                        onChange={(e) => setNewFarmingMethod(e.target.value)}
                        placeholder="Add farming method"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFarmingMethod())}
                      />
                      <Button type="button" onClick={addFarmingMethod} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.farmingMethods.map((method) => (
                        <Badge key={method} variant="outline" className="gap-1">
                          {method}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0"
                            onClick={() => removeFarmingMethod(method)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Success message */}
            {successMessage && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                {successMessage}
              </div>
            )}

            {/* Error message */}
            {(errors.submit || errors.image) && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {errors.submit || errors.image}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Phone Verification Modal */}
      {showPhoneVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <PhoneVerification
              currentUser={user}
              onVerificationComplete={(phoneNumber) => {
                // Update the form data with the new phone number
                setFormData(prev => ({ ...prev, phone: phoneNumber }));
                setShowPhoneVerification(false);
              }}
              onBack={() => setShowPhoneVerification(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}