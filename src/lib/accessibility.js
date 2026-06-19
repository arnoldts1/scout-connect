// Accessibility Utilities

export const AccessibilitySettings = {
  FONT_SIZES: {
    small: 14,
    normal: 16,
    large: 18,
    extraLarge: 20,
  },

  FONTS: {
    default: 'system-ui, -apple-system, sans-serif',
    dyslexia: 'OpenDyslexic, "Comic Sans MS", cursive, sans-serif',
  },
};

export const initializeAccessibility = () => {
  // Load font size preference
  const fontSize = localStorage.getItem('scout-font-size');
  if (fontSize) {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }

  // Load high contrast mode
  const highContrast = localStorage.getItem('scout-high-contrast') === 'true';
  if (highContrast) {
    document.documentElement.classList.add('high-contrast');
  }

  // Load dyslexia font preference
  const dyslexiaFont = localStorage.getItem('scout-dyslexia-font') === 'true';
  if (dyslexiaFont) {
    document.documentElement.classList.add('dyslexia-font');
  }

  // Enable keyboard navigation
  enableKeyboardNavigation();

  // Set up screen reader announcements
  setupScreenReaderSupport();
};

// Keyboard Navigation Support
const enableKeyboardNavigation = () => {
  document.addEventListener('keydown', (e) => {
    // Skip to main content (Alt + M)
    if (e.altKey && e.key === 'm') {
      const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Focus next element (Tab)
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-focus');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-focus');
  });
};

// Screen Reader Support
const setupScreenReaderSupport = () => {
  // Add ARIA labels to common elements
  const buttons = document.querySelectorAll('button:not([aria-label])');
  buttons.forEach((button) => {
    if (!button.textContent.trim()) {
      const icon = button.querySelector('svg');
      if (icon) {
        const title = icon.getAttribute('title') || button.getAttribute('title');
        if (title) {
          button.setAttribute('aria-label', title);
        }
      }
    }
  });
};

// Announcement for screen readers
export const announceToScreenReader = (message, priority = 'polite') => {
  let announcement = document.getElementById('sr-announcements');
  if (!announcement) {
    announcement = document.createElement('div');
    announcement.id = 'sr-announcements';
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    document.body.appendChild(announcement);
  }

  announcement.textContent = message;
  announcement.setAttribute('aria-live', priority);
};

// Color contrast checker
export const getContrastRatio = (color1, color2) => {
  const getLuminance = (rgb) => {
    const [r, g, b] = rgb.match(/\d+/g).map((x) => {
      x = parseInt(x) / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

// Check if contrast meets WCAG standards
export const meetsWCAGStandards = (contrastRatio, level = 'AA') => {
  const standards = {
    A: 3,
    AA: 4.5,
    AAA: 7,
  };
  return contrastRatio >= standards[level];
};

// Focus management
export const manageFocus = {
  trapFocus: (element) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    });
  },

  restoreFocus: (previousElement) => {
    if (previousElement && previousElement.focus) {
      previousElement.focus();
    }
  },
};

// Motion preferences
export const respectsReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const getAnimationDuration = (duration = 300) => {
  if (respectsReducedMotion()) {
    return 0;
  }
  return duration;
};
