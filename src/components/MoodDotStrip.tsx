import { useMemo } from 'react';
import type { Mood, Entry } from '../types';
import { getLastNDaysDates, isToday } from '../logic/stats';

/** Maps mood → HEX fill for the dot */
const MOOD_COLOR: Record<Mood, string> = {
    wonderful: '#2ea043',
    calm: '#58a6ff',
    normal: '#8b949e',
    tired: '#d29922',
    anxious: '#f85149',
    heavy: '#a13028',
};

interface Props {
    entries: Entry[];
    moodFilter: Mood | null;
    onDotClick: (date: string) => void;
}

export default function MoodDotStrip({ entries, moodFilter, onDotClick }: Props) {
    const dates = useMemo(() => getLastNDaysDates(14), []);

    const entryMap = useMemo(() => {
        const map: Record<string, Mood[]> = {};
        entries.forEach((e) => {
            if (!map[e.date]) map[e.date] = [];
            map[e.date].push(e.mood);
        });
        return map;
    }, [entries]);

    return (
        <div className="dot-strip">
            {dates.map((date) => {
                const moods = entryMap[date] || [];
                const hasEntry = moods.length > 0;

                // If there are multiple entries, we just show a dot for the first (most recent/primary) or we could render stacked dots. Let's just use the worst mood or last one for the dot map.
                const topMood = hasEntry ? moods[0] : null;

                const isMuted = hasEntry && moodFilter && !moods.includes(moodFilter);
                const color = topMood ? MOOD_COLOR[topMood] : undefined;
                const today = isToday(date);

                const classes = [
                    'dot',
                    !hasEntry && 'dot-empty',
                    isMuted && 'dot-muted',
                    today && 'dot-today',
                ].filter(Boolean).join(' ');

                // We can use a simple tooltip or just the first background color.
                return (
                    <button
                        key={date}
                        className={classes}
                        style={color && !isMuted ? { background: color } : undefined}
                        onClick={() => hasEntry && onDotClick(date)}
                        aria-label={date}
                    />
                );
            })}
        </div>
    );
}
