import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { S3Image } from "./S3Image";
import { 
  ChevronLeft,
  Package, 
  DollarSign, 
  Truck, 
  MapPin,
  AlertCircle,
  CheckCircle,
  Camera,
  Upload,
  FileText,
  X,
  CreditCard,
  Shield,
  Plus,
  Info,
  Lightbulb
} from "lucide-react";

import type { Product } from "../data/products";

interface SimplifiedProductFormProps {
  currentUser: any;
  onBack: () => void;
  onSave: (product: Product) => Promise<void>;
  editingProduct?: Product | null;
}

export function SimplifiedProductForm({ currentUser, onBack, onSave, editingProduct }: SimplifiedProductFormProps) {
  const [newCustomDelivery, setNewCustomDelivery] = useState('');
  const [newCustomPayment, setNewCustomPayment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [allCategories, setAllCategories] = useState<Array<{id: string, name: string}>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageMessage, setImageMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom options state
  const [availableCustomDeliveryOptions, setAvailableCustomDeliveryOptions] = useState<string[]>([]);
  const [customDeliveryLoading, setCustomDeliveryLoading] = useState(false);
  const [availableCustomPaymentTerms, setAvailableCustomPaymentTerms] = useState<string[]>([]);
  const [customPaymentLoading, setCustomPaymentLoading] = useState(false);
  const [customOptionsLoaded, setCustomOptionsLoaded] = useState(false);
  
  // Store original form data to track changes (for edit mode)
  const originalFormDataRef = useRef<Product | null>(null);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setAllCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Load custom options from database when currentUser changes
  useEffect(() => {
    const loadCustomOptions = async () => {
      console.log('🔄 Loading custom options for user:', currentUser?.id);
      console.log('🔄 Current user object:', currentUser);
      
      if (!currentUser?.id) {
        console.log('❌ No current user, clearing custom options');
        setAvailableCustomDeliveryOptions([]);
        setAvailableCustomPaymentTerms([]);
        setCustomOptionsLoaded(true);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        console.log('🔐 Token for custom options:', token ? 'present' : 'missing');
        console.log('🔐 Token value:', token);
        
        // Load custom delivery options
        setCustomDeliveryLoading(true);
        console.log('📦 Loading custom delivery options...');
        const deliveryResponse = await fetch('/api/seller/custom-delivery-options', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('📦 Delivery options response status:', deliveryResponse.status);
        console.log('📦 Delivery options response headers:', Object.fromEntries(deliveryResponse.headers.entries()));
        
        if (deliveryResponse.ok) {
          const deliveryData = await deliveryResponse.json();
          console.log('📦 Delivery options data:', deliveryData);
          setAvailableCustomDeliveryOptions(deliveryData.customOptions || []);
          console.log('📦 Set available custom delivery options:', deliveryData.customOptions || []);
        } else {
          const errorText = await deliveryResponse.text();
          console.error('❌ Failed to load delivery options:', errorText);
          console.error('❌ Response status:', deliveryResponse.status);
        }

        // Load custom payment terms
        setCustomPaymentLoading(true);
        console.log('💳 Loading custom payment terms...');
        const paymentResponse = await fetch('/api/seller/custom-payment-terms', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('💳 Payment terms response status:', paymentResponse.status);
        console.log('💳 Payment terms response headers:', Object.fromEntries(paymentResponse.headers.entries()));
        
        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          console.log('💳 Payment terms data:', paymentData);
          setAvailableCustomPaymentTerms(paymentData.customTerms || []);
          console.log('💳 Set available custom payment terms:', paymentData.customTerms || []);
        } else {
          const errorText = await paymentResponse.text();
          console.error('❌ Failed to load payment terms:', errorText);
          console.error('❌ Response status:', paymentResponse.status);
        }
      } catch (error) {
        console.error('❌ Error loading custom options:', error);
        console.error('❌ Error details:', error);
      } finally {
        setCustomDeliveryLoading(false);
        setCustomPaymentLoading(false);
        setCustomOptionsLoaded(true);
        console.log('✅ Custom options loading completed');
      }
    };

    loadCustomOptions();
  }, [currentUser?.id]);

  // Re-initialize form data when editing product changes
  useEffect(() => {
    if (editingProduct && editingProduct.id) {
      console.log('🔄 Re-initializing form data for editing product:', {
        id: editingProduct.id,
        name: editingProduct.name,
      quantity: editingProduct.quantity,
      quantityUnit: editingProduct.quantityUnit,
      packaging: editingProduct.packaging,
      unit: editingProduct.unit,
        availableStock: editingProduct.availableStock,
        availableStockType: typeof editingProduct.availableStock,
        availableQuantity: editingProduct.availableQuantity,
        availableQuantityType: typeof editingProduct.availableQuantity,
        minimumOrder: editingProduct.minimumOrder,
        additionalNotes: editingProduct.additionalNotes
      });
      console.log('📊 Current editing product delivery options:', editingProduct.deliveryOptions);
      console.log('📊 Current editing product payment terms:', editingProduct.paymentTerms);
      
      // Helper function to convert null/undefined to empty string for form display
      const toFormValue = (value: any) => {
        return value === null || value === undefined ? '' : String(value);
      };

      // Handle images
      let images: string[] = [];
      let primaryImage = '';
      
      if (editingProduct.images && editingProduct.images.length > 0) {
        images = editingProduct.images;
        primaryImage = editingProduct.images[0];
      } else if (editingProduct.image) {
        images = [editingProduct.image];
        primaryImage = editingProduct.image;
      } else if (editingProduct.imageUrl) {
        images = [editingProduct.imageUrl];
        primaryImage = editingProduct.imageUrl;
      }

      const updatedFormData = {
        id: editingProduct.id,
        sellerId: editingProduct.sellerId,
        name: editingProduct.name || '',
        price: editingProduct.price || 0,
        quantity: toFormValue(editingProduct.quantity),
        quantityUnit: toFormValue(editingProduct.quantityUnit),
        packaging: toFormValue(editingProduct.packaging),
        // Legacy field for backward compatibility
        unit: toFormValue(editingProduct.unit),
        sellerType: editingProduct.sellerType || currentUser?.userType || 'farmer',
        sellerName: editingProduct.sellerName || currentUser?.name || '',
        image: primaryImage,
        images: images,
        // Use availableStock (raw value) for editing, fallback to availableQuantity for backward compatibility
        availableQuantity: (() => {
          const stockValue = editingProduct.availableStock;
          const quantityValue = editingProduct.availableQuantity;
          const finalValue = stockValue !== null && stockValue !== undefined && stockValue !== '' 
            ? stockValue 
            : quantityValue;
          console.log('📊 Available stock value selection:', {
            availableStock: stockValue,
            availableQuantity: quantityValue,
            selected: finalValue,
            finalFormValue: toFormValue(finalValue)
          });
          return toFormValue(finalValue);
        })(),
        minimumOrder: toFormValue(editingProduct.minimumOrder),
        deliveryOptions: editingProduct.deliveryOptions || [],
        paymentTerms: editingProduct.paymentTerms || [],
        lastUpdated: editingProduct.lastUpdated || new Date().toISOString(),
        category: editingProduct.category || '',
        description: editingProduct.description || '',
        additionalNotes: toFormValue(editingProduct.additionalNotes),
        isEditing: true
      };

      console.log('🔄 Updated form data:', {
        quantity: updatedFormData.quantity,
        quantityUnit: updatedFormData.quantityUnit,
        packaging: updatedFormData.packaging,
        unit: updatedFormData.unit,
        availableQuantity: updatedFormData.availableQuantity,
        deliveryOptions: updatedFormData.deliveryOptions,
        paymentTerms: updatedFormData.paymentTerms
      });
      

      // Store original data for change tracking
      originalFormDataRef.current = { ...updatedFormData };
      console.log('📊 Set original form data for change tracking:', {
        quantity: originalFormDataRef.current.quantity,
        quantityUnit: originalFormDataRef.current.quantityUnit,
        packaging: originalFormDataRef.current.packaging,
        unit: originalFormDataRef.current.unit,
        availableQuantity: originalFormDataRef.current.availableQuantity
      });

      setFormData(updatedFormData);
    }
  }, [editingProduct?.id, customOptionsLoaded, currentUser?.id]); // Re-run when product, custom options, or user changes

  // This useEffect was causing too many re-renders, removed it

  // Initialize form data with defaults - only for new products
  const [formData, setFormData] = useState<Product>(() => {
    // Only initialize for new products, editing products will be handled by useEffect
    return {
      id: '',
      sellerId: currentUser?.id || '',
      name: '',
      price: 0,
      quantity: '',
      quantityUnit: '',
      packaging: '',
      // Legacy field for backward compatibility
      unit: '',
      // Location fields removed - using seller location only
      sellerType: currentUser?.userType || 'farmer',
      sellerName: currentUser?.name || '',
      image: '',
      images: [],
      availableQuantity: '',
      minimumOrder: '',
      deliveryOptions: [],
      paymentTerms: [],
      lastUpdated: new Date().toISOString(),
      category: '',
      description: '',
      additionalNotes: '',
      isEditing: false
    };
  });

  // This useEffect was causing too many re-renders, removed it

  // Get unique available delivery options with custom additions
  const availableDeliveryOptions = useMemo(() => {
    const baseOptions = [
      'Pickup',
      'Local Delivery',
      'Regional Delivery', 
      'Express Delivery',
      'Nationwide Shipping',
      'Cold Chain Transport'
    ];
    
    // Combine and deduplicate options to prevent duplicate keys
    const allOptions = [...baseOptions, ...availableCustomDeliveryOptions];
    const uniqueOptions = Array.from(new Set(allOptions));
    return uniqueOptions;
  }, [availableCustomDeliveryOptions]);

  // Check if form data has been modified (for edit mode)
  const hasFormChanges = useMemo(() => {
    if (!editingProduct || !originalFormDataRef.current) {
      return false; // For new products, always allow submission
    }

    const original = originalFormDataRef.current;
    
    // Compare key fields that matter for product updates
    const fieldsToCompare = [
      'name', 'price', 'quantity', 'quantityUnit', 'packaging', 'category', 
      'description', 'availableQuantity', 'minimumOrder', 'additionalNotes'
    ];
    
    // Check if any simple fields changed
    const simpleFieldsChanged = fieldsToCompare.some(field => {
      return String(formData[field as keyof Product] || '') !== String(original[field as keyof Product] || '');
    });
    
    // Check if arrays changed (deliveryOptions, paymentTerms, images)
    const deliveryChanged = JSON.stringify(formData.deliveryOptions?.sort()) !== JSON.stringify(original.deliveryOptions?.sort());
    const paymentChanged = JSON.stringify(formData.paymentTerms?.sort()) !== JSON.stringify(original.paymentTerms?.sort());
    const imagesChanged = JSON.stringify(formData.images?.sort()) !== JSON.stringify(original.images?.sort());
    
    return simpleFieldsChanged || deliveryChanged || paymentChanged || imagesChanged;
  }, [formData, editingProduct]);

  // Get button text and state
  const getUpdateButtonConfig = () => {
    if (!editingProduct) {
      return {
        text: 'Publish Product',
        disabled: false,
        variant: 'default' as const
      };
    }

    if (hasFormChanges) {
      return {
        text: 'Save Changes',
        disabled: false,
        variant: 'default' as const
      };
    }

    return {
      text: 'Update Product',
      disabled: true,
      variant: 'secondary' as const
    };
  };

  // Note: Custom delivery options are now saved to database via API

  // Get unique available payment terms with custom additions
  const availablePaymentTerms = useMemo(() => {
    const baseOptions = [
      'Cash on Pickup',
      'Cash on Delivery',
      'Bank Transfer',
      'Mobile Payment',
      '50% Advance, 50% on Delivery',
      '30% Advance, 70% on Delivery'
    ];
    
    // Combine and deduplicate terms to prevent duplicate keys
    const allTerms = [...baseOptions, ...availableCustomPaymentTerms];
    const uniqueTerms = Array.from(new Set(allTerms));
    return uniqueTerms;
  }, [availableCustomPaymentTerms]);

  // Debug form data changes - removed to reduce console spam

  // Note: Custom payment terms are now saved to database via API

  // Validation function
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Product name is required';
    }
    
    if (!formData.category?.trim()) {
      errors.category = 'Category is required';
    }
    
    if (categoriesLoading) {
      errors.category = 'Categories are still loading';
    }
    
    if (!formData.quantity || !formData.quantityUnit) {
      errors.quantity = 'Quantity and unit are required (e.g., "20", "kg")';
    }
    
    if (!formData.price || formData.price <= 0) {
      errors.price = 'Valid price is required';
    }
    
    if (formData.availableQuantity === undefined || formData.availableQuantity === null || formData.availableQuantity === '') {
      errors.availableQuantity = 'Available quantity is required';
    } else if (isNaN(Number(formData.availableQuantity)) || Number(formData.availableQuantity) < 0) {
      errors.availableQuantity = 'Available quantity must be a number ≥ 0';
    }
    
    if (!formData.minimumOrder?.trim()) {
      errors.minimumOrder = 'Minimum order is required';
    }
    
    // Location validation removed - using seller location only
    
    if (!formData.deliveryOptions || formData.deliveryOptions.length === 0) {
      errors.deliveryOptions = 'At least one delivery option is required';
    }
    
    if (!formData.paymentTerms || formData.paymentTerms.length === 0) {
      errors.paymentTerms = 'At least one payment term is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Toggle delivery option
  const toggleDeliveryOption = useCallback((option: string) => {
    setFormData(prev => ({
      ...prev,
      deliveryOptions: (prev.deliveryOptions || []).includes(option)
        ? (prev.deliveryOptions || []).filter(o => o !== option)
        : [...(prev.deliveryOptions || []), option]
    }));
  }, []);

  // Toggle payment term
  const togglePaymentTerm = useCallback((term: string) => {
    setFormData(prev => ({
      ...prev,
      paymentTerms: (prev.paymentTerms || []).includes(term)
        ? (prev.paymentTerms || []).filter(t => t !== term)
        : [...(prev.paymentTerms || []), term]
    }));
  }, []);

  // Add custom delivery option
  const addCustomDeliveryOption = useCallback(async () => {
    if (!newCustomDelivery.trim() || !currentUser?.id) return;
    
    const option = newCustomDelivery.trim();
    
    try {
      const response = await fetch('/api/seller/custom-delivery-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: option })
      });

      if (response.ok) {
        setAvailableCustomDeliveryOptions(prev => [...prev, option]);
        setNewCustomDelivery('');
      } else {
        const errorData = await response.json();
        console.error('Error adding custom delivery option:', errorData.message);
      }
    } catch (error) {
      console.error('Error adding custom delivery option:', error);
    }
  }, [newCustomDelivery, currentUser?.id]);

  // Remove custom delivery option
  const removeCustomDeliveryOption = useCallback(async (option: string, force = false) => {
    if (!currentUser?.id) return;
    
    // Get current product ID if editing
    const currentProductId = editingProduct?.id || null;
    
    try {
      // First, we need to find the option ID from the database
      // Since we only have the name, we'll need to fetch the full options first
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No token found');
        alert('Please log in to delete custom options');
        return;
      }
      
      const fullOptions = await fetch('/api/seller/custom-delivery-options/full', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (fullOptions.ok) {
        const fullData = await fullOptions.json();
        console.log('📦 Full delivery options data:', fullData);
        
        if (!fullData.options || !Array.isArray(fullData.options)) {
          console.error('❌ Invalid response format:', fullData);
          alert('Failed to fetch delivery options. Please try again.');
          return;
        }
        
        const optionToDelete = fullData.options.find((opt: any) => opt.name === option);
        
        if (optionToDelete) {
          // Call DELETE API with the option ID and current product ID (if editing)
          const deleteUrl = `/api/seller/custom-delivery-options?id=${optionToDelete.id}${force ? '&force=true' : ''}${currentProductId ? `&currentProductId=${currentProductId}` : ''}`;
          const deleteResponse = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const deleteData = await deleteResponse.json();
          
          if (deleteResponse.ok) {
            // Remove from local state only after successful API call
            setAvailableCustomDeliveryOptions(prev => prev.filter(o => o !== option));
            
            // Also remove from current form if selected
            setFormData(prev => ({
              ...prev,
              deliveryOptions: (prev.deliveryOptions || []).filter(o => o !== option)
            }));
            
            console.log('✅ Custom delivery option deleted successfully');
            alert('Delivery option deleted successfully');
          } else if (deleteResponse.status === 409 && deleteData.error === 'OPTION_IN_USE') {
            // Show warning dialog for option in use
            const shouldForceDelete = window.confirm(
              `⚠️ Cannot delete "${option}"\n\n` +
              `This delivery option is currently used by ${deleteData.usageCount} product(s).\n\n` +
              `If you delete it, those products will have broken references.\n\n` +
              `Do you want to force delete anyway?`
            );
            
            if (shouldForceDelete) {
              // Retry with force deletion
              await removeCustomDeliveryOption(option, true);
            }
          } else {
            console.error('❌ Failed to delete custom delivery option:', deleteData);
            alert(`Failed to delete delivery option: ${deleteData.message || 'Unknown error'}`);
          }
        } else {
          console.error('❌ Option not found for deletion:', option);
          console.error('📦 Available options:', fullData.options.map((opt: any) => opt.name));
          alert(`Option "${option}" not found in your custom delivery options`);
        }
      } else {
        const errorText = await fullOptions.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Unknown error' };
        }
        console.error('❌ Failed to fetch options for deletion:', {
          status: fullOptions.status,
          statusText: fullOptions.statusText,
          error: errorData
        });
        alert(`Failed to fetch delivery options: ${errorData.message || 'Please try again'}`);
      }
    } catch (error: any) {
      console.error('Error removing custom delivery option:', error);
      alert(`Error: ${error.message || 'Failed to delete delivery option. Please try again.'}`);
    }
  }, [currentUser?.id, editingProduct?.id]);

  // Add custom payment option
  const addCustomPaymentOption = useCallback(async () => {
    if (!newCustomPayment.trim() || !currentUser?.id) return;
    
    const term = newCustomPayment.trim();
    
    try {
      const response = await fetch('/api/seller/custom-payment-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: term })
      });

      if (response.ok) {
        setAvailableCustomPaymentTerms(prev => [...prev, term]);
        setNewCustomPayment('');
      } else {
        const errorData = await response.json();
        console.error('Error adding custom payment term:', errorData.message);
      }
    } catch (error) {
      console.error('Error adding custom payment term:', error);
    }
  }, [newCustomPayment, currentUser?.id]);

  // Remove custom payment option
  const removeCustomPaymentOption = useCallback(async (term: string, force = false) => {
    if (!currentUser?.id) return;
    
    // Get current product ID if editing
    const currentProductId = editingProduct?.id || null;
    
    try {
      // First, we need to find the option ID from the database
      // Since we only have the name, we'll need to fetch the full options first
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No token found');
        alert('Please log in to delete custom options');
        return;
      }
      
      const fullOptions = await fetch('/api/seller/custom-payment-terms/full', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (fullOptions.ok) {
        const fullData = await fullOptions.json();
        console.log('💳 Full payment terms data:', fullData);
        
        if (!fullData.options || !Array.isArray(fullData.options)) {
          console.error('❌ Invalid response format:', fullData);
          alert('Failed to fetch payment terms. Please try again.');
          return;
        }
        
        const optionToDelete = fullData.options.find((opt: any) => opt.name === term);
        
        if (optionToDelete) {
          // Call DELETE API with the option ID and current product ID (if editing)
          const deleteUrl = `/api/seller/custom-payment-terms?id=${optionToDelete.id}${force ? '&force=true' : ''}${currentProductId ? `&currentProductId=${currentProductId}` : ''}`;
          const deleteResponse = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const deleteData = await deleteResponse.json();
          
          if (deleteResponse.ok) {
            // Remove from local state only after successful API call
            setAvailableCustomPaymentTerms(prev => prev.filter(t => t !== term));
            
            // Also remove from current form if selected
            setFormData(prev => ({
              ...prev,
              paymentTerms: (prev.paymentTerms || []).filter(t => t !== term)
            }));
            
            console.log('✅ Custom payment term deleted successfully');
            alert('Payment term deleted successfully');
          } else if (deleteResponse.status === 409 && deleteData.error === 'TERM_IN_USE') {
            // Show warning dialog for term in use
            const shouldForceDelete = window.confirm(
              `⚠️ Cannot delete "${term}"\n\n` +
              `This payment term is currently used by ${deleteData.usageCount} product(s).\n\n` +
              `If you delete it, those products will have broken references.\n\n` +
              `Do you want to force delete anyway?`
            );
            
            if (shouldForceDelete) {
              // Retry with force deletion
              await removeCustomPaymentOption(term, true);
            }
          } else {
            console.error('❌ Failed to delete custom payment term:', deleteData);
            alert(`Failed to delete payment term: ${deleteData.message || 'Unknown error'}`);
          }
        } else {
          console.error('❌ Option not found for deletion:', term);
          console.error('💳 Available options:', fullData.options.map((opt: any) => opt.name));
          alert(`Payment term "${term}" not found in your custom payment terms`);
        }
      } else {
        const errorText = await fullOptions.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Unknown error' };
        }
        console.error('❌ Failed to fetch options for deletion:', {
          status: fullOptions.status,
          statusText: fullOptions.statusText,
          error: errorData
        });
        alert(`Failed to fetch payment terms: ${errorData.message || 'Please try again'}`);
      }
    } catch (error: any) {
      console.error('Error removing custom payment option:', error);
      alert(`Error: ${error.message || 'Failed to delete payment term. Please try again.'}`);
    }
  }, [currentUser?.id, editingProduct?.id]);

  // Handle multiple image upload
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types - only allow image files
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const invalidFiles = files.filter(file => !allowedImageTypes.includes(file.type.toLowerCase()));
    
    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map(f => f.name).join(', ');
      setValidationErrors(prev => ({ 
        ...prev, 
        images: `Invalid file type(s): ${invalidFileNames}. Only image files (JPEG, PNG, WebP, GIF) are allowed.` 
      }));
      // Clear the input value
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const maxImages = 10; // Reasonable limit
    const currentImageCount = formData.images?.length || 0;
    
    if (currentImageCount + files.length > maxImages) {
      setValidationErrors(prev => ({ ...prev, images: `Maximum ${maxImages} images allowed` }));
      // Clear the input value
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Check each file size (limit to 5MB per image)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setValidationErrors(prev => ({ ...prev, images: 'Each image must be smaller than 5MB' }));
      // Clear the input value
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Clear any previous errors and messages before processing valid files
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.images;
      return newErrors;
    });
    setImageMessage(null);
    setImageUploading(true);

    try {
      const newImages: string[] = [];
      
      // Process all selected files and convert to base64
      for (const file of files) {
        // Convert to base64
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        
        // Store base64 data directly (will be uploaded to S3 when form is submitted)
        newImages.push(base64Data);
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...newImages],
        // Update legacy image field with first image for backward compatibility
        image: prev.images?.length === 0 && newImages.length > 0 ? newImages[0] : prev.image
      }));

      setImageMessage({ 
        type: 'success', 
        text: `Successfully added ${files.length} image${files.length > 1 ? 's' : ''}! Images will be uploaded when you save the product.` 
      });
      setTimeout(() => setImageMessage(null), 5000);
      
    } catch (error) {
      console.error('Failed to process images:', error);
      setImageMessage({ 
        type: 'error', 
        text: 'Failed to process images. Please try again.' 
      });
      setTimeout(() => setImageMessage(null), 5000);
    } finally {
      setImageUploading(false);
    }
    
    // Clear the input value to allow re-uploading the same files
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [formData.images]);

  // Remove specific image by index
  const removeImage = useCallback((index: number) => {
    setFormData(prev => {
      const newImages = [...(prev.images || [])];
      newImages.splice(index, 1);
      
      return {
        ...prev,
        images: newImages,
        // Update legacy image field
        image: newImages.length > 0 ? newImages[0] : ''
      };
    });
  }, []);

  // Remove all images
  const removeAllImages = useCallback(() => {
    setFormData(prev => ({ ...prev, images: [], image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    console.log('🚀 Form submission started');
    console.log('🔍 Change detection debug:', {
      hasEditingProduct: !!editingProduct,
      hasFormChanges: hasFormChanges,
      originalData: originalFormDataRef.current,
      currentData: formData
    });
    
    // Prevent submission if editing product and no changes made
    if (editingProduct && !hasFormChanges) {
      console.log('❌ No changes detected, skipping submission');
      console.log('🔍 Debug - comparing original vs current:', {
        original: originalFormDataRef.current,
        current: formData,
        fieldsComparison: ['name', 'price', 'quantity', 'availableQuantity', 'images'].map(field => ({
          field,
          original: originalFormDataRef.current?.[field as keyof Product],
          current: formData[field as keyof Product],
          changed: String(originalFormDataRef.current?.[field as keyof Product] || '') !== String(formData[field as keyof Product] || '')
        }))
      });
      return;
    }
    
    console.log('Form data being validated:', {
      id: formData.id,
      name: formData.name,
      price: formData.price,
      priceType: typeof formData.price,
      category: formData.category,
      description: formData.description,
      isEditing: formData.isEditing,
      hasImages: !!(formData.images?.length || formData.image),
      imagesCount: formData.images?.length || (formData.image ? 1 : 0),
      hasChanges: hasFormChanges,
      quantity: formData.quantity,
      availableQuantity: formData.availableQuantity
    });

    if (!validateForm()) {
      console.log('❌ Validation failed:', validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('✅ Validation passed, calling onSave');
      // Update lastUpdated timestamp and preserve isEditing flag for proper update handling
      const productToSave = {
        ...formData,
        lastUpdated: new Date().toISOString(),
        // Keep isEditing flag if this is an edit operation to ensure proper update handling
        isEditing: formData.isEditing
      };
      
      console.log('📤 Data being sent to API:', {
        quantity: productToSave.quantity,
        quantityUnit: productToSave.quantityUnit,
        packaging: productToSave.packaging,
        unit: productToSave.unit,
        availableQuantity: productToSave.availableQuantity,
        price: productToSave.price
      });
      await onSave(productToSave);
      console.log('✅ onSave completed successfully');
    } catch (error) {
      console.error('❌ Product save failed:', error);
      setIsSubmitting(false); // Re-enable the form if save fails
    }
  }, [formData, validateForm, validationErrors, onSave, editingProduct, hasFormChanges]);

  // Handle form submission with proper preventDefault
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit();
  }, [handleSubmit]);

  return (
    <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="space-y-4 mb-8">
        {/* Back button row */}
        <Button variant="ghost" onClick={onBack} className="h-9 px-3 -ml-3">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        {/* Title section - aligned with content */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-muted-foreground">
            {editingProduct ? 'Update your product listing details' : 'Create a detailed product listing for buyers'}
          </p>
          {editingProduct && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Stock Management:</strong> Set available stock to 0 to mark as "Out of Stock". 
                The product will remain visible with a red "Out of Stock" badge, but buyers won't be able to make offers.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Banner for Multiple Variations */}
      {!editingProduct && (
        <Alert className="border-primary/20 bg-primary/5">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <span className="font-medium text-primary">💡 Selling multiple sizes or variants?</span>
            <br />
            Create separate product listings for each size/variant (e.g., "Rice - 25kg bag", "Rice - 50kg bag"). 
            This makes it easier for buyers to find exactly what they need and helps with analytics.
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {Object.keys(validationErrors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fix the following errors:
            <ul className="mt-2 ml-4 list-disc">
              {Object.entries(validationErrors).map(([field, error]) => (
                <li key={field} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6 md:space-y-8">
        {/* Product Information & Image - Stacked Vertically with Top/Bottom Alignment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
          {/* Product Information - Top Aligned - Takes 2/3 of width */}
          <div className="lg:col-span-2 lg:self-start">
            <Card className="h-[300px] lg:h-[320px] flex flex-col">
              <CardHeader className="flex-shrink-0 pb-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Package className="w-5 h-5" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-shrink-0">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name *</Label>
                    <Input
                      id="productName"
                      placeholder="e.g., Fresh Cabbage"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`h-10 ${validationErrors.name ? 'border-destructive' : ''}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category || ''} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      disabled={categoriesLoading}
                    >
                      <SelectTrigger className={`h-10 ${validationErrors.category ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {allCategories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2 flex-grow flex flex-col">
                  <Label htmlFor="description">Product Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your product, quality, farming methods, and what makes it special..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="flex-grow resize-none h-[100px] lg:h-[110px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Image Upload - Bottom Aligned - Takes 1/3 of width */}
          <div className="lg:col-span-1 lg:self-end">
            <Card className="h-[300px] lg:h-[320px] flex flex-col">
              <CardHeader className="flex-shrink-0 pb-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Camera className="w-5 h-5" />
                  Product Photos
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col space-y-3">
                {/* Multiple Images Display */}
                {formData.images && formData.images.length > 0 ? (
                  <div className="flex-grow flex flex-col space-y-2">
                    {/* Image Grid - Fixed height container */}
                    <div className="flex-grow">
                      <div className="grid grid-cols-2 gap-2 h-[120px] lg:h-[130px] overflow-y-auto">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <S3Image
                              src={image}
                              alt={`Product ${index + 1}`}
                              className="w-full h-16 md:h-18 object-cover rounded-lg border hover:opacity-90 transition-opacity"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-2 h-2" />
                            </Button>
                            {index === 0 && (
                              <Badge className="absolute bottom-1 left-1 text-xs px-1 py-0 h-4">
                                Main
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Action Buttons - Fixed at bottom */}
                    <div className="flex-shrink-0 space-y-2">
                      {/* Add More Photos Button */}
                      {formData.images.length < 10 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-9"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add More ({formData.images.length}/10)
                        </Button>
                      )}
                      
                      {/* Clear All Button */}
                      {formData.images.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={removeAllImages}
                          className="w-full text-destructive hover:text-destructive h-9"
                        >
                          Remove All Photos
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Upload Area for First Photos - Center in available space */
                  <div className="flex-grow flex items-center justify-center">
                    <div className="border-2 border-dashed border-muted rounded-lg p-3 text-center w-full">
                      <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <div className="text-xs text-muted-foreground space-y-1 mb-3">
                        <p>• Use high-quality photos</p>
                        <p>• Multiple photos help customers</p>
                        <p>• JPG, PNG up to 3MB each</p>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Upload Photos
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  id="product-images-upload"
                  name="product-images-upload"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {/* Image Upload Errors */}
                {validationErrors.images && (
                  <p className="text-sm text-destructive">{validationErrors.images}</p>
                )}
                
                {/* Image Upload Message */}
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
                
                {/* Image Upload Loading */}
                {imageUploading && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-200 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Uploading images...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pricing & Quantity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <DollarSign className="w-5 h-5" />
              Pricing & Quantity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Package Size Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Package Size</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Define how your product is packaged and sold. This helps buyers understand exactly what they're purchasing.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="e.g., 20, 50, 100"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className={`h-11 ${validationErrors.quantity ? 'border-destructive' : ''}`}
                  />
                  <p className="text-xs text-gray-500">How many units per package</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantityUnit">Unit *</Label>
                  <Select
                    value={formData.quantityUnit}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, quantityUnit: value }))}
                  >
                    <SelectTrigger className={`h-11 ${validationErrors.quantity ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg (kilograms)</SelectItem>
                      <SelectItem value="g">g (grams)</SelectItem>
                      <SelectItem value="lb">lb (pounds)</SelectItem>
                      <SelectItem value="tons">tons</SelectItem>
                      <SelectItem value="dozen">dozen</SelectItem>
                      <SelectItem value="piece">piece</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Measurement unit</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="packaging">Packaging (Optional)</Label>
                  <Select
                    value={formData.packaging || undefined}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, packaging: value === 'none' ? '' : value }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-muted-foreground italic">
                        No packaging
                      </SelectItem>
                      <SelectItem value="bag">bag</SelectItem>
                      <SelectItem value="sack">sack</SelectItem>
                      <SelectItem value="box">box</SelectItem>
                      <SelectItem value="crate">crate</SelectItem>
                      <SelectItem value="bundle">bundle</SelectItem>
                      <SelectItem value="pack">pack</SelectItem>
                      <SelectItem value="piece">piece</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Container type (optional)</p>
                </div>
              </div>
              
              {/* Preview of how it will look */}
              {formData.quantity && formData.quantityUnit && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Preview:</strong> Your product will be displayed as: 
                    <span className="font-mono bg-blue-100 px-2 py-1 rounded ml-2">
                      {formData.quantity}{formData.quantityUnit}{formData.packaging ? ` ${formData.packaging}` : ''}
                    </span>
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price (MMK) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="0"
                value={formData.price || ''}
                onChange={(e) => {
                  const newPrice = parseFloat(e.target.value) || 0;
                  console.log('💰 Price changed:', {
                    inputValue: e.target.value,
                    parsedValue: newPrice,
                    previousPrice: formData.price
                  });
                  setFormData(prev => ({ ...prev, price: newPrice }));
                }}
                className={`h-11 ${validationErrors.price ? 'border-destructive' : ''}`}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="availableQuantity">Available Stock *</Label>
              <Input
                id="availableQuantity"
                type="number"
                min="0"
                placeholder="e.g., 100 (set to 0 for out of stock)"
                value={formData.availableQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, availableQuantity: e.target.value }))}
                className={`h-11 ${validationErrors.availableQuantity ? 'border-destructive' : ''}`}
              />
              <p className="text-xs text-muted-foreground">
                Set to 0 to mark as out of stock (product will remain visible with "Out of Stock" badge)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minimumOrder">Minimum Order *</Label>
              <Input
                id="minimumOrder"
                placeholder="e.g., 5 bags minimum"
                value={formData.minimumOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, minimumOrder: e.target.value }))}
                className={`h-11 ${validationErrors.minimumOrder ? 'border-destructive' : ''}`}
              />
            </div>
            
            {/* Location fields removed - using seller location only */}
          </CardContent>
        </Card>

        {/* Delivery Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Truck className="w-5 h-5" />
              Delivery Options *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableDeliveryOptions.map((option, index) => (
                <div key={`delivery-${index}-${option}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`delivery-${option}`}
                    checked={(formData.deliveryOptions || []).includes(option)}
                    onCheckedChange={() => toggleDeliveryOption(option)}
                  />
                  <Label 
                    htmlFor={`delivery-${option}`} 
                    className="text-sm leading-5 cursor-pointer"
                  >
                    {option}
                  </Label>
                  {availableCustomDeliveryOptions.includes(option) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomDeliveryOption(option)}
                      className="h-6 w-6 p-0 ml-2 text-destructive hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {validationErrors.deliveryOptions && (
              <p className="text-sm text-destructive">{validationErrors.deliveryOptions}</p>
            )}
            
            {/* Add Custom Delivery Option */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom delivery option"
                value={newCustomDelivery}
                onChange={(e) => setNewCustomDelivery(e.target.value)}
                className="h-11"
                onKeyPress={(e) => e.key === 'Enter' && addCustomDeliveryOption()}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={addCustomDeliveryOption}
                disabled={!newCustomDelivery.trim()}
                className="h-11 px-3"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <CreditCard className="w-5 h-5" />
              Payment Terms *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availablePaymentTerms.map((term, index) => (
                <div key={`payment-${index}-${term}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`payment-${term}`}
                    checked={(formData.paymentTerms || []).includes(term)}
                    onCheckedChange={() => togglePaymentTerm(term)}
                  />
                  <Label 
                    htmlFor={`payment-${term}`} 
                    className="text-sm leading-5 cursor-pointer"
                  >
                    {term}
                  </Label>
                  {availableCustomPaymentTerms.includes(term) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomPaymentOption(term)}
                      className="h-6 w-6 p-0 ml-2 text-destructive hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {validationErrors.paymentTerms && (
              <p className="text-sm text-destructive">{validationErrors.paymentTerms}</p>
            )}
            
            {/* Add Custom Payment Term */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom payment term"
                value={newCustomPayment}
                onChange={(e) => setNewCustomPayment(e.target.value)}
                className="h-11"
                onKeyPress={(e) => e.key === 'Enter' && addCustomPaymentOption()}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={addCustomPaymentOption}
                disabled={!newCustomPayment.trim()}
                className="h-11 px-3"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <FileText className="w-5 h-5" />
              Additional Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any special conditions, harvest dates, certifications, or additional information..."
              value={formData.additionalNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
              className="min-h-20 resize-none"
            />
          </CardContent>
        </Card>

        {/* Submit Button - Right Aligned */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
          <Button 
            variant="outline" 
            onClick={onBack} 
            disabled={isSubmitting || categoriesLoading}
            className="h-11 sm:px-6 order-2 sm:order-1 min-h-11"
          >
            Cancel
          </Button>
          
          <Button 
            type="submit"
            disabled={isSubmitting || categoriesLoading || getUpdateButtonConfig().disabled}
            variant={getUpdateButtonConfig().variant}
            className={`h-11 flex-1 sm:flex-none sm:px-8 order-1 sm:order-2 min-h-11 ${
              getUpdateButtonConfig().disabled ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground hover:bg-muted' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2 animate-spin" />
                {editingProduct ? 'Updating...' : 'Publishing...'}
              </>
            ) : (
              <>
                {!editingProduct && <Package className="w-4 h-4 mr-2" />}
                {getUpdateButtonConfig().text}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}