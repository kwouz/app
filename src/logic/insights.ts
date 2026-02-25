import type { Entry, Mood } from '../types';
import type { Language } from '../i18n/translations';

// Very lightweight rule-based local pattern matching
export function analyzePatterns(entries: Entry[], language: Language): string[] {
    if (entries.length < 5) return [];

    const insights: string[] = [];
    const recent = entries.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 7);

    // Calculate local stats
    const counts: Record<Mood, number> = { wonderful: 0, calm: 0, normal: 0, tired: 0, anxious: 0, heavy: 0 };
    recent.forEach(e => counts[e.mood]++);
    let mostFrequent: Mood = 'normal';
    let max = 0;
    for (const [m, count] of Object.entries(counts)) {
        if (count > max) {
            max = count;
            mostFrequent = m as Mood;
        }
    }

    // Insight 1: Recent frequency
    if (mostFrequent === 'anxious' && counts.anxious >= 3) {
        insights.push(language === 'en'
            ? `You marked anxiety ${counts.anxious} times recently.`
            : `Вы отметили тревогу ${counts.anxious} раз за последнее время.`);
    } else if (mostFrequent === 'heavy' && counts.heavy >= 3) {
        insights.push(language === 'en'
            ? `You marked feeling heavy ${counts.heavy} times recently.`
            : `Вы часто отмечали тяжесть (${counts.heavy} раз) недавно.`);
    } else if (mostFrequent === 'calm' && counts.calm >= 3) {
        insights.push(language === 'en'
            ? `You've had ${counts.calm} calm check-ins recently.`
            : `У вас было ${counts.calm} спокойных отметок недавно.`);
    } else if (mostFrequent === 'tired' && counts.tired >= 3) {
        insights.push(language === 'en'
            ? `You marked tiredness ${counts.tired} times recently.`
            : `Вы отметили усталость ${counts.tired} раз за последнее время.`);
    }

    // Insight 2: Time of day pattern (simple heuristic)
    const eveningEntries = entries.filter(e => {
        const hour = new Date(e.createdAt).getHours();
        return hour >= 17 || hour < 4;
    });

    if (eveningEntries.length > entries.length * 0.6) {
        insights.push(language === 'en'
            ? "You mostly check in during the evening."
            : "В основном вы делаете отметки вечером.");
    } else if (entries.length - eveningEntries.length > entries.length * 0.6) {
        insights.push(language === 'en'
            ? "You mostly check in during the day."
            : "В основном вы делаете отметки днем.");
    }

    // Return max 2 insights, calmest ones
    return insights.slice(0, 2);
}

export function getMicroPause(mood: Mood, language: Language): string | null {
    if (mood === 'calm' || mood === 'wonderful') {
        return language === 'en' ? "Notice your breathing." : "Обратите внимание на дыхание.";
    }
    if (mood === 'anxious') {
        return language === 'en' ? "Take 3 slow exhales." : "Сделайте 3 медленных выдоха.";
    }
    if (mood === 'heavy' || mood === 'tired') {
        return language === 'en' ? "Relax your shoulders." : "Расслабьте плечи.";
    }
    return null;
}
