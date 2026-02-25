import type { Entry, Mood } from '../types';
import { MOODS } from '../types';

/** Generates an array of YYYY-MM-DD strings for the last N days. */
export function getDateRange(days: number): string[] {
    const dates: string[] = [];
    const now = new Date();
    for (let i = 0; i < days; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
}

/** Counts consecutive days with entries ending today or yesterday. */
export function countStreak(entries: Entry[]): number {
    if (!entries.length) return 0;

    // Create a set of all entry dates for fast lookup
    const dateSet = new Set(entries.map((e) => e.date));
    let streak = 0;

    const now = new Date();
    // Start from today(0) and go backwards
    for (let i = 0; i < 365; i++) { // cap at 1 year for safety
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);

        if (dateSet.has(dateStr)) {
            streak++;
        } else if (i === 0) {
            // It's okay if today is missed, means the user hasn't checked in yet today.
            // But if yesterday is also missed, streak is 0.
            continue;
        } else {
            break;
        }
    }
    return streak;
}

export interface PeriodStats {
    counts: Record<Mood, number>;
    mostFrequent: Mood;
    total: number;
    streak: number;
    maxCount: number;
}

/** Computes mood distribution and streak for a given period. */
export function getPeriodStats(entries: Entry[], days: number): PeriodStats {
    const dateSet = new Set(getDateRange(days));
    const filtered = entries.filter((e) => dateSet.has(e.date));

    const counts: Record<Mood, number> = {
        wonderful: 0, calm: 0, normal: 0, tired: 0, anxious: 0, heavy: 0,
    };
    filtered.forEach((e) => counts[e.mood]++);

    let maxCount = 0;
    let mostFrequent: Mood = 'normal';
    for (const m of MOODS) {
        if (counts[m] > maxCount) {
            maxCount = counts[m];
            mostFrequent = m;
        }
    }

    return {
        counts,
        mostFrequent,
        total: filtered.length,
        streak: countStreak(entries),
        maxCount,
    };
}

/** Checks whether a date string matches today. */
export function isToday(dateStr: string): boolean {
    return dateStr === new Date().toISOString().slice(0, 10);
}

/** Formats a YYYY-MM-DD string into a localized short date. */
export function formatDate(dateStr: string, locale: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

/* ─── History helpers ─── */

/** Returns the last N days as YYYY-MM-DD strings (most recent first). */
export function getLastNDaysDates(n: number): string[] {
    const dates: string[] = [];
    const now = new Date();
    for (let i = 0; i < n; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
}

/** Returns how many days ago a date string is (0 = today). */
export function daysAgo(dateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr + 'T00:00:00');
    return Math.round((today.getTime() - d.getTime()) / 86_400_000);
}

/** Filters entries by mood (returns all if mood is null). */
export function filterEntriesByMood(entries: Entry[], mood: Mood | null): Entry[] {
    if (!mood) return entries;
    return entries.filter((e) => e.mood === mood);
}

/** Counts entries in the current calendar month. */
export function countEntriesThisMonth(entries: Entry[]): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return entries.filter((e) => {
        const d = new Date(e.date + 'T00:00:00');
        return d.getFullYear() === year && d.getMonth() === month;
    }).length;
}

/* ─── Range-based helpers ─── */

/** Filters entries within a date range (inclusive). */
export function getEntriesInRange(entries: Entry[], from: string, to: string): Entry[] {
    return entries.filter((e) => e.date >= from && e.date <= to);
}

/** Returns entries for the current calendar month. */
export function getEntriesThisMonth(entries: Entry[]): Entry[] {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const from = `${y}-${m}-01`;
    const to = `${y}-${m}-${new Date(y, now.getMonth() + 1, 0).getDate()}`;
    return getEntriesInRange(entries, from, to);
}

/** Returns entries for the last 7 days. */
export function getEntriesLast7Days(entries: Entry[]): Entry[] {
    const dates = new Set(getDateRange(7));
    return entries.filter((e) => dates.has(e.date));
}

/** Computes stats for entries within a date range. */
export function getRangeStats(entries: Entry[], from: string, to: string): PeriodStats {
    const filtered = getEntriesInRange(entries, from, to);
    const counts: Record<Mood, number> = {
        wonderful: 0, calm: 0, normal: 0, tired: 0, anxious: 0, heavy: 0,
    };
    filtered.forEach((e) => counts[e.mood]++);

    let maxCount = 0;
    let mostFrequent: Mood = 'normal';
    for (const m of MOODS) {
        if (counts[m] > maxCount) {
            maxCount = counts[m];
            mostFrequent = m;
        }
    }

    return {
        counts,
        mostFrequent,
        total: filtered.length,
        streak: countStreak(entries),
        maxCount,
    };
}
