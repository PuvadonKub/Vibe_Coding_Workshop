/**
 * Image optimization utilities for performance
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
  lazy?: boolean;
  placeholder?: 'blur' | 'empty';
}

/**
 * Generate optimized image URL with query parameters
 */
export function getOptimizedImageUrl(
  src: string, 
  options: ImageOptimizationOptions = {}
): string {
  if (!src) return src;
  
  const url = new URL(src, window.location.origin);
  
  if (options.width) url.searchParams.set('w', options.width.toString());
  if (options.height) url.searchParams.set('h', options.height.toString());
  if (options.quality) url.searchParams.set('q', options.quality.toString());
  if (options.format) url.searchParams.set('f', options.format);
  
  return url.toString();
}

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(src: string, widths: number[] = [320, 640, 1024, 1280]): string {
  return widths
    .map(width => `${getOptimizedImageUrl(src, { width })} ${width}w`)
    .join(', ');
}

/**
 * Get appropriate sizes attribute for responsive images
 */
export function getResponsiveSizes(maxWidth = 1280): string {
  return `(max-width: 320px) 100vw, 
          (max-width: 640px) 100vw, 
          (max-width: 1024px) 50vw, 
          ${maxWidth}px`;
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, options: ImageOptimizationOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = getOptimizedImageUrl(src, options);
  });
}

/**
 * Intersection Observer for lazy loading images
 */
export class LazyImageObserver {
  private observer: IntersectionObserver;
  
  constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
    this.observer = new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
    });
  }
  
  observe(element: Element): void {
    this.observer.observe(element);
  }
  
  unobserve(element: Element): void {
    this.observer.unobserve(element);
  }
  
  disconnect(): void {
    this.observer.disconnect();
  }
}