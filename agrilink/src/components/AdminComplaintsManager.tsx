"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  AlertTriangle, 
  FileText, 
  Clock, 
  ArrowLeft,
  RefreshCw,
  Eye,
  User,
  Package
} from 'lucide-react';

interface Complaint {
  id: string;
  offerId: string;
  complaintType: string;
  reason: string;
  status: string;
  createdAt: string;
  offer: {
    id: string;
    status: string;
    cancellationReason?: string;
  };
  product: {
    id: string;
    name: string;
  };
  buyer: {
    id: string;
    name: string;
    email: string;
  };
  seller: {
    id: string;
    name: string;
    email: string;
  };
}

interface ComplaintStatistics {
  submitted: number;
  total: number;
}

interface AdminComplaintsManagerProps {
  currentAdmin: any;
}

export function AdminComplaintsManager({ currentAdmin }: AdminComplaintsManagerProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statistics, setStatistics] = useState<ComplaintStatistics>({
    submitted: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/complaints', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setComplaints(data.complaints || []);
        setStatistics(data.statistics || statistics);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const getStatusBadge = (status: string) => {
    const config = {
      submitted: { label: 'Submitted', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    };
    const statusConfig = config[status as keyof typeof config] || config.submitted;
    return (
      <Badge variant="outline" className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    if (type === 'unfair_cancellation') return 'Unfair Cancellation';
    if (type === 'delivery_issue') return 'Order Issue';
    return 'Other';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/admin'}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Complaint Management</h1>
          <p className="text-gray-600 mt-1">Review complaints filed by buyers about cancelled orders</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This is an MVP-only complaint storage system. Complaints are recorded and stored for future review. 
              Full complaint resolution system (admin review, status tracking, resolution actions) is in post-MVP development.
            </p>
          </div>
        </div>
        <Button onClick={fetchComplaints} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.submitted}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading complaints...</p>
        </div>
      ) : complaints.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No complaints found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <Card key={complaint.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <h3 className="text-lg font-semibold">
                        {getTypeLabel(complaint.complaintType)} Complaint
                      </h3>
                      {getStatusBadge(complaint.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Product</p>
                        <p className="font-medium">{complaint.product.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Offer Status</p>
                        <p className="font-medium">{complaint.offer.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Complained By (Buyer)</p>
                        <p className="font-medium">{complaint.buyer.name}</p>
                        <p className="text-xs text-gray-500">{complaint.buyer.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Reported User (Seller)</p>
                        <p className="font-medium">{complaint.seller.name}</p>
                        <p className="text-xs text-gray-500">{complaint.seller.email}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">Complaint Reason</p>
                      <p className="bg-gray-50 p-3 rounded-md">{complaint.reason}</p>
                    </div>

                    {complaint.offer.cancellationReason && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">Seller's Cancellation Reason</p>
                        <p className="bg-gray-50 p-3 rounded-md">{complaint.offer.cancellationReason}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Filed on {new Date(complaint.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => {
                        setSelectedComplaint(complaint);
                        window.open(`/offers/${complaint.offerId}`, '_blank');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Offer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

