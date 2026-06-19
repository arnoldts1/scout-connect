import React from 'react';
import CampsiteMap from './CampsiteMap';

export default function CampsiteMapView({ layout = [] }) {
  if (!layout || layout.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-400">No campsite layout saved yet</p>
      </div>
    );
  }

  return (
    <CampsiteMap 
      initialLayout={layout} 
      viewOnly={true}
    />
  );
}
