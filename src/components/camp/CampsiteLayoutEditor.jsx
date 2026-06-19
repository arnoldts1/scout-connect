import React, { useState, useRef, useEffect } from 'react';
import { 
  Tent, Flame, Droplets, TreePine, Users, CircleDot,
  Plus, Trash2, Move, RotateCcw, Save, ZoomIn, ZoomOut, Fence, Wind, Triangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const CAMP_ITEMS = [
  { id: 'tent', label: 'Tent', icon: Tent, color: '#22c55e' },
  { id: 'campfire', label: 'Campfire', icon: Flame, color: '#f97316' },
  { id: 'water', label: 'Water Source', icon: Droplets, color: '#3b82f6' },
  { id: 'tree', label: 'Tree', icon: TreePine, color: '#15803d' },
  { id: 'gathering', label: 'Gathering Area', icon: Users, color: '#8b5cf6' },
  { id: 'fence', label: 'Fence', icon: Fence, color: '#92400e' },
  { id: 'string_fence', label: 'String Fence', icon: Fence, color: '#a16207' },
  { id: 'tripod', label: 'Tripod Gate', icon: Triangle, color: '#78350f' },
  { id: 'wind', label: 'Wind Direction', icon: Wind, color: '#0ea5e9' },
  { id: 'marker', label: 'Marker', icon: CircleDot, color: '#6b7280' },
];

export default function CampsiteLayoutEditor({ initialLayout = [], onChange }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [scale, setScale] = useState(1);
  const [tool, setTool] = useState('tent');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [fenceStart, setFenceStart] = useState(null);
  const [isDrawingFence, setIsDrawingFence] = useState(false);

  // Load initial layout on mount and when it changes
  useEffect(() => {
    if (initialLayout && Array.isArray(initialLayout)) {
      setItems(initialLayout);
    }
  }, [JSON.stringify(initialLayout)]);

  useEffect(() => {
    onChange?.(items);
  }, [items]);

  const getMousePos = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  };

  const handleCanvasClick = (e) => {
    if (isDragging) return;
    
    const pos = getMousePos(e);
    
    // Handle fence drawing (both fence and string_fence)
    if (tool === 'fence' || tool === 'string_fence') {
      if (!fenceStart) {
        setFenceStart(pos);
        setIsDrawingFence(true);
      } else {
        // Complete the fence line
        const newItem = {
          id: `item-${Date.now()}`,
          type: tool,
          x: fenceStart.x,
          y: fenceStart.y,
          x2: pos.x,
          y2: pos.y,
          label: tool === 'string_fence' ? 'String Fence' : 'Fence',
          rotation: 0
        };
        setItems([...items, newItem]);
        setSelectedItem(newItem.id);
        setFenceStart(null);
        setIsDrawingFence(false);
      }
      return;
    }
    
    const clickedItem = items.find(item => {
      if (item.type === 'fence' || item.type === 'string_fence') {
        // Check distance to line for fence items
        const dist = distanceToLine(pos, { x: item.x, y: item.y }, { x: item.x2, y: item.y2 });
        return dist < 10;
      }
      const dx = item.x - pos.x;
      const dy = item.y - pos.y;
      return Math.sqrt(dx * dx + dy * dy) < 25;
    });

    if (clickedItem) {
      setSelectedItem(clickedItem.id);
    } else {
      // Add new item
      const newItem = {
        id: `item-${Date.now()}`,
        type: tool,
        x: pos.x,
        y: pos.y,
        label: CAMP_ITEMS.find(i => i.id === tool)?.label || '',
        rotation: 0
      };
      setItems([...items, newItem]);
      setSelectedItem(newItem.id);
    }
  };

  const distanceToLine = (point, lineStart, lineEnd) => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = lenSq !== 0 ? dot / lenSq : -1;
    let xx, yy;
    if (param < 0) { xx = lineStart.x; yy = lineStart.y; }
    else if (param > 1) { xx = lineEnd.x; yy = lineEnd.y; }
    else { xx = lineStart.x + param * C; yy = lineStart.y + param * D; }
    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleMouseDown = (e, itemId) => {
    e.stopPropagation();
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const pos = getMousePos(e);
    setDragOffset({ x: pos.x - item.x, y: pos.y - item.y });
    setDraggedItem(itemId);
    setSelectedItem(itemId);
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !draggedItem) return;

    const pos = getMousePos(e);
    setItems(items.map(item => 
      item.id === draggedItem 
        ? { ...item, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
        : item
    ));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedItem(null);
  };

  const deleteSelected = () => {
    if (!selectedItem) return;
    setItems(items.filter(i => i.id !== selectedItem));
    setSelectedItem(null);
  };

  const rotateSelected = () => {
    if (!selectedItem) return;
    setItems(items.map(item => 
      item.id === selectedItem 
        ? { ...item, rotation: (item.rotation || 0) + 45 }
        : item
    ));
  };

  const updateItemLabel = (label) => {
    if (!selectedItem) return;
    setItems(items.map(item => 
      item.id === selectedItem ? { ...item, label } : item
    ));
  };

  const selectedItemData = items.find(i => i.id === selectedItem);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-gray-900 rounded-xl border">
        <div className="flex gap-1 border-r pr-2">
          {CAMP_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTool(item.id)}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                  tool === item.id ? "bg-teal-100 text-teal-700" : "hover:bg-gray-100"
                )}
                title={item.label}
              >
                <Icon className="w-5 h-5" style={{ color: tool === item.id ? item.color : undefined }} />
              </button>
            );
          })}
        </div>

        <div className="flex gap-1 border-r pr-2">
          <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(s + 0.1, 2))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(s - 0.1, 0.5))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>

        {selectedItem && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={rotateSelected}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={deleteSelected} className="text-red-500">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="relative w-full h-[400px] bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-dashed border-green-300 overflow-hidden cursor-crosshair"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="absolute inset-0"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {/* Grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#22c55e" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Fence lines */}
          <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            {/* Regular fence */}
            {items.filter(item => item.type === 'fence' && item.x2 !== undefined && item.y2 !== undefined).map(item => {
              const isSelected = item.id === selectedItem;
              return (
                <g key={item.id}>
                  <line
                    x1={item.x || 0}
                    y1={item.y || 0}
                    x2={item.x2 || 0}
                    y2={item.y2 || 0}
                    stroke="#92400e"
                    strokeWidth={isSelected ? 6 : 4}
                    strokeLinecap="round"
                    strokeDasharray="8 4"
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setSelectedItem(item.id); }}
                  />
                  {isSelected && (
                    <>
                      <circle cx={item.x || 0} cy={item.y || 0} r="6" fill="#0d9488" />
                      <circle cx={item.x2 || 0} cy={item.y2 || 0} r="6" fill="#0d9488" />
                    </>
                  )}
                </g>
              );
            })}
            {/* String fence with X markers */}
            {items.filter(item => item.type === 'string_fence' && item.x2 !== undefined && item.y2 !== undefined).map(item => {
              const isSelected = item.id === selectedItem;
              const x1 = item.x || 0;
              const y1 = item.y || 0;
              const x2 = item.x2 || 0;
              const y2 = item.y2 || 0;
              const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
              const numX = Math.max(2, Math.floor(length / 30));
              const xMarkers = [];
              for (let i = 1; i < numX; i++) {
                const t = i / numX;
                xMarkers.push({
                  x: x1 + (x2 - x1) * t,
                  y: y1 + (y2 - y1) * t
                });
              }
              return (
                <g key={item.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#a16207"
                    strokeWidth={isSelected ? 3 : 2}
                    strokeLinecap="round"
                    strokeDasharray="12 6"
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setSelectedItem(item.id); }}
                  />
                  {xMarkers.map((marker, idx) => (
                    <g key={idx} transform={`translate(${marker.x}, ${marker.y})`}>
                      <line x1="-4" y1="-4" x2="4" y2="4" stroke="#a16207" strokeWidth="2" />
                      <line x1="4" y1="-4" x2="-4" y2="4" stroke="#a16207" strokeWidth="2" />
                    </g>
                  ))}
                  {isSelected && (
                    <>
                      <circle cx={x1} cy={y1} r="5" fill="#0d9488" />
                      <circle cx={x2} cy={y2} r="5" fill="#0d9488" />
                    </>
                  )}
                </g>
              );
            })}
            {/* Drawing preview */}
            {isDrawingFence && fenceStart && (
              <line
                x1={fenceStart.x}
                y1={fenceStart.y}
                x2={fenceStart.x}
                y2={fenceStart.y}
                stroke={tool === 'string_fence' ? "#a16207" : "#92400e"}
                strokeWidth={tool === 'string_fence' ? 2 : 3}
                strokeDasharray={tool === 'string_fence' ? "12 6" : "8 4"}
                opacity={0.5}
                className="fence-preview"
              />
            )}
          </svg>

          {/* Tripod items rendered in SVG */}
          <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            {items.filter(item => item.type === 'tripod').map(item => {
              const isSelected = item.id === selectedItem;
              const x = item.x || 0;
              const y = item.y || 0;
              const rotation = item.rotation || 0;
              return (
                <g 
                  key={item.id} 
                  transform={`translate(${x}, ${y}) rotate(${rotation})`}
                  className="pointer-events-auto cursor-move"
                  onMouseDown={(e) => handleMouseDown(e, item.id)}
                  onClick={(e) => { e.stopPropagation(); setSelectedItem(item.id); }}
                >
                  {/* Three poles meeting at top */}
                  <line x1="0" y1="-8" x2="-10" y2="12" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
                  <line x1="0" y1="-8" x2="10" y2="12" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
                  <line x1="0" y1="-8" x2="0" y2="14" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
                  {/* Lashing at top */}
                  <circle cx="0" cy="-7" r="3" fill="#a16207" />
                  {/* Selection ring */}
                  {isSelected && <circle cx="0" cy="2" r="16" fill="none" stroke="#0d9488" strokeWidth="2" />}
                  {/* Label */}
                  {item.label && (
                    <text 
                      x="0" 
                      y="26" 
                      textAnchor="middle" 
                      fontSize="10" 
                      fill="#374151"
                      transform={`rotate(${-rotation})`}
                    >
                      {item.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Wind direction indicators */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {items.filter(item => item.type === 'wind').map(item => {
              const isSelected = item.id === selectedItem;
              const rotation = item.rotation || 0;
              return (
                <g 
                  key={item.id} 
                  transform={`translate(${item.x}, ${item.y}) rotate(${rotation})`}
                  className="pointer-events-auto cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setSelectedItem(item.id); }}
                >
                  {/* Arrow line */}
                  <line x1="-30" y1="0" x2="30" y2="0" stroke="#0ea5e9" strokeWidth={isSelected ? 4 : 3} />
                  {/* Arrow head */}
                  <polygon points="30,0 20,-8 20,8" fill="#0ea5e9" />
                  {/* Wind icon at start */}
                  <circle cx="-30" cy="0" r="12" fill="#0ea5e9" className={isSelected ? "stroke-teal-500 stroke-2" : ""} />
                  <text x="-30" y="4" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">W</text>
                </g>
              );
            })}
          </svg>

          {/* Regular Items (non-fence, non-string_fence, non-wind, non-tripod) */}
          {items.filter(item => item.type !== 'fence' && item.type !== 'string_fence' && item.type !== 'wind' && item.type !== 'tripod').map(item => {
            const itemConfig = CAMP_ITEMS.find(i => i.id === item.type);
            const Icon = itemConfig?.icon || CircleDot;
            const isSelected = item.id === selectedItem;

            return (
              <div
                key={item.id}
                className={cn(
                  "absolute cursor-move flex flex-col items-center transition-shadow",
                  isSelected && "z-10"
                )}
                style={{
                  left: item.x - 20,
                  top: item.y - 20,
                  transform: `rotate(${item.rotation || 0}deg)`
                }}
                onMouseDown={(e) => handleMouseDown(e, item.id)}
              >
                <div 
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shadow-md",
                    isSelected && "ring-2 ring-offset-2 ring-teal-500"
                  )}
                  style={{ backgroundColor: itemConfig?.color || '#6b7280' }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {item.label && (
                  <span 
                    className="text-xs mt-1 px-1 bg-white/80 rounded whitespace-nowrap"
                    style={{ transform: `rotate(${-(item.rotation || 0)}deg)` }}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
            <div className="text-center">
              <Plus className="w-8 h-8 mx-auto mb-2" />
              <p>Click to add camp items</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected item properties */}
      {selectedItemData && (
        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border">
          <Label className="text-sm text-gray-500">Item Label</Label>
          <Input
            value={selectedItemData.label || ''}
            onChange={(e) => updateItemLabel(e.target.value)}
            placeholder="e.g. Patrol 1 Tent"
            className="mt-1"
          />
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-sm">
        {CAMP_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: item.color }}>
                <Icon className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-gray-600">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}