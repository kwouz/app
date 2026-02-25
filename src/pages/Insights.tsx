import { useState, useEffect, useMemo } from 'react';
import { getEntries } from '../services/storage';
import type { Entry, Mood } from '../types';

const MOOD_SCORE: Record<Mood, number> = {
    wonderful: 2, calm: 1, normal: 0, tired: -1, anxious: -1, heavy: -2,
};

const MOOD_LABEL: Record<Mood, string> = {
    wonderful: 'прекрасно', calm: 'спокойно', normal: 'нормально',
    tired: 'усталость', anxious: 'тревога', heavy: 'тяжело',
};

const DAYS_RU = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

function getLast7DaysDates(): string[] {
    const dates: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
}

function getLast30DaysDates(): string[] {
    const dates: string[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
}

export default function Insights() {
    const [entries, setEntries] = useState<Entry[]>([]);

    useEffect(() => {
        setEntries(getEntries());
    }, []);

    const weekDates = useMemo(() => new Set(getLast7DaysDates()), []);
    const monthDates = useMemo(() => new Set(getLast30DaysDates()), []);
    const weekEntries = useMemo(() => entries.filter(e => weekDates.has(e.date)), [entries, weekDates]);
    const monthEntries = useMemo(() => entries.filter(e => monthDates.has(e.date)), [entries, monthDates]);

    // ─── Block 1: Динамика 7 дней ───
    const weekDynamic = useMemo(() => {
        if (weekEntries.length < 2) return 'Пока мало данных, но начало положено.';

        const counts: Record<string, number> = {};
        weekEntries.forEach(e => { counts[e.mood] = (counts[e.mood] || 0) + 1; });
        const total = weekEntries.length;
        const neg = (counts['heavy'] || 0) + (counts['anxious'] || 0) + (counts['tired'] || 0);
        const pos = (counts['wonderful'] || 0) + (counts['calm'] || 0);
        const avgScore = weekEntries.reduce((s, e) => s + MOOD_SCORE[e.mood], 0) / total;

        if (neg === 0 && pos > 0) return 'Неделя прошла стабильно и спокойно.';
        if (neg > pos && neg > total * 0.5) {
            if ((counts['anxious'] || 0) >= (counts['heavy'] || 0) && (counts['anxious'] || 0) >= (counts['tired'] || 0)) {
                return 'На этой неделе больше тревоги, чем спокойствия.';
            }
            if ((counts['tired'] || 0) >= (counts['heavy'] || 0)) return 'На этой неделе преобладала усталость.';
            return 'Неделя была непростой.';
        }
        if (pos > neg) return 'В целом неделя прошла хорошо.';
        if (avgScore > 0.5) return 'Неделя прошла скорее хорошо.';
        if (avgScore < -0.5) return 'Неделя была скорее тяжёлой.';
        return 'Неделя была смешанной — разные состояния.';
    }, [weekEntries]);

    // ─── Block 2: Паттерн недели ───
    const weekPatterns = useMemo(() => {
        const results: string[] = [];
        if (weekEntries.length < 3) return ['Паттерны станут заметны со временем.'];

        // Time-of-day analysis
        const eveningEntries = weekEntries.filter(e => {
            const h = new Date(e.createdAt).getHours();
            return h >= 19 || h < 4;
        });
        const morningEntries = weekEntries.filter(e => {
            const h = new Date(e.createdAt).getHours();
            return h >= 6 && h < 12;
        });

        // Evening anxiety
        const eveningAnxious = eveningEntries.filter(e => e.mood === 'anxious').length;
        if (eveningAnxious >= 2) {
            results.push('Тревога чаще вечером (после 19:00).');
        }

        // Morning tiredness
        const morningTired = morningEntries.filter(e => e.mood === 'tired').length;
        if (morningTired >= 2) {
            results.push('Усталость проявляется утром.');
        }

        // Day-of-week patterns
        const dowCounts: Record<number, { pos: number; neg: number; total: number }> = {};
        weekEntries.forEach(e => {
            const dow = new Date(e.date).getDay();
            if (!dowCounts[dow]) dowCounts[dow] = { pos: 0, neg: 0, total: 0 };
            dowCounts[dow].total++;
            if (['wonderful', 'calm'].includes(e.mood)) dowCounts[dow].pos++;
            if (['heavy', 'anxious'].includes(e.mood)) dowCounts[dow].neg++;
        });

        // Worst day of week
        let worstDow = -1, worstNeg = 0;
        for (const [dow, c] of Object.entries(dowCounts)) {
            if (c.neg > worstNeg && c.neg >= 2) { worstNeg = c.neg; worstDow = parseInt(dow); }
        }
        if (worstDow >= 0 && results.length < 3) {
            results.push(`${DAYS_RU[worstDow].charAt(0).toUpperCase() + DAYS_RU[worstDow].slice(1)} — непростой день.`);
        }

        // Stability check
        const allSame = new Set(weekEntries.map(e => e.mood)).size <= 2;
        if (allSame && weekEntries.length >= 4 && results.length < 3) {
            results.push('Неделя прошла стабильно, без резких перепадов.');
        }

        if (results.length === 0) results.push('Паттерны станут заметны со временем.');
        return results.slice(0, 3);
    }, [weekEntries]);

    // ─── Block 3: Паттерн месяца ───
    const monthPatterns = useMemo(() => {
        const results: string[] = [];
        if (monthEntries.length < 5) return ['Нужно больше данных для месячного анализа.'];

        // Most frequent mood this month
        const counts: Record<string, number> = {};
        monthEntries.forEach(e => { counts[e.mood] = (counts[e.mood] || 0) + 1; });
        let topMood = 'normal', topCount = 0;
        for (const [m, c] of Object.entries(counts)) {
            if (c > topCount) { topMood = m; topCount = c; }
        }
        const pct = Math.round((topCount / monthEntries.length) * 100);
        results.push(`В этом месяце преобладает ${MOOD_LABEL[topMood as Mood]} (${pct}%).`);

        // Weekend vs weekday
        const weekdayEntries = monthEntries.filter(e => {
            const dow = new Date(e.date).getDay();
            return dow >= 1 && dow <= 5;
        });
        const weekendMonthEntries = monthEntries.filter(e => {
            const dow = new Date(e.date).getDay();
            return dow === 0 || dow === 6;
        });

        if (weekendMonthEntries.length >= 3 && weekdayEntries.length >= 5) {
            const weekendAvg = weekendMonthEntries.reduce((s, e) => s + MOOD_SCORE[e.mood], 0) / weekendMonthEntries.length;
            const weekdayAvg = weekdayEntries.reduce((s, e) => s + MOOD_SCORE[e.mood], 0) / weekdayEntries.length;
            if (weekendAvg > weekdayAvg + 0.5) {
                results.push('Выходные более стабильны.');
            } else if (weekdayAvg > weekendAvg + 0.5) {
                results.push('Будни комфортнее выходных.');
            }
        }

        // Midweek tiredness (monthly)
        const midweekTired = monthEntries.filter(e => {
            const dow = new Date(e.date).getDay();
            return e.mood === 'tired' && dow >= 2 && dow <= 4;
        }).length;
        const totalTired = monthEntries.filter(e => e.mood === 'tired').length;
        if (totalTired >= 4 && midweekTired > totalTired * 0.5 && results.length < 3) {
            results.push('Усталость чаще в середине недели.');
        }

        // Volatility
        if (monthEntries.length >= 8) {
            const scores = monthEntries.map(e => MOOD_SCORE[e.mood]);
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            const variance = scores.reduce((s, v) => s + (v - avg) ** 2, 0) / scores.length;
            if (variance > 2 && results.length < 3) {
                results.push('Заметные перепады в настроении в этом месяце.');
            } else if (variance < 0.5 && results.length < 3) {
                results.push('Месяц прошёл стабильно.');
            }
        }

        return results.slice(0, 3);
    }, [monthEntries]);

    // ─── Block 4: Небольшое направление ───
    const direction = useMemo(() => {
        if (entries.length < 5) return 'Продолжайте отмечать — скоро появятся более точные наблюдения.';

        const recent14 = entries.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 14);
        const avgScore = recent14.reduce((s, e) => s + MOOD_SCORE[e.mood], 0) / recent14.length;

        // Check trend — first half vs second half
        const half = Math.floor(recent14.length / 2);
        const firstHalf = recent14.slice(half);
        const secondHalf = recent14.slice(0, half);
        const firstAvg = firstHalf.reduce((s, e) => s + MOOD_SCORE[e.mood], 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((s, e) => s + MOOD_SCORE[e.mood], 0) / secondHalf.length;

        if (secondAvg > firstAvg + 0.5) return 'Динамика улучшается — последние дни лучше.';
        if (secondAvg < firstAvg - 0.5) return 'Возможно, стоит обратить внимание на отдых и восстановление.';
        if (avgScore > 0.8) return 'Хорошая динамика, продолжайте наблюдать.';
        if (avgScore < -0.8) return 'Если чувствуете, что нужна поддержка — это нормально.';

        return 'Состояние в целом стабильно. Продолжайте наблюдать.';
    }, [entries]);

    return (
        <div className="page fade-in">
            <h1 className="page-title">Инсайты</h1>

            {/* Block 1: Week dynamics */}
            <div className="insight-glass-card">
                <div className="insight-glass-label">Динамика 7 дней</div>
                <p className="insight-glass-text">{weekDynamic}</p>
            </div>

            {/* Block 2: Week patterns */}
            <div className="insight-glass-card">
                <div className="insight-glass-label">Паттерн недели</div>
                {weekPatterns.map((p, i) => (
                    <p key={i} className="insight-glass-text">{p}</p>
                ))}
            </div>

            {/* Block 3: Month patterns */}
            <div className="insight-glass-card">
                <div className="insight-glass-label">Паттерн месяца</div>
                {monthPatterns.map((p, i) => (
                    <p key={i} className="insight-glass-text">{p}</p>
                ))}
            </div>

            {/* Block 4: Direction */}
            <div className="insight-glass-card">
                <div className="insight-glass-label">Небольшое направление</div>
                <p className="insight-glass-text">{direction}</p>
            </div>
        </div>
    );
}
