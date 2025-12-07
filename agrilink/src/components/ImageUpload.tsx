"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface ImageUploadProps {
  onImageUpload?: (imageUrl: string) => void;
  onImageSelect?: (imageFile: File) => void;
  currentImage?: string;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({ onImageUpload, onImageSelect, currentImage, className = "", disabled = false }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clear any previous errors
      setError(null);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        setTimeout(() => setError(null), 5000);
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        setTimeout(() => setError(null), 5000);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Handle file based on callback type
      if (onImageSelect) {
        // Pass file directly to parent component
        onImageSelect && onImageSelect(file);
      } else if (onImageUpload) {
        // Upload file and pass URL to parent
        uploadFile(file);
      }
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);

    try {
      // In a real app, you would upload to Cloudinary, AWS S3, or similar
      // For now, we'll simulate the upload and return a placeholder URL
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a mock URL (in production, this would be the actual uploaded image URL)
      const mockImageUrl = `/api/placeholder/400/300`;
      
      onImageUpload && onImageUpload(mockImageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
      setTimeout(() => setError(null), 5000);
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    // Only call onImageUpload if it exists (for backward compatibility)
    // onImageSelect doesn't need to be called on remove since it's for file selection
    if (onImageUpload) {
      onImageUpload("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
        id="image-upload"
        name="image-upload"
      />
      
      {preview ? (
        <div className="space-y-3">
          <Card className="relative">
            <CardContent className="p-0">
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute top-2 right-2 flex space-x-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRemove}
                    disabled={isUploading || disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="text-center text-white">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Uploading...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Visible action buttons */}
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={handleClick}
              disabled={isUploading || disabled}
              className="flex items-center gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Change Image
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isUploading || disabled}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Card 
          className={`border-2 border-dashed border-gray-300 transition-colors ${
            disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-gray-400 cursor-pointer'
          }`}
          onClick={handleClick}
        >
          <CardContent className="p-8 text-center">
            {isUploading ? (
              <div>
                <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Uploading image...</p>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Click to upload an image</p>
                <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          {error}
        </div>
      )}
    </div>
  );
}
