"use client";

import React from "react";
import { S3Image } from "./S3Image";
import { cn } from "./ui/utils";

interface S3AvatarProps {
  src?: string;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
  onClick?: () => void;
}

export function S3Avatar({ 
  src, 
  alt = "User", 
  className, 
  fallback,
  onClick 
}: S3AvatarProps) {
  return (
    <div 
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      onClick={onClick}
    >
      {src ? (
        <S3Image 
          src={src} 
          alt={alt}
          className="aspect-square size-full object-cover"
        />
      ) : (
        <div className="bg-muted flex size-full items-center justify-center rounded-full">
          {fallback}
        </div>
      )}
    </div>
  );
}
