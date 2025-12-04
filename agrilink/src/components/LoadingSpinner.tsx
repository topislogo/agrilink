import { Leaf } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  const containerClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  };

  return (
    <div className={`flex items-center justify-center ${containerClasses[size]} ${className}`}>
      <div className={`${sizeClasses[size]} bg-primary rounded-lg flex items-center justify-center animate-pulse`}>
        <Leaf className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-4 h-4' : 'w-6 h-6'} text-primary-foreground`} />
      </div>
      {text && (
        <span className={`text-muted-foreground ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
          {text}
        </span>
      )}
    </div>
  );
}