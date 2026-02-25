import { useState, useEffect } from 'react';
import {
    getSettings, saveSettings, resetData,
} from '../services/storage';
import type { Settings } from '../types';
import { applyTheme } from '../logic/theme';
import { useT, useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/i18n';
import ConfirmModal from '../components/ConfirmModal';
import Toggle from '../components/Toggle';
import { useNavigate } from 'react-router-dom';

type Theme = Settings['theme'];

function isContactValid(c: { name: string, phone: string }) {
    const nameValid = c.name.trim().length >= 2;
    const phoneDigits = c.phone.replace(/[\s\-\+\(\)]/g, '');
    const phoneValid = phoneDigits.length >= 8 && /^\d+$/.test(phoneDigits);
    return nameValid && phoneValid;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>(getSettings);
    const [showConfirm, setShowConfirm] = useState(false);
    const t = useT();
    const { language, setLanguage } = useLanguage();
    const navigate = useNavigate();

    const [localContacts, setLocalContacts] = useState<{ name: string, phone: string }[]>(
        () => (getSettings().trustedContacts && getSettings().trustedContacts!.length > 0)
            ? getSettings().trustedContacts!
            : [{ name: '', phone: '' }]
    );
    const [savedIndex, setSavedIndex] = useState<number | null>(null);
    const [removingIndex, setRemovingIndex] = useState<number | null>(null);

    function handleContactChange(index: number, field: 'name' | 'phone', value: string) {
        setLocalContacts(prev => {
            const newContacts = [...prev];
            newContacts[index] = { ...newContacts[index], [field]: value };
            return newContacts;
        });
    }

    function handleSaveContact(index: number) {
        setSettings(prev => {
            const newContacts = prev.trustedContacts ? [...prev.trustedContacts] : [];
            newContacts[index] = localContacts[index];
            return { ...prev, trustedContacts: newContacts };
        });
        setSavedIndex(index);
        setTimeout(() => setSavedIndex(null), 3000);
    }

    function handleAddContactSlot() {
        if (localContacts.length < 2) {
            setLocalContacts(prev => [...prev, { name: '', phone: '' }]);
        }
    }

    function handleRemoveContactSlot(index: number) {
        setRemovingIndex(index);
        setTimeout(() => {
            setLocalContacts(prev => prev.filter((_, i) => i !== index));
            setSettings(prev => {
                if (!prev.trustedContacts) return prev;
                const newContacts = prev.trustedContacts.filter((_, i) => i !== index);
                return { ...prev, trustedContacts: newContacts };
            });
            setRemovingIndex(null);
        }, 250);
    }

    useEffect(() => {
        saveSettings(settings);
        applyTheme(settings.theme);
    }, [settings]);

    function handleTheme(theme: Theme) {
        setSettings((s) => ({ ...s, theme }));
    }

    function confirmReset() {
        resetData();
        setShowConfirm(false);
        window.location.href = '/';
    }

    return (
        <div className="page fade-in">
            <h1 className="page-title">{t('settings_title')}</h1>

            {/* Theme */}
            <section className="settings-section">
                <div className="section-label">{t('settings_appearance')}</div>
                <div className="settings-row">
                    <span>{t('settings_theme')}</span>
                    <div className="pill-toggle">
                        {(['light', 'dark', 'system'] as Theme[]).map((thm) => (
                            <button
                                key={thm}
                                className={`pill-btn${settings.theme === thm ? ' active' : ''}`}
                                onClick={() => handleTheme(thm)}
                            >
                                {t(`settings_${thm === 'system' ? 'system' : thm}`)}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Premium Features */}
            <section className="settings-section">
                <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="pro-badge" style={{ position: 'relative', top: -1 }}>PRO</span>
                    Премиум функции
                </div>
                <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        Разблокируйте доступ к AI-Ассистенту, глубокой аналитике и персональным инсайтам.
                    </p>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/chat')}>
                        {/* As per instruction this directs to /chat, if there is a separate paywall we could direct to /paywall */}
                        Купить Премиум
                    </button>
                    <button className="btn btn-ghost" style={{ width: '100%', fontSize: '0.8125rem' }} onClick={() => navigate('/chat')}>
                        Восстановить покупки
                    </button>
                </div>
            </section>

            {/* Language */}
            <section className="settings-section">
                <div className="section-label">{t('settings_language')}</div>
                <div className="settings-row">
                    <span>{t('settings_language_label')}</span>
                    <div className="pill-toggle">
                        <button
                            className={`pill-btn${language === 'en' ? ' active' : ''}`}
                            onClick={() => setLanguage('en' as Language)}
                        >
                            {t('lang_en')}
                        </button>
                        <button
                            className={`pill-btn${language === 'ru' ? ' active' : ''}`}
                            onClick={() => setLanguage('ru' as Language)}
                        >
                            {t('lang_ru')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Reminders */}
            <section className="settings-section">
                <div className="section-label">{t('settings_reminders')}</div>
                <div className="settings-row">
                    <span>{t('settings_daily_reminder')}</span>
                    <Toggle
                        checked={settings.reminderEnabled}
                        onChange={() => setSettings((s) => ({ ...s, reminderEnabled: !s.reminderEnabled }))}
                    />
                </div>
                {settings.reminderEnabled && (
                    <div className="settings-row">
                        <span>{t('settings_reminder_time')}</span>
                        <input
                            type="time"
                            className="time-input"
                            value={settings.reminderTime}
                            onChange={(e) => setSettings((s) => ({ ...s, reminderTime: e.target.value }))}
                        />
                    </div>
                )}
            </section>

            {/* Trusted Contacts */}
            <section className="settings-section">
                <div className="section-label">Доверенный контакт (для трудных моментов)</div>
                <div className="settings-row" style={{ flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
                    {localContacts.map((contact, idx) => {
                        const valid = isContactValid(contact);
                        const savedContact = settings.trustedContacts?.[idx];
                        const isModified = !savedContact || savedContact.name !== contact.name || savedContact.phone !== contact.phone;
                        const disabled = !valid || !isModified;

                        return (
                            <div key={idx} style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                                paddingBottom: idx === 0 && localContacts.length > 1 ? 16 : 0,
                                borderBottom: idx === 0 && localContacts.length > 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                opacity: removingIndex === idx ? 0 : 1,
                                maxHeight: removingIndex === idx ? 0 : 300,
                                overflow: removingIndex === idx ? 'hidden' : 'visible',
                                transition: 'opacity 200ms ease, max-height 250ms ease, padding 250ms ease, margin 250ms ease'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="note-input"
                                            style={{ marginBottom: 0, paddingRight: idx > 0 ? 44 : 16 }}
                                            placeholder="Имя контакта"
                                            value={contact.name}
                                            onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                                        />
                                        {idx > 0 && (
                                            <button
                                                onClick={() => handleRemoveContactSlot(idx)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    right: 14,
                                                    transform: 'translateY(-50%)',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'rgba(255, 90, 90, 0.85)',
                                                    fontSize: 20,
                                                    width: 24,
                                                    height: 24,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    borderRadius: 6,
                                                    transition: 'all 0.2s ease',
                                                    lineHeight: 1
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.color = 'rgba(255, 120, 120, 1)';
                                                    e.currentTarget.style.background = 'rgba(255, 80, 80, 0.08)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.color = 'rgba(255, 90, 90, 0.85)';
                                                    e.currentTarget.style.background = 'transparent';
                                                }}
                                                onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(0.95)'}
                                                onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        className="note-input"
                                        style={{ marginBottom: 0 }}
                                        type="tel"
                                        placeholder="Телефон"
                                        value={contact.phone}
                                        onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                                    <button
                                        className="btn btn-primary"
                                        disabled={disabled}
                                        onClick={() => handleSaveContact(idx)}
                                        style={{
                                            width: '100%',
                                            opacity: disabled ? 0.4 : 1,
                                            cursor: disabled ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Добавить контакт
                                    </button>
                                    <div style={{ minHeight: 18, textAlign: 'center' }}>
                                        {savedIndex === idx && (
                                            <span className="fade-in" style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)' }}>
                                                Контакт сохранён
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {localContacts.length < 2 && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                            <button
                                onClick={handleAddContactSlot}
                                style={{
                                    width: 44, height: 44, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: 'rgba(255,255,255,0.8)',
                                    fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', backdropFilter: 'blur(10px)',
                                    transition: 'all 0.2s', padding: 0, lineHeight: 1
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                            >
                                ＋
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Data */}
            <section className="settings-section">
                <div className="section-label">{t('settings_data')}</div>
                <div className="data-actions">
                    <button className="btn btn-danger" onClick={() => setShowConfirm(true)}>
                        {t('settings_reset')}
                    </button>
                </div>
            </section>

            {showConfirm && (
                <ConfirmModal
                    title={t('settings_reset_title')}
                    body={t('settings_reset_body')}
                    confirmLabel={t('settings_reset_confirm')}
                    cancelLabel={t('settings_cancel')}
                    onConfirm={confirmReset}
                    onCancel={() => setShowConfirm(false)}
                />
            )}
        </div>
    );
}
