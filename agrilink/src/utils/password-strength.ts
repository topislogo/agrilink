/**
 * Password strength validation and utilities
 */

export interface PasswordStrength {
  score: number; // 0-4 (0 = weak, 4 = very strong)
  label: string; // 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'
  feedback: string[];
  isValid: boolean;
}

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

/**
 * Check password requirements
 */
export function checkPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}

/**
 * Calculate password strength score
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'Weak',
      feedback: [],
      isValid: false,
    };
  }

  const requirements = checkPasswordRequirements(password);
  const feedback: string[] = [];
  
  let score = 0;
  
  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety scoring
  if (requirements.hasUppercase) score += 0.5;
  if (requirements.hasLowercase) score += 0.5;
  if (requirements.hasNumber) score += 0.5;
  if (requirements.hasSpecialChar) score += 0.5;
  
  // Round to nearest integer (0-4)
  score = Math.min(4, Math.round(score));
  
  // Generate feedback
  if (!requirements.minLength) {
    feedback.push('At least 8 characters');
  }
  if (!requirements.hasUppercase) {
    feedback.push('One uppercase letter');
  }
  if (!requirements.hasLowercase) {
    feedback.push('One lowercase letter');
  }
  if (!requirements.hasNumber) {
    feedback.push('One number');
  }
  if (!requirements.hasSpecialChar) {
    feedback.push('One special character');
  }
  
  // Determine label
  let label: string;
  switch (score) {
    case 0:
    case 1:
      label = 'Weak';
      break;
    case 2:
      label = 'Fair';
      break;
    case 3:
      label = 'Good';
      break;
    case 4:
      label = 'Strong';
      break;
    default:
      label = 'Weak';
  }
  
  // Check if password meets all requirements
  const isValid = 
    requirements.minLength &&
    requirements.hasUppercase &&
    requirements.hasLowercase &&
    requirements.hasNumber &&
    requirements.hasSpecialChar;
  
  return {
    score,
    label,
    feedback,
    isValid,
  };
}

/**
 * Validate password meets all requirements
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  const requirements = checkPasswordRequirements(password);
  
  if (!requirements.minLength) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!requirements.hasUppercase) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!requirements.hasLowercase) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!requirements.hasNumber) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  if (!requirements.hasSpecialChar) {
    return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)' };
  }
  
  return { isValid: true };
}

