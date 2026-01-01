'use client';

import React from 'react';
import { Home, Users, Calendar, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

interface SideNavProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navigation = [
  { name: 'Início', href: '/', icon: Home },
  { name: 'Pacientes', href: '/pacientes', icon: Users },
  { name: 'Consultas', href: '/consultas', icon: Calendar },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export default function SideNav({ isOpen = false, onClose }: SideNavProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">StixConnect</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  onClick={onClose}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
          
          <div className="px-4 mt-8">
            <button className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}