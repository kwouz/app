import { MOOD_CONFIG } from '../types';
import type { Mood } from '../types';
import { useT } from '../i18n/LanguageContext';

interface Props {
    selected: Mood | null;
    onSelect: (mood: Mood) => void;
}

export default function MoodSelector({ selected, onSelect }: Props) {
    const t = useT();

    // Left column: Прекрасно, Нормально, Спокойно
    // Right column: Усталость, Тревога, Тяжело
    // Grid is 2 columns, items flow left→right per row:
    // Row 1: wonderful, tired
    // Row 2: normal, anxious
    // Row 3: calm, heavy

    const layoutOrder: Mood[] = [
        'wonderful', 'tired',
        'normal', 'anxious',
        'calm', 'heavy',
    ];

    return (
        <div className="mood-grid">
            {layoutOrder.map((mood) => {
                const cfg = MOOD_CONFIG[mood];
                const isActive = selected === mood;
                return (
                    <button
                        key={mood}
                        className={`mood-btn${isActive ? ' selected' : ''}`}
                        onClick={() => onSelect(mood)}
                        aria-label={t(cfg.labelKey)}
                        style={{
                            background: isActive ? 'var(--accent-muted)' : 'var(--surface)'
                        }}
                    >
                        <img className="mood-icon" src={cfg.icon} alt="" />
                        <span className="mood-label">{t(cfg.labelKey)}</span>
                    </button>
                );
            })}
        </div>
    );
}
