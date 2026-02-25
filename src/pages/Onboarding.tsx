import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setOnboarded, getSettings, saveSettings } from '../services/storage';
import { useT } from '../i18n/LanguageContext';

const SCREEN_KEYS = ['onboarding_1', 'onboarding_2', 'onboarding_3'] as const;

export default function Onboarding() {
    const [step, setStep] = useState(0);
    const [fading, setFading] = useState(false);
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const navigate = useNavigate();
    const t = useT();

    const isLast = step === SCREEN_KEYS.length - 1;

    function advance() {
        if (fading) return;

        if (isLast) {
            // Save trusted contact if provided
            if (contactName.trim() && contactPhone.trim()) {
                const existing = getSettings();
                saveSettings({
                    ...existing,
                    trustedContacts: [
                        { name: contactName.trim(), phone: contactPhone.trim() }
                    ]
                });
            }

            setOnboarded();
            window.dispatchEvent(new Event('onboarding-complete'));
            navigate('/', { replace: true });
            return;
        }

        // Fade out → swap step → fade in
        setFading(true);
        setTimeout(() => {
            setStep((s) => s + 1);
            setFading(false);
        }, 250);
    }

    // Split on \n to render multi-line text
    const lines = t(SCREEN_KEYS[step]).split('\n');

    return (
        <div className="center-page">
            <div className={`onboarding-content${fading ? ' fading-out' : ' fading-in'}`}>
                <p className="onboarding-text">
                    {lines.map((line, i) => (
                        <span key={i}>
                            {line}
                            {i < lines.length - 1 && <br />}
                        </span>
                    ))}
                </p>

                {step === 2 && (
                    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300 }}>
                        <input
                            className="note-input"
                            placeholder="Имя (например, Мама)"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                        />
                        <input
                            className="note-input"
                            type="tel"
                            placeholder="Номер телефона"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                        />
                    </div>
                )}

                <div className="onboarding-dots">
                    {SCREEN_KEYS.map((_, i) => (
                        <span key={i} className={`onboarding-dot${i === step ? ' active' : ''}`} />
                    ))}
                </div>

                <button className="btn btn-onboarding" onClick={advance}>
                    {isLast ? t('start') : t('continue')}
                </button>
            </div>
        </div>
    );
}
