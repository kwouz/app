import type { Entry, Mood } from '../types';
import type { Language } from '../i18n/translations';

/* ─── Types ─── */

export type AIMode = 'weekly' | 'monthly';

export interface AISummaryRequest {
    mode: AIMode;
    language: Language;
    entries: { date: string; mood: Mood; note?: string }[];
}

export interface AISummaryProvider {
    getSummary(req: AISummaryRequest): Promise<string>;
}

/* ─── Mock Provider ─── */

const MOCK_INSIGHTS: Record<Language, Record<AIMode, string[]>> = {
    en: {
        weekly: [
            'This week, a gentle pattern emerges. You seem to find moments of calm more often in the early days, while the second half carried a bit more weight. That rhythm is worth noticing — not to fix, just to see.',
            'Looking at your week, there\'s a quiet steadiness. Even on heavier days, you showed up and checked in. That consistency, in itself, is a kind of care.',
            'Your week held a mix of states — some ease, some tension. Noticing both without ranking them is a practice in itself. No day was wasted.',
        ],
        monthly: [
            'Over the past month, your most common state has been one of relative calm. The anxious or heavy moments, while present, didn\'t dominate. There\'s a quiet resilience in that pattern.',
            'This month tells a story of fluctuation — which is entirely natural. The shifts between states suggest you\'re paying attention, not that something is wrong.',
            'A month of check-ins reveals something simple: you kept showing up. The landscape of your moods varied, but the act of noticing remained constant. That matters.',
        ],
    },
    ru: {
        weekly: [
            'На этой неделе проступает мягкий ритм. В начале недели чаще встречалось спокойствие, ближе к концу — чуть больше тяжести. Это стоит заметить, не чтобы исправить, а просто увидеть.',
            'Глядя на вашу неделю, заметна тихая устойчивость. Даже в более тяжёлые дни вы отмечались. Эта последовательность — уже форма заботы о себе.',
            'Ваша неделя вместила разные состояния — и лёгкость, и напряжение. Замечать и то, и другое без оценки — это практика сама по себе.',
        ],
        monthly: [
            'За прошедший месяц ваше наиболее частое состояние — относительное спокойствие. Моменты тревоги или тяжести, хоть и были, не доминировали. В этом есть негромкая устойчивость.',
            'Этот месяц — история колебаний, что совершенно естественно. Смены состояний говорят о внимании к себе, а не о том, что что-то не так.',
            'Месяц отметок показывает простое: вы продолжали замечать. Ландшафт состояний менялся, но практика наблюдения оставалась постоянной. Это важно.',
        ],
    },
};

class MockAIProvider implements AISummaryProvider {
    async getSummary(req: AISummaryRequest): Promise<string> {
        // Simulate network delay
        await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

        const pool = MOCK_INSIGHTS[req.language][req.mode];
        // Pick deterministically based on entry count
        const index = req.entries.length % pool.length;
        return pool[index];
    }
}

/* ─── Public API ─── */

let provider: AISummaryProvider = new MockAIProvider();

export function setAIProvider(p: AISummaryProvider): void {
    provider = p;
}

export async function getAISummary(
    mode: AIMode,
    language: Language,
    entries: Entry[],
): Promise<string> {
    const simplified = entries.map((e) => ({
        date: e.date,
        mood: e.mood,
        note: e.note,
    }));
    return provider.getSummary({ mode, language, entries: simplified });
}
