import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function MediaViewer({ 
  mediaUrl, 
  mediaType, 
  isOpen, 
  onClose, 
  allMedia = [] 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const currentMedia = allMedia[currentIndex] || { url: mediaUrl, type: mediaType };
  const hasMultiple = allMedia.length > 1;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle pinch zoom for touch devices
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setDragStart({ ...dragStart, pinchDistance: distance });
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && dragStart.pinchDistance) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const scaleFactor = distance / dragStart.pinchDistance;
      setScale(Math.min(Math.max(scaleFactor, 1), 3));
    } else if (isDragging) {
      setPosition({
        x: position.x + (e.touches[0].clientX - dragStart.x),
        y: position.y + (e.touches[0].clientY - dragStart.y)
      });
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
  };

  // Desktop zoom controls
  const handleZoom = (direction) => {
    setScale(prev => {
      const newScale = direction === 'in' ? prev + 0.2 : prev - 0.2;
      return Math.min(Math.max(newScale, 1), 3);
    });
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = currentMedia.url;
    a.download = `media-${Date.now()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? allMedia.length - 1 : prev - 1));
    resetZoom();
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === allMedia.length - 1 ? 0 : prev + 1));
    resetZoom();
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <Button
        onClick={onClose}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/10 rounded-full"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Download button */}
      <Button
        onClick={handleDownload}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-16 z-10 text-white hover:bg-white/10 rounded-full"
      >
        <Download className="w-6 h-6" />
      </Button>

      {/* Zoom controls (desktop) */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 hidden md:flex">
        <Button
          onClick={() => handleZoom('out')}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 rounded-full"
          disabled={scale <= 1}
        >
          <ZoomOut className="w-6 h-6" />
        </Button>
        <div className="bg-white/10 rounded-full px-4 py-2 text-white text-sm min-w-[60px] flex items-center justify-center">
          {Math.round(scale * 100)}%
        </div>
        <Button
          onClick={() => handleZoom('in')}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 rounded-full"
          disabled={scale >= 3}
        >
          <ZoomIn className="w-6 h-6" />
        </Button>
      </div>

      {/* Main media container */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentMedia.type === 'image' ? (
          <img
            ref={imageRef}
            src={currentMedia.url}
            alt="Full view"
            className="max-w-[90%] max-h-[90%] object-contain transition-transform select-none"
            style={{
              transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
              cursor: scale > 1 ? 'grab' : 'default'
            }}
            draggable={false}
          />
        ) : currentMedia.type === 'video' ? (
          <video
            controls
            className="max-w-[90%] max-h-[90%] object-contain"
            style={{
              transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`
            }}
          >
            <source src={currentMedia.url} />
            Your browser does not support the video tag.
          </video>
        ) : null}
      </div>

      {/* Navigation arrows for multiple media */}
      {hasMultiple && (
        <>
          <Button
            onClick={handlePrevious}
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/10 rounded-full"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>

          <Button
            onClick={handleNext}
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/10 rounded-full"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>

          {/* Media counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 rounded-full px-4 py-2 text-white text-sm">
            {currentIndex + 1} / {allMedia.length}
          </div>
        </>
      )}
    </div>
  );
}
