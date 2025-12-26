import { calculatePasswordStrength, checkPasswordRequirements } from '@/utils/password-strength';
import { CheckCircle2, XCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

export function PasswordStrengthIndicator({ 
  password, 
  showRequirements = true,
  className = '' 
}: PasswordStrengthIndicatorProps) {
  if (!password) {
    return showRequirements ? (
      <div className={`space-y-2 ${className}`}>
        <p className="text-sm font-medium text-muted-foreground">Password Requirements:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li className="flex items-center gap-2">
            <XCircle className="w-3 h-3" />
            At least 8 characters
          </li>
          <li className="flex items-center gap-2">
            <XCircle className="w-3 h-3" />
            One uppercase letter (A-Z)
          </li>
          <li className="flex items-center gap-2">
            <XCircle className="w-3 h-3" />
            One lowercase letter (a-z)
          </li>
          <li className="flex items-center gap-2">
            <XCircle className="w-3 h-3" />
            One number (0-9)
          </li>
          <li className="flex items-center gap-2">
            <XCircle className="w-3 h-3" />
            One special character ({'!@#$%^&*()_+-=[]{}|;:,.<>?'})
          </li>
        </ul>
      </div>
    ) : null;
  }

  const strength = calculatePasswordStrength(password);
  const requirements = checkPasswordRequirements(password);

  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score === 2) return 'bg-orange-500';
    if (score === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthTextColor = (score: number) => {
    if (score <= 1) return 'text-red-600';
    if (score === 2) return 'text-orange-600';
    if (score === 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Password Strength:</span>
          <span className={`text-xs font-semibold ${getStrengthTextColor(strength.score)}`}>
            {strength.label}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strength.score)}`}
            style={{ width: `${(strength.score / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Requirements:</p>
          <ul className="text-xs space-y-1">
            <li className={`flex items-center gap-2 ${requirements.minLength ? 'text-green-600' : 'text-muted-foreground'}`}>
              {requirements.minLength ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              At least 8 characters
            </li>
            <li className={`flex items-center gap-2 ${requirements.hasUppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
              {requirements.hasUppercase ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              One uppercase letter (A-Z)
            </li>
            <li className={`flex items-center gap-2 ${requirements.hasLowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
              {requirements.hasLowercase ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              One lowercase letter (a-z)
            </li>
            <li className={`flex items-center gap-2 ${requirements.hasNumber ? 'text-green-600' : 'text-muted-foreground'}`}>
              {requirements.hasNumber ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              One number (0-9)
            </li>
            <li className={`flex items-center gap-2 ${requirements.hasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}`}>
              {requirements.hasSpecialChar ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              One special character ({'!@#$%^&*()_+-=[]{}|;:,.<>?'})
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

