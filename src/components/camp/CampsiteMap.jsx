import React, { useState, useRef, useEffect } from 'react';
import { 
  Tent, Flame, Droplets, TreePine, Users, CircleDot,
  Plus, Trash2, RotateCcw, ZoomIn, ZoomOut, Fence, Wind, Triangle, Edit2
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
  { id: 'wind', label: 'Wind Direction', icon: Wind, color: '#0ea5e9' },
  { id: 'marker', label: 'Marker', icon: CircleDot, color: '#6b7280' },
];

export default function CampsiteMap({ initialLayout = [], onChange, viewOnly = false }) {
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
  const [tempLine, setTempLine] = useState(null);

  useEffect(() => {
    if (initialLayout && Array.isArray(initialLayout)) {
      setItems(initialLayout);
    }
  }, [JSON.stringify(initialLayout)]);

  useEffect(() => {
    if (!viewOnly) {
      onChange?.(items);
    }
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
    if (viewOnly || isDragging) return;

    // Don't add items if clicking on an existing item (unless in fence mode)
    if (e.target.closest('[data-item-id]') && tool !== 'fence') {
      return;
    }

    const pos = getMousePos(e);

    // Handle fence drawing
    if (tool === 'fence') {
      if (!fenceStart) {
        setFenceStart(pos);
        setIsDrawingFence(true);
      } else {
        const newItem = {
          id: `item-${Date.now()}`,
          type: 'fence',
          x: fenceStart.x,
          y: fenceStart.y,
          x2: pos.x,
          y2: pos.y,
          label: 'Fence',
        };
        setItems([...items, newItem]);
        setSelectedItem(newItem.id);
        setFenceStart(null);
        setIsDrawingFence(false);
      }
      return;
    }

    const clickedItem = items.find(item => {
      if (item.type === 'fence') {
        const dist = distanceToLine(pos, { x: item.x, y: item.y }, { x: item.x2, y: item.y2 });
        return dist < 15;
      }
      const dx = (item.x || 0) - pos.x;
      const dy = (item.y || 0) - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < 30;
    });

    if (clickedItem) {
      setSelectedItem(clickedItem.id);
    } else {
      // Only add new item if not clicking on existing items
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
    if (viewOnly) return;
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
    if (isDrawingFence && fenceStart) {
      const pos = getMousePos(e);
      setTempLine({ x1: fenceStart.x, y1: fenceStart.y, x2: pos.x, y2: pos.y });
    }

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
      {!viewOnly && (
        <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg border">
          <div className="flex gap-1 border-r pr-2">
            {CAMP_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setTool(item.id)}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    tool === item.id 
                      ? "bg-emerald-500 text-white shadow-md" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>

          <div className="flex gap-1 border-r pr-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setScale(s => Math.min(s + 0.2, 2))}
              className="h-9"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}
              className="h-9"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setScale(1)}
              className="h-9 text-xs"
            >
              Reset
            </Button>
          </div>

          {selectedItem && (
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={rotateSelected}
                className="h-9"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={deleteSelected}
                className="h-9 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Canvas */}
      <div 
        ref={containerRef}
        className={cn(
          "relative w-full h-[500px] rounded-lg border-2 overflow-hidden",
          viewOnly 
            ? "bg-gray-50 dark:bg-gray-900 border-gray-300"
            : "bg-green-50 dark:bg-green-900/20 border-dashed border-green-300 cursor-crosshair"
        )}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="absolute inset-0 transition-transform"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {/* Grid Background */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Fences */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            {items.filter(item => item.type === 'fence').map(item => {
              const isSelected = item.id === selectedItem;
              return (
                <g key={item.id} data-item-id={item.id}>
                  <line
                    x1={item.x}
                    y1={item.y}
                    x2={item.x2}
                    y2={item.y2}
                    stroke="#92400e"
                    strokeWidth={isSelected ? 5 : 3}
                    strokeLinecap="round"
                    strokeDasharray="8 4"
                    className="pointer-events-auto cursor-pointer hover:stroke-orange-600"
                    onClick={(e) => { e.stopPropagation(); setSelectedItem(item.id); }}
                  />
                  {isSelected && (
                    <>
                      <circle cx={item.x} cy={item.y} r="5" fill="#10b981" />
                      <circle cx={item.x2} cy={item.y2} r="5" fill="#10b981" />
                    </>
                  )}
                </g>
              );
            })}

            {/* Temporary line while drawing */}
            {tempLine && (
              <line
                x1={tempLine.x1}
                y1={tempLine.y1}
                x2={tempLine.x2}
                y2={tempLine.y2}
                stroke="#92400e"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.5"
              />
            )}
          </svg>

          {/* Items */}
          {items.filter(item => item.type !== 'fence').map(item => {
            const itemConfig = CAMP_ITEMS.find(i => i.id === item.type);
            const Icon = itemConfig?.icon || CircleDot;
            const isSelected = item.id === selectedItem;

            return (
              <div
                key={item.id}
                data-item-id={item.id}
                className="absolute flex flex-col items-center"
                style={{
                  left: item.x - 20,
                  top: item.y - 20,
                  transform: `rotate(${item.rotation || 0}deg)`,
                  cursor: viewOnly ? 'default' : 'move'
                }}
                onMouseDown={(e) => handleMouseDown(e, item.id)}
              >
                <div 
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all",
                    isSelected && !viewOnly && "ring-2 ring-offset-2 ring-emerald-500 scale-110"
                  )}
                  style={{ backgroundColor: itemConfig?.color || '#6b7280' }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {item.label && (
                  <span 
                    className="text-xs mt-1 px-2 py-0.5 bg-white dark:bg-gray-800 rounded shadow whitespace-nowrap font-medium"
                    style={{ transform: `rotate(${-(item.rotation || 0)}deg)` }}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {items.length === 0 && !viewOnly && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
            <div className="text-center">
              <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Click to add camp items or draw fences</p>
            </div>
          </div>
        )}
      </div>

      {/* Item Editor */}
      {!viewOnly && selectedItemData && (
        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
          <div className="flex items-center gap-2 mb-3">
            <Edit2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium text-sm">Edit Item</span>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Label</Label>
            <Input
              value={selectedItemData.label || ''}
              onChange={(e) => updateItemLabel(e.target.value)}
              placeholder="e.g. Patrol 1 Tent"
              className="text-sm"
            />
          </div>
        </div>
      )}

      {/* Legend */}
      {items.length > 0 && (
        <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border">
          <p className="text-xs font-semibold text-gray-600 mb-2">Map Legend</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {CAMP_ITEMS.filter(item => items.some(i => i.type === item.id)).map(item => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: item.color }}>
                    <Icon className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
