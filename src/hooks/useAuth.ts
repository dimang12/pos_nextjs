import { useEffect, useState } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include',
        });
        
        // 401 is expected when user is not authenticated
        if (response.status === 401) {
          setIsAuthenticated(false);
        } else if (response.ok) {
          setIsAuthenticated(true);
        }
      } catch {
        // Network errors or other issues should be treated as not authenticated
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { isAuthenticated, isLoading };
} 