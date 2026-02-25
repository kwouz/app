type Theme = 'light' | 'dark' | 'system';

/** Detects whether the OS prefers dark mode. */
export function detectSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Sets the `data-theme` attribute on the document root. */
export function applyTheme(theme: Theme): void {
    const resolved = theme === 'system' ? detectSystemTheme() : theme;
    document.documentElement.setAttribute('data-theme', resolved);
}
