'use client';

import { usePathname } from 'next/navigation';
import { Gamepad2, Puzzle, Trophy, UserCircle, Store } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import Link from 'next/link';

export function MainNav() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', label: 'Games', icon: Gamepad2 },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/shop', label: 'Shop', icon: Store },
    { href: '/profile', label: 'Profile', icon: UserCircle },
    { href: '/minigames', label: 'Minigames', icon: Puzzle },
  ];

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')}
            tooltip={item.label}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
