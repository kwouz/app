import { useState, useEffect, useMemo, useCallback } from 'react';
import { getEntries, deleteEntry } from '../services/storage';
import { MOOD_CONFIG } from '../types';
import type { Mood, Entry } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

const MOOD_DOT_COLOR: Record<Mood, string> = {
    wonderful: '#4CAF50',
    calm: '#58a6ff',
    normal: '#8b949e',
    tired: '#d29922',
    anxious: '#f85149',
    heavy: '#a13028',
};

function getMonthDays(year: number, month: number): { date: string; day: number; weekday: number }[] {
    const days: { date: string; day: number; weekday: number }[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, month, d);
        const dateStr = dt.toISOString().slice(0, 10);
        const weekday = (dt.getDay() + 6) % 7;
        days.push({ date: dateStr, day: d, weekday });
    }
    return days;
}

export default function History() {
    const [allEntries, setAllEntries] = useState<Entry[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth());
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteMsg, setDeleteMsg] = useState(false);
    const { language } = useLanguage();

    const refreshEntries = useCallback(() => {
        setAllEntries(getEntries());
    }, []);

    useEffect(() => { refreshEntries(); }, [refreshEntries]);

    const monthDays = useMemo(() => getMonthDays(year, month), [year, month]);

    const entryMap = useMemo(() => {
        const map: Record<string, Entry[]> = {};
        allEntries.forEach(e => {
            if (!map[e.date]) map[e.date] = [];
            map[e.date].push(e);
        });
        return map;
    }, [allEntries]);

    const monthName = new Date(year, month).toLocaleDateString(
        language === 'ru' ? 'ru-RU' : 'en-US',
        { month: 'long', year: 'numeric' },
    );

    const weekdayHeaders = language === 'ru'
        ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    function prevMonth() {
        if (month === 0) { setYear(y => y - 1); setMonth(11); }
        else setMonth(m => m - 1);
        setSelectedDay(null);
    }

    function nextMonth() {
        if (month === 11) { setYear(y => y + 1); setMonth(0); }
        else setMonth(m => m + 1);
        setSelectedDay(null);
    }

    function handleDelete(id: string) {
        setDeletingId(id);
        setTimeout(() => {
            deleteEntry(id);
            refreshEntries();
            setDeletingId(null);
            setDeleteMsg(true);
            setTimeout(() => setDeleteMsg(false), 1500);
        }, 280);
    }

    const firstWeekday = monthDays[0]?.weekday ?? 0;
    const gridCells: (null | typeof monthDays[0])[] = [];
    for (let i = 0; i < firstWeekday; i++) gridCells.push(null);
    monthDays.forEach(d => gridCells.push(d));

    const selectedEntries = selectedDay ? (entryMap[selectedDay] || []) : [];

    return (
        <div className="page fade-in">
            {/* Month header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <button className="btn btn-ghost" onClick={prevMonth} style={{ padding: '4px 12px', fontSize: '1.25rem' }}>←</button>
                <h1 className="page-title" style={{ margin: 0, textTransform: 'capitalize' }}>{monthName}</h1>
                <button className="btn btn-ghost" onClick={nextMonth} style={{ padding: '4px 12px', fontSize: '1.25rem' }}>→</button>
            </div>

            {/* Weekday headers */}
            <div className="cal-grid cal-header">
                {weekdayHeaders.map(d => (
                    <div key={d} className="cal-weekday">{d}</div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="cal-grid">
                {gridCells.map((cell, i) => {
                    if (!cell) return <div key={`blank-${i}`} className="cal-cell cal-blank" />;
                    const dayEntries = entryMap[cell.date] || [];
                    const hasMood = dayEntries.length > 0;
                    const isSelected = selectedDay === cell.date;
                    const lastMood = hasMood ? dayEntries[dayEntries.length - 1].mood : null;
                    const dotColor = lastMood ? MOOD_DOT_COLOR[lastMood] : 'transparent';
                    const isMultiple = dayEntries.length > 1;

                    return (
                        <button
                            key={cell.date}
                            className={`cal-cell${isSelected ? ' cal-active' : ''}`}
                            onClick={() => setSelectedDay(isSelected ? null : cell.date)}
                        >
                            <span className="cal-day-num">{cell.day}</span>
                            {hasMood && (
                                <span
                                    className="cal-dot"
                                    style={{
                                        background: dotColor,
                                        width: isMultiple ? 8 : 6,
                                        height: isMultiple ? 8 : 6,
                                        boxShadow: isMultiple ? `0 0 6px ${dotColor}` : 'none',
                                    }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Bottom detail card with delete */}
            {selectedDay && selectedEntries.length > 0 && (
                <div className="cal-detail-card fade-in">
                    <div className="cal-detail-date">
                        {new Date(selectedDay + 'T00:00:00').toLocaleDateString(
                            language === 'ru' ? 'ru-RU' : 'en-US',
                            { weekday: 'short', day: 'numeric', month: 'long' },
                        )}
                    </div>
                    {selectedEntries.map((entry, i) => {
                        const cfg = MOOD_CONFIG[entry.mood];
                        const isDeleting = deletingId === entry.id;
                        return (
                            <div
                                key={entry.id}
                                className={`cal-detail-entry${isDeleting ? ' cal-entry--deleting' : ''}`}
                                style={i > 0 ? { borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 } : {}}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <img src={cfg.icon} alt="" style={{ width: 20, height: 20 }} />
                                    <span style={{ fontWeight: 500 }}>{cfg.labelKey}</span>
                                    <div style={{ flex: 1, textAlign: 'right', marginRight: 8 }}>
                                        <span className="cal-detail-time" style={{ display: 'inline-block', width: 60, textAlign: 'center' }}>{entry.time}</span>
                                    </div>
                                    <button
                                        className="cal-delete-btn"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                                        aria-label="Удалить"
                                        style={{ marginLeft: 0 }}
                                    >
                                        ✕
                                    </button>
                                </div>
                                {entry.note && (
                                    <div className="cal-detail-note">"{entry.note}"</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedDay && selectedEntries.length === 0 && (
                <div className="cal-detail-card fade-in" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {new Date(selectedDay + 'T00:00:00').toLocaleDateString(
                        language === 'ru' ? 'ru-RU' : 'en-US',
                        { weekday: 'short', day: 'numeric', month: 'long' },
                    )}
                    <div style={{ marginTop: 4, fontSize: '0.8125rem' }}>Нет записей</div>
                </div>
            )}

            {/* Delete confirmation message */}
            <div className={`mood-confirm-text${deleteMsg ? ' mood-confirm-text--visible' : ''}`}
                style={{ fontSize: '0.9375rem', top: 'auto', bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
                Запись удалена
            </div>
        </div>
    );
}
