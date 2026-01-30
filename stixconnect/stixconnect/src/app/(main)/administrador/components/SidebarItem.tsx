'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import { MenuItem } from '../lib/menuData';

interface SidebarItemProps {
  item: MenuItem;
}

export function SidebarItem({ item }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = (Icons as any)[item.icon];

  if (item.isHeading) {
    return (
      <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
        {item.title}
      </div>
    );
  }

  if (item.target === '_blank') {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-between px-4 py-2.5 text-sm rounded-lg transition-all duration-200 text-black hover:bg-gray-200`}
      >
        <div className="flex items-center space-x-3 my-1">
          {Icon && <Icon className="w-5 h-5 text-black" />}
          <span>{item.title}</span>
        </div>
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center justify-between px-4 py-2.5 text-sm rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-[#10c4b5] text-white font-semibold'
          : 'text-black hover:bg-gray-200'
      }`}
    >
      <div className="flex items-center space-x-3 my-1">
        {Icon && (
          <Icon
            className={`w-5 h-5 ${
              isActive ? 'text-white' : 'text-black group-hover:font-semibold'
            }`}
          />
        )}
        <span>{item.title}</span>
      </div>
    </Link>
  );
}
