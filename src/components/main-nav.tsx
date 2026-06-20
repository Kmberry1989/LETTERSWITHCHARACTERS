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
    <SidebarMenu className="gap-3.5 rounded-[2rem] bg-white/[.34] p-3.5">
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
                'rounded-[1.6rem] px-3.5 py-2.5 font-black text-[1.16rem] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[.72] hover:shadow-[inset_0_1px_0_rgba(255,255,255,.75),0_8px_18px_rgba(35,50,80,.08)]',
                active && 'pressed-surface text-slate-950'
              )}
            >
              <Link href={item.href}>
                <span
                  className={cn(
                    'flex h-[3.85rem] w-[3.85rem] items-center justify-center rounded-[1.3rem] bg-white/[.62] shadow-[inset_0_1px_0_rgba(255,255,255,.7)] transition-all',
                    active && 'bg-white text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_6px_14px_rgba(35,50,80,.08)]'
                  )}
                >
                  <Image
                    src={item.iconPath}
                    alt=""
                    width={38}
                    height={38}
                    className="h-9 w-9 object-contain"
                  />
                </span>
                <span className="text-[1.16rem]">{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
