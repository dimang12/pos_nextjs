'use client';

import { useAuth } from '@/hooks/useAuth';

export default function MainMenu() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-full flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className="h-full flex items-center justify-center">Please log in to access the menu</div>;
  }

  return (
    <div className="h-full flex items-center justify-center">
      <h1 className="text-2xl font-bold">Main Menu</h1>
    </div>
  );
} 