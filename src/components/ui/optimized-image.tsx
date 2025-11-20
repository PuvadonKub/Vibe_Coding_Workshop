import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  getOptimizedImageUrl, 
  generateSrcSet, 
  getResponsiveSizes,
  LazyImageObserver,
  type ImageOptimizationOptions
} from '@/lib/imageOptimization';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  optimization?: ImageOptimizationOptions;
  lazy?: boolean;
  placeholder?: React.ReactNode;
  fallback?: string;
  responsive?: boolean;
  responsiveWidths?: number[];
}

/**
 * Optimized Image component with lazy loading, responsive sizing, and fallback handling
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  optimization = {},
  lazy = true,
  placeholder,
  fallback = '/api/placeholder/400/300',
  responsive = true,
  responsiveWidths = [320, 640, 1024, 1280],
  onLoad,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<LazyImageObserver | null>(null);

  // Set up lazy loading observer
  useEffect(() => {
    if (!lazy || shouldLoad) return;

    observerRef.current = new LazyImageObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          if (observerRef.current && imgRef.current) {
            observerRef.current.unobserve(imgRef.current);
          }
        }
      });
    });

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy, shouldLoad]);

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.(event);
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(event);
    
    // Try fallback image if available
    if (fallback && imgRef.current && imgRef.current.src !== fallback) {
      imgRef.current.src = fallback;
    }
  };

  const optimizedSrc = getOptimizedImageUrl(src, optimization);
  const srcSet = responsive ? generateSrcSet(src, responsiveWidths) : undefined;
  const sizes = responsive ? getResponsiveSizes() : undefined;

  // Show placeholder while loading or if lazy loading hasn't triggered
  if ((isLoading && shouldLoad) || !shouldLoad) {
    return (
      <div 
        className={cn(
          "bg-muted animate-pulse flex items-center justify-center",
          className
        )}
        style={props.style}
        ref={!shouldLoad ? imgRef : undefined}
      >
        {placeholder || (
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={optimizedSrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={cn(
        "transition-opacity duration-300",
        isLoading && "opacity-0",
        className
      )}
      onLoad={handleLoad}
      onError={handleError}
      loading={lazy ? "lazy" : "eager"}
      decoding="async"
      {...props}
    />
  );
};

/**
 * Avatar-specific optimized image component
 */
export const OptimizedAvatar: React.FC<Omit<OptimizedImageProps, 'responsive'>> = (props) => (
  <OptimizedImage
    {...props}
    optimization={{
      width: 150,
      height: 150,
      quality: 80,
      format: 'webp',
      ...props.optimization
    }}
    responsive={false}
    className={cn("rounded-full object-cover", props.className)}
  />
);

/**
 * Product image-specific optimized component
 */
export const OptimizedProductImage: React.FC<OptimizedImageProps> = (props) => (
  <OptimizedImage
    {...props}
    optimization={{
      quality: 85,
      format: 'webp',
      ...props.optimization
    }}
    responsiveWidths={[300, 600, 900, 1200]}
    className={cn("object-cover", props.className)}
  />
);