'use client';

import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, formatDate } from '@/lib/utils';

/** Parse a `YYYY-MM-DD` string into a local Date (or undefined). */
function toDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Serialize a Date to `YYYY-MM-DD` (local, no timezone shift). */
function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const MAX_AGE_YEARS = 150;

interface DatePickerProps
  extends Omit<React.ComponentProps<'button'>, 'value' | 'onChange' | 'onBlur'> {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}

/**
 * A shadcn-style date picker (Popover + Calendar) that reads/writes a
 * `YYYY-MM-DD` string, so it drops straight into the shared Zod contract.
 * forwardRef + prop spread let it sit inside <FormControl>.
 */
const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ value, onChange, onBlur, placeholder = 'Select a date', className, ...rest }, ref) => {
    const [open, setOpen] = React.useState(false);
    const selected = toDate(value);

    const today = React.useMemo(() => new Date(), []);
    const minDate = React.useMemo(() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() - MAX_AGE_YEARS);
      return d;
    }, []);

    return (
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) onBlur?.();
        }}
      >
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type="button"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal aria-[invalid=true]:border-destructive',
              !selected && 'text-muted-foreground',
              className,
            )}
            {...rest}
          >
            <CalendarIcon className="text-muted-foreground" />
            {selected ? formatDate(value!) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected ?? minDate}
            captionLayout="dropdown"
            startMonth={minDate}
            endMonth={today}
            disabled={[{ after: today }, { before: minDate }]}
            autoFocus
            onSelect={(date) => {
              if (date) {
                onChange(toISODate(date));
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    );
  },
);
DatePicker.displayName = 'DatePicker';

export { DatePicker };
