'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Sparkles, Store, Swords, Trophy, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', label: 'Play', icon: Gamepad2 },
  { href: '/minigames', label: 'Arcade', icon: Sparkles },
  { href: '/lobby', label: 'Lobby', icon: Swords },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
  { href: '/shop', label: 'Shop', icon: Store },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 md:hidden" aria-label="Primary mobile navigation">
      <div className="glass-panel grid grid-cols-6 gap-1 rounded-[1.6rem] p-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.25rem] px-1 text-[0.62rem] font-black text-slate-500 transition-all',
                active ? 'pressed-surface text-slate-950' : 'hover:bg-white/[.65] hover:text-slate-900'
              )}
            >
              <Icon className={cn('h-5 w-5 transition-transform', active ? 'scale-110 text-emerald-700' : '')} />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
