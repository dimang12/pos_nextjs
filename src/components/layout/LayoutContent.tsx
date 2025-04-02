'use client';

import React from 'react';
import LeftNavigation from '@/components/layout/LeftNavigation';
import MainMenu from '@/components/layout/MainMenu';
import TopNavigation from '@/components/layout/TopNavigation';
import Footer from '@/components/layout/Footer';
import { useNavigation } from '@/context/NavigationContext';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useNavigation();

  return (
    <div className="min-h-screen bg-gray-100">
      <MainMenu />
      <LeftNavigation />
      <div className="min-h-screen flex flex-col">
        <TopNavigation />
        <div className={`pt-16 pb-12 transition-all duration-300 ${
          isCollapsed ? 'ml-16' : 'ml-80'
        }`}>
          <main className="flex-1 px-4">
            {children}
          </main>
        </div>
        <Footer />
      </div>
    </div>
  );
} 