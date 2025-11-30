"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { S3Image } from './S3Image';
import { getDocumentUrl } from '@/lib/cloudfront-utils';
import { Separator } from './ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building2, 
  MapPin, 
  FileText, 
  Eye,
  Shield,
  AlertTriangle,
  Download,
  ExternalLink,
  RefreshCw
} from "lucide-react";

interface VerificationRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userType: 'farmer' | 'trader' | 'buyer';
  accountType: 'individual' | 'business';
  verificationStatus: 'not_started' | 'in_progress' | 'under_review' | 'verified' | 'rejected';
  verificationSubmitted: boolean;
  verificationDocuments?: {
    idCard?: {
      status?: 'pending' | 'uploaded' | 'verified' | 'rejected';
      name?: string;
      uploadedAt?: string;
      data?: string;
    };
    businessLicense?: {
      status?: 'pending' | 'uploaded' | 'verified' | 'rejected';
      name?: string;
      uploadedAt?: string;
      data?: string;
    };
    selfieWithId?: string;
  };
  businessInfo?: {
    businessName?: string;
    businessDescription?: string;
    location?: string;
    region?: string;
  };
  phoneVerified: boolean;
  submittedAt: string;
  type: string;
  status: string;
  documents: any;
  businessType: string;
  business_name?: string;
  business_description?: string;
  business_license_number?: string;
}

interface AdminVerificationPanelProps {
  currentAdmin: any;
  onBack: () => void;
}

export function AdminVerificationPanel({ currentAdmin, onBack }: AdminVerificationPanelProps) {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{name: string, data: string, type: string} | null>(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Helper function to create a shorter, more user-friendly display name
  const createDisplayName = (filename: string, maxLength: number = 25): string => {
    if (!filename) return 'Unknown file';
    
    // Remove common prefixes that make filenames long
    let cleanName = filename
      .replace(/^Gemini_Generated_Image_/i, '')
      .replace(/^generated_image_/i, '')
      .replace(/^image_/i, '')
      .replace(/^document_/i, '')
      .replace(/^file_/i, '');
    
    // If still too long, truncate intelligently
    if (cleanName.length > maxLength) {
      const extension = cleanName.split('.').pop();
      const nameWithoutExt = cleanName.substring(0, cleanName.lastIndexOf('.'));
      const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4); // -4 for "..."
      return `${truncatedName}...${extension ? '.' + extension : ''}`;
    }
    
    return cleanName;
  };

  // Helper function to handle document viewing (S3 keys or base64 data)
  const handleDocumentView = async (documentData: string, documentName: string) => {
    try {
      // Check if it's an S3 key (doesn't start with 'data:' or 'http')
      if (!documentData.startsWith('data:') && !documentData.startsWith('http')) {
        // S3 key format - use server-side proxy to avoid CORS issues
        console.log('🔍 Using server-side proxy for viewing S3 key:', documentData);
        
        // Generate a server-side URL for viewing
        const viewUrl = `/api/s3/view?key=${encodeURIComponent(documentData)}`;
        
        // Determine file type from S3 key
        const fileExtension = documentData.split('.').pop()?.toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
        
        setPreviewDocument({
          name: documentName,
          data: viewUrl,
          type: isImage ? 'image' : 'document'
        });
        setShowDocumentPreview(true);
        return;
      }
      
      // Handle base64 data or direct URL
      const fileExtension = documentName.split('.').pop()?.toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
      
      setPreviewDocument({
        name: documentName,
        data: documentData,
        type: isImage ? 'image' : 'document'
      });
      setShowDocumentPreview(true);
    } catch (error) {
      console.error('View failed:', error);
      alert('Failed to view document');
    }
  };

  // Helper function to handle document downloads (S3 keys or base64 data)
  const handleDocumentDownload = async (documentData: string, fileName: string) => {
    try {
      console.log('📥 Starting download for:', fileName, 'Data type:', typeof documentData);
      
      // Check if it's an S3 key (doesn't start with 'data:' or 'http')
      if (!documentData.startsWith('data:') && !documentData.startsWith('http')) {
        console.log('🔑 Using server-side download for S3 key:', documentData);
        
        // Use server-side download proxy to avoid CORS issues
        const response = await fetch('/api/s3/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            s3Key: documentData,
            filename: fileName 
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Server download failed: ${response.status} ${response.statusText}`);
        }
        
        console.log('📦 Creating blob from server response');
        const blob = await response.blob();
        console.log('✅ Blob created, size:', blob.size, 'type:', blob.type);
        
        // Create blob URL and force download
        const blobUrl = URL.createObjectURL(blob);
        console.log('🔗 Created blob URL:', blobUrl);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        console.log('⬇️ Triggering download');
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        URL.revokeObjectURL(blobUrl);
        console.log('✅ Download completed successfully');
        
      } else {
        // Handle direct URLs or base64 data
        console.log('📡 Using direct download for URL/data');
        
        let downloadUrl = documentData;
        
        // If it's base64 data, convert to blob
        if (documentData.startsWith('data:')) {
          const response = await fetch(documentData);
          const blob = await response.blob();
          downloadUrl = URL.createObjectURL(blob);
        }
        
        // Create download link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        console.log('⬇️ Triggering direct download');
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL if we created one
        if (documentData.startsWith('data:')) {
          URL.revokeObjectURL(downloadUrl);
        }
        
        console.log('✅ Direct download completed successfully');
      }
      
    } catch (error) {
      console.error('❌ Download failed:', error);
      alert(`Failed to download document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Load verification requests from Neon database
  const loadRequests = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      const url = forceRefresh 
        ? '/api/admin/verification-requests?refresh=true'
        : '/api/admin/verification-requests';
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch verification requests');
      }

      const data = await response.json();
      const requests = data.requests || [];

      // Transform database data to component format
      const transformedRequests: VerificationRequest[] = requests.map((req: any) => ({
        id: req.id,
        userId: req.userId,
        userEmail: req.userEmail,
        userName: req.userName,
        userType: req.userType,
        accountType: req.accountType,
        verificationStatus: req.status === 'under_review' ? 'under_review' : 
                           req.status === 'approved' ? 'verified' : 
                           req.status === 'rejected' ? 'rejected' : 'under_review',
        verificationSubmitted: true,
        verificationDocuments: req.user_verification_documents || req.verification_request_documents || {},
        businessInfo: {
          businessName: req.businessName || req.user_business_name,
          businessDescription: req.businessDescription || req.user_business_description,
          location: req.location,
          region: req.businessInfo?.region,
        },
        phoneVerified: req.user_phone_verified || req.verification_phone_verified || false,
        submittedAt: req.submittedAt || req.submitted_at,
        type: req.accountType === 'business' ? 'Business Account' : 'Individual Account',
        status: req.status,
        documents: req.user_verification_documents || req.verification_request_documents || {},
        businessType: req.accountType,
        business_name: req.businessName || req.user_business_name,
        business_description: req.businessDescription || req.user_business_description,
        business_license_number: req.businessLicenseNumber || req.user_business_license_number,
      }));

      setRequests(transformedRequests);
      setLastRefresh(new Date());
      
      // Log performance info
      if (data.cached) {
        console.log('📦 Loaded from cache');
      } else {
        console.log('💾 Loaded from database');
      }
    } catch (error) {
      console.error('❌ Failed to load verification requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Force refresh function
  const handleRefresh = () => {
    loadRequests(true);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (requestId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/verification-requests/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          requestId,
          reviewNotes: reviewNotes || 'Approved by admin',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve request');
      }

      const responseData = await response.json();
      console.log('✅ Admin approval response:', responseData);

      // Dispatch event to notify user of verification status change
      if (responseData.userId) {
        console.log('🔄 Dispatching verificationStatusChanged event for user:', responseData.userId);
        window.dispatchEvent(new CustomEvent('verificationStatusChanged', {
          detail: { 
            userId: responseData.userId,
            status: 'verified',
            message: 'Your verification has been approved!'
          }
        }));
      }

      // Close dialog and refresh data
      setIsDialogOpen(false);
      setReviewNotes('');
      setSelectedRequest(null);
      
      // Refresh the requests list to show updated status
      console.log('🔄 Refreshing admin panel data after approval...');
      await loadRequests(true);
      
      alert('Verification request approved successfully!');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (requestId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/verification-requests/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          requestId,
          reviewNotes: reviewNotes || 'Rejected by admin',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to reject request`);
      }

      const responseData = await response.json();
      console.log('❌ Admin rejection response:', responseData);

      // Dispatch event to notify user of verification status change
      if (responseData.userId) {
        console.log('🔄 Dispatching verificationStatusChanged event for user:', responseData.userId);
        window.dispatchEvent(new CustomEvent('verificationStatusChanged', {
          detail: { 
            userId: responseData.userId,
            status: 'rejected',
            message: 'Your verification request has been rejected. Please check the feedback and resubmit if needed.'
          }
        }));
      }

      // Close dialog and refresh data
      setSelectedRequest(null);
      setReviewNotes('');
      
      // Refresh the requests list to show updated status
      console.log('🔄 Refreshing admin panel data after rejection...');
      await loadRequests(true);
      
      alert('Verification request rejected successfully');
    } catch (error) {
      console.error('Error rejecting request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject request';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'under_review':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
      case 'approved':
      case 'verified':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getAccountTypeIcon = (accountType: string) => {
    return accountType === 'business' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  const pendingRequests = requests.filter(r => r.verificationStatus === 'under_review');
  const processedRequests = requests.filter(r => r.verificationStatus !== 'under_review');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Verification Requests</h2>
            <p className="text-gray-600">Review and manage user verification requests</p>
          </div>
          <Button variant="outline" onClick={onBack}>
            ← Back to Dashboard
          </Button>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2">Loading verification requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Verification Requests</h2>
          <p className="text-gray-600">
            Review and manage user verification requests
            {lastRefresh && (
              <span className="text-sm text-gray-500 ml-2">
                • Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={onBack}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{requests.filter(r => r.verificationStatus === 'verified').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{requests.filter(r => r.verificationStatus === 'rejected').length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Review ({pendingRequests.length})
            </CardTitle>
            <CardDescription>
              Verification requests awaiting admin review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getAccountTypeIcon(request.accountType)}
                      <div>
                        <h3 className="font-medium text-gray-900">{request.userName}</h3>
                        <p className="text-sm text-gray-600">{request.userEmail}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(request.verificationStatus)}
                          <span className="text-xs text-gray-500">
                            {request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : 'Date not available'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Dialog 
                      open={isDialogOpen && selectedRequest?.id === request.id} 
                      onOpenChange={(open) => {
                      if (!open) {
                        setIsDialogOpen(false);
                        setSelectedRequest(null);
                        setReviewNotes('');
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent 
          className="max-w-[45vw] w-[45vw] max-h-[90vh] overflow-y-auto overflow-x-hidden !max-w-[45vw] !w-[45vw]"
          style={{ maxWidth: '45vw', width: '45vw' }}
        >
                        <DialogHeader>
                          <DialogTitle>Review Verification Request</DialogTitle>
                          <DialogDescription>
                            Review documents and information for {request.userName}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* User Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">User Information</Label>
                              <div className="mt-2 space-y-2">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm">{request.userName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">Email:</span>
                                  <span className="text-sm">{request.userEmail}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">Type:</span>
                                  <span className="text-sm">{request.type}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">Phone Verified:</span>
                                  <span className="text-sm">{request.phoneVerified ? 'Yes' : 'No'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Business Information */}
                            {(request.businessInfo || request.business_name) && (
                              <div>
                                <Label className="text-sm font-medium">Business Information</Label>
                                <div className="mt-2 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">{request.business_name || request.businessInfo?.businessName || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">{request.businessInfo?.location || 'N/A'}</span>
                                  </div>
                                  {request.business_license_number && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-500">License #:</span>
                                      <span className="text-sm">{request.business_license_number}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <Separator />

                          {/* Business Description Card */}
                          {(request.business_description || request.businessInfo?.businessDescription) && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Business Description</h4>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {request.business_description || request.businessInfo?.businessDescription}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Documents */}
                          <div>
                            <Label className="text-sm font-medium">Uploaded Documents</Label>
                            <div className="mt-2 space-y-3">
                              {request.verificationDocuments?.idCard && (
                                <div className="border rounded-lg p-3 min-w-0 max-w-full overflow-hidden">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                      <span className="text-sm font-medium flex-shrink-0">ID Card</span>
                                      <Badge variant="outline" className="text-xs flex-shrink-0">
                                        {request.verificationDocuments.idCard.status}
                                      </Badge>
                                      <div className="text-xs text-gray-500 truncate flex-1 min-w-0 ml-2" title={request.verificationDocuments.idCard.name}>
                                        {createDisplayName(request.verificationDocuments.idCard.name, 20)}
                                      </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                      {request.verificationDocuments.idCard.data ? (
                                        <div className="flex gap-1">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDocumentView(
                                              request.verificationDocuments?.idCard?.data || '',
                                              request.verificationDocuments?.idCard?.name || 'id-card'
                                            )}
                                            className="text-xs px-2 py-1 h-6"
                                            title="View document"
                                          >
                                            <Eye className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDocumentDownload(
                                              request.verificationDocuments?.idCard?.data || '',
                                              request.verificationDocuments?.idCard?.name || 'id-card'
                                            )}
                                            className="text-xs px-2 py-1 h-6"
                                            title="Download document"
                                          >
                                            <Download className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="text-xs text-gray-400 text-[10px]">
                                          No file
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Uploaded: {request.verificationDocuments.idCard.uploadedAt ? 
                                      new Date(request.verificationDocuments.idCard.uploadedAt).toLocaleString() : 'Unknown'}
                                  </p>
                                </div>
                              )}

                              {request.verificationDocuments?.businessLicense && (
                                <div className="border rounded-lg p-3 min-w-0 max-w-full overflow-hidden">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                                      <span className="text-sm font-medium flex-shrink-0">Business License</span>
                                      <Badge variant="outline" className="text-xs flex-shrink-0">
                                        {request.verificationDocuments.businessLicense.status}
                                      </Badge>
                                      <div className="text-xs text-gray-500 truncate flex-1 min-w-0 ml-2" title={request.verificationDocuments.businessLicense.name}>
                                        {createDisplayName(request.verificationDocuments.businessLicense.name, 20)}
                                      </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                      {request.verificationDocuments.businessLicense.data ? (
                                        <div className="flex gap-1">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDocumentView(
                                              request.verificationDocuments?.businessLicense?.data || '',
                                              request.verificationDocuments?.businessLicense?.name || 'business-license'
                                            )}
                                            className="text-xs px-2 py-1 h-6"
                                            title="View document"
                                          >
                                            <Eye className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDocumentDownload(
                                              request.verificationDocuments?.businessLicense?.data || '',
                                              request.verificationDocuments?.businessLicense?.name || 'business-license'
                                            )}
                                            className="text-xs px-2 py-1 h-6"
                                            title="Download document"
                                          >
                                            <Download className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="text-xs text-gray-400 text-[10px]">
                                          No file
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Uploaded: {request.verificationDocuments.businessLicense.uploadedAt ? 
                                      new Date(request.verificationDocuments.businessLicense.uploadedAt).toLocaleString() : 'Unknown'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <Separator />

                          {/* Admin Actions */}
                          <div>
                            <Label htmlFor="admin-notes" className="text-sm font-medium">Admin Notes (Optional)</Label>
                            <Textarea
                              id="admin-notes"
                              placeholder="Add notes about this verification request..."
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              className="mt-2"
                            />
                          </div>

                          <div className="flex justify-end gap-3">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsDialogOpen(false);
                                setSelectedRequest(null);
                                setReviewNotes('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleReject(request.id)}
                              disabled={isProcessing}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              onClick={() => handleApprove(request.id)}
                              disabled={isProcessing}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Processed Requests ({processedRequests.length})
            </CardTitle>
            <CardDescription>
              Previously reviewed verification requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processedRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getAccountTypeIcon(request.accountType)}
                      <div>
                        <h3 className="font-medium text-gray-900">{request.userName}</h3>
                        <p className="text-sm text-gray-600">{request.userEmail}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(request.verificationStatus)}
                          <span className="text-xs text-gray-500">
                            {request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : 'Date not available'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {requests.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Verification Requests</h3>
            <p className="text-gray-600">No verification requests have been submitted yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Document Preview Modal */}
      {showDocumentPreview && previewDocument && (
        <Dialog open={showDocumentPreview} onOpenChange={setShowDocumentPreview}>
          <DialogContent 
          className="max-w-[45vw] w-[45vw] max-h-[90vh] overflow-y-auto overflow-x-hidden !max-w-[45vw] !w-[45vw]"
          style={{ maxWidth: '45vw', width: '45vw' }}
        >
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
              <DialogDescription>
                {previewDocument.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              {previewDocument.type === 'image' ? (
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
              )}
            </div>
            
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDocumentPreview(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
