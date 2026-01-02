"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent } from "./ui/card";
import { S3Image } from './S3Image';
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { 
  Package, 
  DollarSign, 
  Truck, 
  Calendar, 
  MapPin,
  AlertCircle,
  Plus,
  Home,
  Building,
  CreditCard,
  Banknote,
  Smartphone
} from "lucide-react";
import { myanmarRegions } from "@/utils/regions";

interface SimpleOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    unit: string;
    category: string;
  };
  seller: {
    id: string;
    name: string;
    location: string;
  };
  onSubmit: (offer: {
    offerPrice: number;
    quantity: number;
    message: string;
    deliveryAddress?: {
      addressType: string;
      label: string;
      recipient_name: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postal_code?: string;
    };
    deliveryOptions: string[];
    paymentTerms: string[];
    expirationHours: number;
  }) => void;
}

export function SimpleOfferModal({
  isOpen,
  onClose,
  product,
  seller,
  onSubmit
}: SimpleOfferModalProps) {
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [message, setMessage] = useState<string>('');
  const [deliveryOptions, setDeliveryOptions] = useState<string[]>(['']);
  const [paymentTerms, setPaymentTerms] = useState<string[]>(['']);
  const [expirationHours, setExpirationHours] = useState<number>(24);
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch product data when modal opens
  useEffect(() => {
    if (isOpen && product.id) {
      fetchProductData().catch(error => {
        console.error('❌ Failed to fetch product data in useEffect:', error);
        // Don't set any fallback data - let it fail
      });
    }
  }, [isOpen, product.id]);

  // Pre-populate offer price when product data is loaded
  useEffect(() => {
    const currentProductData = productData || product;
    if (currentProductData && currentProductData.price && !offerPrice) {
      console.log('💰 Pre-populating offer price:', currentProductData.price);
      setOfferPrice(currentProductData.price.toString());
    }
  }, [productData, product, offerPrice]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOfferPrice('');
      setQuantity('1');
      setMessage('');
      setDeliveryOptions(['']);
      setPaymentTerms(['']);
      setExpirationHours(24);
      setProductData(null);
      setShowNewAddress(false);
      setNewAddress({
        addressType: 'home',
        label: '',
        recipient_name: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postal_code: '',
      });
    }
  }, [isOpen]);

  const fetchProductData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching product data for ID:', product.id);
      
      // Check if product ID is valid
      if (!product.id || product.id === 'undefined' || product.id === 'null') {
        throw new Error(`Invalid product ID: ${product.id}`);
      }
      
      const response = await fetch(`/api/products/${product.id}`);
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Product data fetched:', data);
        // The API returns data wrapped in a 'product' object
        const productData = data.product || data;
        console.log('💰 Product price:', productData.price);
        console.log('🖼️ Product image:', productData.imageUrl);
        setProductData(productData);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch product data, status:', response.status);
        console.error('❌ Error response:', errorText);
        console.error('❌ Product ID that failed:', product.id);
        throw new Error(`Failed to fetch product data: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error fetching product data:', error);
      console.error('❌ Product ID that caused error:', product.id);
      setError(error instanceof Error ? error.message : 'Failed to fetch product data');
      throw error; // Re-throw the error instead of using fallback
    } finally {
      setLoading(false);
    }
  };

  // Aligned delivery and payment options (matching SimplifiedProductForm order)
  const deliveryOptionsList = [
    // Primary aligned options (matching SimplifiedProductForm)
    'Pickup',
    'Local Delivery',
    'Regional Delivery', 
    'Express Delivery',
    'Nationwide Shipping',
    'Cold Chain Transport',
    // Additional options
    'Local Delivery (Within 10km)',
    'Delivery',
    'Shipping',
    'Local Transport',
    'Farm Pickup',
    'Regional Transport',
    'Cold Chain Delivery',
    'Bulk Transport',
    'Custom Logistics'
  ];

  const paymentTermOptionsList = [
    // Primary aligned options (matching SimplifiedProductForm)
    'Cash on Pickup',
    'Cash on Delivery',
    'Bank Transfer',
    'Mobile Payment',
    '50% Advance, 50% on Delivery',
    '30% Advance, 70% on Delivery',
    // Additional options
    'Credit',
    'Installments',
    'Advance Payment',
    '30 Days Credit',
    '15 Days Credit',
    'Letter of Credit'
  ];
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Address states
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    addressType: 'home',
    label: '',
    recipient_name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '', // This will store the region key (e.g., 'yangon', 'mandalay')
    postal_code: ''
  });

  // Get available cities based on selected region (using myanmarRegions)
  const getAvailableCities = () => {
    if (!newAddress.state) {
      return [];
    }
    return myanmarRegions[newAddress.state as keyof typeof myanmarRegions]?.cities || [];
  };

  // Fetch user addresses when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUserAddresses();
    }
  }, [isOpen]);

  const fetchUserAddresses = async () => {
    try {
      const response = await fetch('/api/user/addresses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserAddresses(data.addresses);
        // Set default address if available
        const defaultAddress = data.addresses.find((addr: any) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Collect all validation errors
    const errors: string[] = [];
    
    // Validate required fields
    if (!offerPrice || !quantity) {
      errors.push('Offer Price and Quantity are required');
    }

    // Validate quantity is positive
    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    // Validate quantity doesn't exceed available stock
    if (productData && productData.availableQuantity !== undefined) {
      const availableQuantity = parseInt(productData.availableQuantity) || 0;
      if (quantityNum > availableQuantity) {
        errors.push(`Quantity cannot exceed available stock. Available: ${availableQuantity}, Requested: ${quantityNum}`);
      }
    }

    // Validate delivery options
    const validDeliveryOptions = deliveryOptions.filter(opt => opt && opt !== '');
    if (validDeliveryOptions.length === 0) {
      errors.push('Please select a delivery option');
    }

    // Validate payment terms
    const validPaymentTerms = paymentTerms.filter(term => term && term !== '');
    if (validPaymentTerms.length === 0) {
      errors.push('Please select payment terms');
    }

    // Check if delivery option requires address (not Pickup)
    const selectedDeliveryOption = deliveryOptions[0];
    const isPickup = selectedDeliveryOption && 
      ['Pickup', 'pickup', 'Pick Up', 'pick up', 'Farm Pickup', 'farm pickup'].includes(selectedDeliveryOption);
    const requiresAddress = selectedDeliveryOption && !isPickup;
    
    // Validate address is provided when required
    if (requiresAddress) {
      if (showNewAddress) {
        // Validate all new address fields
        const missingFields: string[] = [];
        if (!newAddress.recipient_name) missingFields.push('Full Name');
        if (!newAddress.phone) missingFields.push('Phone');
        if (!newAddress.addressLine1) missingFields.push('Address Line 1');
        if (!newAddress.city) missingFields.push('City');
        if (!newAddress.state) missingFields.push('State/Region');
        
        if (missingFields.length > 0) {
          errors.push(`Please fill in all required address fields: ${missingFields.join(', ')}`);
        }
      } else {
        // Validate selected address
        if (!selectedAddressId) {
          errors.push('Please select a delivery address');
        }
      }
    }
    
    // Show all errors at once
    if (errors.length > 0) {
      alert(`Please complete the following:\n\n${errors.join('\n')}`);
      return;
    }

    setIsSubmitting(true);
    
    // Get selected address or new address (only if delivery option requires address)
    let deliveryAddress = undefined;
    
    if (requiresAddress) {
      if (showNewAddress) {
        // Save the new address to user's address list first
        try {
          const token = localStorage.getItem('token');
          const addressResponse = await fetch('/api/user/addresses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newAddress)
          });

          if (addressResponse.ok) {
            const savedAddress = await addressResponse.json();
            deliveryAddress = savedAddress.address;
            console.log('✅ New address saved:', savedAddress.address);
            
            // Refresh the user addresses list
            await fetchUserAddresses();
          } else {
            console.error('❌ Failed to save new address');
            alert('Failed to save new address. Please try again.');
            setIsSubmitting(false);
            return;
          }
        } catch (error) {
          console.error('❌ Error saving new address:', error);
          alert('Error saving new address. Please try again.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const selectedAddress = userAddresses.find(addr => addr.id === selectedAddressId);
        if (selectedAddress) {
          deliveryAddress = {
            addressType: selectedAddress.addressType,
            label: selectedAddress.label || `${selectedAddress.addressType} address`,
            recipient_name: selectedAddress.recipient_name || '',
            phone: selectedAddress.phone,
            addressLine1: selectedAddress.addressLine1,
            addressLine2: selectedAddress.addressLine2 || '',
            city: selectedAddress.city || '',
            state: selectedAddress.state || '',
            postal_code: selectedAddress.postal_code || ''
          };
        }
      }
    }

    try {
      await onSubmit({
        offerPrice: parseFloat(offerPrice),
        quantity: parseInt(quantity),
        message: message.trim(),
        deliveryAddress,
        deliveryOptions: validDeliveryOptions,
        paymentTerms: validPaymentTerms,
        expirationHours
      });
      
      // Reset form
      setOfferPrice('');
      setQuantity('1');
      setMessage('');
      setDeliveryOptions(['']);
      setPaymentTerms(['']);
      setShowNewAddress(false);
      setSelectedAddressId('');
      setNewAddress({
        addressType: 'home',
        label: '',
        recipient_name: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postal_code: '',
      });
      onClose();
    } catch (error) {
      console.error('Error submitting offer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentProductData = productData || product;
  const originalPrice = currentProductData?.price || 0;
  const offerPriceNum = parseFloat(offerPrice) || 0;
  const discountPercentage = originalPrice > 0 ? ((originalPrice - offerPriceNum) / originalPrice * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-w-[90vw] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Make an Offer
          </DialogTitle>
          <DialogDescription>
            Submit your offer for {productData?.name || product.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Product Info */}
          <Card>
            <CardContent className="p-3">
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
                    <Package className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-red-800">Failed to Load Product Data</h4>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setError(null);
                      if (product.id) {
                        fetchProductData().catch(err => {
                          setError(err instanceof Error ? err.message : 'Failed to fetch product data');
                        });
                      }
                    }}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {productData?.imageUrl ? (
                      <S3Image 
                        src={productData.imageUrl} 
                        alt={productData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{productData?.name || product.name}</h4>
                    <p className="text-xs text-muted-foreground">{productData?.category || product.category}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{seller.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{originalPrice.toLocaleString()} MMK</p>
                    <p className="text-xs text-muted-foreground">per {productData?.unit || product.unit}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Offer Price and Quantity - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="offerPrice">Your Offer Price (MMK)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="offerPrice"
                  type="number"
                  placeholder="Enter your offer"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="pl-10"
                  required
                  min="1"
                />
              </div>
              {originalPrice > 0 && offerPriceNum > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  {discountPercentage > 0 ? (
                    <Badge variant="secondary" className="text-green-600">
                      {discountPercentage.toFixed(1)}% discount
                    </Badge>
                  ) : discountPercentage < 0 ? (
                    <Badge variant="destructive">
                      {Math.abs(discountPercentage).toFixed(1)}% above asking
                    </Badge>
                  ) : (
                    <Badge variant="outline">Same as asking price</Badge>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
            </div>
          </div>

          {/* Delivery Options and Payment Terms - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Delivery Options *</Label>
              <Select 
                value={deliveryOptions[0] || ''} 
                onValueChange={(value) => setDeliveryOptions([value])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery option *" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryOptionsList.map((option) => (
                    <SelectItem key={option} value={option}>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        {option}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Terms *</Label>
              <Select 
                value={paymentTerms[0] || ''} 
                onValueChange={(value) => setPaymentTerms([value])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment terms *" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTermOptionsList.map((term) => (
                    <SelectItem key={term} value={term}>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        {term}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address Selection for Delivery Options that require address */}
          {deliveryOptions[0] && !['Pickup', 'pickup', 'Pick Up', 'pick up', 'Farm Pickup', 'farm pickup'].includes(deliveryOptions[0]) && (
            <div className="space-y-3">
              <Label>Delivery Address <span className="text-red-500">*</span></Label>
              
              {!showNewAddress && userAddresses.length > 0 && (
                <div className="space-y-2">
                  <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an address *" />
                    </SelectTrigger>
                    <SelectContent>
                      {userAddresses.map((address) => (
                        <SelectItem key={address.id} value={address.id}>
                          <div className="flex items-center gap-2 w-full">
                            {address.addressType === 'home' && <Home className="w-4 h-4" />}
                            {address.addressType === 'work' && <Building className="w-4 h-4" />}
                            <span className="font-medium">{address.label}</span>
                            {address.isDefault && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Selected Address Display */}
                  {selectedAddressId && userAddresses.find(addr => addr.id === selectedAddressId) && (
                    <Card className="border-primary/20 bg-muted/30">
                      <CardContent className="p-3">
                        {(() => {
                          const selectedAddress = userAddresses.find(addr => addr.id === selectedAddressId);
                          return (
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 mt-1">
                                {selectedAddress?.addressType === 'home' && <Home className="w-4 h-4 text-primary" />}
                                {selectedAddress?.addressType === 'work' && <Building className="w-4 h-4 text-primary" />}
                                {selectedAddress?.addressType === 'other' && <MapPin className="w-4 h-4 text-primary" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium text-sm">{selectedAddress?.label}</h4>
                                  {selectedAddress?.isDefault && (
                                    <Badge variant="secondary" className="text-xs">Default</Badge>
                                  )}
                                </div>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <p className="font-medium">{selectedAddress?.label}</p>
                                  <p>
                                    {[
                                      selectedAddress?.addressLine1,
                                      selectedAddress?.addressLine2,
                                      selectedAddress?.city,
                                      selectedAddress?.state,
                                      selectedAddress?.postal_code
                                    ].filter(field => field && field !== '').join(', ')}
                                  </p>
                                  {selectedAddress?.phone && <p>📞 {selectedAddress.phone}</p>}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewAddress(true)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Address
                  </Button>
                </div>
              )}

              {/* Show "Add New Address" button when no addresses exist */}
              {!userAddresses.length && !showNewAddress && (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewAddress(true)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Delivery Address
                  </Button>
                </div>
              )}

              {showNewAddress && (
                <Card>
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">New Address</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNewAddress(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="addressType" className="text-xs">Type</Label>
                        <Select value={newAddress.addressType} onValueChange={(value) => setNewAddress({...newAddress, addressType: value})}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="home">Home</SelectItem>
                            <SelectItem value="work">Work</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="label" className="text-xs">Label</Label>
                        <Input
                          id="label"
                          placeholder="e.g., Home, Office"
                          value={newAddress.label}
                          onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
                          className="h-8"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="fullName" className="text-xs">Recipient Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="fullName"
                          value={newAddress.recipient_name}
                          onChange={(e) => setNewAddress({...newAddress, recipient_name: e.target.value})}
                          className="h-8"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone" className="text-xs">Phone <span className="text-red-500">*</span></Label>
                        <Input
                          id="phone"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                          className="h-8"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="addressLine1" className="text-xs">Address Line 1 <span className="text-red-500">*</span></Label>
                      <Input
                        id="addressLine1"
                        value={newAddress.addressLine1}
                        onChange={(e) => setNewAddress({...newAddress, addressLine1: e.target.value})}
                        className="h-8"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="addressLine2" className="text-xs">Address Line 2 (Optional)</Label>
                      <Input
                        id="addressLine2"
                        value={newAddress.addressLine2}
                        onChange={(e) => setNewAddress({...newAddress, addressLine2: e.target.value})}
                        className="h-8"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
                        <Label htmlFor="state" className="text-xs">State/Region <span className="text-red-500">*</span></Label>
                        <Select
                          value={newAddress.state}
                          onValueChange={(value) => {
                            setNewAddress({...newAddress, state: value, city: ''}); // Reset city when region changes
                          }}
                        >
                          <SelectTrigger className="h-8 pl-10">
                            <SelectValue placeholder="Select State/Region *" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64 overflow-y-auto">
                            {Object.entries(myanmarRegions).map(([key, region]) => (
                              <SelectItem key={key} value={key}>
                                {region.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
                        <Label htmlFor="city" className="text-xs">City <span className="text-red-500">*</span></Label>
                        <Select
                          value={newAddress.city}
                          onValueChange={(value) => setNewAddress({...newAddress, city: value})}
                          disabled={!newAddress.state}
                        >
                          <SelectTrigger className="h-8 pl-10">
                            <SelectValue placeholder="Select City *" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64 overflow-y-auto">
                            {getAvailableCities().map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="postalCode" className="text-xs">Postal Code (Optional)</Label>
                      <Input
                        id="postalCode"
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress({...newAddress, postal_code: e.target.value})}
                        className="h-8"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a message to your offer..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Expiration Time */}
          <div className="space-y-2">
            <Label htmlFor="expiration">Offer Expires In</Label>
            <Select 
              value={expirationHours.toString()} 
              onValueChange={(value) => setExpirationHours(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select expiration time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">1 day</SelectItem>
                <SelectItem value="48">2 days</SelectItem>
                <SelectItem value="72">3 days</SelectItem>
                <SelectItem value="168">1 week</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How long are you willing to wait for a response?
            </p>
          </div>

          {/* Total */}
          {offerPriceNum > 0 && parseInt(quantity) > 0 && (
            <Card>
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Offer:</span>
                  <span className="text-lg font-bold">
                    {(offerPriceNum * parseInt(quantity)).toLocaleString()} MMK
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {quantity} × {offerPriceNum.toLocaleString()} MMK
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !offerPrice || !quantity || !!error}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Offer'}
            </Button>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <p className="font-medium">Important:</p>
              <p>This offer will be sent to {seller.name}. Make sure you've discussed the terms in chat first.</p>
            </div>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
