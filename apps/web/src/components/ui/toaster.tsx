'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

/** App-wide toast host, themed to match the design tokens. */
export function Toaster() {
  const { theme } = useTheme();
  return (
    <Sonner
      theme={(theme as 'light' | 'dark' | 'system') ?? 'system'}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border border-border shadow-lg',
        },
      }}
    />
  );
}
