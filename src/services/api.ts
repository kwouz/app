import { getCache, setCache } from './storage';
import type { Mood, Entry } from '../types';

const API_BASE = 'http://localhost:3001/api'; // In prod, this would be relative or injected

export async function fetchMicroPractices(mood: Mood): Promise<string[]> {
    const cached = getCache<string[]>('cache_practices', mood);
    if (cached) return cached;

    try {
        const res = await fetch(`${API_BASE}/practices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mood })
        });
        if (!res.ok) throw new Error('Failed to fetch practices');
        const data = await res.json();

        // Ensure data is array
        const practices = Array.isArray(data.practices) ? data.practices : [];
        if (practices.length > 0) {
            setCache('cache_practices', mood, practices, 24); // cache 1 day
        }
        return practices;
    } catch (err) {
        console.error('Error fetching practices', err);
        return [];
    }
}

export async function fetchWeeklyInsight(entries: Entry[]): Promise<string | null> {
    if (entries.length === 0) return null;

    // Use last 7 days entries to build a cache key representation
    const recent = entries.slice(0, 14); // roughly 7 days if 2/day
    const maxDate = recent[0]?.date || 'none';
    const numEntries = recent.length;
    const subKey = `${maxDate}_count_${numEntries}`;

    const cached = getCache<string>('cache_insights', subKey);
    if (cached) return cached;

    try {
        const res = await fetch(`${API_BASE}/weekly-insights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries: recent })
        });
        if (!res.ok) throw new Error('Failed to fetch insight');
        const data = await res.json();

        if (data.insight) {
            setCache('cache_insights', subKey, data.insight, 24); // cache 1 day
        }
        return data.insight;
    } catch (err) {
        console.error('Error fetching weekly insight', err);
        return null;
    }
}

export async function fetchPatterns(entries: Entry[]): Promise<string[]> {
    if (entries.length === 0) return [];

    const recent = entries.slice(0, 30); // Use more entries for pattern analysis
    const maxDate = recent[0]?.date || 'none';
    const subKey = `${maxDate}_count_${recent.length}`;

    const cached = getCache<string[]>('cache_patterns', subKey);
    if (cached) return cached;

    try {
        const res = await fetch(`${API_BASE}/patterns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries: recent })
        });
        if (!res.ok) throw new Error('Failed to fetch patterns');
        const data = await res.json();

        const patterns = Array.isArray(data.patterns) ? data.patterns : [];
        if (patterns.length > 0) {
            setCache('cache_patterns', subKey, patterns, 24); // cache 1 day
        }
        return patterns;
    } catch (err) {
        console.error('Error fetching patterns', err);
        return [];
    }
}
