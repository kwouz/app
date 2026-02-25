import { useState, useMemo } from 'react';
import { getEntries } from '../services/storage';
import { MOOD_CONFIG, MOODS } from '../types';
import type { Entry, Mood } from '../types';
import {
    getPeriodStats, getEntriesInRange, getRangeStats,
    getDateRange, getEntriesThisMonth, countStreak,
} from '../logic/stats';
import { useT, useLanguage } from '../i18n/LanguageContext';
import { printReport } from '../services/printReport';

type RangeMode = '7' | 'month' | 'custom';

function todayStr(): string { return new Date().toISOString().slice(0, 10); }
function monthStartStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function Report() {
    const [rangeMode, setRangeMode] = useState<RangeMode>('7');
    const [customFrom, setCustomFrom] = useState(monthStartStr());
    const [customTo, setCustomTo] = useState(todayStr());
    const t = useT();
    const { language } = useLanguage();

    const allEntries = useMemo(() => getEntries(), []);

    // Compute filtered entries & stats
    const { entries, from, to, stats } = useMemo(() => {
        let filtered: Entry[];
        let f: string;
        let tt: string;

        if (rangeMode === '7') {
            const dates = getDateRange(7);
            f = dates[dates.length - 1];
            tt = dates[0];
            filtered = getEntriesInRange(allEntries, f, tt);
        } else if (rangeMode === 'month') {
            filtered = getEntriesThisMonth(allEntries);
            f = monthStartStr();
            tt = todayStr();
        } else {
            f = customFrom;
            tt = customTo;
            filtered = getEntriesInRange(allEntries, f, tt);
        }

        const s = rangeMode === '7'
            ? getPeriodStats(allEntries, 7)
            : getRangeStats(allEntries, f, tt);

        return { entries: filtered, from: f, to: tt, stats: s };
    }, [rangeMode, customFrom, customTo, allEntries]);

    const total = stats.total;
    const maxBar = Math.max(...Object.values(stats.counts), 1);

    // Days with at least 1 entry
    const daysWithEntries = useMemo(() => {
        const dates = new Set(entries.map(e => e.date));
        return dates.size;
    }, [entries]);

    // Average entries per day
    const avgPerDay = daysWithEntries > 0 ? (total / daysWithEntries).toFixed(1) : '0';

    // Longest streak
    const longestStreak = countStreak(allEntries);

    // Longest break
    const longestBreak = useMemo(() => {
        if (allEntries.length < 2) return 0;
        const dates = [...new Set(allEntries.map(e => e.date))].sort();
        let maxGap = 0;
        for (let i = 1; i < dates.length; i++) {
            const diff = Math.round(
                (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86_400_000,
            );
            if (diff > maxGap) maxGap = diff;
        }
        return maxGap;
    }, [allEntries]);

    // Calmest day & most anxious period (factual)
    const { calmestDay, hardestDay } = useMemo(() => {
        const SCORE: Record<Mood, number> = { wonderful: 2, calm: 1, normal: 0, tired: -1, anxious: -1, heavy: -2 };
        const dateScores: Record<string, { total: number; count: number }> = {};
        entries.forEach(e => {
            if (!dateScores[e.date]) dateScores[e.date] = { total: 0, count: 0 };
            dateScores[e.date].total += SCORE[e.mood];
            dateScores[e.date].count++;
        });

        let bestDate = '—';
        let bestAvg = -Infinity;
        let worstDate = '—';
        let worstAvg = Infinity;

        for (const [date, { total: t, count: c }] of Object.entries(dateScores)) {
            const avg = t / c;
            if (avg > bestAvg) { bestAvg = avg; bestDate = date; }
            if (avg < worstAvg) { worstAvg = avg; worstDate = date; }
        }

        const fmt = (d: string) => d === '—' ? '—' : new Date(d + 'T00:00:00').toLocaleDateString(
            language === 'ru' ? 'ru-RU' : 'en-US',
            { day: 'numeric', month: 'short' },
        );

        return { calmestDay: fmt(bestDate), hardestDay: fmt(worstDate) };
    }, [entries, language]);

    return (
        <div className="page fade-in">
            <h1 className="page-title">{t('report_title')}</h1>

            {/* Period picker */}
            <div className="range-toggle" style={{ marginTop: 16 }}>
                {(['7', 'month', 'custom'] as RangeMode[]).map((mode) => (
                    <button
                        key={mode}
                        className={`range-btn${rangeMode === mode ? ' active' : ''}`}
                        onClick={() => setRangeMode(mode)}
                    >
                        {mode === '7' ? '7 дней'
                            : mode === 'month' ? 'Этот месяц'
                                : 'Период'}
                    </button>
                ))}
            </div>

            {rangeMode === 'custom' && (
                <div className="custom-range fade-in">
                    <label className="range-field">
                        <span className="range-field-label">{t('report_from')}</span>
                        <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                    </label>
                    <label className="range-field">
                        <span className="range-field-label">{t('report_to')}</span>
                        <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                    </label>
                </div>
            )}

            {/* Distribution of states */}
            <section className="settings-section" style={{ marginTop: 24 }}>
                <div className="section-label">Распределение состояний</div>
                <div className="bar-chart">
                    {MOODS.map((mood) => {
                        const cfg = MOOD_CONFIG[mood];
                        const count = stats.counts[mood];
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        const barW = maxBar > 0 ? (count / maxBar) * 100 : 0;
                        return (
                            <div className="bar-row" key={mood}>
                                <img className="bar-icon" src={cfg.icon} alt="" />
                                <div className="bar-track">
                                    <div className="bar-fill" style={{ width: `${barW}%` }} />
                                </div>
                                <span className="bar-count">{pct}%</span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Frequency */}
            <section className="settings-section" style={{ marginTop: 20 }}>
                <div className="section-label">Частота</div>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Всего записей</div>
                        <div className="stat-value">{total}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Дней с записями</div>
                        <div className="stat-value">{daysWithEntries}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">В среднем / день</div>
                        <div className="stat-value">{avgPerDay}</div>
                    </div>
                </div>
            </section>

            {/* Streaks */}
            <section className="settings-section" style={{ marginTop: 20 }}>
                <div className="section-label">Серии</div>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Серия подряд</div>
                        <div className="stat-value">{longestStreak} {longestStreak === 1 ? 'день' : 'дней'}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Макс. перерыв</div>
                        <div className="stat-value">{longestBreak} {longestBreak === 1 ? 'день' : 'дней'}</div>
                    </div>
                </div>
            </section>

            {/* Best / difficult period */}
            {total > 0 && (
                <section className="settings-section" style={{ marginTop: 20 }}>
                    <div className="section-label">Дни</div>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">Самый спокойный</div>
                            <div className="stat-value">{calmestDay}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Самый тревожный</div>
                            <div className="stat-value">{hardestDay}</div>
                        </div>
                    </div>
                </section>
            )}

            {/* Export */}
            <section className="settings-section" style={{ marginTop: 20 }}>
                <div className="section-label">{t('export_pdf')}</div>
                <div className="report-actions">
                    <button className="btn btn-report" onClick={() => printReport(entries, language, from, to)}>
                        {t('export_personal')}
                    </button>
                </div>
            </section>
        </div>
    );
}
