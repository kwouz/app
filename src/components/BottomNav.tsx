import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, Lightbulb, BarChart3, SlidersHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const TABS: { to: string; icon: LucideIcon; end?: boolean }[] = [
    { to: '/', icon: Home, end: true },
    { to: '/history', icon: CalendarDays },
    { to: '/insights', icon: Lightbulb },
    { to: '/report', icon: BarChart3 },
    { to: '/settings', icon: SlidersHorizontal },
];

export default function BottomNav() {
    return (
        <nav className="bottom-nav">
            {TABS.map(({ to, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className="nav-tab">
                    <span className="nav-ring">
                        <Icon size={22} strokeWidth={1.8} />
                    </span>
                </NavLink>
            ))}
        </nav>
    );
}
