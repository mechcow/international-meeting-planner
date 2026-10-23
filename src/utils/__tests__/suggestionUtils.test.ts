import { describe, it, expect } from 'vitest';
import { format } from 'date-fns';
import { findSuggestedTimes } from '../suggestionUtils';
import type { City } from '../../types';

// Cities in the test runner's own timezone, so viewer-local days line up with city-local days
const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

function city(id: string, workStart: number, workEnd: number, countryCode = 'GB'): City {
  return { id, name: id, timezone: localTz, countryCode, subdivision: '', workStart, workEnd };
}

const dayKeys = (days: Date[]) => days.map((d) => format(d, 'yyyy-MM-dd'));

describe('findSuggestedTimes', () => {
  it('returns nothing without cities', () => {
    const result = findSuggestedTimes([], new Date(2025, 11, 24, 8, 0));
    expect(result.suggestions).toEqual([]);
    expect(result.days).toEqual([]);
  });

  it('skips weekends and days where any city has a public holiday', () => {
    // Wed 24 Dec 2025: Christmas (Thu) and Boxing Day (Fri) are GB holidays, then a weekend
    const result = findSuggestedTimes([city('london', 9, 17)], new Date(2025, 11, 24, 8, 0));

    expect(dayKeys(result.days)).toEqual(['2025-12-24', '2025-12-29', '2025-12-30']);
    expect(dayKeys(result.skipped.map((s) => s.day))).toEqual(['2025-12-25', '2025-12-26']);
    expect(result.skipped[0].holidays[0].name).toContain('Christmas');
    expect(result.skipped[0].holidays[0].cityName).toBe('london');
  });

  it("skips a day for everyone when only one city's country has a holiday", () => {
    // Thanksgiving (Thu 27 Nov 2025) is a US holiday but not a GB one
    const result = findSuggestedTimes(
      [city('london', 9, 17), city('new-york', 9, 17, 'US')],
      new Date(2025, 10, 26, 8, 0)
    );
    expect(dayKeys(result.skipped.map((s) => s.day))).toContain('2025-11-27');
    expect(dayKeys(result.days)).not.toContain('2025-11-27');
  });

  it('suggests the middle of the best-overlap window, best score first then soonest', () => {
    // Overlap of 9-17 and 12-20 is 12:00-17:00 (slots 24..33); its middle is slot 28 (2pm)
    const result = findSuggestedTimes(
      [city('a', 9, 17), city('b', 12, 20)],
      new Date(2025, 11, 22, 7, 0) // Mon 22 Dec
    );

    expect(result.suggestions).toHaveLength(3);
    expect(result.suggestions.every((s) => s.score === 2)).toBe(true);
    expect(result.suggestions.map((s) => s.slot)).toEqual([28, 28, 28]);
    expect(dayKeys(result.suggestions.map((s) => s.day))).toEqual([
      '2025-12-22',
      '2025-12-23',
      '2025-12-24',
    ]);
  });

  it('ignores slots that are already past today', () => {
    // At 3pm only 3:30-5pm (slots 31..33) is left today; its middle is slot 32
    const result = findSuggestedTimes([city('london', 9, 17)], new Date(2025, 11, 24, 15, 0));
    const today = result.suggestions.find((s) => format(s.day, 'yyyy-MM-dd') === '2025-12-24');
    expect(today?.slot).toBe(32);
  });
});
