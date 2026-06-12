'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Sparkles, Store, Swords, Trophy, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Play', icon: Gamepad2 },
  { href: '/minigames', label: 'Arcade', icon: Sparkles },
  { href: '/lobby', label: 'Match', icon: Swords },
  { href: '/leaderboard', label: 'Rank', icon: Trophy },
  { href: '/shop', label: 'Shop', icon: Store },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-2 bottom-2 z-40 md:hidden" aria-label="Primary mobile navigation">
      <div className="glass-panel grid grid-cols-6 gap-1 rounded-[1.65rem] p-1.5 shadow-[0_18px_46px_rgba(20,35,55,0.18)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex min-h-[3.75rem] flex-col items-center justify-center gap-1 rounded-[1.2rem] px-1 text-[0.64rem] font-black text-slate-600 transition-all duration-200',
                active
                  ? 'pressed-card text-slate-950'
                  : 'hover:-translate-y-0.5 hover:bg-white/60 hover:text-slate-950'
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-xl transition-all',
                  active ? 'bg-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_6px_12px_rgba(35,50,80,.08)]' : 'bg-white/35'
                )}
              >
                <Icon className="h-4 w-4 stroke-[2.35]" />
              </span>
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
