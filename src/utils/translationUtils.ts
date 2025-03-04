/**
 * Utility functions for handling translations and language changes
 */

// List of RTL languages
const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

/**
 * Check if a language code is RTL (Right-to-Left)
 * @param langCode The language code to check
 * @returns True if the language is RTL, false otherwise
 */
export const isRTL = (langCode: string): boolean => {
  // Get the base language code (e.g., 'en-US' -> 'en')
  const baseCode = langCode.split('-')[0].toLowerCase();
  return rtlLanguages.includes(baseCode);
};

/**
 * Apply RTL/LTR direction to HTML based on language
 * @param langCode The language code to check
 * @param shouldDispatchEvent Whether to dispatch a language change event (default: false)
 */
export const applyLanguageDirection = (langCode: string, shouldDispatchEvent = false): void => {
  try {
    const isRtl = isRTL(langCode);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = langCode;
    
    // Add or remove RTL class on body for styling purposes
    if (isRtl) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
    
    // Add language-specific class to body for CSS targeting
    document.body.className = document.body.className
      .replace(/lang-\w+/g, '')
      .trim();
    document.body.classList.add(`lang-${langCode}`);
    
    // Only dispatch event if explicitly requested
    // This prevents infinite loops when event listeners call this function
    if (shouldDispatchEvent) {
      const event = new CustomEvent('languageChange', { 
        detail: { language: langCode, isRtl } 
      });
      document.dispatchEvent(event);
    }
  } catch (error) {
    console.warn('Error applying language direction:', error);
  }
};

/**
 * Get the current language from localStorage or browser settings
 * @returns The current language code
 */
export const getCurrentLanguage = (): string => {
  try {
    // Try to get from localStorage first
    const savedLang = localStorage.getItem('i18nextLng');
    if (savedLang) {
      return savedLang;
    }
    
    // Fallback to browser language
    const browserLang = navigator.language || (navigator as any).userLanguage;
    if (browserLang) {
      // Just get the base language code (e.g., 'en-US' -> 'en')
      return browserLang.split('-')[0];
    }
  } catch (error) {
    console.warn('Error getting current language:', error);
  }
  
  // Default to English
  return 'en';
};

/**
 * Format a date according to the current language
 * @param date The date to format
 * @param options Intl.DateTimeFormatOptions to customize the format
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date, 
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
): string => {
  try {
    const lang = getCurrentLanguage();
    return new Intl.DateTimeFormat(lang, options).format(date);
  } catch (error) {
    console.warn('Error formatting date:', error);
    return date.toDateString();
  }
};

/**
 * Format a number according to the current language
 * @param num The number to format
 * @param options Intl.NumberFormatOptions to customize the format
 * @returns Formatted number string
 */
export const formatNumber = (
  num: number,
  options: Intl.NumberFormatOptions = {}
): string => {
  try {
    const lang = getCurrentLanguage();
    return new Intl.NumberFormat(lang, options).format(num);
  } catch (error) {
    console.warn('Error formatting number:', error);
    return num.toString();
  }
};
