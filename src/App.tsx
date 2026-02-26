import { useState, useEffect, useCallback } from 'react';
import {
    BrowserRouter, Routes, Route, Navigate,
} from 'react-router-dom';
import { isOnboarded, getSettings } from './services/storage';
import { getSavedLanguage } from './i18n/i18n';
import { applyTheme } from './logic/theme';
import { LanguageProvider, useT } from './i18n/LanguageContext';
import BottomNav from './components/BottomNav';
import LanguageSelect from './pages/LanguageSelect';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import History from './pages/History';
import Report from './pages/Report';
import Insights from './pages/Insights';
import SettingsPage from './pages/Settings';
import Chat from './pages/Chat';
import OnboardingOverlay from './components/OnboardingOverlay';

function AppRoutes() {
    const [ready, setReady] = useState(false);
    const [hasLanguage, setHasLanguage] = useState(false);
    const [onboarded, setOnboardedState] = useState(false);
    // Consume useT so the tree re-renders on language change
    useT();

    // Read persisted state once on mount
    useEffect(() => {
        setHasLanguage(getSavedLanguage() !== null);
        setOnboardedState(isOnboarded());
        setReady(true);
    }, []);

    // Listen for custom events from child components
    const handleLanguageSet = useCallback(() => {
        setHasLanguage(true);
    }, []);

    const handleOnboarded = useCallback(() => {
        setOnboardedState(true);
    }, []);

    useEffect(() => {
        window.addEventListener('language-set', handleLanguageSet);
        window.addEventListener('onboarding-complete', handleOnboarded);
        return () => {
            window.removeEventListener('language-set', handleLanguageSet);
            window.removeEventListener('onboarding-complete', handleOnboarded);
        };
    }, [handleLanguageSet, handleOnboarded]);

    // Theme setup
    useEffect(() => {
        const settings = getSettings();
        applyTheme(settings.theme);

        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            if (getSettings().theme === 'system') applyTheme('system');
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Wait for localStorage read before rendering anything
    if (!ready) return null;

    if (!hasLanguage) {
        return (
            <Routes>
                <Route path="/language" element={<LanguageSelect />} />
                <Route path="*" element={<Navigate to="/language" replace />} />
            </Routes>
        );
    }

    if (!onboarded) {
        return (
            <Routes>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="*" element={<Navigate to="/onboarding" replace />} />
            </Routes>
        );
    }

    return (
        <>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/history" element={<History />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/report" element={<Report />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <BottomNav />
            <OnboardingOverlay />
        </>
    );
}

export default function App() {
    return (
        <LanguageProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </LanguageProvider>
    );
}
