'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Sparkles, Store, Swords, Trophy, UserCircle } from 'lucide-react';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/dashboard', label: 'Play', icon: Gamepad2 },
  { href: '/minigames', label: 'Arcade', icon: Sparkles },
  { href: '/lobby', label: 'Match', icon: Swords },
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
    <SidebarMenu className="gap-2 p-0">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={active}
              tooltip={item.label}
              className={cn(
                'h-12 rounded-[1.25rem] px-3 font-black transition-all duration-200 group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-11',
                active
                  ? 'pressed-card text-slate-950 data-[active=true]:bg-transparent data-[active=true]:text-slate-950'
                  : 'hover:-translate-y-0.5 hover:bg-white/65 hover:shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_8px_18px_rgba(35,50,80,.08)]'
              )}
            >
              <Link href={item.href}>
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9',
                    active ? 'bg-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_6px_12px_rgba(35,50,80,.08)]' : 'bg-white/35'
                  )}
                >
                  <Icon className="h-[1.125rem] w-[1.125rem] stroke-[2.35]" />
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
