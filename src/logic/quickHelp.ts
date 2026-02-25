// Quick Help — single source of truth for states, labels, and action cards

export type StateKey = 'heavy' | 'anxiety' | 'tired';

export interface QuickAction {
    id: string;
    title: string;
    why: string;
    steps: string;
    durationSec?: number;
    group: 'quick' | 'energy';
}

export const STATE_LABELS_RU: Record<StateKey, string> = {
    heavy: 'Тяжело',
    anxiety: 'Тревога',
    tired: 'Усталость',
};

/** Map the app's Mood type to a StateKey (only 3 moods qualify) */
export function moodToStateKey(mood: string): StateKey | null {
    switch (mood) {
        case 'heavy': return 'heavy';
        case 'anxious': return 'anxiety';
        case 'neutral': return 'tired';   // neutral mood = "Усталость"
        default: return null;
    }
}

export const QUICK_HELP_ACTIONS: Record<StateKey, QuickAction[]> = {
    heavy: [
        {
            id: 'heavy_1', group: 'quick',
            title: 'Длинный выдох',
            why: 'Снижает внутреннее напряжение за минуту',
            steps: 'Вдох 3–4 сек → выдох 6–8 сек. Повтори 6 циклов.',
            durationSec: 60,
        },
        {
            id: 'heavy_2', group: 'quick',
            title: 'Сброс плеч',
            why: 'Тело отпускает зажимы через простое движение',
            steps: 'Подними плечи к ушам → 2 сек удержи → отпусти. 5 раз.',
            durationSec: 30,
        },
        {
            id: 'heavy_3', group: 'quick',
            title: 'Вернуться в реальность',
            why: 'Переключает внимание из мыслей в тело',
            steps: 'Назови 5 предметов вокруг + 3 звука + 1 ощущение в теле.',
            durationSec: 60,
        },
        {
            id: 'heavy_4', group: 'energy',
            title: 'Вода + движение',
            why: 'Чуть поднимает тонус и ясность',
            steps: 'Стакан воды + 10 медленных приседаний/наклонов.',
            durationSec: 180,
        },
        {
            id: 'heavy_5', group: 'energy',
            title: 'Окно / 2 минуты',
            why: 'Снимает «залипание»',
            steps: 'Открой окно или выйди на 2 минуты.',
            durationSec: 120,
        },
    ],

    anxiety: [
        {
            id: 'anx_1', group: 'quick',
            title: 'Физиологический вздох',
            why: 'Быстро снижает остроту тревоги',
            steps: 'Два коротких вдоха носом → длинный выдох ртом. 5 раз.',
            durationSec: 30,
        },
        {
            id: 'anx_2', group: 'quick',
            title: 'Коробка 4–4–4–4',
            why: 'Дает ощущение контроля',
            steps: 'Вдох 4 → пауза 4 → выдох 4 → пауза 4. 4 круга.',
            durationSec: 60,
        },
        {
            id: 'anx_3', group: 'quick',
            title: 'Челюсть + плечи',
            why: 'Снимает зажимы, которые держат тревогу',
            steps: 'Разомкни зубы, язык на нёбо, круг плеч назад 10 раз.',
            durationSec: 40,
        },
        {
            id: 'anx_4', group: 'energy',
            title: 'Заземление стопами',
            why: 'Возвращает опору',
            steps: 'Надави стопами в пол 10 сек × 3.',
            durationSec: 30,
        },
    ],

    tired: [
        {
            id: 'tired_1', group: 'quick',
            title: 'Ровное дыхание (мягко)',
            why: 'Аккуратно поднимает энергию',
            steps: 'Вдох 2–3 сек, выдох 2–3 сек. 20–30 дыханий (без усилия).',
            durationSec: 60,
        },
        {
            id: 'tired_2', group: 'quick',
            title: 'Осанка: макушка вверх',
            why: 'Тело «просыпается» через выпрямление',
            steps: 'Потянись макушкой вверх 10 сек → отпусти. 3 раза.',
            durationSec: 30,
        },
        {
            id: 'tired_3', group: 'quick',
            title: 'Свет в глаза (мягко)',
            why: 'Синхронизирует бодрость',
            steps: 'Посмотри в окно/на свет 30–60 сек без напряжения.',
            durationSec: 60,
        },
        {
            id: 'tired_4', group: 'energy',
            title: '2 минуты ходьбы',
            why: 'Перезапускает голову',
            steps: 'Быстрая ходьба или шаги на месте 2 минуты.',
            durationSec: 120,
        },
    ],
};
