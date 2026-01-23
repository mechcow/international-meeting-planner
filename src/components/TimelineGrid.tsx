import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { useTimezone } from '../context/TimezoneContext';
import { WorkingHoursModal } from './WorkingHoursModal';
import {
  getSlotInTimezone,
  isWithinWorkingHours,
  formatSlot,
  getTimezoneOffset,
  SLOTS_PER_DAY,
} from '../utils/timezoneUtils';
import type { City } from '../types';

interface SlotData {
  hour: number;
  minutes: number;
  isWorking: boolean;
}

const SLOT_WIDTH = 44;
const CITY_COL_WIDTH = 180;

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

export function TimelineGrid() {
  const { cities, referenceDate, meeting, setMeeting, removeCity } = useTimezone();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [firstFutureSlot, setFirstFutureSlot] = useState(() => getFirstFutureSlot(referenceDate));
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

  // Pre-compute slot data for all cities and all slots
  const { citySlotData, overlapScores } = useMemo(() => {
    const citySlotData = new Map<string, SlotData[]>();
    const overlapScores: number[] = new Array(SLOTS_PER_DAY).fill(0);

    for (const city of cities) {
      const slots: SlotData[] = [];
      for (let i = 0; i < SLOTS_PER_DAY; i++) {
        const { hour, minutes, timeDecimal, date } = getSlotInTimezone(
          referenceDate,
          i,
          city.timezone
        );
        const isWorking = isWithinWorkingHours(
          timeDecimal,
          city.workStart,
          city.workEnd,
          date,
          city.countryCode
        );
        slots.push({ hour, minutes, isWorking });
        if (isWorking) {
          overlapScores[i]++;
        }
      }
      citySlotData.set(city.id, slots);
    }

    return { citySlotData, overlapScores };
  }, [cities, referenceDate]);

  // Scroll to 9am on initial load
  useEffect(() => {
    if (scrollContainerRef.current && cities.length > 0) {
      const nineAmSlot = 18; // 9:00 AM = slot 18 (9 hours * 2 slots per hour)
      const scrollPosition = nineAmSlot * SLOT_WIDTH;
      scrollContainerRef.current.scrollLeft = scrollPosition;
    }
  }, []); // Only run on mount

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
                className="sticky left-0 z-20 bg-gray-800 border-r border-gray-600 p-2 text-left"
              >
                <span className="text-sm font-medium text-gray-400">City</span>
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
                    <div className={`h-10 flex items-center justify-center text-[9px] relative z-10 ${
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
              <td className="sticky left-0 z-20 bg-gray-900 border-r border-gray-600 p-2">
                <div className="font-medium text-sm text-gray-300">Best Times</div>
                <div className="text-xs text-gray-500">{cities.length} cities</div>
              </td>
              {headerSlots.map(({ index }) => {
                const isPast = index < firstFutureSlot;
                const overlapScore = overlapScores[index];
                const inDragRange = isSlotInDragRange(index);
                const inMeeting = isSlotInMeeting(index);
                const isHovered = hoveredSlot === index;
                const isHalfHour = index % 2 === 1;
                const isSelected = inDragRange || inMeeting;
                const heatmapColor = getHeatmapColor(overlapScore, cities.length, isPast);

                return (
                  <td
                    key={index}
                    className={`p-0 border-r transition-all overflow-hidden ${
                      isPast ? 'cursor-not-allowed' : 'cursor-crosshair'
                    } ${isHalfHour ? 'border-r-gray-700' : 'border-r-gray-600'
                    } ${isHovered && !isSelected && !isPast ? 'brightness-125' : ''}`}
                    onMouseDown={() => !isPast && handleMouseDown(index)}
                    onMouseMove={() => handleMouseMove(index)}
                  >
                    <div className={`h-10 flex items-center justify-center relative ${heatmapColor}`}>
                      {isSelected && (
                        <div className={`absolute inset-0 ${inDragRange ? 'bg-blue-500/50' : 'bg-blue-600/40'}`} />
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

              return (
                <tr key={city.id} className="bg-gray-800 border-b border-gray-700">
                  {/* City name column */}
                  <td
                    className="sticky left-0 z-20 bg-gray-800 border-r border-gray-600 p-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="font-medium truncate text-sm">{city.name}</div>
                        <div className="text-xs text-gray-400">{offset}</div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => setEditingCity(city)}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                          title="Edit working hours"
                        >
                          <Clock size={14} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => removeCity(city.id)}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                          title="Remove city"
                        >
                          <X size={14} className="text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Time slots - simple green/gray, past slots darker */}
                  {headerSlots.map(({ index }) => {
                    const isPast = index < firstFutureSlot;
                    const slotData = citySlotData.get(city.id)![index];
                    const { hour, minutes, isWorking } = slotData;
                    const inDragRange = isSlotInDragRange(index);
                    const inMeeting = isSlotInMeeting(index);
                    const isHovered = hoveredSlot === index;
                    const isHalfHour = minutes === 30;
                    const isSelected = inDragRange || inMeeting;

                    let bgColor = 'bg-gray-700';
                    if (isPast) {
                      bgColor = 'bg-gray-800';
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
                        onMouseDown={() => !isPast && handleMouseDown(index)}
                        onMouseMove={() => handleMouseMove(index)}
                      >
                        <div
                          className={`h-12 flex flex-col items-center justify-center relative ${bgColor}`}
                        >
                          {isSelected && (
                            <div
                              className={`absolute inset-0 ${
                                inDragRange
                                  ? 'bg-blue-500/50'
                                  : 'bg-blue-600/40'
                              }`}
                            />
                          )}
                          <span className={`text-[10px] font-medium leading-tight relative z-10 ${
                            isPast ? 'text-gray-600' : isSelected ? 'text-white' : ''
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
