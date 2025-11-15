import { Badge } from "./ui/badge";

import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Sprout,
  Truck,
  ShoppingCart,
  Building2,
  User,
  Award,
  Leaf,
  Users,
  MapPin,
  Phone
} from "lucide-react";
import { cn } from "../lib/utils";

// Enhanced user type definitions for Myanmar agricultural context
export interface UserTypeConfig {
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// AgriLink's 3 core user types - each can choose Individual or Business account (6 total + Admin)
export const USER_TYPES: Record<string, UserTypeConfig> = {
  farmer: {
    key: 'farmer',
    label: 'Farmer',
    shortLabel: 'Farmer',
    icon: Sprout,
    description: 'Grows and harvests agricultural products',
    color: 'text-white dark:text-white',
    bgColor: 'bg-green-600 dark:bg-green-600',
    borderColor: 'border-green-600 dark:border-green-600'
  },
  trader: {
    key: 'trader',
    label: 'Trader',
    shortLabel: 'Trader', 
    icon: Truck,
    description: 'Distributes and trades agricultural products',
    color: 'text-white dark:text-white',
    bgColor: 'bg-orange-600 dark:bg-orange-600',
    borderColor: 'border-orange-600 dark:border-orange-600'
  },
  buyer: {
    key: 'buyer',
    label: 'Buyer',
    shortLabel: 'Buyer',
    icon: ShoppingCart,
    description: 'Purchases agricultural products for business or personal use',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  admin: {
    key: 'admin',
    label: 'Admin',
    shortLabel: 'Admin',
    icon: Shield,
    description: 'AgriLink platform administrator',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800'
  }
};

// Account Types (Individual vs Business)
export interface AccountType {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
}

export const ACCOUNT_TYPES: Record<string, AccountType> = {
  individual: {
    key: 'individual',
    label: 'Individual Account',
    shortLabel: 'Individual',
    description: 'Personal account perfect for small-scale farmers and individual sellers. No business license required - just verify your identity with Myanmar ID/NRC.'
  },
  business: {
    key: 'business',
    label: 'Business Account',
    shortLabel: 'Business',
    description: 'For formal businesses, cooperatives, and companies. Requires business registration and provides enhanced credibility for larger operations.'
  }
};

// Verification levels aligned with your existing system
export interface VerificationLevel {
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  level: number;
  requirements: string[];
  accountTypes: string[]; // Which account types can achieve this level
}

export const VERIFICATION_LEVELS: Record<string, VerificationLevel> = {
  unverified: {
    key: 'unverified',
    label: 'Unverified',
    shortLabel: 'Unverified',
    icon: AlertCircle,
    description: 'Basic account - verification not started',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    level: 0,
    requirements: ['Account registration', 'Email verification'],
    accountTypes: ['individual', 'business']
  },
  rejected: {
    key: 'rejected',
    label: 'Verification Rejected',
    shortLabel: 'Rejected',
    icon: AlertCircle,
    description: 'Verification documents were rejected - resubmission required',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    level: 0,
    requirements: ['Resubmit verification documents', 'Review admin feedback'],
    accountTypes: ['individual', 'business']
  },
  'phone-verified': {
    key: 'phone-verified',
    label: 'Phone Verified',
    shortLabel: 'Phone Verified',
    icon: Phone,
    description: 'Phone verified - ID verification still needed',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    level: 0.3,
    requirements: ['Phone number verification', 'SMS confirmation'],
    accountTypes: ['individual', 'business']
  },
  'under-review': {
    key: 'under-review',
    label: 'Under Review',
    shortLabel: 'Under Review',
    icon: Clock,
    description: 'Documents submitted, awaiting verification',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    level: 0.5,
    requirements: ['Documents uploaded', 'Awaiting admin review'],
    accountTypes: ['individual', 'business']
  },
  'id-verified': {
    key: 'id-verified',
    label: 'Verified',
    shortLabel: 'Verified',
    icon: CheckCircle,
    description: 'Individual verification complete - trusted member',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    level: 1,
    requirements: ['Valid Myanmar ID/NRC', 'Identity verification'],
    accountTypes: ['individual']
  },
  'business-verified': {
    key: 'business-verified',
    label: 'Business Verified',
    shortLabel: 'Business ✓',
    icon: Award,
    description: 'Business registration and ID verified - formal business',
    color: 'text-primary dark:text-primary-foreground',
    bgColor: 'bg-primary/10 dark:bg-primary/20',
    borderColor: 'border-primary/30 dark:border-primary/40',
    level: 2,
    requirements: ['Valid Myanmar ID/NRC', 'Business registration', 'Business license'],
    accountTypes: ['business']
  },
  'verified': {
    key: 'verified',
    label: 'Verified',
    shortLabel: 'Verified',
    icon: CheckCircle,
    description: 'Account verified - trusted member',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    level: 1,
    requirements: ['Account verification complete'],
    accountTypes: ['individual', 'business']
  }
};

// Specialty badges for agricultural focus areas
export const SPECIALTY_BADGES = {
  'organic-certified': {
    label: 'Organic Certified',
    icon: Leaf,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  'export-ready': {
    label: 'Export Quality',
    icon: Award,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  'local-champion': {
    label: 'Local Champion',
    icon: MapPin,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  'sustainable': {
    label: 'Sustainable Practices',
    icon: Sprout,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  }
};

interface UserBadgeProps {
  userType: string;
  accountType?: string; // 'individual' or 'business'
  verificationLevel?: string;
  specialties?: string[];
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
}

// Public verification status component for product cards/storefronts (only shows if fully verified)
interface PublicVerificationStatusProps {
  verificationLevel: string;
  size?: 'xs' | 'sm';
  className?: string;
}

export function PublicVerificationStatus({ 
  verificationLevel = 'unverified',
  size = 'xs',
  className 
}: PublicVerificationStatusProps) {
  // For public view, show specific verification types
  // Business-verified gets special "Business ✓" badge
  let publicLevel = verificationLevel;
  
  if (verificationLevel === 'business-verified') {
    publicLevel = 'business-verified'; // Keep the specific business-verified level
  } else if (verificationLevel === 'id-verified') {
    publicLevel = 'verified'; // Map individual verification to generic "verified"
  } else {
    publicLevel = 'unverified'; // Everything else is unverified
  }
  
  const verificationConfig = VERIFICATION_LEVELS[publicLevel] || VERIFICATION_LEVELS.unverified;
  
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1'
  };
  
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3 h-3'
  };

  return (
    <Badge 
      variant="outline"
      className={cn(
        sizeClasses[size],
        verificationConfig.color,
        verificationConfig.bgColor, 
        verificationConfig.borderColor,
        "font-medium flex items-center gap-1 ml-1",
        className
      )}
    >
      <verificationConfig.icon className={iconSizes[size]} />
      {verificationConfig.shortLabel}
    </Badge>
  );
}

// Private verification status component for user profile/menu (shows detailed progress)
interface PrivateVerificationStatusProps {
  verificationLevel: string;
  size?: 'xs' | 'sm';
  className?: string;
}

export function PrivateVerificationStatus({ 
  verificationLevel = 'unverified',
  size = 'xs',
  className 
}: PrivateVerificationStatusProps) {
  const verificationConfig = VERIFICATION_LEVELS[verificationLevel] || VERIFICATION_LEVELS.unverified;
  
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1'
  };
  
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3 h-3'
  };

  return (
    <Badge 
      variant="outline"
      className={cn(
        sizeClasses[size],
        verificationConfig.color,
        verificationConfig.bgColor, 
        verificationConfig.borderColor,
        "font-medium flex items-center gap-1 ml-1",
        className
      )}
    >
      <verificationConfig.icon className={iconSizes[size]} />
      {verificationConfig.shortLabel}
    </Badge>
  );
}

// Legacy component - keeping for backward compatibility but should migrate to Public/Private versions
interface VerificationStatusProps {
  verificationLevel: string;
  size?: 'xs' | 'sm';
  className?: string;
}

export function VerificationStatus({ 
  verificationLevel = 'unverified',
  size = 'xs',
  className 
}: VerificationStatusProps) {
  const verificationConfig = VERIFICATION_LEVELS[verificationLevel] || VERIFICATION_LEVELS.unverified;
  
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1'
  };
  
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3 h-3'
  };

  return (
    <Badge 
      variant="outline"
      className={cn(
        sizeClasses[size],
        verificationConfig.color,
        verificationConfig.bgColor, 
        verificationConfig.borderColor,
        "font-medium flex items-center gap-1 ml-1",
        className
      )}
    >
      <verificationConfig.icon className={iconSizes[size]} />
      {verificationConfig.shortLabel}
    </Badge>
  );
}

export function UserBadge({ 
  userType, 
  accountType,
  verificationLevel = 'unverified',
  specialties = [],
  size = 'md',
  showDescription = false,
  className 
}: UserBadgeProps) {
  const userTypeConfig = USER_TYPES[userType] || USER_TYPES.farmer;
  const verificationConfig = VERIFICATION_LEVELS[verificationLevel] || VERIFICATION_LEVELS.unverified;
  const accountTypeConfig = accountType ? ACCOUNT_TYPES[accountType] : null;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  // Clean badge labeling - just show user type without business account text
  const getPrimaryBadgeLabel = () => {
    return size === 'sm' ? userTypeConfig.shortLabel : userTypeConfig.label;
  };

  // Create the main badge content with forced styling for farmers and traders
  const getBadgeStyles = () => {
    if (userType === 'farmer') {
      return {
        className: cn(
          sizeClasses[size],
          "font-medium flex items-center gap-1 bg-green-600 text-white border-green-600"
        ),
        style: {
          backgroundColor: '#16a34a',
          color: '#ffffff',
          borderColor: '#16a34a'
        }
      };
    }
    if (userType === 'trader') {
      return {
        className: cn(
          sizeClasses[size],
          "font-medium flex items-center gap-1 bg-orange-600 text-white border-orange-600"
        ),
        style: {
          backgroundColor: '#ea580c',
          color: '#ffffff',
          borderColor: '#ea580c'
        }
      };
    }
    return {
      className: cn(
        sizeClasses[size],
        userType === 'buyer' && cn(userTypeConfig.color, userTypeConfig.bgColor, userTypeConfig.borderColor),
        userType === 'admin' && cn(userTypeConfig.color, userTypeConfig.bgColor, userTypeConfig.borderColor),
        "font-medium flex items-center gap-1"
      ),
      style: undefined
    };
  };

  const badgeStyles = getBadgeStyles();
  

  const mainBadgeContent = (
    <Badge 
      variant="default"
      className={badgeStyles.className}
      style={badgeStyles.style}
    >
      {/* Account type icon before text - individual vs business */}
      {accountType === 'business' ? (
        <Building2 className={cn(
          iconSizes[size], 
          userType === 'farmer' ? 'text-white' : 
          userType === 'trader' ? 'text-white' : 
          userTypeConfig.color
        )} />
      ) : (
        <User className={cn(
          iconSizes[size],
          userType === 'farmer' ? 'text-white' : 
          userType === 'trader' ? 'text-white' : 
          userTypeConfig.color
        )} />
      )}
      {getPrimaryBadgeLabel()}
    </Badge>
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* User Type Badge (Primary) - with helpful tooltip */}
      {mainBadgeContent}

      {/* Verification Status Badge - Always show for all users (Private context shows progress) */}
      <PrivateVerificationStatus 
        verificationLevel={verificationLevel}
        size={size === 'lg' ? 'sm' : 'xs'}
      />

      {/* Specialty Badges */}
      {specialties.map((specialty) => {
        const specialtyConfig = SPECIALTY_BADGES[specialty as keyof typeof SPECIALTY_BADGES];
        if (!specialtyConfig) return null;
        
        return (
          <Badge 
            key={specialty}
            variant="outline"
            className={cn(
              sizeClasses[size],
              specialtyConfig.color,
              specialtyConfig.bgColor,
              specialtyConfig.borderColor,
              "font-medium flex items-center gap-1.5"
            )}
          >
            <specialtyConfig.icon className={iconSizes[size]} />
            {size !== 'lg' ? '★' : specialtyConfig.label}
          </Badge>
        );
      })}
      
      {/* Description tooltip for mobile */}
      {showDescription && size !== 'sm' && (
        <div className="text-xs text-muted-foreground max-w-xs">
          {userTypeConfig.description}
          {accountTypeConfig && (
            <span className="block mt-1">Account Type: {accountTypeConfig.description}</span>
          )}
          {verificationLevel !== 'unverified' && (
            <span className="block mt-1">{verificationConfig.description}</span>
          )}
        </div>
      )}
    </div>
  );
}

// Simple account type badge component (for image overlays) - just shows account type + user type
interface AccountTypeBadgeProps {
  userType: string;
  accountType?: string; // 'individual' or 'business'
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AccountTypeBadge({ 
  userType, 
  accountType,
  size = 'sm',
  className 
}: AccountTypeBadgeProps) {
  const userTypeConfig = USER_TYPES[userType] || USER_TYPES.farmer;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  // Clean badge labeling - just show user type without business account text
  const getPrimaryBadgeLabel = () => {
    return size === 'sm' ? userTypeConfig.shortLabel : userTypeConfig.label;
  };

  // Create the main badge content with forced styling for farmers and traders
  const getBadgeStyles = () => {
    if (userType === 'farmer') {
      return {
        className: cn(
          sizeClasses[size],
          "font-medium flex items-center gap-1 bg-green-600 text-white border-green-600"
        ),
        style: {
          backgroundColor: '#16a34a',
          color: '#ffffff',
          borderColor: '#16a34a'
        }
      };
    }
    if (userType === 'trader') {
      return {
        className: cn(
          sizeClasses[size],
          "font-medium flex items-center gap-1 bg-orange-600 text-white border-orange-600"
        ),
        style: {
          backgroundColor: '#ea580c',
          color: '#ffffff',
          borderColor: '#ea580c'
        }
      };
    }
    return {
      className: cn(
        sizeClasses[size],
        userType === 'buyer' && cn(userTypeConfig.color, userTypeConfig.bgColor, userTypeConfig.borderColor),
        userType === 'admin' && cn(userTypeConfig.color, userTypeConfig.bgColor, userTypeConfig.borderColor),
        "font-medium flex items-center gap-1"
      ),
      style: undefined
    };
  };

  const badgeStyles = getBadgeStyles();
  

  return (
    <Badge 
      variant="default"
      className={cn(badgeStyles.className, className)}
      style={badgeStyles.style}
    >
      {/* Account type icon before text - individual vs business */}
      {accountType === 'business' ? (
        <Building2 className={cn(
          iconSizes[size], 
          userType === 'farmer' ? 'text-white' : 
          userType === 'trader' ? 'text-white' : 
          userTypeConfig.color
        )} />
      ) : (
        <User className={cn(
          iconSizes[size],
          userType === 'farmer' ? 'text-white' : 
          userType === 'trader' ? 'text-white' : 
          userTypeConfig.color
        )} />
      )}
      {getPrimaryBadgeLabel()}
    </Badge>
  );
}


interface BadgeExplanationProps {
  className?: string;
}

export function BadgeExplanation({ className }: BadgeExplanationProps) {
  return (
    <div className={cn("space-y-4 p-4 bg-muted/50 rounded-lg", className)}>
      <h4 className="font-medium">Understanding AgriLink Badges</h4>
      
      <div className="space-y-3">
        <div>
          <h5 className="text-sm font-medium mb-2">User Types</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.values(USER_TYPES).map((type) => (
              <div key={type.key} className="flex items-center gap-2 text-sm">
                <type.icon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{type.shortLabel}:</span>
                <span className="text-muted-foreground">{type.description}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h5 className="text-sm font-medium mb-2">Verification Levels</h5>
          <div className="space-y-2">
            {Object.values(VERIFICATION_LEVELS)
              .filter(level => level.key !== 'under-review')
              .sort((a, b) => a.level - b.level)
              .map((level) => (
                <div key={level.key} className="flex items-start gap-2 text-sm">
                  <level.icon className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="font-medium">{level.label}:</span>
                    <span className="text-muted-foreground ml-2">{level.description}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        Higher verification levels indicate increased trust and platform privileges. 
        All verifications are voluntary but recommended for better buyer confidence.
      </div>
    </div>
  );
}

// Helper function to determine verification level from user data (matches product card logic)
export function getUserVerificationLevel(user: any): string {
  // Check for rejection status first - highest priority
  if (user.verificationStatus === 'rejected') {
    return 'rejected';
  }
  
  // Check for under review - but only if not already verified
  // Priority: Approved status overrides under-review status
  if (user.verificationStatus === 'under-review' || 
      (user.verificationSubmitted && user.verificationStatus !== 'verified')) {
    return 'under-review';
  }
  
  // Business account with ID verification (matches product card logic)
  if (user.accountType === 'business' && user.verified) {
    return 'business-verified';
  }
  
  // Individual account with ID verification
  if (user.verified) {
    return 'id-verified';
  }
  
  // Phone verification only (halfway state for all user types)
  if (user.phoneVerified) {
    return 'phone-verified';
  }
  
  return 'unverified';
}

// Helper function to get account type from user data  
export function getUserAccountType(user: any): string {
  return user.accountType || 'individual'; // Default to individual if not specified
}

// Helper to get user specialties from profile data
export function getUserSpecialties(user: any): string[] {
  const specialties: string[] = [];
  
  if (user.organicCertified) specialties.push('organic-certified');
  if (user.exportReady) specialties.push('export-ready');
  if (user.localChampion) specialties.push('local-champion');
  if (user.sustainablePractices) specialties.push('sustainable');
  
  return specialties;
}