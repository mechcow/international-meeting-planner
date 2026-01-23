import { Calendar, X } from 'lucide-react';
import { useTimezone } from '../context/TimezoneContext';
import { getSlotInTimezone, formatSlot, SLOTS_PER_DAY } from '../utils/timezoneUtils';
import { formatInTimeZone } from 'date-fns-tz';

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

  return (
    <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-blue-400" />
          <span className="text-sm font-medium text-blue-300">
            Selected Meeting ({formatDuration()})
          </span>
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
        {cities.map((city) => {
          const startInfo = getSlotInTimezone(referenceDate, startSlot, city.timezone);
          const endInfo = getSlotInTimezone(referenceDate, endSlot % SLOTS_PER_DAY, city.timezone);

          const startTime = formatSlot(startInfo.hour, startInfo.minutes);
          const endTime = formatSlot(endInfo.hour, endInfo.minutes);
          const startDate = formatInTimeZone(startInfo.date, city.timezone, 'EEE, MMM d');
          const endDate = formatInTimeZone(endInfo.date, city.timezone, 'EEE, MMM d');
          const sameDay = startDate === endDate;

          return (
            <div key={city.id} className="bg-gray-700/50 rounded px-3 py-2">
              <div className="text-xs text-gray-400 truncate mb-1">{city.name}</div>
              <div className="text-sm font-mono font-medium text-blue-300">
                {startTime} - {endTime}
              </div>
              <div className="text-xs text-gray-500">
                {sameDay ? startDate : `${startDate} - ${endDate}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
