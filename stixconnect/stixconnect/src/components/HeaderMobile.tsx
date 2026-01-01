'use client';

import React from 'react';

interface HeaderMobileProps {
  onMenuToggle?: () => void;
}

export default function HeaderMobile({ onMenuToggle }: HeaderMobileProps) {
  return (
    <div className="md:hidden">
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}