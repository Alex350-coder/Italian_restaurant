import { useState } from 'react';

type Language = 'en' | 'es';

interface LanguageSwitcherProps {
  className?: string;
}

const labels: Record<Language, { flag: string; name: string; code: string }> = {
  en: { flag: '🇬🇧', name: 'English', code: 'EN' },
  es: { flag: '🇪🇸', name: 'Español', code: 'ES' },
};

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    setIsOpen(false);
    localStorage.setItem('language', lang);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-sm"
        aria-label="Cambia lingua"
      >
        <span className="text-base">{labels[currentLang].flag}</span>
        <span className="font-body text-xs uppercase tracking-wider">{labels[currentLang].code}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl py-2 animate-fade-in z-50">
            {(Object.keys(labels) as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  currentLang === lang
                    ? 'bg-crema text-noche-negro font-semibold'
                    : 'text-noche-negro hover:bg-crema'
                }`}
              >
                <span className="text-base">{labels[lang].flag}</span>
                <span>{labels[lang].name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
