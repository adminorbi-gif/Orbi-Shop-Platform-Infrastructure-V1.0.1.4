import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ImageWithSkeletonProps {
  src?: string | null;
  alt?: string;
  className?: string;
  containerClassName?: string;
  fallbackIconSize?: number;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  decoding?: "async" | "auto" | "sync";
  style?: React.CSSProperties;
  [key: string]: any;
}

export function ImageWithSkeleton({
  src,
  alt,
  className,
  containerClassName = "",
  fallbackIconSize = 48,
  ...props
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-300 w-full h-full ${containerClassName}`}>
        <Package size={fallbackIconSize} />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${containerClassName}`}>
      {/* Skeleton / Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center text-slate-300">
           <Package size={fallbackIconSize} className="opacity-20" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className || ''} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 w-full h-full object-cover`}
        {...props}
      />
    </div>
  );
}
