'use client';

import React from 'react';
import { useNavigation } from '@/context/NavigationContext';

const Footer = () => {
  const { isCollapsed } = useNavigation();

  return (
    <footer className={`bg-white border-t h-12 fixed bottom-0 z-40 transition-all duration-300 ${
      isCollapsed ? 'left-16 right-0' : 'left-80 right-0'
    }`}>
      <div className="h-full px-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          © {new Date().getFullYear()} POS System. All rights reserved.
        </p>
        <div className="text-sm text-gray-600">
          Version 1.0.0
        </div>
      </div>
    </footer>
  );
};

export default Footer; 