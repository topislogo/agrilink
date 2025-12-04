import { useState, useRef, useEffect } from "react";
import { cn } from "./ui/utils";

interface BasicOTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function BasicOTPInput({ 
  length = 6, 
  value, 
  onChange, 
  disabled, 
  className 
}: BasicOTPInputProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleInputChange = (index: number, inputValue: string) => {
    if (disabled) return;

    // Only allow single digit input
    const digit = inputValue.replace(/\D/g, '').slice(-1);
    
    // Update the value
    const newValue = value.split('');
    newValue[index] = digit;
    const updatedValue = newValue.join('').slice(0, length);
    onChange(updatedValue);

    // Move to next input if digit entered
    if (digit && index < length - 1) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
        setFocusedIndex(index + 1);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      
      const newValue = value.split('');
      
      if (newValue[index]) {
        // Clear current input
        newValue[index] = '';
        onChange(newValue.join(''));
      } else if (index > 0) {
        // Move to previous input and clear it
        newValue[index - 1] = '';
        onChange(newValue.join(''));
        const prevInput = inputRefs.current[index - 1];
        if (prevInput) {
          prevInput.focus();
          setFocusedIndex(index - 1);
        }
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
        setFocusedIndex(index - 1);
      }
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
        setFocusedIndex(index + 1);
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
    onChange(pastedData);
    
    // Focus the next empty input or the last input
    const nextIndex = Math.min(pastedData.length, length - 1);
    const nextInput = inputRefs.current[nextIndex];
    if (nextInput) {
      nextInput.focus();
      setFocusedIndex(nextIndex);
    }
  };

  return (
    <div 
      className={cn("flex items-center gap-3 md:gap-2", className)}
      onPaste={handlePaste}
    >
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          id={`otp-${index}`}
          name={`otp-${index}`}
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={cn(
            // Mobile-first: larger touch targets for mobile
            "relative flex h-14 w-14 items-center justify-center border border-input bg-input-background text-center text-xl font-medium transition-all",
            // Desktop: smaller size
            "md:h-12 md:w-12 md:text-lg",
            // Focus states
            "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20",
            // Disabled state
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Border radius
            "first:rounded-l-md last:rounded-r-md",
            // Active/focused state
            focusedIndex === index && "z-10 border-ring ring-2 ring-ring/20",
            // Has value state
            value[index] && "border-ring",
            className
          )}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}