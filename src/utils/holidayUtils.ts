import Holidays from 'date-holidays';

// Cache Holidays instances per country to avoid recreating them
const holidayInstances = new Map<string, Holidays>();

// Cache holiday check results: "countryCode:YYYY-MM-DD" -> boolean
const holidayCache = new Map<string, boolean>();

function getHolidayInstance(countryCode: string): Holidays {
  if (!holidayInstances.has(countryCode)) {
    const hd = new Holidays(countryCode);
    holidayInstances.set(countryCode, hd);
  }
  return holidayInstances.get(countryCode)!;
}

function getCacheKey(countryCode: string, year: number, month: number, day: number): string {
  return `${countryCode}:${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Check if a date is a public holiday in the given country
 * Only checks for 'public' type holidays (official days off)
 *
 * Results are cached by country and date for performance.
 */
export function isPublicHoliday(date: Date, countryCode: string): boolean {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const cacheKey = getCacheKey(countryCode, year, month, day);

  if (holidayCache.has(cacheKey)) {
    return holidayCache.get(cacheKey)!;
  }

  let result = false;
  try {
    const hd = getHolidayInstance(countryCode);
    const cleanDate = new Date(year, month, day, 12, 0, 0);
    const holidays = hd.isHoliday(cleanDate);

    if (holidays) {
      const publicHolidays = Array.isArray(holidays) ? holidays : [holidays];
      result = publicHolidays.some(h => h.type === 'public');
    }
  } catch {
    // If country code is not supported, return false
  }

  holidayCache.set(cacheKey, result);
  return result;
}

/**
 * Get the name of the holiday if the date is a public holiday
 */
export function getHolidayName(date: Date, countryCode: string): string | null {
  try {
    const hd = getHolidayInstance(countryCode);
    const holidays = hd.isHoliday(date);

    if (!holidays) return null;

    const publicHolidays = Array.isArray(holidays)
      ? holidays
      : [holidays];

    const publicHoliday = publicHolidays.find(h => h.type === 'public');
    return publicHoliday?.name ?? null;
  } catch {
    return null;
  }
}
