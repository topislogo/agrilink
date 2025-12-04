// Product data types for AgriLink Marketplace

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  // New structured fields
  quantity: number;
  quantityUnit: string;
  packaging: string;
  // Legacy field for backward compatibility
  unit: string;
  // Available quantity for stock management
  availableQuantity?: number;
  location: string;
  image?: string;
  images?: string[];
  seller: {
    id: string;
    name: string;
    userType: string;
    location: string;
    profileImage?: string;
    verified: boolean;
    phoneVerified: boolean;
    verificationStatus: string;
    rating: number;
    totalReviews: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  deliveryOptions?: string[];
  paymentTerms?: string[];
  additionalNotes?: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerType?: string;
  verifiedOnly?: boolean;
}

export const productCategories = [
  'Vegetables',
  'Fruits', 
  'Rice & Grains',
  'Cooking Oil',
  'Livestock',
  'Seeds',
  'Fertilizers',
  'Equipment',
  'Other'
];

export const productUnits = [
  'kg',
  'ton',
  'bag',
  'sack',
  'crate',
  'box',
  'basket',
  'piece',
  'liter',
  'gallon'
];
