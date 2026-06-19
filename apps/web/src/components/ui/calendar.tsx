'use client';

import 'react-day-picker/style.css';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * shadcn-style calendar built on react-day-picker. Uses the library's base
 * stylesheet for structure, themed to our design tokens via the `.rdp-themed`
 * overrides in globals.css (accent → primary, surfaces → popover, etc.).
 */
function Calendar({ className, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('rdp-themed p-3', className)}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
