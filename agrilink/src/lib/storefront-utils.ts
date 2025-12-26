/**
 * Shared utility functions for storefront management
 */

export interface StorefrontUpdates {
  description?: string;
  delivery?: string;
  paymentMethods?: string;
  returnPolicy?: string;
  businessHours?: string;
  policies?: any;
  specialties?: string[];
  website?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  tiktok?: string;
  email?: string;
  phone?: string;
}

export interface UpdateStorefrontOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Updates storefront information via the API
 * @param updates - The storefront fields to update
 * @param reloadCallback - Optional callback to reload data after successful update
 * @returns Promise that resolves when update is complete
 */
export async function updateStorefront(
  updates: StorefrontUpdates,
  reloadCallback?: () => Promise<void>
): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Map storefront field names to API field names
  const apiUpdates: any = {};
  if (updates.description !== undefined) {
    apiUpdates.storefront_description = updates.description;
  }
  if (updates.delivery !== undefined) {
    apiUpdates.storefront_delivery = updates.delivery;
  }
  if (updates.paymentMethods !== undefined) {
    apiUpdates.storefront_payment_methods = updates.paymentMethods;
  }
  if (updates.returnPolicy !== undefined) {
    apiUpdates.storefront_return_policy = updates.returnPolicy;
  }
  if (updates.businessHours !== undefined) {
    apiUpdates.business_hours = updates.businessHours;
  }
  if (updates.policies !== undefined) {
    apiUpdates.policies = updates.policies;
  }
  if (updates.website !== undefined) {
    apiUpdates.website = updates.website;
  }
  if (updates.facebook !== undefined) {
    apiUpdates.facebook = updates.facebook;
  }
  if (updates.instagram !== undefined) {
    apiUpdates.instagram = updates.instagram;
  }
  if (updates.whatsapp !== undefined) {
    apiUpdates.whatsapp = updates.whatsapp;
  }
  if (updates.tiktok !== undefined) {
    apiUpdates.tiktok = updates.tiktok;
  }
  if (updates.email !== undefined) {
    apiUpdates.email = updates.email;
  }
  if (updates.phone !== undefined) {
    apiUpdates.phone = updates.phone;
  }

  console.log('📤 Sending API request to /api/user/profile:', apiUpdates);
  
  const response = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(apiUpdates),
  });

  console.log('📡 Response status:', response.status, response.statusText);
  const responseData = await response.json();
  console.log('📥 API response data:', responseData);

  if (!response.ok) {
    console.error('❌ Failed to update storefront:', responseData);
    throw new Error(responseData.error || responseData.message || 'Failed to update storefront');
  }

  // Reload data if callback provided
  if (reloadCallback) {
    console.log('🔄 Reloading seller data...');
    await reloadCallback();
    console.log('✅ Seller data reloaded');
  }

  return responseData;
}

