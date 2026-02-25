import translations from './translations';
import type { Language } from './translations';
export type { Language };

const LS_KEY = 'dc_language';

export function getSavedLanguage(): Language | null {
    const val = localStorage.getItem(LS_KEY);
    if (val === 'en' || val === 'ru') return val;
    return null;
}

export function saveLanguage(lang: Language): void {
    localStorage.setItem(LS_KEY, lang);
}

export function t(key: string, lang?: Language): string {
    const l = lang ?? getSavedLanguage() ?? 'en';
    return translations[l][key] ?? translations['en'][key] ?? key;
}
