import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { PhoneVerification } from "./PhoneVerification";
import { S3Image } from './S3Image';
import { getDocumentUrl } from '@/lib/cloudfront-utils';
import { 
  ArrowLeft, 
  CheckCircle, 
  Phone, 
  FileText, 
  Building,
  ChevronRight,
  ChevronLeft,
  Edit,
  Shield,
  X,
  Eye,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'farmer' | 'trader' | 'buyer' | 'admin';
  accountType?: 'individual' | 'business';
  location?: string;
  phone?: string;
  phoneVerified?: boolean;
  verified?: boolean;
  businessName?: string;
  businessDescription?: string;
  businessLicenseNumber?: string;
  verificationStatus?: 'pending' | 'under_review' | 'verified' | 'rejected';
  verificationDocuments?: {
    idCard?: {
      status?: 'pending' | 'uploaded' | 'under_review' | 'verified' | 'rejected';
      name?: string;
      size?: number;
      type?: string;
      uploadedAt?: string;
      data?: string;
    };
    businessLicense?: {
      status?: 'pending' | 'uploaded' | 'under_review' | 'verified' | 'rejected';
      name?: string;
      size?: number;
      type?: string;
      uploadedAt?: string;
      data?: string;
    };
    farmCertification?: {
      status?: 'pending' | 'uploaded' | 'under_review' | 'verified' | 'rejected';
      name?: string;
      size?: number;
      type?: string;
      uploadedAt?: string;
      data?: string;
    };
  };
  agriLinkVerificationRequested?: boolean;
  agriLinkVerificationRequestedAt?: string;
  agriLinkVerificationDate?: string;
  verificationSubmittedAt?: string;
  phoneVerificationDate?: string;
}

interface AccountTypeVerificationProps {
  currentUser: User;
  onBack: () => void;
  onVerificationComplete?: () => void;
}

export function AccountTypeVerification({ currentUser, onBack, onVerificationComplete }: AccountTypeVerificationProps) {
  // Initialize uploaded documents from current user state
  const [uploadedDocuments, setUploadedDocuments] = useState<{[key: string]: { file: File | null, url: string, name: string, verified: boolean, status?: string }}>(() => {
    const documents: any = {};
    
    
    // Restore from user's verification documents if they exist
    if ((currentUser as any).verificationDocuments) {
      const userDocs = (currentUser as any).verificationDocuments;
      
      // Restore ID Card - check if it's an object with status
      if (userDocs.idCard && typeof userDocs.idCard === 'object' && userDocs.idCard.status) {
        documents.idCard = {
          file: null,
          url: userDocs.idCard.data || '', // This should be S3 key, not blob URL
          name: userDocs.idCard.name || 'ID Card Document',
          verified: userDocs.idCard.status === 'verified',
          status: userDocs.idCard.status
        };
      }
      
      // Restore Business License - check if it's an object with status
      if (userDocs.businessLicense && typeof userDocs.businessLicense === 'object' && userDocs.businessLicense.status) {
        documents.businessLicense = {
          file: null,
          url: userDocs.businessLicense.data || '', // This should be S3 key, not blob URL
          name: userDocs.businessLicense.name || 'Business License Document',
          verified: userDocs.businessLicense.status === 'verified',
          status: userDocs.businessLicense.status
        };
      }
    }
    return documents;
  });
  
  // Track upload status to prevent duplicate uploads
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Track verification request submission status
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);


  // Sync uploadedDocuments state when currentUser.verificationDocuments changes
  useEffect(() => {
    const userDocs = (currentUser as any).verificationDocuments;
    
    console.log('🔍 AccountTypeVerification - User verification documents:', {
      userDocs,
      userDocsType: typeof userDocs,
      userDocsStringified: JSON.stringify(userDocs, null, 2),
      currentUserVerified: currentUser.verified,
      currentUserVerificationStatus: currentUser.verificationStatus
    });
    
    // If verification documents are null (after reset), clear the local state
    if (!userDocs) {
      console.log('🔍 No verification documents found, clearing local state');
      setUploadedDocuments({});
      return;
    }
    
    // If verification documents exist, sync with them
    setUploadedDocuments(prev => {
      const updated = { ...prev };
      
      console.log('🔍 Processing verification documents:', {
        idCard: userDocs.idCard,
        businessLicense: userDocs.businessLicense,
        idCardType: typeof userDocs.idCard,
        businessLicenseType: typeof userDocs.businessLicense
      });
      
      // Sync ID Card status
      if (userDocs.idCard && typeof userDocs.idCard === 'object' && userDocs.idCard.status) {
        console.log('🔍 Syncing ID Card:', userDocs.idCard);
        updated.idCard = {
          file: null,
          url: userDocs.idCard.data || '', // Use data field for preview
          name: userDocs.idCard.name || 'ID Card Document',
          verified: userDocs.idCard.status === 'verified',
          status: userDocs.idCard.status
        };
      }
      
      // Sync Business License status  
      if (userDocs.businessLicense && typeof userDocs.businessLicense === 'object' && userDocs.businessLicense.status) {
        console.log('🔍 Syncing Business License:', userDocs.businessLicense);
        updated.businessLicense = {
          file: null,
          url: userDocs.businessLicense.data || '', // Use data field for preview
          name: userDocs.businessLicense.name || 'Business License Document',
          verified: userDocs.businessLicense.status === 'verified',
          status: userDocs.businessLicense.status
        };
      }
      
      console.log('🔍 Updated uploadedDocuments:', updated);
      return updated;
    });
  }, [(currentUser as any).verificationDocuments]);
  
  
  // Business form state
  const [businessForm, setBusinessForm] = useState({
    businessName: currentUser.businessName || '',
    businessDescription: currentUser.businessDescription || '',
    businessLicenseNumber: currentUser.businessLicenseNumber || ''
  });
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const justSavedRef = useRef(false);
  
  // Sync business form state when currentUser business info changes
  // Only update if user is not currently editing to preserve their input
  // Skip if we just saved to prevent flickering
  useEffect(() => {
    if (!isEditingBusiness && !justSavedRef.current) {
      const newFormData = {
        businessName: currentUser.businessName || '',
        businessDescription: currentUser.businessDescription || '',
        businessLicenseNumber: currentUser.businessLicenseNumber || ''
      };
      
      // Only update if the data is actually different
      if (
        businessForm.businessName !== newFormData.businessName ||
        businessForm.businessDescription !== newFormData.businessDescription ||
        businessForm.businessLicenseNumber !== newFormData.businessLicenseNumber
      ) {
        console.log('🔄 Updating business form from currentUser:', {
          currentForm: businessForm,
          newForm: newFormData,
          reason: 'currentUser data changed'
        });
        setBusinessForm(newFormData);
      } else {
        console.log('⏸️ Skipping business form update - data is the same');
      }
    } else if (justSavedRef.current) {
      console.log('⏸️ Skipping business form update - just saved, preventing flicker');
      justSavedRef.current = false; // Reset the flag
    }
  }, [currentUser.businessName, currentUser.businessDescription, currentUser.businessLicenseNumber, isEditingBusiness]);
  
  // Initialize AgriLink verification state from user data
  const [agriLinkVerificationRequested, setAgriLinkVerificationRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Sync AgriLink verification state when currentUser changes
  useEffect(() => {
    console.log('🔄 Syncing AgriLink verification state');
    console.log('📋 User agriLinkVerificationRequested:', (currentUser as any).agriLinkVerificationRequested);
    console.log('📋 User verificationSubmitted:', (currentUser as any).verificationSubmitted);
    console.log('📋 User verified:', currentUser.verified);
    console.log('📋 User verificationStatus:', currentUser.verificationStatus);
    
    // Don't reset state if we're currently submitting (prevents race condition)
    if (isSubmittingVerification || verificationSubmitted) {
      console.log('⏸️ Skipping state sync - submission in progress');
      return;
    }
    
    // Check if AgriLink verification was already requested or completed
    const userRequested = (currentUser as any).agriLinkVerificationRequested || (currentUser as any).verificationSubmitted;
    const isVerified = currentUser.verified;
    // Check for both 'pending' and 'under-review'/'under_review' statuses (API uses snake_case, some code uses kebab-case)
    const isUnderReview = currentUser.verificationStatus === 'under-review' || 
                          currentUser.verificationStatus === 'under_review' || 
                          currentUser.verificationStatus === 'pending';
    
    // For rejected users, reset agriLinkVerificationRequested to false so they can re-upload
    const isRejected = currentUser.verificationStatus === 'rejected';
    const shouldShowAsRequested = (userRequested || isVerified || isUnderReview) && !isRejected;
    
    console.log('✅ AgriLink verification state:', shouldShowAsRequested ? 'true' : 'false');
    // Treat under_review as requested so the button shows blue and stays disabled after refresh
    // But for rejected users, reset to false so they can re-upload documents
    setAgriLinkVerificationRequested(Boolean(shouldShowAsRequested));
    
    // Reset verification submitted flag when user data refreshes AND we have confirmed status
    // Don't reset if status is still not updated (prevents premature reset)
    if ((userRequested || isVerified) && (isUnderReview || isVerified)) {
      setVerificationSubmitted(false);
    }
    
    // Show success message if verification was requested but user is still under review
    const hasRequestedVerification = userRequested || isUnderReview;
    const isNotYetVerified = !isVerified;
    
    console.log('🔄 Syncing success message state:', {
      hasRequestedVerification,
      isUnderReview,
      isNotYetVerified,
      shouldShow: hasRequestedVerification && isUnderReview && isNotYetVerified
    });
    
    setShowSuccessMessage(hasRequestedVerification && isUnderReview && isNotYetVerified);
  }, [
    currentUser.verificationStatus, 
    currentUser.verified, 
    (currentUser as any).agriLinkVerificationRequested,
    (currentUser as any).verificationSubmitted, // Add this to dependency array
    isSubmittingVerification, // Add this to prevent race condition
    verificationSubmitted // Add this to prevent race condition
  ]);

  // Keep button dimmed/disabled on refresh while under review
  useEffect(() => {
    const isUnderReview = currentUser.verificationStatus === 'under-review' || 
                          currentUser.verificationStatus === 'under_review';
    if (isUnderReview && !currentUser.verified) {
      setIsSubmittingVerification(true);
      setVerificationSubmitted(true);
    } else {
      setIsSubmittingVerification(false);
      setVerificationSubmitted(false);
    }
  }, [currentUser.verificationStatus, currentUser.verified]);

  // Check verification request status directly from API if local state suggests it should be requested
  // This helps catch cases where user profile hasn't updated yet
  useEffect(() => {
    const checkVerificationRequestStatus = async () => {
      // Only check if we think verification was requested but user data doesn't reflect it
      const isUnderReview = currentUser.verificationStatus === 'under-review' || 
                            currentUser.verificationStatus === 'under_review';
      if (agriLinkVerificationRequested && !currentUser.verified && 
          !isUnderReview && 
          currentUser.verificationStatus !== 'pending') {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          const response = await fetch('/api/user/verification-status', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            const verificationRequest = data.verificationRequest;
            
            // If there's a pending/under_review request, keep the state as requested
            if (verificationRequest && 
                (verificationRequest.status === 'pending' || verificationRequest.status === 'under_review')) {
              console.log('✅ Found pending verification request, keeping state as requested');
              setAgriLinkVerificationRequested(true);
              setShowSuccessMessage(true);
            }
          }
        } catch (error) {
          console.error('Error checking verification request status:', error);
        }
      }
    };

    // Only check after a delay to avoid too many API calls
    const timeoutId = setTimeout(checkVerificationRequestStatus, 2000);
    return () => clearTimeout(timeoutId);
  }, [agriLinkVerificationRequested, currentUser.verificationStatus, currentUser.verified]);
  
  // Monitor verification status changes to hide success message when status changes
  useEffect(() => {
    // Hide success message if verification is completed (verified) or explicitly rejected
    if (showSuccessMessage) {
      if (currentUser.verified || currentUser.verificationStatus === 'rejected') {
        setShowSuccessMessage(false);
      }
    }
  }, [currentUser.verified, currentUser.verificationStatus, showSuccessMessage]);

  // Fetch rejection details when user has rejected status
  useEffect(() => {
    const fetchRejectionDetails = async () => {
      if (currentUser.verificationStatus === 'rejected') {
        try {
          const response = await fetch('/api/user/verification-status', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('📋 Verification request status:', data.verificationRequest?.status);
            if (data.verificationRequest && data.verificationRequest.status === 'rejected') {
              setRejectionDetails({
                review_notes: data.verificationRequest.review_notes,
                reviewed_at: data.verificationRequest.reviewed_at
              });
            }
          }
        } catch (error) {
          console.error('Failed to fetch rejection details:', error);
        }
      }
    };

    fetchRejectionDetails();
  }, [currentUser.verificationStatus]);
  
  // Phone verification state
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  
  // All documents state
  const [showDocumentsDetail, setShowDocumentsDetail] = useState(false);
  
  // Business details state  
  const [showBusinessDetail, setShowBusinessDetail] = useState(false);
  
  // Document preview modal state
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{
    name: string;
    data: string;
    type: string;
    originalData?: string;
  } | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Debug: Track showDocumentPreview changes
  useEffect(() => {
    console.log('🔍 showDocumentPreview changed:', showDocumentPreview);
  }, [showDocumentPreview]);

  // Debug: Track isGeneratingPreview changes
  useEffect(() => {
    console.log('🔍 isGeneratingPreview changed:', isGeneratingPreview);
  }, [isGeneratingPreview]);

  // Debug: Track when modal should render
  useEffect(() => {
    const shouldShow = showDocumentPreview || isGeneratingPreview;
    console.log('🔍 Modal should render effect:', { showDocumentPreview, isGeneratingPreview, shouldShow });
    if (shouldShow) {
      console.log('🔍 Modal should be visible NOW!');
    }
  }, [showDocumentPreview, isGeneratingPreview]);
  
  // Rejection review state
  const [showRejectionReview, setShowRejectionReview] = useState(false);
  const [rejectionDetails, setRejectionDetails] = useState<{
    review_notes?: string;
    reviewed_at?: string;
  } | null>(null);
  
  
  // Determine account type
  const isBusinessAccount = currentUser.accountType === 'business';
  
  // Helper function to check document completion status
  const getDocumentCompletionStatus = useMemo(() => {
    const userDocs = (currentUser as any).verificationDocuments;
    
    // Documents are only considered complete if user is verified by admin
    // If user is rejected or not verified, documents should show as "Required" even if visible
    if (currentUser.verified) {
      // User is verified - documents are complete
      const hasIdCard = (userDocs?.idCard && userDocs.idCard.status && userDocs.idCard.status !== 'pending') || uploadedDocuments.idCard;
      return { hasIdCard, hasBusinessLicense: false, isComplete: true };
    } else if (currentUser.verificationStatus === 'rejected') {
      // User was rejected - show documents as complete if uploaded for resubmission
      const hasIdCard = (userDocs?.idCard && userDocs.idCard.status && userDocs.idCard.status !== 'pending') || uploadedDocuments.idCard;
      return { hasIdCard, hasBusinessLicense: false, isComplete: hasIdCard };
    } else if (agriLinkVerificationRequested) {
      // Verification submitted but not yet approved - documents are complete for submission
      const hasIdCard = (userDocs?.idCard && userDocs.idCard.status && userDocs.idCard.status !== 'pending') || uploadedDocuments.idCard;
      return { hasIdCard, hasBusinessLicense: false, isComplete: true };
    } else {
      // Not submitted yet - only check local uploaded documents
      const hasIdCard = uploadedDocuments.idCard;
      return { hasIdCard, hasBusinessLicense: false, isComplete: hasIdCard };
    }
  }, [uploadedDocuments.idCard, currentUser.verificationDocuments, currentUser.verified, currentUser.verificationStatus, agriLinkVerificationRequested]);
  
  // Calculate progress based on what the UI actually shows as complete
  const getProgress = () => {
    // If user is fully verified, they are 100% complete
    if (currentUser.verified) {
      return 100;
    }
    
    let completed = 0;
    let total = isBusinessAccount ? 4 : 3; // Phone, Documents, Business (if business account), AgriLink Verification

    // 1. Phone verification - count as complete if phone is verified
    if (currentUser.phoneVerified) completed++;
    
    // 2. Documents verification - count as complete if documents are uploaded (matches UI logic)
    if (getDocumentCompletionStatus.isComplete) completed++;
    
    // 3. Business details (only for business accounts) - count as complete if business info AND license are filled
    if (isBusinessAccount) {
      const hasBusinessInfo = Boolean(currentUser.businessName && currentUser.businessDescription && currentUser.businessLicenseNumber);
      const hasBusinessLicense = Boolean(
        (currentUser.verificationDocuments?.businessLicense && 
         currentUser.verificationDocuments.businessLicense.status && 
         currentUser.verificationDocuments.businessLicense.status !== 'pending') ||
        uploadedDocuments.businessLicense
      );
      if (hasBusinessInfo && hasBusinessLicense) completed++;
    }
    
    // 4. AgriLink Verification - count as complete if user is verified by admin
    if (currentUser.verified) completed++;
    
    const progress = Math.round((completed / total) * 100);
    
    // Ensure progress doesn't exceed 100%
    return Math.min(progress, 100);
  };

  // Cleanup blob URLs on component unmount
  useEffect(() => {
    return () => {
      if (previewDocument && previewDocument.data.startsWith('blob:')) {
        URL.revokeObjectURL(previewDocument.data);
      }
    };
  }, [previewDocument]);

  // Handler functions
  
  const handleDocumentPreview = async (documentData: string, documentName: string) => {
    try {
      console.log('🔍 Document preview requested:', { documentName, documentData: documentData?.substring(0, 50) + '...' });
      console.log('🔍 Current modal state before:', { showDocumentPreview, isGeneratingPreview });
      
      if (!documentData) {
        alert('No document data available');
        return;
      }

      setIsGeneratingPreview(true);
      setShowDocumentPreview(false); // Hide previous preview
      console.log('🔍 Modal state after setting:', { showDocumentPreview: false, isGeneratingPreview: true });

      // Handle S3 key (new format) - use CloudFront URL
      if (!documentData.startsWith('data:') && !documentData.startsWith('/uploads/') && !documentData.startsWith('http') && !documentData.startsWith('blob:')) {
        try {
          console.log('🔄 Getting CloudFront URL for S3 key:', documentData);
          
          // Use CloudFront URL instead of generating presigned URL
          const documentUrl = getDocumentUrl(documentData);
          console.log('✅ Generated CloudFront URL:', documentUrl.substring(0, 100) + '...');
          
          // Determine file type from S3 key
          const fileExtension = documentData.split('.').pop()?.toLowerCase();
          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
          
          setPreviewDocument({
            name: documentName,
            data: documentUrl,
            type: isImage ? 'image' : 'document',
            originalData: documentData
          });
          setShowDocumentPreview(true);
          setIsGeneratingPreview(false);
          console.log('🔍 Modal should now be visible:', { showDocumentPreview: true, isGeneratingPreview: false });
          return;
        } catch (error) {
          console.error('❌ Error getting CloudFront URL:', error);
          alert('Failed to load document from storage');
          setIsGeneratingPreview(false);
          return;
        }
      }
      
      // Handle blob URL (temporary URLs)
      if (documentData.startsWith('blob:')) {
        // Blob URL format - use directly
        setPreviewDocument({
          name: documentName,
          data: documentData,
          type: 'image', // Assume image for blob URLs
          originalData: documentData
        });
        setShowDocumentPreview(true);
        setIsGeneratingPreview(false);
        return;
      }
      
      // Handle file path (legacy format)
      if (documentData.startsWith('/uploads/')) {
        // File path format - open directly
        window.open(documentData, '_blank');
        setIsGeneratingPreview(false);
        return;
      } else if (documentData.startsWith('data:')) {
        // Base64 data format (legacy)
        // Convert Data URL to Blob URL for safer display
        const [header, base64Data] = documentData.split(',');
        const mimeType = header.match(/data:([^;]+)/)?.[1] || 'application/octet-stream';
        
        // Clean and fix base64 data
        let cleanBase64 = base64Data.replace(/[^A-Za-z0-9+/]/g, '');
        while (cleanBase64.length % 4) {
          cleanBase64 += '=';
        }

        // Convert to binary
        const binaryString = atob(cleanBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Create blob and blob URL
        const blob = new Blob([bytes], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);

        setPreviewDocument({
          name: documentName,
          data: blobUrl,
          type: mimeType.startsWith('image/') ? 'image' : 'document',
          originalData: documentData // Keep original for cleanup
        });
        setShowDocumentPreview(true);
        setIsGeneratingPreview(false);
      } else {
        alert('Invalid document format');
        setIsGeneratingPreview(false);
        return;
      }
    } catch (error) {
      console.error('Error preparing document preview:', error);
      setUploadError('Unable to preview document - invalid format');
      setTimeout(() => setUploadError(null), 5000);
      setIsGeneratingPreview(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Prevent duplicate uploads
    if (isUploading) {
      console.log('⚠️ Upload already in progress, skipping duplicate upload');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      setTimeout(() => setUploadError(null), 5000);
      return;
    }

    // Validate file type
    // if (!file.type.startsWith('image/')) {
    //   setUploadError('Please upload an image file (JPG, PNG, etc.)');
    //   setTimeout(() => setUploadError(null), 5000);
    //   return;
    // }
    const allowedTypes = ['image/', 'application/pdf'];
    if (!allowedTypes.some(type => file.type.startsWith(type))) {
      setUploadError('Please upload an image or PDF file');
      setTimeout(() => setUploadError(null), 5000);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      // Create object URL for preview
      const url = URL.createObjectURL(file);
      
      // Store document info as uploaded (not verified yet)
      setUploadedDocuments(prev => ({
        ...prev,
        [documentType]: {
          file,
          url,
          name: file.name,
          verified: false,
          status: 'uploaded'
        }
      }));

      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update user's verification documents
      const updatedDocuments = {
        ...(currentUser.verificationDocuments || {}),
        [documentType]: {
        status: 'uploaded',
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        // Convert to base64 for API - API will handle S3 upload
        data: await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        })
        }
      };
      
      // Update user profile via API
      const token = localStorage.getItem('token');
      
      console.log('🔄 Uploading document to API:', {
        documentType,
        fileName: file.name,
        fileSize: file.size,
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
      });
      
      const requestBody = {
        verificationDocuments: updatedDocuments
      };
      
      console.log('📤 API Request body:', {
        verificationDocumentsKeys: Object.keys(updatedDocuments),
        documentData: updatedDocuments[documentType] ? {
          status: updatedDocuments[documentType].status,
          name: updatedDocuments[documentType].name,
          size: updatedDocuments[documentType].size,
          type: updatedDocuments[documentType].type,
          hasData: !!updatedDocuments[documentType].data,
          dataLength: updatedDocuments[documentType].data?.length || 0
        } : 'no document data'
      });
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Failed to update user profile: ${response.status} ${response.statusText}`);
      }
      
      // Get the response data to update local state with S3 keys
      const responseData = await response.json();
      console.log('✅ API Response received:', responseData);
      
      // Update local state with S3 keys from API response
      if (responseData.user?.verificationDocuments?.[documentType]?.data) {
        const s3Key = responseData.user.verificationDocuments[documentType].data;
        console.log('🔄 Updating local state with S3 key:', s3Key);
        
        setUploadedDocuments(prev => ({
          ...prev,
          [documentType]: {
            ...prev[documentType],
            url: s3Key, // Replace blob URL with S3 key
            verified: false,
            status: 'uploaded'
          }
        }));
      }
      
      // Small delay to ensure state propagation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Call verification complete callback to refresh user data
      if (onVerificationComplete) {
        onVerificationComplete();
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('Upload failed. Please try again.');
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveDocument = (documentType: string) => {
    setUploadedDocuments(prev => {
      const updated = { ...prev };
      delete updated[documentType];
      return updated;
    });
  };

  const handleResubmitVerification = async () => {
    try {
      // Reset verification status in user_verification table
      const response = await fetch('/api/user/reset-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        console.log('✅ Reset API successful, updating local state...');
        
        // Reset local state immediately
        setAgriLinkVerificationRequested(false);
        setUploadedDocuments({});
        
        console.log('🔄 Local state reset, calling onVerificationComplete...');
        
        // Call verification complete callback to refresh user data
        if (onVerificationComplete) {
          onVerificationComplete();
        }
        
        console.log('✅ Verification status and documents reset for resubmission');
      } else {
        throw new Error('Failed to reset verification status');
      }
    } catch (error) {
      console.error('Failed to reset verification status:', error);
      alert('Failed to reset verification status. Please try again.');
    }
  };

  // Handle reset verification for resubmission (preserves rejection history)

  const handleRequestAgriLinkVerification = async () => {
    // Prevent duplicate submissions
    if (isSubmittingVerification) {
      console.log('⚠️ Verification request already in progress, skipping duplicate submission');
      return;
    }
    
    setError(null); // Clear any previous errors
    setIsSubmittingVerification(true);
    let success = false;
    
    // Add timeout to prevent infinite processing
    const timeoutId = setTimeout(() => {
      console.error('❌ Verification request timeout - stopping processing');
      setIsSubmittingVerification(false);
    }, 10000); // 10 second timeout
    
    try {
      console.log('🛡️ Requesting AgriLink verification for user:', currentUser.email);
      
      // Check if documents are uploaded in the database OR locally uploaded
      const userDocs = currentUser.verificationDocuments || {};
      const hasIdCard = (userDocs.idCard && userDocs.idCard.status && userDocs.idCard.status !== 'pending') || uploadedDocuments.idCard;
      const hasBusinessLicense = !isBusinessAccount || (userDocs.businessLicense && userDocs.businessLicense.status && userDocs.businessLicense.status !== 'pending') || uploadedDocuments.businessLicense;
      const hasUploadedDocs = hasIdCard && hasBusinessLicense;
      
      // Prepare verification documents for submission
      // Use local uploadedDocuments if available, otherwise use database documents
      const verificationDocsForSubmission: any = {};
      
      // Process ID Card
      if (uploadedDocuments.idCard && uploadedDocuments.idCard.file) {
        // Use local document (has file object)
        verificationDocsForSubmission.idCard = {
          status: 'uploaded',
          name: uploadedDocuments.idCard.name,
          size: uploadedDocuments.idCard.file.size,
          type: uploadedDocuments.idCard.file.type,
          uploadedAt: new Date().toISOString(),
          data: await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(uploadedDocuments.idCard.file!);
          })
        };
      } else if (userDocs.idCard && userDocs.idCard.status && userDocs.idCard.status !== 'pending') {
        // Use database document (might be S3 key or base64)
        verificationDocsForSubmission.idCard = userDocs.idCard;
      }
      
      // Process Business License (for business accounts)
      if (isBusinessAccount) {
        if (uploadedDocuments.businessLicense && uploadedDocuments.businessLicense.file) {
          // Use local document (has file object)
          verificationDocsForSubmission.businessLicense = {
            status: 'uploaded',
            name: uploadedDocuments.businessLicense.name,
            size: uploadedDocuments.businessLicense.file.size,
            type: uploadedDocuments.businessLicense.file.type,
            uploadedAt: new Date().toISOString(),
            data: await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(uploadedDocuments.businessLicense.file!);
            })
          };
        } else if (userDocs.businessLicense && userDocs.businessLicense.status && userDocs.businessLicense.status !== 'pending') {
          // Use database document (might be S3 key or base64)
          verificationDocsForSubmission.businessLicense = userDocs.businessLicense;
        }
      }
      
      // Check phone verification
      const isPhoneVerified = currentUser.phoneVerified === true;
      
      // Check business information completion (for business accounts)
      const hasBusinessInfo = !isBusinessAccount || (
        currentUser.businessName && 
        currentUser.businessDescription && 
        currentUser.businessLicenseNumber &&
        currentUser.location
      );
      
      // Check location information
      const hasLocation = currentUser.location && currentUser.location.trim() !== '';
      
      console.log('🔍 Debug - Validation check results:');
      console.log('  - hasIdCard:', hasIdCard);
      console.log('  - hasBusinessLicense:', hasBusinessLicense);
      console.log('  - hasUploadedDocs:', hasUploadedDocs);
      console.log('  - isPhoneVerified:', isPhoneVerified);
      console.log('  - hasBusinessInfo:', hasBusinessInfo);
      console.log('  - hasLocation:', hasLocation);
      console.log('  - isBusinessAccount:', isBusinessAccount);
      console.log('  - userDocs:', userDocs);
      console.log('  - uploadedDocuments:', uploadedDocuments);
      console.log('  - Database idCard status:', userDocs.idCard?.status);
      console.log('  - Local idCard uploaded:', !!uploadedDocuments.idCard);
      console.log('  - Database businessLicense status:', userDocs.businessLicense?.status);
      console.log('  - Local businessLicense uploaded:', !!uploadedDocuments.businessLicense);
      
      // Comprehensive validation
      if (!hasUploadedDocs) {
        alert('Please upload all required documents before submitting verification request.');
        return;
      }
      
      if (!isPhoneVerified) {
        alert('Please complete phone verification before submitting verification request.');
        return;
      }
      
      if (!hasLocation) {
        alert('Please provide your location before submitting verification request.');
        return;
      }
      
      if (isBusinessAccount && !hasBusinessInfo) {
        alert('Please complete all business information (business name, description, license number, and location) before submitting verification request.');
        return;
      }
      
      if (hasUploadedDocs && isPhoneVerified && hasLocation && (!isBusinessAccount || hasBusinessInfo)) {
        // Create verification request for admin review
        const verificationRequest = {
          id: `req-${Date.now()}`,
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.name,
          userType: currentUser.userType,
          accountType: currentUser.accountType,
          requestType: 'standard',
          status: 'pending',
          submittedAt: new Date().toISOString(),
          documents: {
            nationalId: userDocs.idCard ? {
              status: userDocs.idCard.status,
              name: userDocs.idCard.name,
              uploadedAt: userDocs.idCard.uploadedAt
            } : undefined,
            businessLicense: userDocs.businessLicense ? {
              status: userDocs.businessLicense.status,
              name: userDocs.businessLicense.name,
              uploadedAt: userDocs.businessLicense.uploadedAt
            } : undefined,
          },
          businessInfo: isBusinessAccount ? {
            businessName: currentUser.businessName,
            businessDescription: currentUser.businessDescription,
            businessLicenseNumber: currentUser.businessLicenseNumber,
            location: currentUser.location
          } : undefined,
          phoneVerified: currentUser.phoneVerified
        };

        // Store verification request in database for admin review
        console.log('🔄 Inserting verification request into database...');
        console.log('📋 Request data:', {
          user_id: currentUser.id,
          user_email: currentUser.email,
          user_name: currentUser.name,
          user_type: currentUser.userType,
          account_type: currentUser.accountType,
          request_type: 'standard',
          status: 'under_review',
          submitted_at: new Date().toISOString(),
          verification_documents: userDocs,
          business_info: isBusinessAccount ? {
            business_name: currentUser.businessName,
            business_description: currentUser.businessDescription,
            business_license_number: currentUser.businessLicenseNumber,
            location: currentUser.location
          } : null,
          phone_verified: currentUser.phoneVerified
        });
        
        const token = localStorage.getItem('token');
        const response = await fetch('/api/verification/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            requestType: 'agrilink_verification',
            status: 'under_review',
            submittedAt: new Date().toISOString(),
            verificationDocuments: verificationDocsForSubmission,
            businessInfo: isBusinessAccount ? {
              business_name: currentUser.businessName,
              business_description: currentUser.businessDescription,
              business_license_number: currentUser.businessLicenseNumber,
              location: currentUser.location
            } : null,
            phoneVerified: currentUser.phoneVerified
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Verification request failed:', response.status, errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.requiresEmailVerification) {
              setError('Please verify your email address before submitting verification requests. Check your email for a verification link and click it to verify your account.');
              return;
            }
          } catch (parseError) {
            // If JSON parsing fails, show generic error
          }
          
          throw new Error(`Failed to submit verification request: ${response.status} - ${errorText}`);
        }
        
        console.log('✅ Verification request inserted successfully');

        // Simulate request processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Set AgriLink verification as requested
        setAgriLinkVerificationRequested(true);
        setShowSuccessMessage(true);
        
        // Update user profile to track the request
        // Note: The verification request API will also update user_verification table,
        // but we update here as well for immediate UI feedback
        console.log('🔄 Updating user profile with verification request data...');
        const userUpdateData = {
          agriLinkVerificationRequested: true,
          agriLinkVerificationRequestedAt: new Date().toISOString(),
          verificationStatus: 'under-review', // Use hyphen format to match dashboard expectations
          verificationSubmittedAt: new Date().toISOString(),
          verificationDocuments: verificationDocsForSubmission
        };
        
        console.log('📋 User update data:', userUpdateData);
        
        try {
          const updateResponse = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(userUpdateData),
          });

          if (!updateResponse.ok) {
            throw new Error('Failed to update user profile');
          }
          
          console.log('✅ User profile updated successfully');
        } catch (updateError) {
          console.error('❌ Error updating user profile:', updateError);
          // Don't throw here, as the verification request was already submitted
        }

        console.log('✅ AgriLink verification request submitted successfully:', verificationRequest);
        
        // Update local state first to prevent flickering
        setAgriLinkVerificationRequested(true);
        setShowSuccessMessage(true);
        setVerificationSubmitted(true);
        success = true;
        
        // Wait a bit for database to update, then refresh user data
        // This ensures the API returns the updated verification status
        setTimeout(async () => {
          // Call verification complete callback to refresh user data in parent components
          if (onVerificationComplete) {
            onVerificationComplete();
          }
          
          // Reset submitting state after refresh completes
          setTimeout(() => {
            setIsSubmittingVerification(false);
          }, 500);
        }, 1000); // Wait 1 second for database update to propagate
        
        // Success message will remain visible until admin accepts/rejects the request
        
      } else {
        alert('Please upload all required documents before requesting verification.');
      }
    } catch (error) {
      console.error('❌ Failed to request AgriLink verification:', error);
      alert('Failed to request verification. Please try again.');
    } finally {
      clearTimeout(timeoutId);
      // Only reset submitting state for errors, success case is handled in setTimeout
      if (!success) {
        setIsSubmittingVerification(false);
      }
    }
  };

  const handleSaveBusinessInfo = async () => {
    if (!businessForm.businessName.trim()) {
      alert('Please enter your business name');
      return;
    }

    if (!businessForm.businessLicenseNumber.trim()) {
      alert('Please enter your business license number');
      return;
    }

    setIsSavingBusiness(true);
    try {
      console.log('💼 Saving business information:', {
        businessName: businessForm.businessName,
        businessDescription: businessForm.businessDescription,
        businessLicenseNumber: businessForm.businessLicenseNumber
      });
      
      // Save to database via API
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          business_name: businessForm.businessName,
          business_description: businessForm.businessDescription,
          business_license_number: businessForm.businessLicenseNumber,
          business_details_completed: true,
        }),
      });

      if (!response.ok) {
        let errorDetails;
        try {
          errorDetails = await response.json();
        } catch (parseError) {
          errorDetails = { message: 'Failed to parse error response' };
        }
        
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorDetails
        });
        
        throw new Error(errorDetails.details || errorDetails.error || 'Failed to save to database');
      }
      
      console.log('✅ Business information saved to database and user profile');
      
      // Update local state to reflect saved business info immediately
      setIsEditingBusiness(false);
      
      // Set flag to prevent flickering when API refreshes
      justSavedRef.current = true;
      
      // Call verification complete callback to refresh user data from API
      // This ensures other components have the latest business info
      if (onVerificationComplete) {
        onVerificationComplete();
      }
    } catch (error) {
      console.error('❌ Error saving business info:', error);
      alert('Failed to save business information. Please try again.');
    } finally {
      setIsSavingBusiness(false);
    }
  };


  // If showing new phone verification, render that instead
  if (showPhoneVerification) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-semibold text-primary">Phone Verification</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Verify your phone number with backend integration
            </p>
          </div>
        </div>

        <PhoneVerification
          currentUser={currentUser}
          onVerificationComplete={(verifiedPhoneNumber) => {
            // Call verification complete callback to refresh user data
            if (onVerificationComplete) {
              onVerificationComplete();
            }
            
            // Go back to main verification view
            setShowPhoneVerification(false);
          }}
          onBack={() => setShowPhoneVerification(false)}
        />
      </div>
    );
  }


  // If showing documents detail, render that instead
  if (showDocumentsDetail) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-semibold text-primary">Identity Documents</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentUser.verified ? 'Documents submitted for identity verification' : 'Upload your government-issued ID to verify your identity'}
            </p>
          </div>
        </div>

        {currentUser.verified ? (
          /* Already Verified - Show Submitted Documents */
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-primary">Submitted Documents</h3>
              
              {/* National ID Card */}
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">National ID Card</p>
                        <p className="text-sm text-muted-foreground">Government-issued identification</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Verified
                      </Badge>
                      {uploadedDocuments.idCard && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDocumentPreview(uploadedDocuments.idCard.url, 'ID Card Document')}
                          className="text-green-700 hover:text-green-800 hover:bg-green-100"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    {uploadedDocuments.idCard 
                      ? `Uploaded: ${uploadedDocuments.idCard.name}` 
                      : 'Document verified and stored securely'
                    }
                  </div>
                </div>
              </div>

              {/* Business License (for business accounts) */}
              {isBusinessAccount && (
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Business License</p>
                          <p className="text-sm text-muted-foreground">Business registration document</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          Verified
                        </Badge>
                        {uploadedDocuments.businessLicense && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDocumentPreview(uploadedDocuments.businessLicense.url, 'Business License Document')}
                            className="text-green-700 hover:text-green-800 hover:bg-green-100"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">
                      {uploadedDocuments.businessLicense 
                        ? `Uploaded: ${uploadedDocuments.businessLicense.name}` 
                        : 'Document verified and stored securely'
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* Status Message */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <p className="font-medium text-primary">Verification Complete</p>
                </div>
                <p className="text-sm text-primary/80">
                  Your documents have been successfully verified. You now have full access to AgriLink platform features.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (currentUser.verificationStatus === 'under-review' || currentUser.verificationStatus === 'under_review') && !agriLinkVerificationRequested ? (
          /* Under Review - Show Status */
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-orange-800">Documents Under Review</h3>
              
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    <p className="font-medium text-orange-800">Review in Progress</p>
                  </div>
                  <p className="text-sm text-orange-700 mb-2">
                    We'll notify you once the review is complete, typically within 1-2 business days.
                  </p>
                  {currentUser.verificationSubmittedAt && (
                    <p className="text-xs text-orange-600 mt-2">
                      Submitted on {new Date(currentUser.verificationSubmittedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Show submitted documents */}
                {uploadedDocuments.idCard && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-orange-800">
                            {uploadedDocuments.idCard.name}
                          </p>
                          <p className="text-xs text-orange-700">
                            Under Review
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDocumentPreview(uploadedDocuments.idCard.url, 'ID Card Document')}
                          className="text-green-700 hover:text-green-800 hover:bg-green-100"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          Under Review
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Business document if applicable */}
                {isBusinessAccount && uploadedDocuments.businessLicense && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-orange-800">
                            {uploadedDocuments.businessLicense.name}
                          </p>
                          <p className="text-xs text-orange-700">
                            Under Review
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDocumentPreview(uploadedDocuments.businessLicense.url, 'Business License Document')}
                          className="text-green-700 hover:text-green-800 hover:bg-green-100"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          Under Review
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Upload Form */
          <>
            
            <Card className="border-primary/20 bg-primary/2">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-primary/80 mb-4">
                      Please upload a clear photo of your government-issued ID (National ID card, passport, or driver's license).
                    </p>
                    
                    {/* ID Document Upload */}
                    <div className="space-y-4">
                      {/* Only show upload card if no document uploaded yet AND AgriLink verification not yet requested */}
                      {!uploadedDocuments.idCard && !agriLinkVerificationRequested && (
                        <div className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-lg p-6 text-center hover:border-primary/50 hover:bg-primary/8 transition-all duration-200">
                          <FileText className="w-12 h-12 text-primary/70 mx-auto mb-4" />
                          <p className="text-sm font-medium mb-2 text-primary">Upload Identity Document</p>
                          <p className="text-xs text-primary/70 mb-4">
                            National ID, Passport, or Driver's License • JPG, PNG, PDF up to 10MB
                          </p>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            id="id-upload"
                            onChange={(e) => handleFileUpload(e, 'idCard')}
                          />
                          <Button variant="outline" size="sm" asChild className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">
                            <label htmlFor="id-upload" className="cursor-pointer">
                              Choose File
                            </label>
                          </Button>
                        </div>
                      )}

                      {/* Upload error message */}
                      {uploadError && (
                        <div className="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          {uploadError}
                        </div>
                      )}

                      {/* Show uploaded ID document */}
                      {uploadedDocuments.idCard && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-primary" />
                              <div>
                                <p className="text-sm font-medium text-primary">
                                  {uploadedDocuments.idCard.name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDocumentPreview(uploadedDocuments.idCard.url, 'ID Card Document')}
                                className="text-green-700 hover:text-green-800 hover:bg-green-100"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              {/* Only show remove button if not submitted for review and AgriLink verification not requested */}
                              {(currentUser.verificationStatus !== 'under-review' && currentUser.verificationStatus !== 'under_review') && !currentUser.verified && !agriLinkVerificationRequested && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleRemoveDocument('idCard')}
                                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                Uploaded
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Back Button - Bottom Left */}
        <div className="flex justify-start">
          <Button variant="ghost" size="sm" onClick={() => setShowDocumentsDetail(false)} className="px-3 py-2 text-primary/70 hover:text-primary hover:bg-primary/10">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Overview
          </Button>
        </div>

        {/* Document Preview Modal */}
        {(showDocumentPreview || isGeneratingPreview) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">{previewDocument?.name || 'Document Preview'}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Clean up blob URL if it exists
                    if (previewDocument && previewDocument.data.startsWith('blob:')) {
                      URL.revokeObjectURL(previewDocument.data);
                    }
                    setShowDocumentPreview(false);
                    setPreviewDocument(null);
                    setIsGeneratingPreview(false);
                  }}
                  className="p-2"
                >
                  ✕
                </Button>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                {isGeneratingPreview ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Generating document preview...</p>
                    </div>
                  </div>
                ) : previewDocument ? (
                  previewDocument.type === 'image' ? (
                    <S3Image
                      src={previewDocument.data}
                      alt={previewDocument.name}
                      className="max-w-full h-auto mx-auto"
                      style={{ maxHeight: '70vh' }}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">Document Preview</p>
                      <iframe
                        src={previewDocument.data}
                        className="w-full h-96 border"
                        title={previewDocument.name}
                      />
                    </div>
                  )
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If showing business detail, render that instead
  if (showBusinessDetail) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Business Details</h1>
            <p className="text-sm text-muted-foreground">
              {currentUser.businessName ? 'Your business information' : 'Complete your business information'}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">
              {isEditingBusiness ? 'Update Business Information' : 'Business Information'}
            </h3>
            
            <div className="space-y-6">
              {/* Business Information Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Business Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={businessForm.businessName}
                      onChange={(e) => setBusinessForm(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Enter your business name"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                        currentUser.businessName && !isEditingBusiness
                          ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed'
                          : 'border-muted bg-background text-foreground'
                      }`}
                      disabled={Boolean(currentUser.businessName) && !isEditingBusiness}
                    />
                    {currentUser.businessName && !isEditingBusiness && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingBusiness(true)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Business License Number *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={businessForm.businessLicenseNumber}
                      onChange={(e) => setBusinessForm(prev => ({ ...prev, businessLicenseNumber: e.target.value }))}
                      placeholder="Enter your business license number"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                        currentUser.businessLicenseNumber && !isEditingBusiness
                          ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed'
                          : 'border-muted bg-background text-foreground'
                      }`}
                      disabled={Boolean(currentUser.businessLicenseNumber) && !isEditingBusiness}
                    />
                    {currentUser.businessLicenseNumber && !isEditingBusiness && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingBusiness(true)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Business Description</label>
                  <textarea
                    value={businessForm.businessDescription}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, businessDescription: e.target.value }))}
                    placeholder="Describe your business activities"
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                      currentUser.businessName && !isEditingBusiness
                        ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed'
                        : 'border-muted bg-background text-foreground'
                    }`}
                    disabled={Boolean(currentUser.businessName) && !isEditingBusiness}
                  />
                </div>

                {currentUser.businessName && !isEditingBusiness && (
                  <div className="bg-muted/50 border border-muted rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">Business information saved to your profile</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {isEditingBusiness || !currentUser.businessName ? (
                    <>
                      <Button 
                        onClick={handleSaveBusinessInfo}
                        disabled={isSavingBusiness || (currentUser as any).verificationStatus === 'under-review' || (currentUser as any).verificationStatus === 'under_review'}
                        className="flex-1"
                      >
                        {isSavingBusiness ? 'Saving...' : 'Save Business Info'}
                      </Button>
                      
                      {isEditingBusiness && (
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setIsEditingBusiness(false);
                            setBusinessForm({
                              businessName: currentUser.businessName || '',
                              businessDescription: currentUser.businessDescription || '',
                              businessLicenseNumber: currentUser.businessLicenseNumber || ''
                            });
                          }}
                          className="px-4"
                        >
                          Cancel
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button 
                      onClick={() => setIsEditingBusiness(true)}
                      variant="outline"
                      className="flex-1"
                    >
                      Edit Business Info
                    </Button>
                  )}
                  

                  

                </div>
              </div>

              {/* Business License Document Section */}
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Business License Document *</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload your business registration or license document to complete your business verification. This is mandatory for business account verification.
                </p>

                {/* Only show upload card if no business document uploaded yet AND AgriLink verification not yet requested */}
                {(() => {
                  console.log('🔍 Business License conditional rendering:', {
                    hasBusinessLicense: !!uploadedDocuments.businessLicense,
                    businessLicenseData: uploadedDocuments.businessLicense,
                    agriLinkVerificationRequested,
                    shouldShowUpload: !uploadedDocuments.businessLicense && !agriLinkVerificationRequested,
                    currentUserVerified: currentUser.verified,
                    currentUserVerificationStatus: currentUser.verificationStatus
                  });
                  return !uploadedDocuments.businessLicense && !agriLinkVerificationRequested;
                })() && (
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm font-medium mb-2">Upload Business Registration</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Business License or Registration • JPG, PNG, PDF up to 10MB
                    </p>
                    <input
                      type="file"  
                      accept="image/*,application/pdf"
                      className="hidden"
                      id="business-detail-upload"
                      onChange={(e) => handleFileUpload(e, 'businessLicense')}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <label htmlFor="business-detail-upload" className="cursor-pointer">
                        Choose File
                      </label>
                    </Button>
                  </div>
                )}

                {/* Show uploaded business document */}
                {uploadedDocuments.businessLicense && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-primary">
                            {uploadedDocuments.businessLicense.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDocumentPreview(uploadedDocuments.businessLicense.url, 'Business License Document')}
                          className="text-green-700 hover:text-green-800 hover:bg-green-100"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {/* Only show remove button if not submitted for review and AgriLink verification not requested */}
                        {(currentUser.verificationStatus !== 'under-review' && currentUser.verificationStatus !== 'under_review') && !currentUser.verified && !agriLinkVerificationRequested && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveDocument('businessLicense')}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          Uploaded
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button - Bottom Left */}
        <div className="flex justify-start">
          <Button variant="ghost" size="sm" onClick={() => setShowBusinessDetail(false)} className="px-3 py-2">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Overview
          </Button>
        </div>

        {/* Document Preview Modal */}
        {(showDocumentPreview || isGeneratingPreview) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">{previewDocument?.name || 'Document Preview'}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Clean up blob URL if it exists
                    if (previewDocument && previewDocument.data.startsWith('blob:')) {
                      URL.revokeObjectURL(previewDocument.data);
                    }
                    setShowDocumentPreview(false);
                    setPreviewDocument(null);
                    setIsGeneratingPreview(false);
                  }}
                  className="p-2"
                >
                  ✕
                </Button>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                {isGeneratingPreview ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Generating document preview...</p>
                    </div>
                  </div>
                ) : previewDocument ? (
                  previewDocument.type === 'image' ? (
                    <S3Image
                      src={previewDocument.data}
                      alt={previewDocument.name}
                      className="max-w-full h-auto mx-auto"
                      style={{ maxHeight: '70vh' }}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">Document Preview</p>
                      <iframe
                        src={previewDocument.data}
                        className="w-full h-96 border"
                        title={previewDocument.name}
                      />
                    </div>
                  )
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main verification overview
  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 pb-20">
      {/* Progress Header - Left Aligned */}
      <div className="space-y-2">
        <div>
          <h1 className="text-xl font-semibold">AgriLink Verification</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete your verification in {isBusinessAccount ? '4' : '3'} steps to build trust and credibility
        </p>
        <div className="w-full bg-muted rounded-full h-2 mt-4">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500" 
            style={{ width: `${getProgress()}%` }}
          ></div>
        </div>
        <p className="text-xs text-muted-foreground">{getProgress()}% Complete</p>
      </div>

      <div className="space-y-4">
        {/* Step 1: Phone Verification */}
        <Card className={
          currentUser.phoneVerified 
            ? "bg-primary/5 border-primary/20" 
            : "bg-primary/5 border-primary/20"
        }>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  currentUser.phoneVerified 
                    ? 'bg-primary' 
                    : 'bg-primary/10 border-2 border-primary/40'
                }`}>
                  {currentUser.phoneVerified ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Phone className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${currentUser.phoneVerified ? 'text-primary' : 'text-primary/90'}`}>
                    Phone Verification
                  </p>
                  <p className={`text-sm truncate ${currentUser.phoneVerified ? 'text-primary/80' : 'text-primary'}`}>
                    {currentUser.phoneVerified ? 'Phone number verified' : 'Verify your phone number'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge 
                  variant="secondary" 
                  className={
                    currentUser.phoneVerified 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-red-100 text-red-700 border-red-200'
                  }
                >
                  {currentUser.phoneVerified ? 'Complete' : 'Required'}
                </Badge>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowPhoneVerification(true)}
                  className={`p-1 h-8 w-8 ${
                    currentUser.phoneVerified 
                      ? 'text-primary hover:bg-primary/10' 
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Documents Upload */}
        <Card className={
          currentUser.verified 
            ? "bg-primary/5 border-primary/20" 
            : getDocumentCompletionStatus.isComplete 
            ? "bg-primary/5 border-primary/20" 
            : "bg-primary/5 border-primary/20"
        }>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  currentUser.verified 
                    ? 'bg-primary' 
                    : getDocumentCompletionStatus.isComplete 
                    ? 'bg-primary' 
                    : 'bg-primary/10 border-2 border-primary/40'
                }`}>
                  {currentUser.verified ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : getDocumentCompletionStatus.isComplete ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    currentUser.verified 
                      ? 'text-primary' 
                      : getDocumentCompletionStatus.isComplete 
                      ? 'text-primary' 
                      : 'text-primary/90'
                  }`}>
                    Identity Documents
                  </p>
                  <p className={`text-sm truncate ${
                    currentUser.verified 
                      ? 'text-primary/80' 
                      : getDocumentCompletionStatus.isComplete
                      ? 'text-primary/80' 
                      : 'text-primary'
                  }`}>
                    {currentUser.verified 
                      ? 'Documents verified' 
                      : getDocumentCompletionStatus.isComplete
                      ? 'Documents uploaded' 
                      : 'Upload identity documents'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge 
                  variant="secondary" 
                  className={
                    currentUser.verified 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : getDocumentCompletionStatus.isComplete
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-red-100 text-red-700 border-red-200'
                  }
                >
                  {currentUser.verified 
                    ? 'Complete' 
                    : getDocumentCompletionStatus.isComplete
                    ? 'Complete' 
                    : 'Required'
                  }
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowDocumentsDetail(true)}
                  className={`p-1 h-8 w-8 ${
                    currentUser.verified 
                      ? 'text-primary hover:bg-primary/10' 
                      : getDocumentCompletionStatus.isComplete 
                      ? 'text-primary hover:bg-primary/10' 
                      : 'text-primary hover:bg-primary/10'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Details - Only show for business accounts */}
        {isBusinessAccount && (() => {
          // Check business completion status more comprehensively
          const hasBusinessInfo = Boolean(currentUser.businessName); // businessDescription is optional
          const hasBusinessLicense = agriLinkVerificationRequested
            ? (Boolean(currentUser.verificationDocuments?.businessLicense) && 
               currentUser.verificationDocuments?.businessLicense?.status && 
               currentUser.verificationDocuments?.businessLicense?.status !== 'pending') || 
              Boolean(uploadedDocuments.businessLicense) // Fallback to local state if database not updated yet
            : Boolean(uploadedDocuments.businessLicense); // Only check local state when not submitted
          
          // Business details completion logic similar to document completion
          let isBusinessComplete = false;
          
          if (currentUser.verified) {
            // User is verified - business details are complete
            isBusinessComplete = true;
          } else if (currentUser.verificationStatus === 'rejected') {
            // User was rejected - check if they have re-uploaded documents for resubmission
            isBusinessComplete = hasBusinessInfo && hasBusinessLicense;
          } else if (agriLinkVerificationRequested) {
            // Verification submitted but not yet approved - business details are complete for submission
            isBusinessComplete = hasBusinessInfo && hasBusinessLicense;
          } else {
            // Not submitted yet - check if business details are complete
            isBusinessComplete = hasBusinessInfo && hasBusinessLicense;
          }
          
          return (
            <Card className={isBusinessComplete ? "bg-primary/5 border-primary/20" : "bg-primary/5 border-primary/20"}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isBusinessComplete 
                        ? 'bg-primary' 
                        : 'bg-primary/10 border-2 border-primary/40'
                    }`}>
                      {isBusinessComplete ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Building className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isBusinessComplete ? 'text-primary' : 'text-primary/90'}`}>
                        Business Details
                      </p>
                      <p className={`text-sm truncate ${isBusinessComplete ? 'text-primary/80' : 'text-primary'}`}>
                        {isBusinessComplete
                          ? 'Business information & license completed' 
                          : hasBusinessInfo 
                          ? 'Business license needed'
                          : 'Complete business information'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge 
                      variant="secondary" 
                      className={isBusinessComplete ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}
                    >
                      {isBusinessComplete ? 'Complete' : 'Required'}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowBusinessDetail(true)}
                      className={`p-1 h-8 w-8 ${
                        isBusinessComplete 
                          ? 'text-primary hover:bg-primary/10' 
                          : 'text-primary hover:bg-primary/10'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Step 3: AgriLink Verification */}
        {currentUser.verified ? (
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-emerald-700 truncate">AgriLink Verification</p>
                    <p className="text-sm text-emerald-600 truncate">Your account is fully verified!</p>
                    {currentUser.agriLinkVerificationDate && (
                      <p className="text-xs text-emerald-600 mt-1 truncate">
                        on {new Date(currentUser.agriLinkVerificationDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    Verified
                  </Badge>
                  <div className="w-8 h-8 flex-shrink-0"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : currentUser.verificationStatus === 'rejected' ? (
          <>
            {/* Normal AgriLink Verification Card for Rejected Users */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-primary/90 truncate">AgriLink Verification</p>
                      <p className="text-sm text-primary truncate">Complete all steps to get verified</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Button logic for Request Verification */}
                    {(() => {
                      // Check what's missing for resubmission
                      const missingSteps: string[] = [];
                      let tooltipText = '';
                      
                      if (!currentUser.phoneVerified) missingSteps.push('phone verification');
                      if (!uploadedDocuments.idCard) missingSteps.push('ID documents');
                      
                      // Check location
                      if (!currentUser.location || currentUser.location.trim() === '') {
                        missingSteps.push('location');
                      }
                      
                      // Check business requirements for business accounts
                      if (isBusinessAccount) {
                        const hasBusinessInfo = Boolean(currentUser.businessName && currentUser.businessDescription && currentUser.businessLicenseNumber);
                        const hasBusinessLicense = Boolean(uploadedDocuments.businessLicense);
                        
                        if (!hasBusinessInfo) missingSteps.push('business information');
                        if (!hasBusinessLicense) missingSteps.push('business license');
                      }
                      
                      // For rejected users, they need to re-upload documents
                      if (missingSteps.length > 0) {
                        tooltipText = `Complete ${missingSteps.join(', ')} first`;
                      } else {
                        tooltipText = 'Ready to resubmit verification request';
                      }
                      
                      const isDisabled = missingSteps.length > 0 || isSubmittingVerification || verificationSubmitted;
                      
                      return (
                        <Button
                          size="sm"
                          disabled={isDisabled}
                          variant="outline"
                          className={`text-xs px-3 py-2 ${
                            isDisabled 
                              ? 'opacity-60 cursor-not-allowed' 
                              : 'bg-primary text-white hover:bg-primary/90 border-primary'
                          }`}
                          title={isSubmittingVerification || verificationSubmitted ? 'Submitting verification request...' : tooltipText}
                          onClick={!isDisabled ? handleRequestAgriLinkVerification : undefined}
                        >
                          {isSubmittingVerification || verificationSubmitted ? (
                            'Submitting...'
                          ) : (
                            'Request Verification'
                          )}
                        </Button>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Spacing and Separator for Rejected Users */}
            <div className="mt-8 mb-6">
              {/* Section separator line */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-gray-500">Previous Submission History</span>
                </div>
              </div>
            </div>

            {/* Previous Rejection History Card for Rejected Users */}
            <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-orange-800 truncate">Previous Rejection History</p>
                      <p className="text-sm text-orange-700 truncate">View rejection feedback and submitted documents</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      onClick={() => setShowRejectionReview(!showRejectionReview)}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                      size="sm"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {showRejectionReview ? 'Hide' : 'View Rejection Details'}
                    </Button>
                  </div>
                </div>

                {/* Expandable Rejection Review Section */}
                {showRejectionReview && (
                  <div className="space-y-4 pt-4 border-t border-orange-200">
                    {/* Admin Review Comments */}
                    {rejectionDetails?.review_notes && (
                      <div className="bg-orange-100 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-medium text-orange-800 mb-2">Reviewer Feedback:</h4>
                        <p className="text-orange-700">{rejectionDetails.review_notes}</p>
                      </div>
                    )}
                    
                    {/* Review Date */}
                    {rejectionDetails?.reviewed_at && (
                      <p className="text-sm text-orange-600">
                        Reviewed on: {new Date(rejectionDetails.reviewed_at).toLocaleDateString()}
                      </p>
                    )}
                    
                    {/* Previously Submitted Documents */}
                    {(currentUser as any).rejectedDocuments && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-orange-800">Previously Submitted Documents:</h4>
                        <div className="space-y-2">
                          {(currentUser as any).rejectedDocuments.idCard && (currentUser as any).rejectedDocuments.idCard.data && (
                            <div className="flex items-center gap-3 p-3 bg-orange-100 rounded border border-orange-200">
                              <FileText className="w-4 h-4 text-orange-600" />
                              <span className="text-sm text-orange-800 flex-1">ID Card Document</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDocumentPreview(
                                  (currentUser as any).rejectedDocuments.idCard.data,
                                  'ID Card Document'
                                )}
                                className="text-orange-700 hover:text-orange-800"
                              >
                                View
                              </Button>
                            </div>
                          )}
                          
                          {(currentUser as any).rejectedDocuments.businessLicense && (currentUser as any).rejectedDocuments.businessLicense.data && (
                            <div className="flex items-center gap-3 p-3 bg-orange-100 rounded border border-orange-200">
                              <FileText className="w-4 h-4 text-orange-600" />
                              <span className="text-sm text-orange-800 flex-1">Business License</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDocumentPreview(
                                  (currentUser as any).rejectedDocuments.businessLicense.data,
                                  'Business License'
                                )}
                                className="text-orange-700 hover:text-orange-800"
                              >
                                View
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Close Button */}
                    <div className="pt-4 border-t border-orange-200">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setShowRejectionReview(false)}
                          className="border-orange-300 text-orange-700 hover:bg-orange-100"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          </>
        ) : agriLinkVerificationRequested && currentUser.verificationStatus !== 'rejected' ? (
          <>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-blue-800 truncate">AgriLink Verification</p>
                      <p className="text-sm text-blue-700 truncate">Verification submitted for review</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button 
                      size="sm"
                      disabled={true}
                      variant="secondary"
                      className="text-xs px-3 py-2 bg-blue-100 text-blue-700 border-blue-200"
                    >
                      Verification Requested
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Success Message for Under Review Status */}
            <p className="text-sm text-blue-700 mb-4">
              AgriLink verification requested successfully! We will review your documents within 1-2 business days and notify you of the outcome.
            </p>
            
          </>
        ) : (() => {
          // Check if user is in resubmit state (no documents, phone-verified status)
          const hasNoDocuments = !uploadedDocuments.idCard && 
                               (!isBusinessAccount || !uploadedDocuments.businessLicense) &&
                               !currentUser.verificationDocuments;
          
          const isResubmitState = hasNoDocuments && (currentUser.verificationStatus as any) === 'phone-verified';
          
          return (
            <Card className={isResubmitState ? "bg-orange-50 border-orange-200" : "bg-primary/5 border-primary/20"}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isResubmitState ? 'bg-orange-600' : 'bg-primary/10 border-2 border-primary/40'
                    }`}>
                      <Shield className={`w-5 h-5 ${isResubmitState ? 'text-white' : 'text-primary'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isResubmitState ? 'text-orange-800' : 'text-primary/90'}`}>
                        AgriLink Verification
                      </p>
                      <p className={`text-sm truncate ${isResubmitState ? 'text-orange-700' : 'text-primary'}`}>
                        {isResubmitState ? 'Please re-upload documents to resubmit' : 'Complete all steps to get verified'}
                      </p>
                    </div>
                  </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Always show the Request Verification button for better UX visibility */}
                  {(() => {
                    // Check business completion properly
                    const hasBusinessInfo = !isBusinessAccount || Boolean(currentUser.businessName); // businessDescription is optional
                    const hasBusinessLicense = !isBusinessAccount || Boolean(uploadedDocuments.businessLicense) || 
                                             (Boolean(currentUser.verificationDocuments?.businessLicense) && 
                                              currentUser.verificationDocuments?.businessLicense?.status !== 'pending');
                    
                    // If user is verified, business details should be considered complete
                    const isBusinessComplete = currentUser.verified || (!isBusinessAccount || (hasBusinessInfo && hasBusinessLicense));
                    
                    const canRequest = currentUser.phoneVerified && 
                                      uploadedDocuments.idCard && 
                                      hasBusinessInfo && 
                                      hasBusinessLicense && 
                                      !agriLinkVerificationRequested;
                    
                    if (canRequest) {
                      return (
                    <Button 
                      size="sm"
                      onClick={handleRequestAgriLinkVerification}
                      disabled={isSubmittingVerification || verificationSubmitted}
                      className="text-xs px-3 py-2"
                      title={isSubmittingVerification || verificationSubmitted ? 'Submitting verification request...' : 'Submit verification request'}
                    >
                          {isSubmittingVerification || verificationSubmitted ? (
                            'Submitting...'
                          ) : (
                            'Request Verification'
                          )}
                        </Button>
                      );
                    } else {
                      // Show disabled button with helpful tooltip
                      const missingSteps: string[] = [];
                      let tooltipText = '';
                      
                      if (!currentUser.phoneVerified) missingSteps.push('phone verification');
                      if (!uploadedDocuments.idCard) missingSteps.push('ID documents');
                      
                      // Check location
                      if (!currentUser.location || currentUser.location.trim() === '') {
                        missingSteps.push('location');
                      }
                      
                      // Check business requirements for business accounts
                      if (isBusinessAccount) {
                        const hasBusinessInfo = Boolean(currentUser.businessName && currentUser.businessDescription && currentUser.businessLicenseNumber);
                        const hasBusinessLicense = Boolean(uploadedDocuments.businessLicense);
                        
                        if (!hasBusinessInfo) missingSteps.push('business information');
                        if (!hasBusinessLicense) missingSteps.push('business license');
                      }
                      
                      // Special case: After resubmit, user needs to re-upload documents
                      if (isResubmitState) {
                        tooltipText = 'Please re-upload documents first to resubmit the verification request';
                      } else if (missingSteps.length > 0) {
                        tooltipText = `Complete ${missingSteps.join(', ')} first`;
                      } else {
                        tooltipText = 'Complete required steps above';
                      }
                      
                      return (
                        <Button
                          size="sm"
                          disabled={true}
                          variant="outline"
                          className={`text-xs px-3 py-2 opacity-60 cursor-not-allowed ${
                            isResubmitState ? 'border-orange-300' : ''
                          }`}
                          title={tooltipText}
                        >
                          Request Verification
                        </Button>
                      );
                    }
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })()}

        {/* Error message display - at bottom of verification cards */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}



        {/* Success Message for Verified Users */}
        {currentUser.verified && (
          <p className="text-sm text-emerald-600">
            Congratulations! Your AgriLink verification is complete. You now have enhanced buyer trust and credibility.
          </p>
        )}






        {/* Back to Profile Button */}
        <div className="mt-8 pt-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack} 
            className="px-3 py-2"
          >
            <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Profile
          </Button>
        </div>

      </div>

      {/* Document Preview Modal - Top Level */}
      {(showDocumentPreview || isGeneratingPreview) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{previewDocument?.name || 'Document Preview'}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Clean up blob URL if it exists
                  if (previewDocument && previewDocument.data.startsWith('blob:')) {
                    URL.revokeObjectURL(previewDocument.data);
                  }
                  setShowDocumentPreview(false);
                  setPreviewDocument(null);
                  setIsGeneratingPreview(false);
                }}
                className="p-2"
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              {isGeneratingPreview ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Generating document preview...</p>
                  </div>
                </div>
              ) : previewDocument ? (
                <div className="w-full h-full flex items-center justify-center">
                  {previewDocument.type === 'image' ? (
                    <img
                      src={previewDocument.data}
                      alt={previewDocument.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        console.error('Image load error:', e);
                        setUploadError('Failed to load document image');
                      }}
                    />
                  ) : (
                    <iframe
                      src={previewDocument.data}
                      className="w-full h-full border-0"
                      title={previewDocument.name}
                      onError={(e) => {
                        console.error('Document load error:', e);
                        setUploadError('Failed to load document');
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No document to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}