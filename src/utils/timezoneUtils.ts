import { format } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import type { City } from '../types';
import { getPublicHoliday } from './holidayUtils';

// Number of slots per day (48 for half-hour increments)
export const SLOTS_PER_DAY = 48;
export const MINUTES_PER_SLOT = 30;

export function getLocalTime(utcDate: Date, timezone: string): Date {
  return toZonedTime(utcDate, timezone);
}

export function getTimezoneOffset(timezone: string, date: Date): string {
  const formatted = formatInTimeZone(date, timezone, 'XXX');
  return `UTC${formatted}`;
}

export function formatTimeInZone(date: Date, timezone: string, formatStr: string): string {
  return formatInTimeZone(date, timezone, formatStr);
}

// Check if a date falls on a weekend (Saturday or Sunday)
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

// Check if a time (in decimal hours, e.g., 9.5 = 9:30) is within working hours
// Also checks that it's not a weekend or public holiday
export function isWithinWorkingHours(
  timeDecimal: number,
  workStart: number,
  workEnd: number,
  date?: Date,
  countryCode?: string,
  subdivision?: string
): boolean {
  if (date && getOffReason(date, countryCode, subdivision)) {
    return false;
  }

  if (workStart <= workEnd) {
    return timeDecimal >= workStart && timeDecimal < workEnd;
  }
  // Handle overnight working hours (e.g., workStart: 22, workEnd: 6)
  return timeDecimal >= workStart || timeDecimal < workEnd;
}

export type OffReason =
  | { kind: 'holiday'; name: string }
  | { kind: 'weekend' };

// Why someone is off for the whole of a local date (public holiday or weekend),
// or null if it's a normal working day. Holidays take precedence over weekends.
export function getOffReason(
  date: Date,
  countryCode?: string,
  subdivision?: string
): OffReason | null {
  if (countryCode) {
    const holiday = getPublicHoliday(date, countryCode, subdivision);
    if (holiday) return { kind: 'holiday', name: holiday.name };
  }
  if (isWeekend(date)) return { kind: 'weekend' };
  return null;
}

export function calculateOverlapScore(cities: City[], slotIndex: number, date: Date): number {
  return cities.reduce((count, city) => {
    const { timeDecimal, date: localDate } = getSlotInTimezone(date, slotIndex, city.timezone);
    return count + (isWithinWorkingHours(timeDecimal, city.workStart, city.workEnd, localDate, city.countryCode, city.subdivision) ? 1 : 0);
  }, 0);
}

export function getHourBlocks(referenceDate: Date): Date[] {
  const blocks: Date[] = [];
  const startOfDay = new Date(referenceDate);
  startOfDay.setHours(0, 0, 0, 0);

  for (let i = 0; i < SLOTS_PER_DAY; i++) {
    const slotDate = new Date(startOfDay);
    const hours = Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    slotDate.setHours(hours, minutes, 0, 0);
    blocks.push(slotDate);
  }

  return blocks;
}

// Convert slot index to time in a specific timezone
export function getSlotInTimezone(baseDate: Date, slotIndex: number, timezone: string): {
  hour: number;
  minutes: number;
  timeDecimal: number;
  dayOffset: number;
  date: Date
} {
  const date = new Date(baseDate);
  const hours = Math.floor(slotIndex / 2);
  const minutes = (slotIndex % 2) * 30;
  date.setHours(hours, minutes, 0, 0);

  const localTime = toZonedTime(date, timezone);
  const localHour = localTime.getHours();
  const localMinutes = localTime.getMinutes();
  const timeDecimal = localHour + localMinutes / 60;

  // Calculate day offset by comparing dates
  const baseDateStr = format(baseDate, 'yyyy-MM-dd');
  const localDateStr = formatInTimeZone(date, timezone, 'yyyy-MM-dd');

  let dayOffset = 0;
  if (localDateStr > baseDateStr) dayOffset = 1;
  else if (localDateStr < baseDateStr) dayOffset = -1;

  return { hour: localHour, minutes: localMinutes, timeDecimal, dayOffset, date: localTime };
}

export function getCurrentTimePosition(timezone: string): number {
  const now = new Date();
  const localTime = toZonedTime(now, timezone);
  const hours = localTime.getHours();
  const minutes = localTime.getMinutes();
  return (hours * 60 + minutes) / (24 * 60) * 100;
}

// Format a slot for display (e.g., "9:00 AM", "9:30 AM")
export function formatSlot(hour: number, minutes: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinutes = minutes === 0 ? '' : ':30';
  return `${displayHour}${displayMinutes}${period}`;
}

// Format time from decimal hours (e.g., 9.5 -> "9:30 AM")
export function formatDecimalTime(timeDecimal: number): string {
  const hours = Math.floor(timeDecimal);
  const minutes = Math.round((timeDecimal - hours) * 60);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  const displayMinutes = minutes === 0 ? ':00' : ':30';
  return `${displayHour}${displayMinutes} ${period}`;
}

export function getDayAbbreviation(date: Date): string {
  return format(date, 'EEE');
}

// Generate all half-hour time options for dropdowns
export function getTimeOptions(): { value: number; label: string }[] {
  const options: { value: number; label: string }[] = [];
  for (let i = 0; i < SLOTS_PER_DAY; i++) {
    const hours = Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    const timeDecimal = hours + minutes / 60;
    options.push({
      value: timeDecimal,
      label: formatDecimalTime(timeDecimal),
    });
  }
  return options;
}
