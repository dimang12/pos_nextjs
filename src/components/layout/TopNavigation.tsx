'use client';

import React from 'react';
import { useNavigation } from '@/context/NavigationContext';
import UserDropdown from './UserDropdown';

const TopNavigation = () => {
  const { toggleCollapse, isCollapsed } = useNavigation();

  return (
    <header className={`h-16 bg-white border-b fixed z-40 transition-all duration-300 ${
      isCollapsed ? 'left-16 right-0' : 'left-80 right-0'
    }`}>
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleCollapse}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title={isCollapsed ? "Expand menu" : "Collapse menu"}
          >
            {isCollapsed ? "☰" : "←"}
          </button>
          <h2 className="text-xl font-semibold">Dashboard</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            🔔
          </button>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default TopNavigation; 