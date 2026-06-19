import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw, Check, X } from 'lucide-react';

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleCrop = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    const container = containerRef.current;
    
    if (!img || !ctx || !container) return;

    const cropSize = 300;
    canvas.width = cropSize;
    canvas.height = cropSize;

    // Get container dimensions (the visible crop circle area)
    const containerSize = container.offsetWidth; // 256px (w-64)
    
    // The image is displayed at 300% width of container, centered
    const displayedImgWidth = containerSize * 3;
    const displayedImgHeight = (img.naturalHeight / img.naturalWidth) * displayedImgWidth;
    
    // Calculate scale ratio between natural and displayed size
    const scaleRatioX = img.naturalWidth / displayedImgWidth;
    const scaleRatioY = img.naturalHeight / displayedImgHeight;
    
    // The image center is at container center + position offset
    // We need to find what part of the natural image is visible in the crop circle
    
    // Center of the displayed image relative to container center
    const imgCenterX = displayedImgWidth / 2 + position.x;
    const imgCenterY = displayedImgHeight / 2 + position.y;
    
    // The crop area in displayed coordinates (centered in container)
    const cropDisplayX = containerSize / 2 - (containerSize / 2) / scale;
    const cropDisplayY = containerSize / 2 - (containerSize / 2) / scale;
    const cropDisplaySize = containerSize / scale;
    
    // Convert to image's displayed coordinate system
    // The image starts at -(displayedImgWidth/2 - containerSize/2) + position.x from left edge
    const imgDisplayOffsetX = (displayedImgWidth - containerSize) / 2 - position.x;
    const imgDisplayOffsetY = (displayedImgHeight - containerSize) / 2 - position.y;
    
    // Crop coordinates in displayed image space
    const srcDisplayX = imgDisplayOffsetX + cropDisplayX;
    const srcDisplayY = imgDisplayOffsetY + cropDisplayY;
    
    // Scale to natural image coordinates
    const srcX = srcDisplayX * scaleRatioX / scale;
    const srcY = srcDisplayY * scaleRatioY / scale;
    const srcWidth = (containerSize * scaleRatioX) / scale;
    const srcHeight = (containerSize * scaleRatioY) / scale;

    // Draw circular clip
    ctx.beginPath();
    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(
      img,
      srcX,
      srcY,
      srcWidth,
      srcHeight,
      0,
      0,
      cropSize,
      cropSize
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'cropped-avatar.jpg', { type: 'image/jpeg' });
        onCropComplete(file);
      }
    }, 'image/jpeg', 0.9);
  };

  const resetPosition = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-center mb-4 text-gray-900 dark:text-white">
          Crop Your Photo
        </h3>
        
        {/* Crop Area */}
        <div 
          ref={containerRef}
          className="relative w-64 h-64 mx-auto overflow-hidden rounded-full border-4 border-emerald-500 bg-gray-100 dark:bg-gray-800 cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <div className="text-gray-500">Loading image...</div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-100 dark:bg-red-900/20">
              <div className="text-red-600 text-center p-4">{error}</div>
            </div>
          )}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop preview"
            className="absolute max-w-none pointer-events-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              left: '50%',
              top: '50%',
              marginLeft: '-150%',
              marginTop: '-150%',
              width: '300%',
              height: 'auto',
              display: isLoading || error ? 'none' : 'block'
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load image. Please try another file.');
            }}
            draggable={false}
          />
        </div>

        <p className="text-xs text-gray-500 text-center mt-2">
          Drag to reposition
        </p>

        {/* Zoom Control */}
        <div className="flex items-center gap-3 mt-4 px-4">
          <ZoomOut className="w-4 h-4 text-gray-500" />
          <Slider
            value={[scale]}
            onValueChange={([val]) => setScale(val)}
            min={0.5}
            max={3}
            step={0.1}
            className="flex-1"
          />
          <ZoomIn className="w-4 h-4 text-gray-500" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            variant="outline"
            onClick={resetPosition}
            className="h-11 rounded-xl px-3"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleCrop}
            disabled={isLoading || !!error}
            className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4 mr-2" />
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
