import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SLOTS_PER_DAY,
  MINUTES_PER_SLOT,
  isWeekend,
  isWithinWorkingHours,
  formatSlot,
  formatDecimalTime,
  getTimeOptions,
  getSlotInTimezone,
  getHourBlocks,
  getTimezoneOffset,
} from '../timezoneUtils';

describe('timezoneUtils constants', () => {
  it('should have 48 slots per day (30-minute increments)', () => {
    expect(SLOTS_PER_DAY).toBe(48);
  });

  it('should have 30 minutes per slot', () => {
    expect(MINUTES_PER_SLOT).toBe(30);
  });
});

describe('isWeekend', () => {
  it('should return true for Saturday', () => {
    const saturday = new Date('2025-01-04'); // Saturday
    expect(isWeekend(saturday)).toBe(true);
  });

  it('should return true for Sunday', () => {
    const sunday = new Date('2025-01-05'); // Sunday
    expect(isWeekend(sunday)).toBe(true);
  });

  it('should return false for weekdays', () => {
    const monday = new Date('2025-01-06');
    const tuesday = new Date('2025-01-07');
    const wednesday = new Date('2025-01-08');
    const thursday = new Date('2025-01-09');
    const friday = new Date('2025-01-10');

    expect(isWeekend(monday)).toBe(false);
    expect(isWeekend(tuesday)).toBe(false);
    expect(isWeekend(wednesday)).toBe(false);
    expect(isWeekend(thursday)).toBe(false);
    expect(isWeekend(friday)).toBe(false);
  });
});

describe('isWithinWorkingHours', () => {
  it('should return true for time within standard working hours (9-17)', () => {
    expect(isWithinWorkingHours(9, 9, 17)).toBe(true);
    expect(isWithinWorkingHours(12, 9, 17)).toBe(true);
    expect(isWithinWorkingHours(16.5, 9, 17)).toBe(true);
  });

  it('should return false for time outside working hours', () => {
    expect(isWithinWorkingHours(8, 9, 17)).toBe(false);
    expect(isWithinWorkingHours(17, 9, 17)).toBe(false);
    expect(isWithinWorkingHours(20, 9, 17)).toBe(false);
  });

  it('should handle overnight working hours (e.g., night shift 22-6)', () => {
    expect(isWithinWorkingHours(23, 22, 6)).toBe(true);
    expect(isWithinWorkingHours(2, 22, 6)).toBe(true);
    expect(isWithinWorkingHours(5.5, 22, 6)).toBe(true);
    expect(isWithinWorkingHours(10, 22, 6)).toBe(false);
    expect(isWithinWorkingHours(18, 22, 6)).toBe(false);
  });

  it('should return false for weekends when date is provided', () => {
    const saturday = new Date('2025-01-04');
    expect(isWithinWorkingHours(12, 9, 17, saturday)).toBe(false);
  });

  it('should return true for weekdays when date is provided', () => {
    const monday = new Date('2025-01-06');
    expect(isWithinWorkingHours(12, 9, 17, monday)).toBe(true);
  });

  it('should handle edge cases at boundaries', () => {
    expect(isWithinWorkingHours(9, 9, 17)).toBe(true); // Start boundary (inclusive)
    expect(isWithinWorkingHours(17, 9, 17)).toBe(false); // End boundary (exclusive)
  });
});

describe('formatSlot', () => {
  it('should format morning times correctly', () => {
    expect(formatSlot(0, 0)).toBe('12AM');
    expect(formatSlot(0, 30)).toBe('12:30AM');
    expect(formatSlot(9, 0)).toBe('9AM');
    expect(formatSlot(9, 30)).toBe('9:30AM');
    expect(formatSlot(11, 0)).toBe('11AM');
    expect(formatSlot(11, 30)).toBe('11:30AM');
  });

  it('should format afternoon/evening times correctly', () => {
    expect(formatSlot(12, 0)).toBe('12PM');
    expect(formatSlot(12, 30)).toBe('12:30PM');
    expect(formatSlot(15, 0)).toBe('3PM');
    expect(formatSlot(15, 30)).toBe('3:30PM');
    expect(formatSlot(23, 0)).toBe('11PM');
    expect(formatSlot(23, 30)).toBe('11:30PM');
  });
});

describe('formatDecimalTime', () => {
  it('should format decimal times correctly', () => {
    expect(formatDecimalTime(9)).toBe('9:00 AM');
    expect(formatDecimalTime(9.5)).toBe('9:30 AM');
    expect(formatDecimalTime(12)).toBe('12:00 PM');
    expect(formatDecimalTime(17)).toBe('5:00 PM');
    expect(formatDecimalTime(17.5)).toBe('5:30 PM');
  });

  it('should handle midnight and noon', () => {
    expect(formatDecimalTime(0)).toBe('12:00 AM');
    expect(formatDecimalTime(12)).toBe('12:00 PM');
  });
});

describe('getTimeOptions', () => {
  it('should return 48 time options (one per slot)', () => {
    const options = getTimeOptions();
    expect(options).toHaveLength(48);
  });

  it('should start at midnight and end at 11:30 PM', () => {
    const options = getTimeOptions();
    expect(options[0].value).toBe(0);
    expect(options[0].label).toBe('12:00 AM');
    expect(options[47].value).toBe(23.5);
    expect(options[47].label).toBe('11:30 PM');
  });

  it('should have correct increments of 0.5 hours', () => {
    const options = getTimeOptions();
    for (let i = 0; i < options.length; i++) {
      expect(options[i].value).toBe(i * 0.5);
    }
  });
});

describe('getSlotInTimezone', () => {
  it('should return correct hour and minutes for a given slot in local context', () => {
    // Use a date without explicit timezone to test local behavior
    const baseDate = new Date(2025, 0, 6, 0, 0, 0); // Jan 6, 2025, midnight local

    // Test that slots increment correctly
    const slot0 = getSlotInTimezone(baseDate, 0, 'America/New_York');
    const slot2 = getSlotInTimezone(baseDate, 2, 'America/New_York');

    // Slot 2 should be 1 hour after slot 0
    expect(slot2.hour - slot0.hour === 1 || (slot0.hour === 23 && slot2.hour === 1)).toBe(true);
    expect(slot0.minutes).toBe(0);
    expect(slot2.minutes).toBe(0);
  });

  it('should calculate timeDecimal correctly based on hour and minutes', () => {
    const baseDate = new Date(2025, 0, 6, 0, 0, 0);

    // Test slots in same timezone to verify relationship
    const slot = getSlotInTimezone(baseDate, 18, 'America/New_York');
    const expectedDecimal = slot.hour + slot.minutes / 60;
    expect(slot.timeDecimal).toBe(expectedDecimal);
  });

  it('should have consistent relationship between slot index and time', () => {
    const baseDate = new Date(2025, 0, 6, 0, 0, 0);

    // Two consecutive slots should be 30 minutes apart
    const slot10 = getSlotInTimezone(baseDate, 10, 'UTC');
    const slot11 = getSlotInTimezone(baseDate, 11, 'UTC');

    // The difference in timeDecimal should be 0.5 (30 minutes)
    expect(slot11.timeDecimal - slot10.timeDecimal).toBeCloseTo(0.5, 1);
  });
});

describe('getHourBlocks', () => {
  it('should return 48 blocks for a day', () => {
    const blocks = getHourBlocks(new Date('2025-01-06'));
    expect(blocks).toHaveLength(48);
  });

  it('should start at midnight and increment by 30 minutes', () => {
    const blocks = getHourBlocks(new Date('2025-01-06'));

    expect(blocks[0].getHours()).toBe(0);
    expect(blocks[0].getMinutes()).toBe(0);

    expect(blocks[1].getHours()).toBe(0);
    expect(blocks[1].getMinutes()).toBe(30);

    expect(blocks[18].getHours()).toBe(9);
    expect(blocks[18].getMinutes()).toBe(0);

    expect(blocks[47].getHours()).toBe(23);
    expect(blocks[47].getMinutes()).toBe(30);
  });
});

describe('getTimezoneOffset', () => {
  it('should return UTC offset string for a timezone', () => {
    const date = new Date('2025-01-06T12:00:00Z');

    const utcOffset = getTimezoneOffset('UTC', date);
    // UTC can be formatted as "UTCZ" or "UTC+00:00" depending on the formatter
    expect(utcOffset).toMatch(/UTC(Z|\+00:00)/);
  });

  it('should handle positive offsets', () => {
    const date = new Date('2025-01-06T12:00:00Z');

    // Tokyo is UTC+9
    const tokyoOffset = getTimezoneOffset('Asia/Tokyo', date);
    expect(tokyoOffset).toBe('UTC+09:00');
  });

  it('should handle negative offsets', () => {
    const date = new Date('2025-01-06T12:00:00Z');

    // New York in January is UTC-5 (EST)
    const nyOffset = getTimezoneOffset('America/New_York', date);
    expect(nyOffset).toBe('UTC-05:00');
  });
});
