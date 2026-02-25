import { useState, useEffect, useRef, useCallback } from 'react';
import { saveEntry, getEntries } from '../services/storage';
import type { Mood } from '../types';
import { useT } from '../i18n/LanguageContext';

const CIRCLE_COLORS: Record<Mood, string> = {
    wonderful: '#C8A97E',
    tired: '#8B7EAD',
    normal: '#6BA68A',
    anxious: '#E8664A',
    calm: '#B8A06A',
    heavy: '#636869',
};

const CIRCLE_GLOW: Record<Mood, string> = {
    wonderful: 'rgba(200, 169, 126, 0.30)',
    tired: 'rgba(139, 126, 173, 0.30)',
    normal: 'rgba(107, 166, 138, 0.30)',
    anxious: 'rgba(232, 102, 74, 0.30)',
    calm: 'rgba(184, 160, 106, 0.30)',
    heavy: 'rgba(99, 104, 105, 0.25)',
};

const LABELS: Record<Mood, string> = {
    wonderful: 'Прекрасно',
    tired: 'Усталость',
    normal: 'Нормально',
    anxious: 'Тревога',
    calm: 'Спокойно',
    heavy: 'Тяжело',
};

const LAYOUT: Mood[] = [
    'wonderful', 'tired',
    'normal', 'anxious',
    'calm', 'heavy',
];

type Phase = 'idle' | 'anticipating' | 'expanding' | 'locked' | 'restoring';

export default function Home() {
    const [phase, setPhase] = useState<Phase>('idle');
    const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
    const [mounted, setMounted] = useState(false);
    const circleRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const [heroTransform, setHeroTransform] = useState('');
    const t = useT();

    useEffect(() => {
        requestAnimationFrame(() => setMounted(true));
    }, []);

    useEffect(() => {
        const entries = getEntries();
        if (entries.length > 0) {
            const last = entries.reduce((a, b) => (b.createdAt > a.createdAt ? b : a));
            const tints: Record<Mood, string> = {
                wonderful: '46,160,67', calm: '88,166,255', normal: '139,148,158',
                tired: '210,153,34', anxious: '248,81,73', heavy: '161,48,40',
            };
            document.documentElement.style.setProperty('--bg-tint', `rgba(${tints[last.mood]}, 0.04)`);
        }
    }, []);

    const clearTimers = useCallback(() => {
        timersRef.current.forEach(t => clearTimeout(t));
        timersRef.current = [];
    }, []);

    useEffect(() => () => clearTimers(), [clearTimers]);

    const schedule = useCallback((fn: () => void, ms: number) => {
        const id = setTimeout(fn, ms);
        timersRef.current.push(id);
        return id;
    }, []);

    const handleTap = useCallback((mood: Mood) => {
        if (phase !== 'idle') return;

        // Calculate translation to viewport center (slightly above center)
        const el = circleRefs.current[mood];
        if (el) {
            const rect = el.querySelector('.mood-circle')?.getBoundingClientRect();
            if (rect) {
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const targetX = window.innerWidth / 2;
                const targetY = window.innerHeight * 0.4; // slightly above center
                const dx = targetX - cx;
                const dy = targetY - cy;
                setHeroTransform(`translate(${dx}px, ${dy}px) scale(4)`);
            }
        }

        setSelectedMood(mood);
        saveEntry(mood, undefined);
        clearTimers();

        // Phase 0: anticipating (120ms)
        setPhase('anticipating');

        // Phase 1: expanding (1000ms)
        schedule(() => setPhase('expanding'), 120);

        // Phase 2: locked (1200ms)
        schedule(() => setPhase('locked'), 120 + 1000);

        // Phase 3: restoring (800ms)
        schedule(() => setPhase('restoring'), 120 + 1000 + 1200);

        // Back to idle
        schedule(() => {
            setPhase('idle');
            setSelectedMood(null);
            setHeroTransform('');
        }, 120 + 1000 + 1200 + 900);
    }, [phase, clearTimers, schedule]);

    const tapping = phase !== 'idle';

    return (
        <div className="mood-screen">
            <div className="mood-screen-glow" />

            <h1 className={`mood-screen-title${tapping && phase !== 'anticipating' ? ' mst--dimmed' : ''}`}>
                {t('home_question')}
            </h1>

            <div className="mood-circle-grid">
                {/* Dividers */}
                <div className="mood-divider mood-divider--v" />
                <div className="mood-divider mood-divider--h1" />
                <div className="mood-divider mood-divider--h2" />

                {LAYOUT.map((mood, i) => {
                    const isHero = selectedMood === mood;
                    const isOther = selectedMood !== null && !isHero;

                    let cls = 'mood-circle-item';
                    if (mounted) cls += ' mood-circle-item--entered';

                    // Phase classes
                    if (isHero) {
                        if (phase === 'anticipating') cls += ' mc-hero--antic';
                        if (phase === 'expanding') cls += ' mc-hero--expand';
                        if (phase === 'locked') cls += ' mc-hero--locked';
                        if (phase === 'restoring') cls += ' mc-hero--restore';
                    }

                    if (isOther) {
                        if (phase === 'anticipating') cls += ' mc-other--antic';
                        if (phase === 'expanding' || phase === 'locked') cls += ' mc-other--gone';
                        if (phase === 'restoring') cls += ' mc-other--reappear';
                    }

                    return (
                        <button
                            key={mood}
                            ref={(el) => { circleRefs.current[mood] = el; }}
                            className={cls}
                            style={{
                                '--stagger': `${i * 70}ms`,
                                '--reappear-delay': `${i * 100}ms`,
                                ...(isHero && (phase === 'expanding' || phase === 'locked')
                                    ? { '--hero-transform': heroTransform } as React.CSSProperties
                                    : {}),
                            } as React.CSSProperties}
                            onClick={() => handleTap(mood)}
                            disabled={tapping}
                        >
                            <div
                                className="mood-circle"
                                style={{
                                    background: CIRCLE_COLORS[mood],
                                    boxShadow: `0 0 16px ${CIRCLE_GLOW[mood]}`,
                                }}
                            />
                            <span className="mood-circle-label">{LABELS[mood]}</span>
                        </button>
                    );
                })}
            </div>

            {/* Confirmation text — appears during locked phase */}
            <div className={`mood-confirm-text${phase === 'locked' ? ' mood-confirm-text--visible' : ''}`}>
                Состояние записано
            </div>
        </div>
    );
}
