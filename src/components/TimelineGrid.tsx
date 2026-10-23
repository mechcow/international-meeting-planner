import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { X, Clock, CalendarOff } from 'lucide-react';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useTimezone } from '../context/TimezoneContext';
import { WorkingHoursModal } from './WorkingHoursModal';
import {
  getSlotInTimezone,
  isWithinWorkingHours,
  formatSlot,
  getTimezoneOffset,
  getOffReason,
  SLOTS_PER_DAY,
} from '../utils/timezoneUtils';
import type { OffReason } from '../utils/timezoneUtils';
import { formatJurisdiction } from '../utils/holidayUtils';
import type { City } from '../types';

interface SlotData {
  hour: number;
  minutes: number;
  isWorking: boolean;
  offReason: OffReason | null;
}

interface CityHoliday {
  date: string; // e.g. "Thu, Dec 25"
  name: string;
}

const SLOT_WIDTH = 44;
const CITY_COL_WIDTH = 200;

// Heatmap colors based on overlap percentage (0 = red, 100% = green)
function getHeatmapColor(score: number, total: number, isPast: boolean): string {
  if (isPast) return 'bg-gray-800';
  if (total === 0) return 'bg-gray-700';
  const percent = score / total;
  if (percent === 0) return 'bg-gray-700';
  if (percent < 0.25) return 'bg-red-700';
  if (percent < 0.5) return 'bg-orange-600';
  if (percent < 0.75) return 'bg-yellow-600';
  if (percent < 1) return 'bg-lime-600';
  return 'bg-green-500';
}

// Check if a slot is in the past
function getFirstFutureSlot(referenceDate: Date): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const refDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  // If reference date is in the past, all slots are past
  if (refDay < today) return SLOTS_PER_DAY;

  // If reference date is in the future, no slots are past
  if (refDay > today) return 0;

  // Reference date is today - calculate current slot
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentSlot = currentHour * 2 + (currentMinutes >= 30 ? 1 : 0);

  return currentSlot;
}

// Position of "now" within today's grid as a fractional slot, or null if not viewing today
function getNowSlotPosition(referenceDate: Date, now: Date): number | null {
  const sameDay =
    now.getFullYear() === referenceDate.getFullYear() &&
    now.getMonth() === referenceDate.getMonth() &&
    now.getDate() === referenceDate.getDate();
  if (!sameDay) return null;
  return (now.getHours() * 60 + now.getMinutes()) / 30;
}

export function TimelineGrid() {
  const { cities, referenceDate, meeting, setMeeting, removeCity } = useTimezone();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [firstFutureSlot, setFirstFutureSlot] = useState(() => getFirstFutureSlot(referenceDate));
  const [now, setNow] = useState(() => new Date());
  // Mobile tap-to-select state
  const [tapStart, setTapStart] = useState<number | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update first future slot when reference date changes or every minute
  useEffect(() => {
    setFirstFutureSlot(getFirstFutureSlot(referenceDate));
    const interval = setInterval(() => {
      setFirstFutureSlot(getFirstFutureSlot(referenceDate));
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [referenceDate]);

  // Live clock for each city's local time
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(interval);
  }, []);

  // Pre-compute slot data for all cities and all slots
  const { citySlotData, cityHolidays, overlapScores } = useMemo(() => {
    const citySlotData = new Map<string, SlotData[]>();
    const cityHolidays = new Map<string, CityHoliday[]>();
    const overlapScores: number[] = new Array(SLOTS_PER_DAY).fill(0);

    for (const city of cities) {
      const slots: SlotData[] = [];
      const holidays: CityHoliday[] = [];
      // The 24h grid spans at most two local dates per city; look each up once
      const offReasonByDate = new Map<string, OffReason | null>();
      for (let i = 0; i < SLOTS_PER_DAY; i++) {
        const { hour, minutes, timeDecimal, date } = getSlotInTimezone(
          referenceDate,
          i,
          city.timezone
        );
        const dateKey = format(date, 'yyyy-MM-dd');
        if (!offReasonByDate.has(dateKey)) {
          const reason = getOffReason(date, city.countryCode, city.subdivision);
          offReasonByDate.set(dateKey, reason);
          if (reason?.kind === 'holiday') {
            holidays.push({ date: format(date, 'EEE, MMM d'), name: reason.name });
          }
        }
        const offReason = offReasonByDate.get(dateKey)!;
        const isWorking =
          !offReason && isWithinWorkingHours(timeDecimal, city.workStart, city.workEnd);
        slots.push({ hour, minutes, isWorking, offReason });
        if (isWorking) {
          overlapScores[i]++;
        }
      }
      citySlotData.set(city.id, slots);
      cityHolidays.set(city.id, holidays);
    }

    return { citySlotData, cityHolidays, overlapScores };
  }, [cities, referenceDate]);

  // Tooltip for the Best Times row, naming anyone off for a public holiday
  const getHeatmapTitle = (slotIndex: number) => {
    const summary = `${overlapScores[slotIndex]}/${cities.length} cities in working hours`;
    const off: string[] = [];
    for (const city of cities) {
      const reason = citySlotData.get(city.id)![slotIndex].offReason;
      if (reason?.kind === 'holiday') off.push(`${city.name} (${reason.name})`);
    }
    return off.length > 0 ? `${summary}\nOff for public holiday: ${off.join(', ')}` : summary;
  };

  // Scroll to 9am on initial load
  useEffect(() => {
    if (scrollContainerRef.current && cities.length > 0) {
      const nineAmSlot = 18; // 9:00 AM = slot 18 (9 hours * 2 slots per hour)
      const scrollPosition = nineAmSlot * SLOT_WIDTH;
      scrollContainerRef.current.scrollLeft = scrollPosition;
    }
  }, []); // Only run on mount

  // Bring a selected meeting into view if it's scrolled off (e.g. picked from Suggested times)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !meeting) return;
    const start = Math.min(meeting.startSlot, meeting.endSlot) * SLOT_WIDTH;
    const end = (Math.max(meeting.startSlot, meeting.endSlot) + 1) * SLOT_WIDTH;
    const visibleWidth = el.clientWidth - CITY_COL_WIDTH;
    if (start < el.scrollLeft || end > el.scrollLeft + visibleWidth) {
      el.scrollLeft = Math.max(0, (start + end - visibleWidth) / 2);
    }
  }, [meeting]);

  // Detect touch device on first touch
  useEffect(() => {
    const handleTouchStart = () => {
      setIsTouchDevice(true);
      // Remove listener after detection
      window.removeEventListener('touchstart', handleTouchStart);
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    return () => window.removeEventListener('touchstart', handleTouchStart);
  }, []);

  // Clear tap start when meeting is cleared
  useEffect(() => {
    if (!meeting && tapStart !== null) {
      // Keep tapStart so user can continue selecting
    }
  }, [meeting, tapStart]);

  const handleMouseDown = useCallback((slotIndex: number) => {
    setIsDragging(true);
    setDragStart(slotIndex);
    setDragEnd(slotIndex);
  }, []);

  const handleMouseMove = useCallback((slotIndex: number) => {
    setHoveredSlot(slotIndex);
    if (isDragging && dragStart !== null) {
      setDragEnd(slotIndex);
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      setMeeting({
        startSlot: Math.min(dragStart, dragEnd),
        endSlot: Math.max(dragStart, dragEnd),
      });
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, setMeeting]);

  const handleMouseLeave = useCallback(() => {
    setHoveredSlot(null);
    if (isDragging) {
      handleMouseUp();
    }
  }, [isDragging, handleMouseUp]);

  // Mobile tap-to-select handler
  const handleTap = useCallback((slotIndex: number) => {
    if (tapStart === null) {
      // First tap - set start point
      setTapStart(slotIndex);
      // Clear any existing meeting when starting new selection
      setMeeting(null);
    } else {
      // Second tap - complete selection
      const startSlot = Math.min(tapStart, slotIndex);
      const endSlot = Math.max(tapStart, slotIndex);
      // If same slot tapped, create 1-hour meeting (2 slots)
      if (startSlot === endSlot) {
        setMeeting({
          startSlot,
          endSlot: Math.min(startSlot + 1, SLOTS_PER_DAY - 1),
        });
      } else {
        setMeeting({ startSlot, endSlot });
      }
      setTapStart(null);
    }
  }, [tapStart, setMeeting]);

  // Clear tap selection
  const handleClearTapStart = useCallback(() => {
    setTapStart(null);
  }, []);

  const isSlotInDragRange = (slotIndex: number) => {
    if (dragStart === null || dragEnd === null) return false;
    const min = Math.min(dragStart, dragEnd);
    const max = Math.max(dragStart, dragEnd);
    return slotIndex >= min && slotIndex <= max;
  };

  const isSlotInMeeting = (slotIndex: number) => {
    if (!meeting) return false;
    return slotIndex >= meeting.startSlot && slotIndex <= meeting.endSlot;
  };

  const isTapStartSlot = (slotIndex: number) => {
    return tapStart === slotIndex;
  };

  // Vertical "now" line drawn inside whichever slot contains the current time
  const nowSlotPosition = getNowSlotPosition(referenceDate, now);
  const renderNowMarker = (slotIndex: number) => {
    if (nowSlotPosition === null || Math.floor(nowSlotPosition) !== slotIndex) return null;
    return (
      <div
        className="absolute inset-y-0 w-0.5 bg-red-500 z-20 pointer-events-none"
        style={{ left: `${(nowSlotPosition % 1) * 100}%` }}
        data-testid="now-marker"
      />
    );
  };

  // Combined click handler for both desktop and mobile
  const handleSlotClick = useCallback((slotIndex: number, e: React.MouseEvent | React.TouchEvent) => {
    // On touch devices, use tap-to-select
    if (isTouchDevice) {
      e.preventDefault();
      handleTap(slotIndex);
    }
    // On desktop, mousedown/mouseup handles drag selection
  }, [isTouchDevice, handleTap]);

  if (cities.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 border border-gray-700 rounded-lg">
        <div className="text-center">
          <p className="text-lg mb-2">No cities added</p>
          <p className="text-sm">Use the search box above to add cities</p>
        </div>
      </div>
    );
  }

  const headerSlots = Array.from({ length: SLOTS_PER_DAY }, (_, i) => ({
    hours: Math.floor(i / 2),
    minutes: (i % 2) * 30,
    index: i,
  }));

  return (
    <div
      ref={containerRef}
      className="border border-gray-700 rounded-lg overflow-hidden select-none"
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
    >
      {/* Mobile tap instruction banner */}
      {isTouchDevice && tapStart !== null && (
        <div className="bg-blue-600 text-white text-sm px-4 py-2 flex items-center justify-between">
          <span>Tap another time to complete selection (or same time for 1-hour meeting)</span>
          <button
            onClick={handleClearTapStart}
            className="ml-2 px-2 py-1 bg-blue-500 hover:bg-blue-400 rounded text-xs font-medium"
          >
            Cancel
          </button>
        </div>
      )}
      <div ref={scrollContainerRef} className="overflow-x-auto timeline-scroll">
        <table
          className="border-collapse"
          style={{
            tableLayout: 'fixed',
            width: CITY_COL_WIDTH + SLOTS_PER_DAY * SLOT_WIDTH,
          }}
        >
          <colgroup>
            <col style={{ width: CITY_COL_WIDTH }} />
            {headerSlots.map(({ index }) => (
              <col key={index} style={{ width: SLOT_WIDTH }} />
            ))}
          </colgroup>
          {/* Header row */}
          <thead>
            <tr className="bg-gray-800 border-b border-gray-600">
              <th
                className="sticky left-0 z-30 bg-gray-800 border-r border-gray-600 px-2 py-1 text-left"
              >
                <div className="flex items-baseline justify-between gap-2 text-xs font-medium text-gray-400">
                  <span>City</span>
                  <span>Local time</span>
                </div>
              </th>
              {headerSlots.map(({ hours, minutes, index }) => {
                const isPast = index < firstFutureSlot;
                const inDragRange = isSlotInDragRange(index);
                const inMeeting = isSlotInMeeting(index);
                const isSelected = inDragRange || inMeeting;

                return (
                  <th
                    key={index}
                    className={`p-0 border-r text-center relative overflow-hidden ${
                      isPast ? 'bg-gray-900' : ''
                    } ${hoveredSlot === index && !isSelected && !isPast ? 'bg-gray-600' : ''
                    } ${minutes === 30 ? 'border-r-gray-700' : 'border-r-gray-600'}`}
                  >
                    {isSelected && (
                      <div
                        className={`absolute inset-0 ${
                          inDragRange ? 'bg-blue-500/50' : 'bg-blue-600/40'
                        }`}
                      />
                    )}
                    {renderNowMarker(index)}
                    <div className={`h-9 flex items-center justify-center text-[9px] relative z-10 ${
                      isPast ? 'text-gray-600' : isSelected ? 'text-white font-medium' : 'text-gray-400'
                    }`}>
                      {formatSlot(hours, minutes)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Best Meeting Times heatmap row + City rows */}
          <tbody>
            {/* Heatmap row */}
            <tr className="bg-gray-900 border-b border-gray-600">
              <td className="sticky left-0 z-30 bg-gray-900 border-r border-gray-600 px-2 py-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-sm text-gray-300">Best Times</span>
                  <span className="text-xs text-gray-500">{cities.length} cities</span>
                </div>
              </td>
              {headerSlots.map(({ index }) => {
                const isPast = index < firstFutureSlot;
                const overlapScore = overlapScores[index];
                const inDragRange = isSlotInDragRange(index);
                const inMeeting = isSlotInMeeting(index);
                const isHovered = hoveredSlot === index;
                const isHalfHour = index % 2 === 1;
                const isSelected = inDragRange || inMeeting;
                const isTapStart = isTapStartSlot(index);
                const heatmapColor = getHeatmapColor(overlapScore, cities.length, isPast);

                return (
                  <td
                    key={index}
                    className={`p-0 border-r transition-all overflow-hidden ${
                      isPast ? 'cursor-not-allowed' : 'cursor-crosshair'
                    } ${isHalfHour ? 'border-r-gray-700' : 'border-r-gray-600'
                    } ${isHovered && !isSelected && !isPast ? 'brightness-125' : ''}`}
                    onMouseDown={() => !isPast && !isTouchDevice && handleMouseDown(index)}
                    onMouseMove={() => !isTouchDevice && handleMouseMove(index)}
                    onClick={(e) => !isPast && isTouchDevice && handleSlotClick(index, e)}
                    title={isPast ? undefined : getHeatmapTitle(index)}
                  >
                    <div className={`h-9 flex items-center justify-center relative ${heatmapColor}`}>
                      {renderNowMarker(index)}
                      {isSelected && (
                        <div className={`absolute inset-0 ${inDragRange ? 'bg-blue-500/50' : 'bg-blue-600/40'}`} />
                      )}
                      {isTapStart && (
                        <div className="absolute inset-0 bg-blue-400/60 ring-2 ring-blue-400 ring-inset" />
                      )}
                      <span className={`text-[10px] font-bold relative z-10 ${
                        isPast ? 'text-gray-600' : overlapScore === 0 ? 'text-gray-500' : 'text-white'
                      }`}>
                        {isPast ? '' : `${overlapScore}/${cities.length}`}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* City rows */}
            {cities.map((city) => {
              const offset = getTimezoneOffset(city.timezone, referenceDate);
              const holidays = cityHolidays.get(city.id)!;
              const jurisdiction = formatJurisdiction(city.countryCode, city.subdivision);

              return (
                <tr key={city.id} className="bg-gray-800 border-b border-gray-700">
                  {/* City name column */}
                  <td className="group sticky left-0 z-30 bg-gray-800 border-r border-gray-600 px-2 py-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium truncate text-sm">{city.name}</span>
                      <span className="shrink-0 font-mono text-sm text-gray-200 tabular-nums">
                        {formatInTimeZone(now, city.timezone, 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-xs text-gray-400 truncate min-w-0">
                        {offset}
                        <span
                          className="text-gray-500"
                          title={`Public holidays for ${jurisdiction}`}
                        >
                          {' '}· {city.subdivision || city.countryCode}
                        </span>
                        <span className="text-gray-500">
                          {' '}· {formatInTimeZone(now, city.timezone, 'EEE d')}
                        </span>
                      </div>
                      <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingCity(city)}
                          className="p-1 -my-1 hover:bg-gray-700 rounded transition-colors"
                          title="Edit working hours & holiday region"
                        >
                          <Clock size={13} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => removeCity(city.id)}
                          className="p-1 -my-1 hover:bg-gray-700 rounded transition-colors"
                          title="Remove city"
                        >
                          <X size={13} className="text-gray-400" />
                        </button>
                      </div>
                    </div>
                    {holidays.length > 0 && (
                      <div
                        className="flex items-center gap-1 text-[11px] font-medium text-amber-300 min-w-0"
                        title={holidays
                          .map((h) => `${h.date}: ${h.name} (public holiday in ${jurisdiction})`)
                          .join('\n')}
                        data-testid={`holiday-badge-${city.id}`}
                      >
                        <CalendarOff size={12} className="shrink-0" />
                        <span className="truncate">
                          Off · {holidays.map((h) => h.name).join(' / ')}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Time slots - simple green/gray, past slots darker */}
                  {headerSlots.map(({ index }) => {
                    const isPast = index < firstFutureSlot;
                    const slotData = citySlotData.get(city.id)![index];
                    const { hour, minutes, isWorking, offReason } = slotData;
                    const holidayName = offReason?.kind === 'holiday' ? offReason.name : null;
                    const inDragRange = isSlotInDragRange(index);
                    const inMeeting = isSlotInMeeting(index);
                    const isHovered = hoveredSlot === index;
                    const isHalfHour = minutes === 30;
                    const isSelected = inDragRange || inMeeting;
                    const isTapStart = isTapStartSlot(index);

                    let bgColor = 'bg-gray-700';
                    if (isPast) {
                      bgColor = 'bg-gray-800';
                    } else if (holidayName) {
                      bgColor = 'holiday-slot';
                    } else if (isWorking) {
                      bgColor = 'bg-green-600';
                    }

                    return (
                      <td
                        key={index}
                        className={`p-0 border-r transition-all overflow-hidden ${
                          isPast ? 'cursor-not-allowed' : 'cursor-crosshair'
                        } ${isHalfHour ? 'border-r-gray-700' : 'border-r-gray-600'
                        } ${isHovered && !isSelected && !isPast ? 'brightness-125' : ''}`}
                        onMouseDown={() => !isPast && !isTouchDevice && handleMouseDown(index)}
                        onMouseMove={() => !isTouchDevice && handleMouseMove(index)}
                        onClick={(e) => !isPast && isTouchDevice && handleSlotClick(index, e)}
                        title={holidayName ? `${holidayName}: public holiday in ${city.name} (${jurisdiction}), off` : undefined}
                      >
                        <div
                          className={`h-12 flex flex-col items-center justify-center relative ${bgColor}`}
                        >
                          {renderNowMarker(index)}
                          {isSelected && (
                            <div
                              className={`absolute inset-0 ${
                                inDragRange
                                  ? 'bg-blue-500/50'
                                  : 'bg-blue-600/40'
                              }`}
                            />
                          )}
                          {isTapStart && (
                            <div className="absolute inset-0 bg-blue-400/60 ring-2 ring-blue-400 ring-inset" />
                          )}
                          <span className={`text-[10px] font-medium leading-tight relative z-10 ${
                            isPast ? 'text-gray-600' : isSelected ? 'text-white' : holidayName ? 'text-amber-200' : ''
                          }`}>
                            {formatSlot(hour, minutes)}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingCity && (
        <WorkingHoursModal city={editingCity} onClose={() => setEditingCity(null)} />
      )}
    </div>
  );
}
