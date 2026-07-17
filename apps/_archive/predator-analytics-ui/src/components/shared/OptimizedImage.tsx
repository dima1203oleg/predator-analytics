/**
 * 🖼️ Optimized Image Component
 *
 * Features:
 * - Lazy loading with intersection observer
 * - WebP format detection and fallback
 * - Blur-up placeholder
 * - Error handling with fallback
 * - Responsive srcset generation
 */

import React, { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

// ========================
// Types
// ========================

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'placeholder' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  placeholder?: 'blur' | 'pulse' | 'none';
  blurDataUrl?: string;
  fallbackSrc?: string;
  priority?: boolean;
  quality?: number;
  onLoadingComplete?: () => void;
  className?: string;
  containerClassName?: string;
}

// ========================
// WebP Support Detection
// ========================

let supportsWebP: boolean | null = null;

const checkWebPSupport = async (): Promise<boolean> => {
  if (supportsWebP !== null) return supportsWebP;

  if (typeof window === 'undefined') {
    supportsWebP = false;
    return false;
  }

  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      supportsWebP = webP.height === 1;
      resolve(supportsWebP);
    };
    webP.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoCAAEAAQAcJYgCdAEO/hOMAAAD';
  });
};

// ========================
// Blur Placeholder Generator
// ========================

const generatePlaceholder = (width: number, height: number): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="blur" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="20" />
      </filter>
      <rect width="100%" height="100%" fill="#1e293b" filter="url(#blur)" />
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// ========================
// Optimized Image Component
// ========================

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  placeholder = 'pulse',
  blurDataUrl,
  fallbackSrc = '/images/placeholder.png',
  priority = false,
  quality = 80,
  onLoadingComplete,
  className,
  containerClassName,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoadingComplete?.();
  };

  // Handle image error
  const handleError = () => {
    setIsError(true);
    if (imgRef.current && fallbackSrc) {
      imgRef.current.src = fallbackSrc;
    }
  };

  // Generate srcset for responsive images
  const generateSrcSet = (baseSrc: string): string | undefined => {
    if (!width) return undefined;

    const sizes = [0.5, 1, 1.5, 2];
    return sizes
      .map(scale => {
        const w = Math.round(width * scale);
        // In prod, this would use an image optimization service
        return `${baseSrc}?w=${w}&q=${quality} ${w}w`;
      })
      .join(', ');
  };

  // Placeholder styles
  const placeholderContent = placeholder === 'blur' ? (
    <div
      className="absolute inset-0 bg-cover bg-center blur-xl scale-110"
      style={{ backgroundImage: `url(${blurDataUrl || generatePlaceholder(width || 400, height || 300)})` }}
    />
  ) : placeholder === 'pulse' ? (
    <motion.div
      className="absolute inset-0 bg-slate-800"
      animate={{ opacity: [0.5, 0.7, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  ) : null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        containerClassName
      )}
      style={{ width, height }}
    >
      {/* Placeholder */}
      <AnimatePresence>
        {!isLoaded && placeholderContent && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {placeholderContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual Image */}
      {isInView && (
        <motion.img
          ref={imgRef}
          src={isError && fallbackSrc ? fallbackSrc : src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "relative z-10",
            className
          )}
          {...props}
        />
      )}
    </div>
  );
};

// ========================
// Image Gallery Component
// ========================

interface ImageGalleryProps {
  images: { src: string; alt: string; width?: number; height?: number }[];
  columns?: number;
  gap?: number;
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  columns = 3,
  gap = 16,
  className
}) => {
  return (
    <div
      className={cn("grid", className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap
      }}
    >
      {images.map((image, index) => (
        <OptimizedImage
          key={index}
          {...image}
          containerClassName="aspect-square rounded-lg"
          className="w-full h-full object-cover"
        />
      ))}
    </div>
  );
};

// ========================
// Avatar Component
// ========================

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

const avatarSizes = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  fallback,
  className
}) => {
  const [error, setError] = useState(false);
  const pixels = avatarSizes[size];

  // Get initials from alt text
  const initials = alt
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (!src || error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold",
          className
        )}
        style={{ width: pixels, height: pixels, fontSize: pixels * 0.4 }}
        title={alt}
      >
        {fallback || initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={pixels}
      height={pixels}
      containerClassName={cn("rounded-full", className)}
      className="w-full h-full object-cover rounded-full"
      onLoadingComplete={() => { }}
      placeholder="pulse"
      priority
    />
  );
};

// ========================
// Background Image
// ========================

interface BackgroundImageProps {
  src: string;
  children?: React.ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
  className?: string;
}

export const BackgroundImage: React.FC<BackgroundImageProps> = ({
  src,
  children,
  overlay = true,
  overlayOpacity = 0.6,
  className
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.src = src;
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${src})` }}
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: isLoaded ? 1 : 1.1, opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      />

      {/* Overlay */}
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default OptimizedImage;
