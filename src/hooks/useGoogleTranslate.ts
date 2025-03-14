import { useState, useEffect } from 'react';
import { hideGoogleTranslateElements, applyLanguageDirection } from '../utils/translationUtils';

interface UseGoogleTranslateOptions {
  autoHideBanner?: boolean;
  autoFixHighlights?: boolean;
  checkInterval?: number;
}

/**
 * Custom hook to interact with Google Translate
 * 
 * @param options Configuration options
 * @returns Object with Google Translate state and functions
 */
export function useGoogleTranslate(options: UseGoogleTranslateOptions = {}) {
  const {
    autoHideBanner = true,
    autoFixHighlights = true,
    checkInterval = 500
  } = options;
  
  const [isReady, setIsReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('i18nextLng') || 'en';
  });
  
  // Check if Google Translate is ready
  const checkTranslateReady = () => {
    return !!(
      window.google && 
      window.google.translate && 
      window.google.translate.TranslateElement
    );
  };
  
  // Change language using the most reliable method
  const changeLanguage = (langCode: string) => {
    if (!isReady) {
      console.warn('Google Translate not ready yet');
      return false;
    }
    
    try {
      // Use the select element approach as it's most reliable
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Store the selected language
        localStorage.setItem('i18nextLng', langCode);
        setCurrentLanguage(langCode);
        
        // Apply RTL/LTR direction
        applyLanguageDirection(langCode);
        
        // Hide banner and fix highlights
        if (autoHideBanner) {
          setTimeout(hideGoogleTranslateElements, 100);
          setTimeout(hideGoogleTranslateElements, 500);
        }
        
        return true;
      }
    } catch (error) {
      console.warn('Error changing language:', error);
    }
    
    return false;
  };
  
  // Initialize Google Translate detection
  useEffect(() => {
    // Check if Google Translate is ready
    const intervalId = setInterval(() => {
      if (checkTranslateReady()) {
        setIsReady(true);
        clearInterval(intervalId);
        
        // Apply initial language direction
        applyLanguageDirection(currentLanguage);
      }
    }, checkInterval);
    
    // Clean up interval
    return () => clearInterval(intervalId);
  }, [currentLanguage, checkInterval]);
  
  // Set up auto-hiding of banners and fixing highlights
  useEffect(() => {
    if (!autoHideBanner && !autoFixHighlights) return;
    
    // Hide elements on mount
    hideGoogleTranslateElements();
    
    // Set up observer for dynamic elements
    const observer = new MutationObserver((mutations) => {
      const shouldHide = mutations.some(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          return Array.from(mutation.addedNodes).some(node => {
            if (node instanceof HTMLElement) {
              return node.classList.contains('VIpgJd-yAWNEb-hvhgNd') || 
                     node.classList.contains('goog-te-banner-frame');
            }
            return false;
          });
        } else if (autoFixHighlights && 
                  mutation.type === 'attributes' && 
                  mutation.attributeName === 'class' && 
                  mutation.target instanceof HTMLElement) {
          const element = mutation.target as HTMLElement;
          return element.classList.contains('goog-text-highlight') ||
                 element.classList.contains('VIpgJd-yAWNEb-VIpgJd-fmcmS-sn54Q');
        }
        return false;
      });
      
      if (shouldHide) {
        hideGoogleTranslateElements();
      }
    });
    
    // Start observing
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Apply multiple times with delays
    const timeouts = [100, 500, 1000, 2000].map(delay => 
      setTimeout(hideGoogleTranslateElements, delay)
    );
    
    // Clean up
    return () => {
      observer.disconnect();
      timeouts.forEach(clearTimeout);
    };
  }, [autoHideBanner, autoFixHighlights]);
  
  return {
    isReady,
    currentLanguage,
    changeLanguage
  };
}
