import { describe, it, expect } from 'vitest';
import {
  isPublicHoliday,
  getHolidayName,
  getPublicHoliday,
  getSubdivisions,
  formatJurisdiction,
} from '../holidayUtils';

describe('regional (subdivision) holidays', () => {
  it('includes state-only holidays when a subdivision is given', () => {
    // King's Birthday is set per state in Australia: NSW observes it on 8 June 2026
    const kingsBirthday = new Date(2026, 5, 8, 12, 0, 0);
    expect(isPublicHoliday(kingsBirthday, 'AU', 'NSW')).toBe(true);
    expect(getHolidayName(kingsBirthday, 'AU', 'NSW')).toContain('King');
    // ...but it isn't a nationwide holiday, and WA holds it in September
    expect(isPublicHoliday(kingsBirthday, 'AU')).toBe(false);
    expect(isPublicHoliday(kingsBirthday, 'AU', 'WA')).toBe(false);
  });

  it('distinguishes US states', () => {
    // Patriots' Day (third Monday of April) is a Massachusetts holiday
    const patriotsDay = new Date(2026, 3, 20, 12, 0, 0);
    expect(isPublicHoliday(patriotsDay, 'US', 'MA')).toBe(true);
    expect(isPublicHoliday(patriotsDay, 'US', 'CA')).toBe(false);
  });

  it('still includes national holidays with a subdivision', () => {
    const christmas = new Date(2025, 11, 25, 12, 0, 0);
    expect(getPublicHoliday(christmas, 'AU', 'NSW')?.name).toContain('Christmas');
    expect(getPublicHoliday(christmas, 'US', 'NY')?.name).toContain('Christmas');
  });

  it('treats an empty subdivision as nationwide', () => {
    const kingsBirthday = new Date(2026, 5, 8, 12, 0, 0);
    expect(isPublicHoliday(kingsBirthday, 'AU', '')).toBe(false);
  });

  it('covers every day of multi-day holidays', () => {
    // Eid al-Fitr 2026 in the UAE runs 20-22 March
    expect(isPublicHoliday(new Date(2026, 2, 19), 'AE')).toBe(false);
    expect(isPublicHoliday(new Date(2026, 2, 20), 'AE')).toBe(true);
    expect(isPublicHoliday(new Date(2026, 2, 21), 'AE')).toBe(true);
    expect(isPublicHoliday(new Date(2026, 2, 22), 'AE')).toBe(true);
    expect(isPublicHoliday(new Date(2026, 2, 23), 'AE')).toBe(false);
  });

  it('returns English holiday names', () => {
    expect(getHolidayName(new Date(2025, 0, 29), 'CN')).toBe('Spring Festival');
  });

  it('matches the holiday on its own calendar day, not shifted by the viewer timezone', () => {
    // Previously a viewer in Sydney saw US Christmas on Dec 26
    expect(getHolidayName(new Date(2025, 11, 25), 'US')).toBe('Christmas Day');
    expect(isPublicHoliday(new Date(2025, 11, 26), 'US')).toBe(false);
  });

  it('uses the calendar day regardless of time of day', () => {
    expect(isPublicHoliday(new Date(2025, 11, 25, 0, 30), 'GB')).toBe(true);
    expect(isPublicHoliday(new Date(2025, 11, 25, 23, 30), 'GB')).toBe(true);
  });
});

describe('getSubdivisions', () => {
  it('lists states for countries that have them', () => {
    const states = getSubdivisions('AU');
    expect(states).toContainEqual({ code: 'NSW', name: 'New South Wales' });
    expect(states.length).toBe(8);
  });

  it('returns empty for countries without subdivisions or invalid codes', () => {
    expect(getSubdivisions('JP')).toEqual([]);
    expect(getSubdivisions('INVALID')).toEqual([]);
  });
});

describe('formatJurisdiction', () => {
  it('formats country and subdivision', () => {
    expect(formatJurisdiction('AU', 'NSW')).toBe('NSW, AU');
    expect(formatJurisdiction('JP')).toBe('JP');
    expect(formatJurisdiction('JP', '')).toBe('JP');
  });
});

describe('isPublicHoliday', () => {
  describe('UK holidays', () => {
    // UK holidays are more consistently typed as 'public' in the library
    it('should return true for Christmas Day in UK', () => {
      const christmas = new Date(2025, 11, 25, 12, 0, 0); // Dec 25, 2025
      expect(isPublicHoliday(christmas, 'GB')).toBe(true);
    });

    it('should return true for Boxing Day in UK', () => {
      const boxingDay = new Date(2025, 11, 26, 12, 0, 0); // Dec 26, 2025
      expect(isPublicHoliday(boxingDay, 'GB')).toBe(true);
    });

    it('should return false for regular weekday in UK', () => {
      const regularDay = new Date(2025, 0, 15, 12, 0, 0); // Jan 15, 2025
      expect(isPublicHoliday(regularDay, 'GB')).toBe(false);
    });
  });

  describe('Japan holidays', () => {
    it('should return true for Coming of Age Day', () => {
      // Second Monday of January 2025 is January 13
      const comingOfAge = new Date(2025, 0, 13, 12, 0, 0);
      expect(isPublicHoliday(comingOfAge, 'JP')).toBe(true);
    });

    it('should return true for New Year\'s Day in Japan', () => {
      const newYear = new Date(2025, 0, 1, 12, 0, 0);
      expect(isPublicHoliday(newYear, 'JP')).toBe(true);
    });
  });

  describe('caching', () => {
    it('should return same result for repeated calls (cache hit)', () => {
      const date = new Date(2025, 11, 25, 12, 0, 0);
      const result1 = isPublicHoliday(date, 'GB');
      const result2 = isPublicHoliday(date, 'GB');
      expect(result1).toBe(result2);
    });
  });

  describe('unsupported country codes', () => {
    it('should return false for invalid country code', () => {
      const date = new Date(2025, 11, 25, 12, 0, 0);
      expect(isPublicHoliday(date, 'INVALID')).toBe(false);
    });
  });

  describe('regular days', () => {
    it('should return false for regular weekdays', () => {
      const regularDay = new Date(2025, 2, 12, 12, 0, 0); // March 12, 2025
      expect(isPublicHoliday(regularDay, 'GB')).toBe(false);
      expect(isPublicHoliday(regularDay, 'JP')).toBe(false);
    });
  });
});

describe('getHolidayName', () => {
  it('should return holiday name for UK Christmas', () => {
    const christmas = new Date(2025, 11, 25, 12, 0, 0);
    const name = getHolidayName(christmas, 'GB');
    expect(name).toContain('Christmas');
  });

  it('should return holiday name for Japan New Year', () => {
    const newYear = new Date(2025, 0, 1, 12, 0, 0);
    const name = getHolidayName(newYear, 'JP');
    expect(name).not.toBeNull();
  });

  it('should return null for regular day', () => {
    const regularDay = new Date(2025, 2, 12, 12, 0, 0);
    const name = getHolidayName(regularDay, 'GB');
    expect(name).toBeNull();
  });

  it('should return null for invalid country code', () => {
    const date = new Date(2025, 11, 25, 12, 0, 0);
    const name = getHolidayName(date, 'INVALID');
    expect(name).toBeNull();
  });
});
