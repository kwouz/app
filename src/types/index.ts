import calmIcon from '../assets/moods/calm.svg';
import okayIcon from '../assets/moods/okay.svg';
import tiredIcon from '../assets/moods/tired.svg';
import anxiousIcon from '../assets/moods/anxious.svg';
import heavyIcon from '../assets/moods/heavy.svg';

export type Mood = 'wonderful' | 'calm' | 'normal' | 'tired' | 'anxious' | 'heavy';

export interface Entry {
    id: string;
    date: string;       // YYYY-MM-DD
    time: string;       // HH:MM
    mood: Mood;
    note?: string;      // max 120 chars
    createdAt: number;
    updatedAt: number;
}

export interface Settings {
    theme: 'light' | 'dark' | 'system';
    reminderEnabled: boolean;
    reminderTime: string; // "HH:MM"
    trustedContacts?: { name: string; phone: string }[];
}

export const MOODS: Mood[] = ['wonderful', 'calm', 'normal', 'tired', 'anxious', 'heavy'];

export const MOOD_CONFIG: Record<Mood, { icon: string; labelKey: string, score: number }> = {
    wonderful: { icon: okayIcon, labelKey: 'Прекрасно', score: 2 },
    calm: { icon: calmIcon, labelKey: 'Спокойно', score: 1 },
    normal: { icon: okayIcon, labelKey: 'Нормально', score: 0 },
    tired: { icon: tiredIcon, labelKey: 'Усталость', score: -1 },
    anxious: { icon: anxiousIcon, labelKey: 'Тревога', score: -1 },
    heavy: { icon: heavyIcon, labelKey: 'Тяжело', score: -2 },
};
