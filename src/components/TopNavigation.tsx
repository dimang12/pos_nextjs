'use client';

import { useAuth } from '@/hooks/useAuth';
import UserDropdown from '@/components/UserDropdown';

export default function TopNavigation() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-full flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Don't show navigation for unauthenticated users
  }

  return (
    <div className="h-full flex items-center justify-between px-4">
      <div className="flex items-center">
        <h1 className="text-xl font-bold">POS System</h1>
      </div>
      <div className="flex items-center space-x-4">
        <UserDropdown />
      </div>
    </div>
  );
} 