"use client";

import { useState } from "react";
import { formatMemberSinceDate } from "../utils/dates";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { S3Image } from './S3Image';
import { UserBadge, getUserVerificationLevel, getUserAccountType } from "./UserBadgeSystem";
import { EmailVerificationStatus } from "./EmailVerificationPrompt";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";
import { 
  User, 
  Settings, 
  LogOut, 
  Store, 
  Package, 
  MessageSquare, 
  Bell,
  Shield,
  MapPin,
  Phone,
  Award,
  BarChart3,
  AlertCircle,
  Building2
} from "lucide-react";

interface UserMenuProps {
  user: any;
  onLogout: () => void;
  onViewStorefront?: (sellerId: string) => void;
  onUpdateUser?: (updates: any) => void;
  onGoToDashboard?: () => void;
  onShowVerification?: () => void;
  onEditProfile?: () => void;
  onViewProfile?: () => void;
  onViewMessages?: () => void;
  onShowAdminVerification?: () => void;
}

export function UserMenuWithSupport({ user, onLogout, onViewStorefront, onUpdateUser, onGoToDashboard, onShowVerification, onEditProfile, onViewProfile, onViewMessages, onShowAdminVerification }: UserMenuProps) {
  const [showProfile, setShowProfile] = useState(false);

  const getVerificationStatus = (user: any) => {
    // Use the unified verification level system for ALL user types
    const level = getUserVerificationLevel(user);
    
    // Apply the consistent color mapping for all users:
    // 🔴 Red → 🟡 Yellow → 🔵 Blue → 🟢 Green
    switch (level) {
      case 'business-verified':
        return {
          status: 'verified',
          color: 'text-green-600 dark:text-green-400', // Green for fully verified
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          dotColor: 'bg-green-600'
        };
      case 'id-verified':
        return {
          status: 'verified',
          color: 'text-green-600 dark:text-green-400', // Green for ID verified
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          dotColor: 'bg-green-600'
        };
      case 'under-review':
        return {
          status: 'under-review',
          color: 'text-blue-600 dark:text-blue-400', // Blue for under review
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          dotColor: 'bg-blue-600'
        };
      case 'phone-verified':
        return {
          status: 'in-progress',
          color: 'text-yellow-600 dark:text-yellow-400', // Yellow for phone verified
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          dotColor: 'bg-yellow-600'
        };
      case 'rejected':
        return {
          status: 'rejected',
          color: 'text-red-600 dark:text-red-400', // Red for rejected
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          dotColor: 'bg-red-600'
        };
      default: // unverified
        return {
          status: 'not-started',
          color: 'text-red-600 dark:text-red-400', // Red for unverified
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          dotColor: 'bg-red-600'
        };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (showProfile) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-card rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">My Profile</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowProfile(false)}>
              ×
            </Button>
          </div>

          <div className="space-y-6">
            {/* Profile Header */}
            <div className="text-center">
              <Avatar className="w-20 h-20 mx-auto mb-4">
                {user.profileImage || user.avatar ? (
                  <S3Image 
                    src={user.profileImage || user.avatar} 
                    alt={`${user.name}'s profile`}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <AvatarFallback className="text-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <h3 className="text-lg font-medium">{user.name}</h3>
              <UserBadge 
                userType={user.userType}
                accountType={getUserAccountType(user)}
                verificationLevel={getUserVerificationLevel(user)}
                size="sm"
              />
              {/* Email Verification Status */}
              <div className="mt-2">
                <EmailVerificationStatus user={user} size="sm" />
              </div>
              
              {/* Verification Status - Only show for non-admin users */}
              {user.userType !== 'admin' && (
                <div className="mt-2">
                  {/* For all non-admin users, show unified verification status */}
                  {user.verified && (
                    <div className="flex items-center justify-center gap-1 text-sm text-green-600">
                      <Shield className="w-4 h-4" />
                      Verified Account
                    </div>
                  )}
                  
                  {user.verificationStatus === 'under-review' && (
                    <div className="flex items-center justify-center gap-1 text-sm text-primary">
                      <AlertCircle className="w-4 h-4" />
                      Verification Under Review
                    </div>
                  )}
                  
                  {!user.verified && user.verificationStatus !== 'under-review' && (
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      Verification Available
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{user.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              </div>
            </div>

            {/* Business Information */}
            {user.businessName && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Business Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Business Name:</span>
                    <div className="text-muted-foreground">{user.businessName}</div>
                  </div>
                  {user.businessDescription && (
                    <div>
                      <span className="font-medium">Description:</span>
                      <div className="text-muted-foreground">{user.businessDescription}</div>
                    </div>
                  )}
                  {user.specialization && (
                    <div>
                      <span className="font-medium">Specialization:</span>
                      <div className="text-muted-foreground capitalize">{user.specialization}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Account Stats */}
            <div className="space-y-3">
              <h4 className="font-medium">Account Stats</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-medium">Member Since</div>
                  <div className="text-muted-foreground">{formatMemberSinceDate(user.joinedDate)}</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-medium">Rating</div>
                  <div className="text-muted-foreground">
                    {user.rating && !isNaN(Number(user.rating)) && Number(user.rating) > 0 ? `${Number(user.rating).toFixed(1)}/5` : 'No ratings yet'}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {(user.userType === 'farmer' || user.userType === 'trader' || user.userType === 'buyer') && onGoToDashboard && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setShowProfile(false);
                    onGoToDashboard();
                  }}
                >
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </Button>
              )}
              
              {user.userType === 'admin' && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setShowProfile(false);
                    window.location.href = '/admin';
                  }}
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </Button>
              )}
              
              {user.userType === 'admin' && onShowAdminVerification && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setShowProfile(false);
                    onShowAdminVerification();
                  }}
                >
                  <Award className="w-4 h-4" />
                  Verification Requests
                </Button>
              )}
              
              {/* Messages button - Only show for non-admin users (user-to-user chat) */}
              {user.userType !== 'admin' && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setShowProfile(false);
                    onViewMessages?.();
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Button>
              )}
              
              {/* Offer Management button - Show for buyers, traders, and farmers (all can participate in offers) */}
              {(() => {
                console.log('🔍 UserMenu Debug - user:', user);
                console.log('🔍 UserMenu Debug - userType:', user?.userType);
                console.log('🔍 UserMenu Debug - should show offer management:', user?.userType === 'buyer' || user?.userType === 'trader' || user?.userType === 'farmer');
                return user?.userType === 'buyer' || user?.userType === 'trader' || user?.userType === 'farmer';
              })() && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setShowProfile(false);
                    window.location.href = '/offers';
                  }}
                  id="offer-management-button"
                  name="offer-management-button"
                >
                  <Package className="w-4 h-4" />
                  Offer Management {/* Updated for traders */}
                </Button>
              )}
              
              
              {/* Verification button - Only show for non-admin users */}
              {user.userType !== 'admin' && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setShowProfile(false);
                    onShowVerification?.();
                  }}
                >
                  <Shield className={`w-4 h-4 ${getVerificationStatus(user).color}`} />
                  {user.verified ? 'Verification Status' : 
                   user.verificationStatus === 'under-review' ? 'Verification' :
                   user.verificationSubmitted ? 'Verification Status' : 'Get Verified'}
                  
                  {getVerificationStatus(user).status === 'under-review' && (
                    <Badge variant="secondary" className={`ml-auto text-xs ${getVerificationStatus(user).bgColor} ${getVerificationStatus(user).color} ${getVerificationStatus(user).borderColor}`}>
                      {user.verificationStatus === 'under-review' || user.verificationSubmitted ? 'Under Review' : 'Reviewing'}
                    </Badge>
                  )}
                  {getVerificationStatus(user).status === 'verified' && (
                    <Badge variant="secondary" className={`ml-auto text-xs ${getVerificationStatus(user).bgColor} ${getVerificationStatus(user).color} ${getVerificationStatus(user).borderColor}`}>
                      Verified
                    </Badge>
                  )}
                  {getVerificationStatus(user).status === 'in-progress' && (
                    <Badge variant="secondary" className={`ml-auto text-xs ${getVerificationStatus(user).bgColor} ${getVerificationStatus(user).color} ${getVerificationStatus(user).borderColor}`}>
                      Phone Verified
                    </Badge>
                  )}
                  {getVerificationStatus(user).status === 'not-started' && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Available
                    </Badge>
                  )}
                </Button>
              )}
              

              <Button variant="outline" className="w-full justify-start gap-2">
                <Bell className="w-4 h-4" />
                Notification Settings
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={() => {
                  setShowProfile(false);
                  onLogout();
                }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger 
          className="relative h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-accent/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Avatar className="h-9 w-9 md:h-10 md:w-10">
            {user.profileImage || user.avatar ? (
              <S3Image 
                src={user.profileImage || user.avatar} 
                alt={`${user.name}'s profile`}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <AvatarFallback className="text-sm">
                {getInitials(user.name)}
              </AvatarFallback>
            )}
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                {/* Account type badge with user type colors */}
                <Badge 
                  variant="outline" 
                  className={`text-xs px-2 py-0.5 font-medium flex items-center gap-1 ${
                    user.userType === 'farmer' ? 'bg-green-600 text-white border-green-600' :
                    user.userType === 'trader' ? 'bg-orange-600 text-white border-orange-600' :
                    user.userType === 'buyer' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' :
                    'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800'
                  }`}
                >
                  {getUserAccountType(user) === 'business' ? (
                    <Building2 className={`w-3 h-3 ${
                      user.userType === 'farmer' || user.userType === 'trader' ? 'text-white' :
                      user.userType === 'buyer' ? 'text-blue-700 dark:text-blue-400' :
                      'text-gray-700 dark:text-gray-300'
                    }`} />
                  ) : (
                    <User className={`w-3 h-3 ${
                      user.userType === 'farmer' || user.userType === 'trader' ? 'text-white' :
                      user.userType === 'buyer' ? 'text-blue-700 dark:text-blue-400' :
                      'text-gray-700 dark:text-gray-300'
                    }`} />
                  )}
                  {user.userType === 'farmer' && 'Farmer'}
                  {user.userType === 'trader' && 'Trader'} 
                  {user.userType === 'buyer' && 'Buyer'}
                  {user.userType === 'admin' && 'Admin'}
                </Badge>
              </div>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* Profile menu item - Only show for non-admin users */}
          {user.userType !== 'admin' && (
            <DropdownMenuItem onClick={onViewProfile}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          )}
          {(user.userType === 'farmer' || user.userType === 'trader' || user.userType === 'buyer') && onGoToDashboard && (
            <DropdownMenuItem onClick={onGoToDashboard}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </DropdownMenuItem>
          )}
          {user.userType === 'admin' && (
            <DropdownMenuItem onClick={() => window.location.href = '/admin'}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          )}
          {user.userType === 'admin' && onShowAdminVerification && (
            <DropdownMenuItem onClick={onShowAdminVerification}>
              <Award className="mr-2 h-4 w-4" />
              <span>Verification Requests</span>
            </DropdownMenuItem>
          )}
          {(user.userType === 'farmer' || user.userType === 'trader') && (
            <DropdownMenuItem onClick={() => onViewStorefront?.(user.id)}>
              <Store className="mr-2 h-4 w-4" />
              <span>My Storefront</span>
            </DropdownMenuItem>
          )}
          {user.userType === 'buyer' && (
            <DropdownMenuItem onClick={() => window.open(`/user/${user.id}`, '_blank')}>
              <User className="mr-2 h-4 w-4" />
              <span>Public Profile</span>
            </DropdownMenuItem>
          )}


          {/* Messages menu item - Only show for non-admin users (user-to-user chat) */}
          {user.userType !== 'admin' && (
            <DropdownMenuItem onClick={onViewMessages}>
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Messages</span>
            </DropdownMenuItem>
          )}
          
          {/* Offer Management menu item - Show for buyers, traders, and farmers */}
          {(user.userType === 'buyer' || user.userType === 'trader' || user.userType === 'farmer') && (
            <DropdownMenuItem onClick={() => window.location.href = '/offers'}>
              <Package className="mr-2 h-4 w-4" />
              <span>Manage Offers</span>
            </DropdownMenuItem>
          )}
          
          {/* Verification menu item - Only show for non-admin users */}
          {user.userType !== 'admin' && (
            <DropdownMenuItem onClick={() => onShowVerification?.()}>
              <Shield className={`mr-2 h-4 w-4 ${getVerificationStatus(user).color}`} />
              <span>
                {user.verified ? 'Verification Status' : 
                 (user.verificationStatus === 'under-review' || user.verificationStatus === 'under_review') ? 'Verification' :
                 user.verificationSubmitted ? 'Verification Status' : 'Get Verified'}
              </span>
              {getVerificationStatus(user).status === 'under-review' && (
                <div className={`ml-auto w-2 h-2 rounded-full ${getVerificationStatus(user).dotColor}`} title="Under Review">
                </div>
              )}
              {getVerificationStatus(user).status === 'verified' && (
                <div className={`ml-auto w-2 h-2 rounded-full ${getVerificationStatus(user).dotColor}`} title="Verified">
                </div>
              )}
              {getVerificationStatus(user).status === 'in-progress' && (
                <div className={`ml-auto w-2 h-2 rounded-full ${getVerificationStatus(user).dotColor}`} title="Phone Verified - ID Verification Still Needed">
                </div>
              )}
              {getVerificationStatus(user).status === 'not-started' && (
                <div className={`ml-auto w-2 h-2 rounded-full ${getVerificationStatus(user).dotColor}`} title="Verification Available">
                </div>
              )}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>




    </div>
  );
}