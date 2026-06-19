import * as React from 'react';
import { AppHeader } from '@/components/app-header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="container py-6 sm:py-8">{children}</main>
    </div>
  );
}
