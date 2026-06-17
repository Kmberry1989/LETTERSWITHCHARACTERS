'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/dashboard', label: 'Play', iconPath: '/interface/sidebar-icons/play.png' },
  { href: '/minigames', label: 'Arcade', iconPath: '/interface/sidebar-icons/arcade.png' },
  { href: '/lobby', label: 'Lobby', iconPath: '/interface/sidebar-icons/lobby.png' },
  { href: '/leaderboard', label: 'Leaderboard', iconPath: '/interface/sidebar-icons/leaderboard.png' },
  { href: '/shop', label: 'Shop', iconPath: '/interface/sidebar-icons/shop.png' },
  { href: '/profile', label: 'Profile', iconPath: '/interface/sidebar-icons/profile.png' },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MainNav() {
  const pathname = usePathname();

  return (
      <SidebarMenu className="gap-2 rounded-[1.65rem] bg-white/[.34] p-2">
      {menuItems.map((item) => {
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
                    'flex h-11 w-11 items-center justify-center rounded-xl bg-white/[.62] shadow-[inset_0_1px_0_rgba(255,255,255,.7)] transition-all',
                    active && 'bg-white text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_6px_14px_rgba(35,50,80,.08)]'
                  )}
                >
                  <Image
                    src={item.iconPath}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                  />
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
