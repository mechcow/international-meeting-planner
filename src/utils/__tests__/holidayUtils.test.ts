import { describe, it, expect } from 'vitest';
import { isPublicHoliday, getHolidayName } from '../holidayUtils';

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
