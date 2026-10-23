import { useEffect, useMemo, useState } from 'react';
import { Sparkles, CalendarOff } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { useTimezone } from '../context/TimezoneContext';
import { findSuggestedTimes } from '../utils/suggestionUtils';
import type { SuggestedTime } from '../utils/suggestionUtils';
import { formatSlot, getSlotInTimezone } from '../utils/timezoneUtils';

function scoreColor(score: number, total: number): string {
  if (score === total) return 'text-green-400';
  if (score / total >= 0.75) return 'text-lime-400';
  return 'text-yellow-400';
}

export function SuggestedTimes() {
  const { cities, referenceDate, meeting, setReferenceDate, setMeeting } = useTimezone();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const { suggestions, skipped } = useMemo(() => findSuggestedTimes(cities, now), [cities, now]);

  if (cities.length === 0) return null;

  const isActive = (s: SuggestedTime) =>
    isSameDay(s.day, referenceDate) &&
    meeting?.startSlot === s.slot &&
    meeting?.endSlot === s.slot;

  const describeSlot = (s: SuggestedTime) =>
    cities
      .map((city) => {
        const { hour, minutes } = getSlotInTimezone(s.day, s.slot, city.timezone);
        return `${city.name}: ${formatSlot(hour, minutes)}`;
      })
      .join('\n');

  const skippedTitle = skipped
    .map(
      ({ day, holidays }) =>
        `${format(day, 'EEE, MMM d')}: ${holidays.map((h) => `${h.name} (${h.cityName})`).join(', ')}`
    )
    .join('\n');

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3 text-sm" data-testid="suggested-times">
      <div className="flex items-center gap-1.5 text-gray-300 font-medium">
        <Sparkles size={14} className="text-amber-300" />
        Suggested
        <span className="text-xs font-normal text-gray-500">30 min, next 3 working days</span>
      </div>

      {suggestions.length === 0 ? (
        <span className="text-xs text-gray-500">No time works for anyone in the next working days</span>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          {suggestions.map((s) => (
            <button
              key={`${s.day.toISOString()}-${s.slot}`}
              onClick={() => {
                setReferenceDate(s.day);
                setMeeting({ startSlot: s.slot, endSlot: s.slot });
              }}
              title={`${s.score}/${cities.length} cities in working hours\n${describeSlot(s)}`}
              className={`flex items-baseline gap-1.5 rounded-md border px-2 py-0.5 transition-colors ${
                isActive(s)
                  ? 'bg-blue-600/30 border-blue-500'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-500'
              }`}
            >
              <span className="text-xs text-gray-400">{format(s.day, 'EEE d')}</span>
              <span className="font-mono">{formatSlot(Math.floor(s.slot / 2), (s.slot % 2) * 30)}</span>
              <span className={`text-xs font-semibold ${scoreColor(s.score, cities.length)}`}>
                {s.score}/{cities.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {skipped.length > 0 && (
        <span className="flex items-center gap-1 text-xs text-gray-500" title={skippedTitle}>
          <CalendarOff size={12} className="text-amber-400/80" />
          Skipped {skipped.map(({ day }) => format(day, 'EEE d')).join(', ')} (public holiday)
        </span>
      )}
    </div>
  );
}
