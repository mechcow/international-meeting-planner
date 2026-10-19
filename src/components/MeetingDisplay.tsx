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
    <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={16} className="text-blue-400" />
          <span className="text-sm font-medium text-blue-300">
            Selected Meeting ({formatDuration()})
          </span>
          {holidayCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-300 bg-amber-900/40 border border-amber-700 rounded px-2 py-0.5">
              <CalendarOff size={12} />
              {holidayCount === 1
                ? '1 city is off for a public holiday'
                : `${holidayCount} cities are off for a public holiday`}
            </span>
          )}
        </div>
        <button
          onClick={() => setMeeting(null)}
          className="p-1 hover:bg-blue-800 rounded transition-colors"
          title="Clear selection"
        >
          <X size={16} className="text-blue-400" />
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cityInfo.map(({ city, startInfo, endInfo, offLabel, isHoliday }) => {
          const startTime = formatSlot(startInfo.hour, startInfo.minutes);
          const endTime = formatSlot(endInfo.hour, endInfo.minutes);
          const startDate = formatInTimeZone(startInfo.date, city.timezone, 'EEE, MMM d');
          const endDate = formatInTimeZone(endInfo.date, city.timezone, 'EEE, MMM d');
          const sameDay = startDate === endDate;

          return (
            <div
              key={city.id}
              className={`rounded px-3 py-2 ${
                isHoliday ? 'bg-amber-900/40 border border-amber-700' : 'bg-gray-700/50'
              }`}
            >
              <div className="text-xs text-gray-400 truncate mb-1">{city.name}</div>
              <div className="text-sm font-mono font-medium text-blue-300">
                {startTime} - {endTime}
              </div>
              <div className="text-xs text-gray-500">
                {sameDay ? startDate : `${startDate} - ${endDate}`}
              </div>
              {offLabel && (
                <div
                  className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                    isHoliday ? 'text-amber-300' : 'text-gray-400'
                  }`}
                  title={isHoliday ? `Public holiday: ${offLabel}` : undefined}
                >
                  <CalendarOff size={12} className="shrink-0" />
                  <span className="truncate">Off: {offLabel}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
