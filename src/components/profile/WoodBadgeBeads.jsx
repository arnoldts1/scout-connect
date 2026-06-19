import React from 'react';
import { cn } from '@/lib/utils';

export default function WoodBadgeBeads({ beadCount = 2, size = 'md' }) {
  if (!beadCount || beadCount < 2 || beadCount > 6) return null;

  const sizes = {
    sm: { bead: 'w-6 h-8', string: 'w-1' },
    md: { bead: 'w-8 h-12', string: 'w-1.5' },
    lg: { bead: 'w-10 h-14', string: 'w-2' }
  };

  const beadSize = sizes[size];
  const beads = Array.from({ length: beadCount }, (_, i) => i);

  return (
    <div className="flex items-start justify-center gap-1">
      {/* String/Leather thong */}
      <div className={cn(
        "h-12 bg-gradient-to-b from-gray-800 via-gray-700 to-gray-600 rounded-full shadow-sm",
        beadSize.string
      )} />
      
      {/* Beads */}
      <div className="flex flex-wrap justify-center gap-1 max-w-[200px]">
        {beads.map((index) => (
          <div
            key={index}
            className={cn(
              "rounded-md shadow-md relative overflow-hidden",
              beadSize.bead
            )}
            style={{
              background: 'linear-gradient(135deg, #d4a574 0%, #c8915f 50%, #b87e4c 100%)',
            }}
          >
            {/* Wood grain effect */}
            <div className="absolute inset-0 opacity-30">
              <div className="w-full h-px bg-amber-900/40 absolute top-1/4" />
              <div className="w-full h-px bg-amber-900/40 absolute top-2/4" />
              <div className="w-full h-px bg-amber-900/40 absolute top-3/4" />
            </div>
            
            {/* Highlight */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-t-md" />
            
            {/* Shadow */}
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/30 to-transparent rounded-b-md" />
          </div>
        ))}
      </div>
      
      {/* String end */}
      <div className={cn(
        "h-12 bg-gradient-to-b from-gray-800 via-gray-700 to-gray-600 rounded-full shadow-sm",
        beadSize.string
      )} />
    </div>
  );
}