import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import LayoutContent from '@/components/layout/LayoutContent';
import { NavigationProvider } from '@/context/NavigationContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'POS System',
  description: 'Point of Sale System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NavigationProvider>
          <LayoutContent>{children}</LayoutContent>
        </NavigationProvider>
      </body>
    </html>
  );
} 