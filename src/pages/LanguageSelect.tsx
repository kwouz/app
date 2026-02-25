import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageSelect() {
    const navigate = useNavigate();
    const { setLanguage } = useLanguage();

    function pick(lang: 'en' | 'ru') {
        setLanguage(lang);
        window.dispatchEvent(new Event('language-set'));
        navigate('/onboarding', { replace: true });
    }

    return (
        <div className="center-page fade-in">
            <h1 className="lang-title">Choose your language</h1>
            <p className="lang-subtitle">Выберите язык</p>
            <div className="lang-buttons">
                <button className="lang-btn" onClick={() => pick('en')}>
                    🇬🇧 English
                </button>
                <button className="lang-btn" onClick={() => pick('ru')}>
                    🇷🇺 Русский
                </button>
            </div>
        </div>
    );
}
