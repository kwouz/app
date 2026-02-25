export type Language = 'en' | 'ru';

const translations: Record<Language, Record<string, string>> = {
    en: {
        // Language selection
        lang_title: 'Choose your language',
        lang_en: 'English',
        lang_ru: 'Русский',

        // Onboarding
        onboarding_1: 'Have you noticed\nhow your state shifts?',
        onboarding_2: 'Try simply noticing.\nNo analysis.\nNo judgment.',
        onboarding_3: 'You don\'t have to be alone.\nWho can you call when it gets heavy?',
        continue: 'Continue',
        start: 'Start',

        // Navigation
        nav_today: 'Today',
        nav_history: 'History',
        nav_report: 'Report',
        nav_settings: 'Settings',

        // Home
        home_question: 'How are you today?',
        home_today_feel: 'Today you feel',
        home_note_placeholder: 'A word or a short thought (optional)',
        save: 'Save',
        skip: 'Skip',
        edit: 'Edit',
        noted: 'Noted.',

        // Mood labels
        mood_calm: 'Calm',
        mood_good: 'Okay',
        mood_neutral: 'Tired',
        mood_anxious: 'Anxious',
        mood_heavy: 'Heavy',

        // History
        history_title: 'History',
        history_empty: 'Nothing here yet.',
        history_empty_cta: 'Start with today.',
        history_month_count: "You've checked in {{count}} times this month",
        history_month_count_one: "You've checked in 1 time this month",
        history_noted_today: 'Noted today',
        history_noted_yesterday: 'Noted yesterday',
        history_noted_days_ago: 'Noted {{n}} days ago',
        history_filter_all: 'All states',
        history_filter_close: 'Done',

        // Report
        report_title: 'Report',
        report_last_7: '7 days',
        report_last_30: '30 days',
        report_this_month: 'This month',
        report_custom: 'Custom',
        report_from: 'From',
        report_to: 'To',
        report_most_frequent: 'Most frequent',
        report_entries: 'Entries',
        report_streak: 'Streak',
        report_day: 'day',
        report_days: 'days',

        // Export
        export_personal: 'Personal report',
        export_therapist: 'Therapist export',
        export_pdf: 'Export PDF',

        // AI & V2
        ai_weekly: 'Weekly reflection',
        ai_monthly: 'Monthly insights',
        ai_loading: 'Reflecting…',
        ai_copy: 'Copy',
        ai_copied: 'Copied',

        // Pro
        pro_label: 'Pro',

        stat_most_common: 'Most common',
        stat_best_day: 'Best day',
        stat_avg_entries: 'Avg entries/mo',
        milestone_10: 'You started noticing. 10 check-ins.',
        milestone_30: 'You are building awareness. 30 check-ins.',
        milestone_100: 'Consistency shapes clarity. 100 check-ins.',
        streak_text: 'You have checked in {0} days in a row.',
        reminders_title: 'Reminders',

        // Print
        print_title: 'Emotional Report',
        print_total: 'Total check-ins',
        print_most_frequent: 'Most frequent state',
        print_date: 'Date',
        print_mood: 'State',
        print_note: 'Note',

        // Settings
        settings_title: 'Settings',
        settings_appearance: 'Appearance',
        settings_theme: 'Theme',
        settings_light: 'Light',
        settings_dark: 'Dark',
        settings_system: 'Auto',
        settings_reminders: 'Reminders',
        settings_daily_reminder: 'Daily reminder',
        settings_reminder_time: 'Time',
        settings_language: 'Language',
        settings_language_label: 'Language',
        settings_data: 'Data',
        settings_export: 'Export',
        settings_import: 'Import',
        settings_reset: 'Reset all data',
        settings_reset_title: 'Reset all data?',
        settings_reset_body: 'All entries and settings will be permanently deleted.',
        settings_cancel: 'Cancel',
        settings_reset_confirm: 'Reset',
        settings_import_fail: 'Import failed.',

        chat_title: 'Reflection',
        chat_empty: 'Hello. I am here to help you reflect. How are you feeling today?',
        chat_placeholder: 'Type a message...',
    },

    ru: {
        lang_title: 'Выберите язык',
        lang_en: 'English',
        lang_ru: 'Русский',

        onboarding_1: 'Вы замечали,\nкак меняется ваше состояние?',
        onboarding_2: 'Попробуйте просто замечать.\nБез анализа.\nБез оценок.',
        onboarding_3: 'Вы не обязаны справляться в одиночку.\nКому можно позвонить когда тяжело?',
        continue: 'Продолжить',
        start: 'Начать',

        nav_today: 'Сегодня',
        nav_history: 'История',
        nav_report: 'Отчёт',
        nav_settings: 'Настройки',

        home_question: 'Как вы сегодня?',
        home_today_feel: 'Сегодня вы чувствуете',
        home_note_placeholder: 'Слово или короткая мысль (необязательно)',
        save: 'Сохранить',
        skip: 'Пропустить',
        edit: 'Изменить',
        noted: 'Записано.',

        mood_calm: 'Спокойствие',
        mood_good: 'Нормально',
        mood_neutral: 'Усталость',
        mood_anxious: 'Тревога',
        mood_heavy: 'Тяжело',

        history_title: 'История',
        history_empty: 'Записей пока нет.',
        history_empty_cta: 'Начните с сегодняшнего дня.',
        history_month_count: 'Вы отметились {{count}} раз в этом месяце',
        history_month_count_one: 'Вы отметились 1 раз в этом месяце',
        history_noted_today: 'Отмечено сегодня',
        history_noted_yesterday: 'Отмечено вчера',
        history_noted_days_ago: 'Отмечено {{n}} дней назад',
        history_filter_all: 'Все состояния',
        history_filter_close: 'Готово',

        report_title: 'Отчёт',
        report_last_7: '7 дней',
        report_last_30: '30 дней',
        report_this_month: 'Этот месяц',
        report_custom: 'Период',
        report_from: 'С',
        report_to: 'По',
        report_most_frequent: 'Чаще всего',
        report_entries: 'Записей',
        report_streak: 'Серия',
        report_day: 'день',
        report_days: 'дней',

        export_personal: 'Личный отчёт',
        export_therapist: 'Для специалиста',
        export_pdf: 'Экспорт PDF',

        ai_weekly: 'Недельная рефлексия',
        ai_monthly: 'Месячные наблюдения',
        ai_loading: 'Размышляю…',
        ai_copy: 'Скопировать',
        ai_copied: 'Скопировано',

        pro_label: 'Pro',

        stat_most_common: 'Чаще всего',
        stat_best_day: 'Лучший день',
        stat_avg_entries: 'Отметок/мес',
        milestone_10: 'Вы начали замечать. 10 отметок.',
        milestone_30: 'Вы развиваете осознанность. 30 отметок.',
        milestone_100: 'Постоянство создает ясность. 100 отметок.',
        streak_text: '{0} дн. подряд.',
        reminders_title: 'Напоминания',

        print_title: 'Эмоциональный отчёт',
        print_total: 'Всего отметок',
        print_most_frequent: 'Частое состояние',
        print_date: 'Дата',
        print_mood: 'Состояние',
        print_note: 'Заметка',

        settings_title: 'Настройки',
        settings_appearance: 'Внешний вид',
        settings_theme: 'Тема',
        settings_light: 'Светлая',
        settings_dark: 'Тёмная',
        settings_system: 'Авто',
        settings_reminders: 'Напоминания',
        settings_daily_reminder: 'Ежедневное напоминание',
        settings_reminder_time: 'Время',
        settings_language: 'Язык',
        settings_language_label: 'Язык',
        settings_data: 'Данные',
        settings_export: 'Экспорт',
        settings_import: 'Импорт',
        settings_reset: 'Сбросить все данные',
        settings_reset_title: 'Сбросить все данные?',
        settings_reset_body: 'Все записи и настройки будут удалены навсегда.',
        settings_cancel: 'Отмена',
        settings_reset_confirm: 'Сбросить',
        settings_import_fail: 'Ошибка импорта.',

        chat_title: 'Рефлексия',
        chat_empty: 'Здравствуйте. Я здесь, чтобы помочь вам с рефлексией. Как вы себя чувствуете сегодня?',
        chat_placeholder: 'Введите сообщение...',
    },
};

export default translations;
