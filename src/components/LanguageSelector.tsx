import React from 'react';

interface Language {
  code: string;
  name: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'ru', name: 'Русский' },
  { code: 'pt', name: 'Português' },
  { code: 'pl', name: 'Polski' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
];

export function LanguageSelector() {
  const changeLanguage = (lang: string) => {
    // Set Google Translate language
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event('change'));
    }
  };

  return (
    <select
      onChange={(e) => changeLanguage(e.target.value)}
      className="block w-[40%] px-3 py-2 text-base text-black bg-white/30 backdrop-blur-sm border border-gray-300 rounded-md shadow-sm 
      focus:outline-none focus:ring-blue-500 focus:border-blue-500 notranslate"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
