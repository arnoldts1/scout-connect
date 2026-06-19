import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MultiPhotoGrid({ mediaUrls, className }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const count = mediaUrls?.length || 0;

  if (count === 0) return null;

  // Single image
  if (count === 1) {
    return (
      <div className={cn("aspect-square bg-black", className)}>
        <img src={mediaUrls[0]} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  // Two images - side by side
  if (count === 2) {
    return (
      <div className={cn("grid grid-cols-2 gap-0.5 aspect-square", className)}>
        {mediaUrls.map((url, idx) => (
          <div key={idx} className="bg-black overflow-hidden">
            <img src={url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    );
  }

  // Three images - one large left, two stacked right
  if (count === 3) {
    return (
      <div className={cn("grid grid-cols-2 gap-0.5 aspect-square", className)}>
        <div className="row-span-2 bg-black overflow-hidden">
          <img src={mediaUrls[0]} alt="" className="w-full h-full object-cover" />
        </div>
        {mediaUrls.slice(1).map((url, idx) => (
          <div key={idx} className="bg-black overflow-hidden">
            <img src={url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    );
  }

  // Four images - 2x2 grid
  if (count === 4) {
    return (
      <div className={cn("grid grid-cols-2 gap-0.5 aspect-square", className)}>
        {mediaUrls.map((url, idx) => (
          <div key={idx} className="bg-black overflow-hidden">
            <img src={url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    );
  }

  // Five+ images - show 5 with +X overlay on last
  return (
    <div className={cn("grid grid-cols-6 grid-rows-2 gap-0.5 aspect-square", className)}>
      {/* First large image - spans 4 cols */}
      <div className="col-span-4 row-span-2 bg-black overflow-hidden">
        <img src={mediaUrls[0]} alt="" className="w-full h-full object-cover" />
      </div>
      {/* Second image */}
      <div className="col-span-2 bg-black overflow-hidden">
        <img src={mediaUrls[1]} alt="" className="w-full h-full object-cover" />
      </div>
      {/* Third/Fourth images in bottom row */}
      <div className="col-span-1 bg-black overflow-hidden">
        <img src={mediaUrls[2]} alt="" className="w-full h-full object-cover" />
      </div>
      {count > 4 ? (
        <div className="col-span-1 bg-black overflow-hidden relative">
          <img src={mediaUrls[3]} alt="" className="w-full h-full object-cover" />
          {count > 4 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-xl">+{count - 4}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="col-span-1 bg-black overflow-hidden">
          <img src={mediaUrls[3]} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}