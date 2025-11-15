/**
 * Email Verification Utilities
 * Handles email verification checks and restrictions for unverified users
 */

export interface EmailVerificationStatus {
  isVerified: boolean;
  requiresVerification: boolean;
  restrictions: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  userType: string;
  accountType: string;
}

/**
 * Check if user's email is verified
 */
export function isEmailVerified(user: User | null): boolean {
  return user?.emailVerified === true;
}

/**
 * Get email verification status and restrictions for a user
 */
export function getEmailVerificationStatus(user: User | null): EmailVerificationStatus {
  const isVerified = isEmailVerified(user);
  
  return {
    isVerified,
    requiresVerification: !isVerified,
    restrictions: isVerified ? [] : [
      'Please verify your email to access all AgriLink features'
    ]
  };
}

/**
 * Check if a specific action requires email verification
 */
export function requiresEmailVerification(action: string): boolean {
  const restrictedActions = [
    'create_product',
    'edit_product',
    'delete_product',
    'make_offer',
    'accept_offer',
    'reject_offer',
    'send_message',
    'reply_message',
    'submit_verification'
  ];
  
  return restrictedActions.includes(action);
}

/**
 * Get user-friendly error message for email verification requirement
 */
export function getEmailVerificationErrorMessage(action: string): string {
  const actionMessages: Record<string, string> = {
    'create_product': 'Please verify your email to create product listings',
    'edit_product': 'Please verify your email to edit product listings',
    'delete_product': 'Please verify your email to manage product listings',
    'make_offer': 'Please verify your email to make offers',
    'accept_offer': 'Please verify your email to accept offers',
    'reject_offer': 'Please verify your email to manage offers',
    'send_message': 'Please verify your email to send messages',
    'reply_message': 'Please verify your email to reply to messages',
    'submit_verification': 'Please verify your email to submit verification requests'
  };
  
  return actionMessages[action] || 'Please verify your email to perform this action';
}

/**
 * Check if user can perform a specific action based on email verification
 */
export function canPerformAction(user: User | null, action: string): boolean {
  if (!user) return false;
  
  const isVerified = isEmailVerified(user);
  const actionRequiresVerification = requiresEmailVerification(action);
  
  return isVerified || !actionRequiresVerification;
}

/**
 * Get verification prompt data for UI components
 */
export function getVerificationPromptData(user: User | null) {
  const status = getEmailVerificationStatus(user);
  
  if (status.isVerified) {
    return null; // No prompt needed
  }
  
  return {
    title: 'Email Verification Required',
    message: 'We\'ve sent a verification link to your email address. Please check your inbox and click the link to verify your account. If you didn\'t receive the email, click the button below to resend it.',
    restrictions: status.restrictions,
    severity: 'warning' as const
  };
}
