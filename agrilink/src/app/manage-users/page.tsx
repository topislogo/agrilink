"use client";

import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getRelativeTime } from "@/utils/dates";
import { Clock, Eye, Shield, ShieldOff, ArrowLeft, RefreshCw, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/Pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";


interface RecentUser {
  id: string;
  name: string;
  user_type: string;
  isRestricted: boolean;
  created_at: string;
  email: string;
  pendingReports: number;
}

interface ReportsStatistics {
  pending: number;
  total: number;
  restrictedUsers: number;
}

export default function ManageUsers() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<any>(null);
  const [userRestricted, setUserRestricted] = useState(false);
  const [statistics, setStatistics] = useState<ReportsStatistics>({
    pending: 0,
    total: 0,
    restrictedUsers: 0
  });

  const fetchUsers = async () => {
    try {
      setLoading(true); 
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem("user");
      if (!token || !userData) return;        
      const recentUsersResponse = await fetch('/api/users/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      let recentUsersData = [];
      if (recentUsersResponse.ok) {
        recentUsersData = await recentUsersResponse.json();
      }
      setRecentUsers(recentUsersData.users || []);
      setStatistics(recentUsersData.statistics);

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);

  const changeStatus = async (idUser: String) => {
    try {
      console.log("Changing status for user ID:", idUser);
      const token = localStorage.getItem('token');
      if (!token) return;        
      await fetch(`/api/user/${idUser}/change_status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error changing user status:', error);
    } finally {
      await fetchUsers();
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader currentUser={user} onLogout={handleLogout}/>
      <main className="max-w-5xl mx-auto px-4 py-8">
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
                  <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
                  <p className="text-gray-600 mt-1">View all users and restrict their accounts</p>
            </div>
            <Button onClick={fetchUsers} variant="outline" disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
            </Button>
        </div>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Restricted Users</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.restrictedUsers}</p>
                </div>
                <ShieldOff className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-3 mx-auto overflow-y-auto">
            {loading ? (
            <div className="text-center py-4">
                <p className="text-gray-500">Loading users...</p>
            </div>
            ) : recentUsers.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No users</p>
                </div>
            ) : (() => {
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const currentUsers = recentUsers.slice(startIndex, endIndex);

                return currentUsers.map((user) => {
                  const cardClass = `flex items-center justify-between p-3 rounded-lg border ${
                    user.isRestricted ? 'border-red-500' : ''
                  }`;
                  return (
                  <div key={user.id} className={cardClass}>
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
                        {/* ⚠️ Pending report warning */}
                        {user.pendingReports > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                            {user.pendingReports} pending
                          </Badge>
                        )}

                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => { 
                            if (user.user_type === 'buyer') {
                                router.push(`/user/${user.id}`)
                            } else {
                                router.push(`/seller/${user.id}`)
                            }
                        }}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => {
                          setUserId(user.id);
                          setOpen(true);
                          setUserRestricted(user.isRestricted);
                        }}>
                          {user.isRestricted ? (
                            <ShieldOff className="h-4 w-4 text-red-500" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </Button>
                    </div>
                </div>
                )});
            })()}
        </div>
        {open === true && (
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm action</AlertDialogTitle>
                    <AlertDialogDescription>
                      {userRestricted === true ? 'Are you sure you want to unrestrict this user?' : 'Are you sure you want to restrict this user?'}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={async () => {
                            await changeStatus(userId);
                            setUserId(null);
                            setOpen(false);
                            setUserRestricted(false);
                        }}
                        >
                        Yes
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}

        {/* Pagination */}
        {recentUsers.length > 0 && (
            <div className="mt-8">
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(recentUsers.length / itemsPerPage)}
                    totalItems={recentUsers.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(newItemsPerPage) => {
                        setItemsPerPage(newItemsPerPage);
                        setCurrentPage(1); // Reset to first page when changing items per page
                    }}
                />
            </div>
        )}
      </main>
    </div>
  );
}
