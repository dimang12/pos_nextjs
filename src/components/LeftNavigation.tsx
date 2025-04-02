'use client';

import { useAuth } from '@/hooks/useAuth';

export default function LeftNavigation() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-full flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className="h-full flex items-center justify-center">Please log in to access navigation</div>;
  }

  return (
    <div className="h-full flex items-center justify-center">
      <h1 className="text-2xl font-bold">Left Navigation</h1>
    </div>
  );
} 