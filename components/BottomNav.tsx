'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, Map, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    name: 'List',
    href: '/app/list',
    icon: List,
  },
  {
    name: 'Map',
    href: '/app/map',
    icon: Map,
  },
  {
    name: 'Profile',
    href: '/app/profile',
    icon: User,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className={cn('w-6 h-6', isActive && 'stroke-[2.5px]')} />
                <span className={cn('text-xs', isActive && 'font-semibold')}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Side Navigation */}
      <nav className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">TasteSwipe</h1>
          <p className="text-sm text-gray-500 mt-1">Discover your perfect restaurant</p>
        </div>
        <div className="flex flex-col space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
