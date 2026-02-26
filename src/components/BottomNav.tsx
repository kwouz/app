import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, Lightbulb, BarChart3, SlidersHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const TABS: { to: string; icon: LucideIcon; end?: boolean; onboarding?: string }[] = [
    { to: '/', icon: Home, end: true },
    { to: '/history', icon: CalendarDays, onboarding: 'nav-history' },
    { to: '/insights', icon: Lightbulb, onboarding: 'nav-insights' },
    { to: '/report', icon: BarChart3, onboarding: 'nav-report' },
    { to: '/settings', icon: SlidersHorizontal },
];

export default function BottomNav() {
    return (
        <nav className="bottom-nav">
            {TABS.map(({ to, icon: Icon, end, onboarding }) => (
                <NavLink key={to} to={to} end={end} className="nav-tab" data-onboarding={onboarding}>
                    <span className="nav-ring">
                        <Icon size={22} strokeWidth={1.8} />
                    </span>
                </NavLink>
            ))}
        </nav>
    );
}
