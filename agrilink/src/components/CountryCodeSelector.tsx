"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { countryCodes, CountryCode, defaultCountryCode } from "@/utils/countryCodes";

interface CountryCodeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CountryCodeSelector({ 
  value, 
  onChange, 
  placeholder = "Enter phone number",
  className = "",
  disabled = false 
}: CountryCodeSelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(defaultCountryCode);

  // Parse the current value to extract country code and phone number
  const parsePhoneValue = (phoneValue: string) => {
    const foundCountry = countryCodes.find(country => 
      phoneValue.startsWith(country.dialCode)
    );
    
    if (foundCountry) {
      const phoneNumber = phoneValue.replace(foundCountry.dialCode, '');
      return { country: foundCountry, phoneNumber };
    }
    
    return { country: defaultCountryCode, phoneNumber: phoneValue };
  };

  const { country, phoneNumber } = parsePhoneValue(value);

  const handleCountryChange = (countryCode: string) => {
    const newCountry = countryCodes.find(c => c.code === countryCode) || defaultCountryCode;
    setSelectedCountry(newCountry);
    
    // Update the full phone number with new country code
    const fullPhone = newCountry.dialCode + phoneNumber;
    onChange(fullPhone);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhoneNumber = e.target.value;
    const fullPhone = selectedCountry.dialCode + newPhoneNumber;
    onChange(fullPhone);
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Country Code Selector */}
      <Select 
        value={selectedCountry.code} 
        onValueChange={handleCountryChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[110px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {countryCodes.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{country.flag}</span>
                <span className="font-medium">{country.dialCode}</span>
                <span className="text-sm text-muted-foreground ml-2">{country.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Phone Number Input */}
      <Input
        type="tel"
        placeholder={placeholder}
        value={phoneNumber}
        onChange={handlePhoneChange}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
}
