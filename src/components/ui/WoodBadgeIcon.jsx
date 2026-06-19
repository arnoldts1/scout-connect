import React from 'react';
import { cn } from '@/lib/utils';

const BEAD_DESCRIPTIONS = {
  2: "Completed Wood Badge Training",
  3: "Assistant Leader Trainer (Course Staff)",
  4: "Course Director (Leader Trainer)",
  5: "Deputy Camp Chief of Gilwell",
  6: "Camp Chief of Gilwell Park (Baden-Powell's Original)"
};

export default function WoodBadgeIcon({ beads = 2, size = "md", showLabel = false, className }) {
  const sizes = {
    sm: { width: 32, height: 32, beadSize: 4, logWidth: 20 },
    md: { width: 48, height: 48, beadSize: 6, logWidth: 30 },
    lg: { width: 64, height: 64, beadSize: 8, logWidth: 40 },
    xl: { width: 96, height: 96, beadSize: 10, logWidth: 60 }
  };

  const s = sizes[size] || sizes.md;
  const beadCount = Math.min(Math.max(beads, 2), 6);

  // Generate bead positions along the string
  const generateBeadPositions = (count) => {
    const positions = [];
    const startY = s.height * 0.25;
    const endY = s.height * 0.85;
    const spacing = (endY - startY) / (count + 1);
    
    for (let i = 0; i < count; i++) {
      positions.push({
        x: s.width * 0.35 + (i % 2) * 3,
        y: startY + spacing * (i + 1)
      });
    }
    return positions;
  };

  const beadPositions = generateBeadPositions(beadCount);

  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <svg 
        width={s.width} 
        height={s.height} 
        viewBox={`0 0 ${s.width} ${s.height}`}
        className="drop-shadow-sm"
      >
        {/* Leather thong/string */}
        <path
          d={`M ${s.width * 0.5} ${s.height * 0.1} 
              Q ${s.width * 0.3} ${s.height * 0.2} ${s.width * 0.35} ${s.height * 0.9}`}
          stroke="#4a3728"
          strokeWidth={s.beadSize / 3}
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Wood log */}
        <ellipse
          cx={s.width * 0.6}
          cy={s.height * 0.45}
          rx={s.logWidth / 2}
          ry={s.logWidth / 5}
          fill="#8B4513"
          stroke="#5D3A1A"
          strokeWidth="1"
        />
        <rect
          x={s.width * 0.6 - s.logWidth / 2}
          y={s.height * 0.45}
          width={s.logWidth}
          height={s.logWidth / 3}
          fill="#A0522D"
          stroke="#5D3A1A"
          strokeWidth="1"
        />
        <ellipse
          cx={s.width * 0.6}
          cy={s.height * 0.45 + s.logWidth / 3}
          rx={s.logWidth / 2}
          ry={s.logWidth / 5}
          fill="#8B4513"
          stroke="#5D3A1A"
          strokeWidth="1"
        />
        
        {/* Wood grain lines */}
        <line
          x1={s.width * 0.6 - s.logWidth / 4}
          y1={s.height * 0.45 + 2}
          x2={s.width * 0.6 - s.logWidth / 4}
          y2={s.height * 0.45 + s.logWidth / 3 - 2}
          stroke="#5D3A1A"
          strokeWidth="0.5"
          opacity="0.5"
        />
        <line
          x1={s.width * 0.6 + s.logWidth / 4}
          y1={s.height * 0.45 + 2}
          x2={s.width * 0.6 + s.logWidth / 4}
          y2={s.height * 0.45 + s.logWidth / 3 - 2}
          stroke="#5D3A1A"
          strokeWidth="0.5"
          opacity="0.5"
        />

        {/* Beads */}
        {beadPositions.map((pos, idx) => (
          <g key={idx}>
            {/* Bead shadow */}
            <ellipse
              cx={pos.x + 1}
              cy={pos.y + 1}
              rx={s.beadSize / 2}
              ry={s.beadSize / 2.5}
              fill="rgba(0,0,0,0.2)"
            />
            {/* Main bead */}
            <ellipse
              cx={pos.x}
              cy={pos.y}
              rx={s.beadSize / 2}
              ry={s.beadSize / 2.5}
              fill="#D4A574"
              stroke="#8B6914"
              strokeWidth="0.5"
            />
            {/* Bead hole */}
            <ellipse
              cx={pos.x}
              cy={pos.y}
              rx={s.beadSize / 6}
              ry={s.beadSize / 8}
              fill="#4a3728"
            />
            {/* Bead highlight */}
            <ellipse
              cx={pos.x - s.beadSize / 6}
              cy={pos.y - s.beadSize / 6}
              rx={s.beadSize / 8}
              ry={s.beadSize / 10}
              fill="rgba(255,255,255,0.3)"
            />
          </g>
        ))}

        {/* Bead count indicator */}
        <circle
          cx={s.width * 0.8}
          cy={s.height * 0.85}
          r={s.beadSize}
          fill="#059669"
          stroke="#047857"
          strokeWidth="1"
        />
        <text
          x={s.width * 0.8}
          y={s.height * 0.85 + s.beadSize / 3}
          textAnchor="middle"
          fill="white"
          fontSize={s.beadSize}
          fontWeight="bold"
        >
          {beadCount}
        </text>
      </svg>
      
      {showLabel && (
        <span className="text-xs text-center text-gray-600 dark:text-gray-400 mt-1 max-w-[120px]">
          {BEAD_DESCRIPTIONS[beadCount]}
        </span>
      )}
    </div>
  );
}

export { BEAD_DESCRIPTIONS };