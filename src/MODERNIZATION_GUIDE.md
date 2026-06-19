# ScoutConnect Modernization - Developer Guide

## Quick Reference

### 1. Using Themes in Components

```jsx
import { useTheme } from '@/lib/ThemeContext';

export default function MyComponent() {
  const { theme, changeTheme, availableThemes } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme.name}</p>
      <div style={{ color: theme.colors.primary }}>
        Primary color text
      </div>
    </div>
  );
}
```

### 2. Using Translations

```jsx
import { useLanguage } from '@/lib/ThemeContext';

export default function MyComponent() {
  const { t, language, changeLanguage } = useLanguage();
  
  return (
    <div>
      <h1>{t('nav.home', 'Home')}</h1>
      <p>Current: {language}</p>
      <button onClick={() => changeLanguage('rw')}>Kinyarwanda</button>
    </div>
  );
}
```

### 3. Adding New Translation Keys

Edit `/src/translations/en.json`:
```json
{
  "myFeature": {
    "title": "My Feature Title",
    "description": "My feature description"
  }
}
```

Then add to `rw.json` and `fr.json`:
```json
{
  "myFeature": {
    "title": "Aho Akazi Kayarirwe Neza",
    "description": "Description in Kinyarwanda"
  }
}
```

Use in component:
```jsx
const { t } = useLanguage();
<h1>{t('myFeature.title')}</h1>
<p>{t('myFeature.description')}</p>
```

### 4. Available Themes

Access any theme:
```jsx
const { availableThemes } = useTheme();
// ['Classic Light', 'Midnight Blue', 'Royal Purple', 'Scout Orange', 'Forest Green', 'Sunset Gradient', 'Modern Dark', 'Rwanda Inspired']
```

Change theme:
```jsx
const { changeTheme } = useTheme();
changeTheme('Midnight Blue');
```

### 5. Using Animations

Add to elements for automatic animation:
```jsx
<div className="animate-fadeIn">Fades in smoothly</div>
<div className="animate-slideInUp">Slides in from bottom</div>
<button className="btn-modern hover-lift">Lifts on hover</button>
<div className="card-modern">Glass card with hover effect</div>
```

Available animations:
- `animate-fadeIn` - Fade in effect
- `animate-slideInLeft` - Slide from left
- `animate-slideInRight` - Slide from right
- `animate-slideInUp` - Slide from bottom
- `animate-scaleIn` - Scale up
- `animate-pulse` - Pulsing effect
- `animate-bounce` - Bouncing effect
- `hover-lift` - Lifts on hover
- `hover-scale` - Scales on hover
- `hover-glow` - Glows on hover

### 6. Accessibility

Enable accessibility features:
```jsx
import { initializeAccessibility, announceToScreenReader, respectsReducedMotion } from '@/lib/accessibility';

// Announce to screen readers
announceToScreenReader('New message received', 'polite');

// Check if user prefers reduced motion
if (!respectsReducedMotion()) {
  // Apply animations
}
```

Available accessibility utilities:
- `initializeAccessibility()` - Initialize all features
- `announceToScreenReader(message, priority)` - Announce to screen readers
- `respectsReducedMotion()` - Check motion preferences
- `getAnimationDuration(duration)` - Get safe animation duration
- `manageFocus.trapFocus(element)` - Trap focus in modal
- `manageFocus.restoreFocus(element)` - Restore previous focus

### 7. Theme Colors in CSS

Use CSS custom properties:
```css
.myElement {
  background: var(--color-primary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
}
```

Available properties:
- `--color-primary`, `--color-primaryLight`, `--color-primaryDark`
- `--color-secondary`, `--color-accent`
- `--color-background`, `--color-surface`, `--color-surfaceAlt`
- `--color-text`, `--color-textSecondary`, `--color-textTertiary`
- `--color-border`, `--color-borderLight`
- `--color-success`, `--color-warning`, `--color-error`, `--color-info`
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`

### 8. Settings Page

Users can change:
- Theme (8 options)
- Language (3 options)
- Font size (4 sizes)
- High contrast mode
- Dyslexia-friendly font
- Notification preferences
- Password
- 2FA settings

Located at: `/Settings`

### 9. Modern Components

Use these component classes for consistent styling:
```jsx
<div className="card-modern">Glass card</div>
<button className="btn-modern">Modern button</button>
<div className="glassmorphism">Glass effect</div>
<div className="animate-fadeIn">Animated entrance</div>
```

### 10. Conditional Animations

Respect user preferences:
```jsx
import { respectsReducedMotion } from '@/lib/accessibility';

const animationClass = respectsReducedMotion() ? '' : 'animate-fadeIn';
<div className={animationClass}>Content</div>
```

### 11. Creating New Themes (Advanced)

Edit `/src/config/themes.js`:
```js
export const THEMES = {
  myCustomTheme: {
    name: 'My Custom Theme',
    mode: 'light', // or 'dark'
    colors: {
      primary: '#FF6B6B',
      // ... all other colors
    },
    shadows: {
      sm: '0 1px 2px ...',
      // ... all shadows
    }
  }
};
```

### 12. Keyboard Navigation

Already built-in:
- **Tab** - Navigate between elements
- **Alt + M** - Skip to main content
- **Enter/Space** - Activate buttons
- Automatic focus management in modals

### 13. Translation Best Practices

- Use dot notation for nested keys: `"section.subsection.key"`
- Keep strings concise
- Use placeholders for variables: `"hello": "Hello, {name}!"`
- Maintain same structure in all language files
- Use context for ambiguous terms

Example structure:
```json
{
  "common": { ... },
  "nav": { ... },
  "auth": { ... },
  "dashboard": { ... },
  "settings": { ... },
  "scout": { ... }
}
```

### 14. Color Accessibility

Check contrast ratios:
```jsx
import { getContrastRatio, meetsWCAGStandards } from '@/lib/accessibility';

const ratio = getContrastRatio('#000000', '#FFFFFF');
const isAccessible = meetsWCAGStandards(ratio, 'AA');
```

### 15. Performance Tips

- Theme changes are instant (no reload needed)
- Language switching updates UI in real-time
- Animations are GPU-accelerated
- Accessibility features have minimal overhead
- All settings are cached locally and in database

---

## Common Tasks

### Add a new feature with translations:

1. Create component with `useLanguage()` hook
2. Add translation keys to all 3 JSON files
3. Use `t()` function in component
4. Component automatically updates on language change

### Create a modal with animations:

```jsx
<div className="glassmorphism card-modern animate-slideInUp">
  <h2>{t('myModal.title')}</h2>
  <p>{t('myModal.description')}</p>
  <button className="btn-modern">{t('common.save')}</button>
</div>
```

### Make a section responsive and accessible:

```jsx
<section role="region" aria-label={t('nav.messages')}>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Responsive grid */}
  </div>
</section>
```

### Add animation on condition:

```jsx
const { respectsReducedMotion } = import('@/lib/accessibility');
const shouldAnimate = !respectsReducedMotion();

<div className={shouldAnimate ? 'animate-fadeIn' : ''}>
  {/* Content */}
</div>
```

---

## Troubleshooting

### Theme not changing?
- Check if ThemeProvider wraps your component
- Verify theme name matches exactly (case-sensitive)
- Check localStorage if debugging

### Translation not showing?
- Verify key path exists in all language files
- Use `t('key', 'fallback')` for fallback
- Check useLanguage() is called in component
- Ensure component is wrapped by ThemeProvider

### Animations not working?
- Check if reduced motion is enabled
- Verify CSS is loaded (check App.css)
- Check browser supports CSS animations
- Use `animation-delay` for staggered effects

### Accessibility issues?
- Ensure all buttons have aria-labels
- Use semantic HTML (`<button>`, `<nav>`, etc.)
- Test with keyboard-only navigation
- Verify color contrast ratios

---

## Resources

- Theme Config: `/src/config/themes.js`
- Theme Context: `/src/lib/ThemeContext.jsx`
- Translations: `/src/translations/`
- Accessibility: `/src/lib/accessibility.js`
- Global Styles: `/src/App.css`
- Settings Page: `/src/pages/Settings.jsx`
- Dashboard: `/src/components/DashboardModern.jsx`

---

Happy coding! 🚀
