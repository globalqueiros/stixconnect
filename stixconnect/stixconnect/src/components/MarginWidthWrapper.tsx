'use client';

import React from 'react';

interface MarginWidthWrapperProps {
  children: React.ReactNode;
}

export default function MarginWidthWrapper({ children }: MarginWidthWrapperProps) {
  return (
    <div className="lg:pl-64">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}