'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Sparkles, Store, Swords, Trophy, UserCircle } from 'lucide-react';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/dashboard', label: 'Play', icon: Gamepad2 },
  { href: '/minigames', label: 'Arcade', icon: Sparkles },
  { href: '/lobby', label: 'Lobby', icon: Swords },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/shop', label: 'Shop', icon: Store },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MainNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu className="gap-2 rounded-[1.65rem] bg-white/[.34] p-2">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={active}
              tooltip={item.label}
              className={cn(
                'rounded-2xl px-2 font-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[.72] hover:shadow-[inset_0_1px_0_rgba(255,255,255,.75),0_8px_18px_rgba(35,50,80,.08)]',
                active && 'pressed-surface text-slate-950'
              )}
            >
              <Link href={item.href}>
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl bg-white/[.62] shadow-[inset_0_1px_0_rgba(255,255,255,.7)] transition-all',
                    active && 'bg-white text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_6px_14px_rgba(35,50,80,.08)]'
                  )}
                >
                  <Icon className="h-5 w-5 stroke-[2.35]" />
                </span>
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
