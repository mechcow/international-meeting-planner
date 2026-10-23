import { Calendar, CalendarOff, X } from 'lucide-react';
import { useTimezone } from '../context/TimezoneContext';
import { getSlotInTimezone, formatSlot, getOffReason, SLOTS_PER_DAY } from '../utils/timezoneUtils';
import type { OffReason } from '../utils/timezoneUtils';
import { formatInTimeZone } from 'date-fns-tz';

function describeOff(reasons: OffReason[]): string | null {
  const holidays = [...new Set(reasons.flatMap((r) => (r.kind === 'holiday' ? [r.name] : [])))];
  if (holidays.length > 0) return holidays.join(' / ');
  if (reasons.some((r) => r.kind === 'weekend')) return 'Weekend';
  return null;
}

export function MeetingDisplay() {
  const { cities, referenceDate, meeting, setMeeting } = useTimezone();

  if (!meeting || cities.length === 0) return null;

  const startSlot = Math.min(meeting.startSlot, meeting.endSlot);
  const endSlot = Math.max(meeting.startSlot, meeting.endSlot) + 1; // +1 because end is exclusive
  const durationSlots = endSlot - startSlot;
  const durationMinutes = durationSlots * 30;
  const durationHours = Math.floor(durationMinutes / 60);
  const durationMins = durationMinutes % 60;

  const formatDuration = () => {
    if (durationHours === 0) return `${durationMins}m`;
    if (durationMins === 0) return `${durationHours}h`;
    return `${durationHours}h ${durationMins}m`;
  };

  const cityInfo = cities.map((city) => {
    const startInfo = getSlotInTimezone(referenceDate, startSlot, city.timezone);
    const endInfo = getSlotInTimezone(referenceDate, endSlot % SLOTS_PER_DAY, city.timezone);
    // The last occupied slot decides the meeting's final local date
    const lastInfo = getSlotInTimezone(referenceDate, endSlot - 1, city.timezone);

    const reasons = [startInfo.date, lastInfo.date]
      .map((date) => getOffReason(date, city.countryCode, city.subdivision))
      .filter((r): r is OffReason => r !== null);
    const isHoliday = reasons.some((r) => r.kind === 'holiday');

    return { city, startInfo, endInfo, offLabel: describeOff(reasons), isHoliday };
  });

  const holidayCount = cityInfo.filter((c) => c.isHoliday).length;

  return (
    <div className="bg-blue-950/40 border border-blue-800/70 rounded-lg px-3 py-2 mb-3">
      <div className="flex flex-wrap md:flex-nowrap items-start gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <Calendar size={14} className="text-blue-400" />
          <span className="text-sm font-medium text-blue-300 whitespace-nowrap">
            Selected Meeting ({formatDuration()})
          </span>
        </div>
        <div className="order-last basis-full md:order-none md:basis-auto flex-1 min-w-0 flex flex-wrap items-center gap-x-4 gap-y-1">
          {cityInfo.map(({ city, startInfo, endInfo, offLabel, isHoliday }) => {
            const startTime = formatSlot(startInfo.hour, startInfo.minutes);
            const endTime = formatSlot(endInfo.hour, endInfo.minutes);
            const startDate = formatInTimeZone(startInfo.date, city.timezone, 'EEE d');
            const endDate = formatInTimeZone(endInfo.date, city.timezone, 'EEE d');
            const sameDay = startDate === endDate;

            return (
              <div
                key={city.id}
                className={`flex items-baseline gap-1.5 text-sm whitespace-nowrap ${
                  isHoliday ? 'text-amber-300' : ''
                }`}
                title={isHoliday ? `Public holiday: ${offLabel}` : undefined}
              >
                <span className={isHoliday ? 'font-medium' : 'text-gray-400'}>{city.name}</span>
                <span className={`font-mono ${isHoliday ? '' : 'text-blue-300'}`}>
                  {startTime}–{endTime}
                </span>
                <span className="text-xs text-gray-500">
                  {sameDay ? startDate : `${startDate}–${endDate}`}
                </span>
                {offLabel && (
                  <span
                    className={`flex items-center gap-0.5 self-center text-xs font-medium ${
                      isHoliday ? 'text-amber-300' : 'text-gray-400'
                    }`}
                  >
                    <CalendarOff size={12} className="shrink-0" />
                    Off: {offLabel}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {holidayCount > 0 && (
          <span className="hidden md:flex shrink-0 items-center gap-1 text-xs font-medium text-amber-300 bg-amber-900/40 border border-amber-700 rounded px-2 py-0.5">
            <CalendarOff size={12} />
            {holidayCount === 1
              ? '1 city is off for a public holiday'
              : `${holidayCount} cities are off for a public holiday`}
          </span>
        )}
        <button
          onClick={() => setMeeting(null)}
          className="ml-auto md:ml-0 shrink-0 p-0.5 hover:bg-blue-800 rounded transition-colors"
          title="Clear selection"
        >
          <X size={16} className="text-blue-400" />
        </button>
      </div>
    </div>
  );
}
