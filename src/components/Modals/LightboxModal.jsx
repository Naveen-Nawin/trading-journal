import React, { useEffect, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const LightboxModal = () => {
  const { lightbox, setLightbox } = useTrading();
  const [zoom, setZoom] = useState(1);

  // Reset zoom whenever a new image is opened
  useEffect(() => {
    if (lightbox) {
      setZoom(1);
    }
  }, [lightbox]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightbox(null);
      }
    };
    if (lightbox) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox, setLightbox]);

  if (!lightbox) return null;

  const imageUrl = typeof lightbox === 'string' ? lightbox : lightbox.url;
  const imageTitle = typeof lightbox === 'object' && lightbox.title ? lightbox.title : 'Trade Chart Screenshot';
  const imageSubtitle = typeof lightbox === 'object' && lightbox.subtitle ? lightbox.subtitle : '';

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `trade-chart-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-background/85 backdrop-blur-md overflow-hidden animate-fade-in"
      onClick={() => setLightbox(null)}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card/90 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div>
              <h3 className="text-foreground font-bold text-xs tracking-wide font-num">
                {imageTitle}
              </h3>
              {imageSubtitle && (
                <p className="text-[10px] text-muted-foreground font-num">{imageSubtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Zoom Controls */}
            <button
              onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-num text-muted-foreground w-12 text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownload}
              className="p-1.5 text-muted-foreground hover:text-profit hover:bg-secondary rounded-lg transition cursor-pointer ml-1"
              title="Download Screenshot"
            >
              <Download className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-border mx-1" />

            <button
              onClick={() => setLightbox(null)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center bg-secondary/10 min-h-[300px]">
          <img
            src={imageUrl}
            alt={imageTitle}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="max-w-full max-h-[78vh] object-contain rounded-xl border border-border/60 transition-transform duration-200 select-none shadow-xl"
          />
        </div>
      </div>
    </div>
  );
};
