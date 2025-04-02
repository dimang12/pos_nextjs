'use client';

import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/lib/theme';
import { useState } from 'react';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [{ cache }] = useState(() => {
    const cache = createCache({
      key: 'mui',
    });
    cache.compat = true;
    return { cache };
  });

  useServerInsertedHTML(() => {
    // @ts-expect-error - This is a workaround for the type error
    const styles = cache.insert('', '', '', '');
    if (!styles) return null;
    
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
} 