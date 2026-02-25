import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { getSavedLanguage, saveLanguage, t as translate } from './i18n';
import type { Language } from './i18n';

interface LanguageContextValue {
    language: Language;
    setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
    language: 'en',
    setLanguage: () => { },
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLang] = useState<Language>(
        () => getSavedLanguage() ?? 'en',
    );

    const setLanguage = useCallback((lang: Language) => {
        saveLanguage(lang);
        setLang(lang);
    }, []);

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}

export function useT() {
    const { language } = useContext(LanguageContext);
    return useCallback((key: string) => translate(key, language), [language]);
}
