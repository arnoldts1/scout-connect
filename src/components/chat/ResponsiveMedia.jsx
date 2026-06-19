import React, { useState } from 'react';
import { Play, FileText } from 'lucide-react';
import MediaViewer from './MediaViewer'
import { cn } from '@/lib/utils';

export default function ResponsiveMedia({ 
  mediaUrl, 
  mediaType, 
  mediaFiles = [],
  isOwn = false 
}) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  if (!mediaUrl) return null;

  const handleClick = () => {
    if (mediaType === 'image' || mediaType === 'video') {
      setIsViewerOpen(true);
    }
  };

  const containerClass = "max-w-[300px] rounded-2xl overflow-hidden";

  if (mediaType === 'image') {
    return (
      <>
        <img
          src={mediaUrl}
          alt="Chat media"
          className={`${containerClass} cursor-pointer hover:opacity-80 transition w-full h-auto object-cover`}
          onClick={handleClick}
          style={{
            maxHeight: '400px'
          }}
        />
        <MediaViewer
          mediaUrl={mediaUrl}
          mediaType={mediaType}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          allMedia={mediaFiles}
        />
      </>
    );
  }

  if (mediaType === 'video') {
    return (
      <>
        <div
          className={`${containerClass} bg-black/10 relative cursor-pointer group`}
          onClick={handleClick}
        >
          <video
            src={mediaUrl}
            className="w-full h-auto object-cover max-h-[400px]"
            onClick={(e) => {
              e.stopPropagation();
              setIsViewerOpen(true);
            }}
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition flex items-center justify-center">
            <Play className="w-12 h-12 text-white opacity-70 group-hover:opacity-100 transition" />
          </div>
        </div>
        <MediaViewer
          mediaUrl={mediaUrl}
          mediaType={mediaType}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          allMedia={mediaFiles}
        />
      </>
    );
  }

  if (mediaType === 'file') {
    const fileName = mediaUrl.split('/').pop() || 'File';
    const fileSize = '2.5 MB'; // TODO: Get actual file size from metadata

    return (
      <div
        className={`${containerClass} ${
          isOwn
            ? 'bg-emerald-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
        } flex items-center gap-3 p-3 cursor-pointer hover:opacity-80 transition`}
      >
        <FileText className="w-6 h-6 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{fileName}</p>
          <p className="text-xs opacity-75">{fileSize}</p>
        </div>
      </div>
    );
  }

  return null;
}
