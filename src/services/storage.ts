import { v4 as uuidv4 } from 'uuid';
import type { Entry, Mood, Settings } from '../types';

// ─── Keys ───

const KEYS = {
    entries: 'dc_entries',
    settings: 'dc_settings',
    onboarded: 'dc_onboarded',
    language: 'dc_language',
    pro: 'dc_pro',
    milestones: 'dc_milestones',
    cache_practices: 'dc_cache_practices',
    cache_insights: 'dc_cache_insights',
    cache_patterns: 'dc_cache_patterns',
} as const;

// ─── Helpers ───

function getStorage<T>(key: string, fallback: T): T {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

function currentTime(): string {
    return new Date().toISOString().slice(11, 16);
}

// ─── Onboarding ───

export function isOnboarded(): boolean {
    return localStorage.getItem(KEYS.onboarded) === 'true';
}

export function setOnboarded(): void {
    localStorage.setItem(KEYS.onboarded, 'true');
}

// ─── Entries ───

export function getEntries(): Entry[] {
    try {
        const raw = localStorage.getItem(KEYS.entries);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function persistEntries(entries: Entry[]): void {
    localStorage.setItem(KEYS.entries, JSON.stringify(entries));
}

export function getTodayEntries(): Entry[] {
    return getEntries().filter((e) => e.date === today());
}

export function getTodayEntry(): Entry | undefined {
    const todayEntries = getTodayEntries();
    return todayEntries.length > 0 ? todayEntries[todayEntries.length - 1] : undefined;
}

export function saveEntry(mood: Mood, note?: string): Entry {
    const entries = getEntries();

    const entry: Entry = {
        id: uuidv4(),
        date: today(),
        time: currentTime(),
        mood,
        note,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    entries.push(entry);
    persistEntries(entries);
    return entry;
}

export function updateEntry(id: string, mood: Mood, note?: string): Entry | null {
    const entries = getEntries();
    const entry = entries.find((e) => e.id === id);
    if (!entry) return null;
    entry.mood = mood;
    entry.note = note;
    entry.updatedAt = Date.now();
    persistEntries(entries);
    return entry;
}

export function deleteEntry(id: string): boolean {
    const entries = getEntries();
    const filtered = entries.filter((e) => e.id !== id);
    if (filtered.length === entries.length) return false;
    persistEntries(filtered);
    return true;
}

// ─── Settings ───

const DEFAULT_SETTINGS: Settings = {
    theme: 'system',
    reminderEnabled: false,
    reminderTime: '20:30',
};

export function getSettings(): Settings {
    try {
        const raw = localStorage.getItem(KEYS.settings);
        return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveSettings(settings: Settings): void {
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

// ─── Pro & Milestones ───

export function isPro(): boolean {
    return localStorage.getItem(KEYS.pro) === 'true';
}

export function setPro(value: boolean): void {
    localStorage.setItem(KEYS.pro, String(value));
}

export function hasSeenMilestone(key: string): boolean {
    const seen = getStorage<string[]>(KEYS.milestones, []);
    return seen.includes(key);
}

export function markMilestoneSeen(key: string): void {
    const seen = getStorage<string[]>(KEYS.milestones, []);
    if (!seen.includes(key)) {
        seen.push(key);
        localStorage.setItem(KEYS.milestones, JSON.stringify(seen));
    }
}

// ─── AI Cache ───

interface CacheItem<T> {
    data: T;
    expiresAt: number;
}

export function getCache<T>(key: 'cache_practices' | 'cache_insights' | 'cache_patterns', subKey: string): T | null {
    const fullKey = KEYS[key];
    const cacheMap = getStorage<Record<string, CacheItem<T>>>(fullKey, {});
    const item = cacheMap[subKey];
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
        delete cacheMap[subKey];
        localStorage.setItem(fullKey, JSON.stringify(cacheMap));
        return null;
    }
    return item.data;
}

export function setCache<T>(key: 'cache_practices' | 'cache_insights' | 'cache_patterns', subKey: string, data: T, ttlHours: number): void {
    const fullKey = KEYS[key];
    const cacheMap = getStorage<Record<string, CacheItem<T>>>(fullKey, {});
    cacheMap[subKey] = {
        data,
        expiresAt: Date.now() + ttlHours * 60 * 60 * 1000
    };
    localStorage.setItem(fullKey, JSON.stringify(cacheMap));
}

// ─── Data Management ───

export function resetData(): void {
    localStorage.removeItem(KEYS.entries);
    localStorage.removeItem(KEYS.settings);
    localStorage.removeItem(KEYS.onboarded);
    localStorage.removeItem(KEYS.language);
}
