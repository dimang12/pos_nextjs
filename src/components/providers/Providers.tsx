'use client';

import LayoutContent from '@/components/layout/LayoutContent';
import { NavigationProvider } from '@/context/NavigationContext';
import MuiThemeProvider from '@/components/providers/MuiThemeProvider';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MuiThemeProvider>
      <NavigationProvider>
        <LayoutContent>{children}</LayoutContent>
        <Toaster position="bottom-right" />
      </NavigationProvider>
    </MuiThemeProvider>
  );
} 