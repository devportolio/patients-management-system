import { describe, expect, it } from 'vitest';
import { calculateAge, cn, formatDate, initials } from './utils';

describe('cn', () => {
  it('merges and de-duplicates conflicting tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    const hidden = false;
    expect(cn('text-sm', hidden && 'hidden', 'font-medium')).toBe('text-sm font-medium');
  });
});

describe('formatDate', () => {
  it('formats a YYYY-MM-DD date in UTC', () => {
    expect(formatDate('1990-12-10')).toBe('Dec 10, 1990');
  });

  it('returns the original value for an unparseable string', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('calculateAge', () => {
  it('computes whole years from a date of birth', () => {
    const year = new Date().getUTCFullYear();
    expect(calculateAge(`${year - 30}-01-01`)).toBeGreaterThanOrEqual(29);
  });
});

describe('initials', () => {
  it('builds uppercase two-letter initials', () => {
    expect(initials('ada', 'lovelace')).toBe('AL');
  });
});
