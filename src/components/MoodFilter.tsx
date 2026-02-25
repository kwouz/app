import { useState, useRef, useEffect } from 'react';
import type { Mood } from '../types';
import { MOODS, MOOD_CONFIG } from '../types';
import { useT } from '../i18n/LanguageContext';

interface Props {
    value: Mood | null;
    onChange: (mood: Mood | null) => void;
}

export default function MoodFilter({ value, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const t = useT();

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const label = value ? t(MOOD_CONFIG[value].labelKey) : t('history_filter_all');

    return (
        <div className="mood-filter" ref={ref}>
            <button className="filter-trigger" onClick={() => setOpen(!open)}>
                {label} <span className="filter-caret">▾</span>
            </button>

            {open && (
                <div className="filter-dropdown fade-in">
                    <button
                        className={`filter-option${!value ? ' active' : ''}`}
                        onClick={() => { onChange(null); setOpen(false); }}
                    >
                        {t('history_filter_all')}
                    </button>
                    {MOODS.map((mood) => (
                        <button
                            key={mood}
                            className={`filter-option${value === mood ? ' active' : ''}`}
                            onClick={() => { onChange(mood); setOpen(false); }}
                        >
                            <img className="filter-icon" src={MOOD_CONFIG[mood].icon} alt="" />
                            {t(MOOD_CONFIG[mood].labelKey)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
