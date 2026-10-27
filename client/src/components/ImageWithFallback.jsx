import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { DEFAULT_COVER } from '../utils/countryPhotos';

/**
 * ImageWithFallback Component
 * Robust image loader with skeleton shimmer, smooth fade-in, and reliable multi-tier fallback.
 * Prevents broken images, layout shifts, and placeholder glitches.
 */
export default function ImageWithFallback({
  src,
  fallbackSrc = DEFAULT_COVER,
  alt = 'Travel scene',
  style = {},
  className = '',
  aspectRatio,
  objectFit = 'cover',
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setImgSrc(src || fallbackSrc);
    setLoaded(false);
    setErrored(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (!errored && fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      setErrored(true);
    } else {
      setErrored(true);
      setLoaded(true);
    }
  };

  const handleLoad = () => {
    setLoaded(true);
  };

  return (
    <div
      className={`img-fallback-wrapper ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        aspectRatio: aspectRatio || undefined,
        backgroundColor: 'var(--surface-warm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {/* Skeleton Shimmer Loader */}
      {!loaded && !errored && (
        <div
          className="skeleton-shimmer"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
          }}
        />
      )}

      {/* Actual Image */}
      {imgSrc && !errored ? (
        <img
          src={imgSrc}
          alt={alt}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            transition: 'opacity 0.35s ease, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: loaded ? 1 : 0,
            display: 'block',
          }}
          {...props}
        />
      ) : (
        /* Graceful Designer Fallback Card */
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--surface-warm) 0%, var(--surface-card) 100%)',
            color: 'var(--text-dimmed)',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <ImageIcon style={{ width: 28, height: 28, opacity: 0.5, marginBottom: '0.4rem', color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{alt}</span>
        </div>
      )}
    </div>
  );
}
