import { addDays, startOfDay } from 'date-fns';
import type { City } from '../types';
import {
  getSlotInTimezone,
  getOffReason,
  isWeekend,
  isWithinWorkingHours,
  SLOTS_PER_DAY,
} from './timezoneUtils';

export interface SuggestedTime {
  day: Date; // start of the viewer-local day
  slot: number; // half-hour slot index within that day
  score: number; // number of cities in working hours
}

export interface SkippedDay {
  day: Date;
  holidays: { cityName: string; name: string }[];
}

export interface SuggestionResult {
  suggestions: SuggestedTime[];
  days: Date[]; // the working days that were searched
  skipped: SkippedDay[]; // weekdays skipped because someone has a public holiday
}

// How far ahead to look for enough holiday-free working days
const MAX_LOOKAHEAD_DAYS = 21;

// Per-slot working counts for one viewer-local day, plus any public holidays it touches
function scoreDay(cities: City[], day: Date) {
  const scores: number[] = new Array(SLOTS_PER_DAY).fill(0);
  const holidays = new Map<string, { cityName: string; name: string }>();

  for (const city of cities) {
    for (let i = 0; i < SLOTS_PER_DAY; i++) {
      const { timeDecimal, date } = getSlotInTimezone(day, i, city.timezone);
      const reason = getOffReason(date, city.countryCode, city.subdivision);
      if (reason?.kind === 'holiday') {
        holidays.set(`${city.id}:${reason.name}`, { cityName: city.name, name: reason.name });
      }
      if (!reason && isWithinWorkingHours(timeDecimal, city.workStart, city.workEnd)) {
        scores[i]++;
      }
    }
  }

  return { scores, holidays: [...holidays.values()] };
}

// Find the best half-hour meeting slots over the next `dayCount` working days
// (viewer-local weekdays), skipping any day on which a city has a public holiday.
// Slots already in the past are ignored. At most one suggestion is taken from each
// run of equally-scored consecutive slots, so the picks aren't three adjacent half-hours.
export function findSuggestedTimes(
  cities: City[],
  now: Date,
  { dayCount = 3, count = 3 }: { dayCount?: number; count?: number } = {}
): SuggestionResult {
  const result: SuggestionResult = { suggestions: [], days: [], skipped: [] };
  if (cities.length === 0) return result;

  const today = startOfDay(now);
  const nowSlot = now.getHours() * 2 + (now.getMinutes() >= 30 ? 1 : 0);
  const candidates: SuggestedTime[] = [];

  for (let offset = 0; offset < MAX_LOOKAHEAD_DAYS && result.days.length < dayCount; offset++) {
    const day = addDays(today, offset);
    if (isWeekend(day)) continue;

    const { scores, holidays } = scoreDay(cities, day);
    if (holidays.length > 0) {
      result.skipped.push({ day, holidays });
      continue;
    }
    result.days.push(day);

    const firstSlot = offset === 0 ? nowSlot + 1 : 0;
    let runStart = firstSlot;
    for (let i = firstSlot; i <= SLOTS_PER_DAY; i++) {
      if (i < SLOTS_PER_DAY && scores[i] === scores[runStart]) continue;
      // End of a run [runStart, i): suggest its middle slot for the most buffer either side
      if (scores[runStart] > 0) {
        candidates.push({ day, slot: Math.floor((runStart + i - 1) / 2), score: scores[runStart] });
      }
      runStart = i;
    }
  }

  // Best score first; ties go to the soonest
  result.suggestions = candidates
    .sort((a, b) => b.score - a.score || a.day.getTime() - b.day.getTime() || a.slot - b.slot)
    .slice(0, count);
  return result;
}
