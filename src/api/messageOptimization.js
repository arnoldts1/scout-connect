import { base44 } from './base44Client';

/**
 * Pagination config
 */
const PAGE_SIZE = 50;
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Load messages with pagination
 * @param {string} conversationId - Conversation ID
 * @param {number} page - Page number (0-indexed)
 * @returns {Promise<Array>} - Page of messages
 */
export async function loadMessagesPage(conversationId, page = 0) {
  try {
    const messages = await base44.entities.Message.filter(
      { conversation_id: conversationId },
      'created_date',
      999
    );

    const startIndex = page * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    // Return messages in reverse order (newest first)
    return messages.slice(startIndex, endIndex);
  } catch (error) {
    console.error('Error loading messages page:', error);
    return [];
  }
}

/**
 * Compress image before upload
 * @param {File} file - Image file
 * @param {number} maxWidth - Max width in pixels
 * @param {number} maxHeight - Max height in pixels
 * @returns {Promise<Blob>} - Compressed image blob
 */
export async function compressImage(file, maxWidth = 800, maxHeight = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to blob
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress video file size
 * Note: This is a client-side hint - actual compression would require server processing
 * @param {File} file - Video file
 * @returns {Object} - Compression info
 */
export function getVideoCompressionInfo(file) {
  const sizeMB = file.size / (1024 * 1024);
  const maxSizeMB = 25; // Max video size

  return {
    currentSizeMB: Math.round(sizeMB * 100) / 100,
    isCompressed: sizeMB <= maxSizeMB,
    suggestedQuality: sizeMB > 100 ? 'low' : sizeMB > 50 ? 'medium' : 'high'
  };
}

/**
 * Lazy load images - only load when needed
 * @param {string} imageUrl - Image URL
 * @returns {Promise<string>} - Resolved when image is loaded
 */
export async function preloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(imageUrl);
    img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
    img.src = imageUrl;
  });
}

/**
 * Batch load multiple images
 * @param {Array<string>} imageUrls - Array of image URLs
 * @returns {Promise<Array>} - Preloaded images
 */
export async function preloadImages(imageUrls) {
  return Promise.allSettled(
    imageUrls.map(url => preloadImage(url))
  );
}

/**
 * Debounce function for search and typing
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, delay = 300) {
  let timeoutId;

  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Throttle function for frequent events
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit = 1000) {
  let inThrottle;

  return function throttled(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Virtual scrolling helper for large message lists
 * Calculates which items should be rendered based on scroll position
 * @param {number} scrollPosition - Current scroll position
 * @param {number} containerHeight - Height of visible container
 * @param {number} itemHeight - Height of each item
 * @param {number} totalItems - Total number of items
 * @returns {Object} - { startIndex, endIndex, offset }
 */
export function calculateVirtualScrollRange(
  scrollPosition,
  containerHeight,
  itemHeight,
  totalItems
) {
  const startIndex = Math.floor(scrollPosition / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 2, totalItems);

  return {
    startIndex: Math.max(0, startIndex - 1),
    endIndex,
    offset: startIndex * itemHeight
  };
}

/**
 * Cache key generator for messages
 * @param {string} conversationId - Conversation ID
 * @param {number} page - Page number
 * @returns {string} - Cache key
 */
export function getMessagesCacheKey(conversationId, page = 0) {
  return `messages:${conversationId}:${page}`;
}

/**
 * Rate limiter for API calls
 * @param {Function} func - API function
 * @param {number} limit - Calls per second
 * @returns {Function} - Rate-limited function
 */
export function rateLimit(func, limit = 5) {
  let lastCallTime = 0;
  let queue = [];

  const executeNext = () => {
    if (queue.length === 0) return;

    const { args, resolve, reject } = queue.shift();
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    const delayNeeded = Math.max(0, 1000 / limit - timeSinceLastCall);

    setTimeout(() => {
      lastCallTime = Date.now();
      func(...args).then(resolve).catch(reject);
      executeNext();
    }, delayNeeded);
  };

  return (...args) => {
    return new Promise((resolve, reject) => {
      queue.push({ args, resolve, reject });
      executeNext();
    });
  };
}

/**
 * Memory-efficient message storage
 * Only keep recent messages in memory, archive older ones
 * @param {Array} messages - All messages
 * @param {number} keepRecent - Number of recent messages to keep
 * @returns {Object} - { recent, archived }
 */
export function optimizeMessageStorage(messages, keepRecent = 100) {
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date)
  );

  return {
    recent: sortedMessages.slice(0, keepRecent),
    archived: sortedMessages.slice(keepRecent),
    totalCount: messages.length,
    memoryUsageEstimate: {
      recent: `${(keepRecent * 2).toFixed(0)} KB`,
      archived: `${(sortedMessages.length * 2).toFixed(0)} KB`
    }
  };
}

/**
 * Intersection Observer helper for lazy loading
 * @param {Function} callback - Callback when element is visible
 * @param {Object} options - IntersectionObserver options
 * @returns {IntersectionObserver} - Observer instance
 */
export function createLazyLoadObserver(callback, options = {}) {
  const defaultOptions = {
    root: null,
    rootMargin: '100px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, defaultOptions);
}
