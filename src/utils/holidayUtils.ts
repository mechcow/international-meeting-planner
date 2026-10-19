import Holidays from 'date-holidays';

export interface PublicHoliday {
  name: string;
}

export interface Subdivision {
  code: string;
  name: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Cache public holidays per jurisdiction and year:
// "AU-NSW:2026" -> Map<"YYYY-MM-DD", name>
const holidayCache = new Map<string, Map<string, string>>();

function getJurisdictionKey(countryCode: string, subdivision?: string): string {
  return subdivision ? `${countryCode}-${subdivision}` : countryCode;
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Build the map of public holiday dates for one jurisdiction and year.
//
// Dates are matched on date-holidays' own local date string ("2025-12-25 00:00:00")
// rather than on Date instants: the library interprets instants in the country's
// timezone, so looking up "noon in the viewer's timezone" can land on the wrong
// day (e.g. US Christmas showing on Dec 26 when viewed from Sydney).
function getYearHolidays(countryCode: string, year: number, subdivision?: string): Map<string, string> {
  const cacheKey = `${getJurisdictionKey(countryCode, subdivision)}:${year}`;
  const cached = holidayCache.get(cacheKey);
  if (cached) return cached;

  const result = new Map<string, string>();
  try {
    const opts = { languages: ['en'] };
    const hd = subdivision
      ? new Holidays(countryCode, subdivision, opts)
      : new Holidays(countryCode, opts);
    // Include the previous year so multi-day holidays spanning New Year are covered
    for (const h of [...hd.getHolidays(year - 1), ...hd.getHolidays(year)]) {
      if (h.type !== 'public') continue;
      const [y, m, d] = h.date.slice(0, 10).split('-').map(Number);
      // Multi-day holidays (e.g. Eid al-Fitr in the UAE) are one entry with a duration
      const days = Math.max(1, Math.round((h.end.getTime() - h.start.getTime()) / DAY_MS));
      for (let i = 0; i < days; i++) {
        const day = new Date(Date.UTC(y, m - 1, d + i));
        if (day.getUTCFullYear() !== year) continue;
        const key = toDateKey(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
        if (!result.has(key)) result.set(key, h.name);
      }
    }
  } catch {
    // If country code is not supported, treat as no holidays
  }

  holidayCache.set(cacheKey, result);
  return result;
}

/**
 * Get the public holiday (official day off) on a date in a country, optionally
 * narrowed to a subdivision (state / province / region) so that regional
 * holidays are included. Returns null if the date is not a public holiday.
 *
 * The date's local calendar day (getFullYear/getMonth/getDate) is used, so pass
 * a date already converted to the city's timezone (e.g. via toZonedTime).
 * Results are cached by jurisdiction and year for performance.
 */
export function getPublicHoliday(
  date: Date,
  countryCode: string,
  subdivision?: string
): PublicHoliday | null {
  const year = date.getFullYear();
  const name = getYearHolidays(countryCode, year, subdivision)
    .get(toDateKey(year, date.getMonth(), date.getDate()));
  return name ? { name } : null;
}

/**
 * Check if a date is a public holiday in the given country (and subdivision)
 */
export function isPublicHoliday(date: Date, countryCode: string, subdivision?: string): boolean {
  return getPublicHoliday(date, countryCode, subdivision) !== null;
}

/**
 * Get the name of the holiday if the date is a public holiday
 */
export function getHolidayName(date: Date, countryCode: string, subdivision?: string): string | null {
  return getPublicHoliday(date, countryCode, subdivision)?.name ?? null;
}

/**
 * List the subdivisions (states / provinces / regions) with their own
 * holiday rules for a country. Empty if the country has none.
 */
export function getSubdivisions(countryCode: string): Subdivision[] {
  try {
    const states = new Holidays().getStates(countryCode);
    if (!states) return [];
    return Object.entries(states)
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

/**
 * Short label for a holiday jurisdiction, e.g. "NSW, AU" or "GB"
 */
export function formatJurisdiction(countryCode: string, subdivision?: string): string {
  return subdivision ? `${subdivision}, ${countryCode}` : countryCode;
}
