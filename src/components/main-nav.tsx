'use client';

import { usePathname } from 'next/navigation';
import { LayoutGrid, Puzzle, Trophy, UserCircle } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import Link from 'next/link';

export function MainNav() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/', label: 'Game', icon: LayoutGrid },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/profile', label: 'Profile', icon: UserCircle },
    { href: '/minigames', label: 'Minigames', icon: Puzzle },
  ];

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
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
