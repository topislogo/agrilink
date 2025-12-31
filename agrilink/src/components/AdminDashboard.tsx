import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Clock, 
  Eye, 
  Shield, 
  AlertTriangle, 
  Users, 
  Flag, 
  Settings, 
  Package, 
  DollarSign,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  pendingVerifications: number;
  totalProducts: number;
  activeTransactions: number;
  platformRevenue: number;
  pendingDisputes?: number;
}

interface RecentUser {
  id: string;
  name: string;
  user_type: string;
  created_at: string;
  email: string;
}

interface AdminDashboardProps {
  currentAdmin: any;
  onBack?: () => void;
  onNavigateToVerification?: () => void;
  onUpdateUser?: (updates: any) => Promise<void>;
}

export function AdminDashboard({ currentAdmin, onBack, onNavigateToVerification, onUpdateUser }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingVerifications: 0,
    totalProducts: 0,
    activeTransactions: 0,
    platformRevenue: 0,
  });

  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);


  const [recentTransactions] = useState([
    { id: '1', amount: 150, buyer: 'John Doe', seller: 'Jane Smith', date: '2 hours ago' },
    { id: '2', amount: 300, buyer: 'Mike Johnson', seller: 'John Doe', date: '4 hours ago' },
  ]);

  const router = useRouter();

  // Function to fetch admin data from Neon database
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch all admin stats from the main stats API
      const statsResponse = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Fetch verification requests for pending count
      const verificationResponse = await fetch('/api/admin/verification-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Fetch complaints for count
      const complaintsResponse = await fetch('/api/admin/complaints', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (statsResponse.ok && verificationResponse.ok) {
        const statsData = await statsResponse.json();
        const verificationData = await verificationResponse.json();
        const complaintsData = complaintsResponse.ok ? await complaintsResponse.json() : { statistics: { submitted: 0, total: 0 } };

        const pendingVerifications = verificationData.requests?.filter(
          (req: any) => req.status === 'under_review' || req.verificationStatus === 'under_review'
        ).length || 0;

        const pendingComplaints = complaintsData.statistics?.submitted || 0;

        // Fetch recent users from users API
        const recentUsersResponse = await fetch('/api/users/recent', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        let recentUsersData = [];
        if (recentUsersResponse.ok) {
          recentUsersData = await recentUsersResponse.json();
        }

        // Update stats
        setStats({
          totalUsers: statsData.totalUsers || 0,
          pendingVerifications,
          totalProducts: statsData.totalProducts || 0,
          activeTransactions: 156, // Keep mock data for now
          platformRevenue: 45670, // Keep mock data for now
        });

        // Update recent users
        setRecentUsers(recentUsersData || []);

      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch real data from Neon database
  useEffect(() => {
    fetchAdminData();
  }, []);


  const handleProductAction = (productId: string, action: string) => {
    console.log(`${action} product ${productId}`);
  };

  // Helper function to format relative time
  const getRelativeTime = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Unknown';
      }
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 0) return 'just now'; // Future date
      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {currentAdmin?.name || 'Admin'}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchAdminData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                ← Back to App
              </Button>
            )}
          </div>
        </div>

        {/* Key Statistics - Split into 2 rows - ABOVE Quick Actions */}
        <div className="space-y-4 mb-8">
          {/* First row - 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : stats.totalUsers.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Verifications</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {loading ? '...' : stats.pendingVerifications}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Products</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : stats.totalProducts.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second row - 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Transactions</p>
                    <p className="text-2xl font-bold">{stats.activeTransactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Flag className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Reported Content</p>
                    <p className="text-2xl font-bold text-red-600">{stats.reportedContent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                    <p className="text-2xl font-bold">{stats.platformRevenue.toLocaleString()} MMK</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions - After statistics */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common admin tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => {
                    if (onNavigateToVerification) {
                      onNavigateToVerification();
                    } else {
                      // Fallback to window location if navigation function not provided
                      window.location.href = '/admin/verification';
                    }
                  }}
                >
                  <Shield className="h-6 w-6" />
                  <span className="text-sm">Review Verifications</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => window.location.href = '/admin/complaints'}
                >
                  <AlertTriangle className="h-6 w-6" />
                  <span className="text-sm">Manage Complaints</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                >
                  <Package className="h-6 w-6" />
                  <span className="text-sm">Moderate Products</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push('/manage-users')}
                >
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Manage Users</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Top Row - Priority Items */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            {/* Verification Requests - Quick Overview */}
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-yellow-600" />
                  Verification Requests
                  <Badge variant="destructive" className="ml-2">
                    {stats.pendingVerifications} pending
                  </Badge>
                </CardTitle>
                <CardDescription>User verification requests requiring review</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Loading verification requests...</div>
                  </div>
                ) : stats.pendingVerifications === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-2xl font-bold text-green-600 mb-2">✓</div>
                    <div className="text-gray-500 mb-4">No pending verification requests</div>
                    <div className="text-sm text-gray-400">
                      All users are verified or no requests submitted
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl font-bold text-yellow-600 mb-2">
                      {stats.pendingVerifications}
                    </div>
                    <div className="text-gray-600 mb-4">
                      {stats.pendingVerifications === 1 ? 'verification request' : 'verification requests'} pending review
                    </div>
                    <Button 
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      onClick={() => {
                        if (onNavigateToVerification) {
                          onNavigateToVerification();
                        } else {
                          // Fallback to window location if navigation function not provided
                          window.location.href = '/admin/verification';
                        }
                      }}
                    >
                      Review Verification Requests
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Users
                </CardTitle>
                <CardDescription>Latest user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500">Loading recent users...</p>
                    </div>
                  ) : recentUsers.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No recent users</p>
                    </div>
                  ) : (
                    recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.name}</p>
                          <p className="text-sm text-gray-600 truncate">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={user.user_type === 'farmer' ? 'default' : 'secondary'} className="text-xs">
                              {user.user_type}
                            </Badge>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getRelativeTime(user.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => { 
                            if (user.user_type === 'buyer') {
                                router.push(`/user/${user.id}`)
                            } else {
                                router.push(`/seller/${user.id}`)
                            }
                          }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Shield className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}