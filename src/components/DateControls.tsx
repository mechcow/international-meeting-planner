import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, addDays, subDays, startOfDay, isSameDay } from 'date-fns';
import { useTimezone } from '../context/TimezoneContext';

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function formatQuickDay(date: Date, index: number): string {
  if (index === 0) return 'Tomorrow';
  const dayName = format(date, 'EEE');
  const dayNum = date.getDate();
  return `${dayName} (${dayNum}${getOrdinalSuffix(dayNum)})`;
}

export function DateControls() {
  const { referenceDate, setReferenceDate } = useTimezone();
  const today = startOfDay(new Date());

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value + 'T12:00:00');
    setReferenceDate(newDate);
  };

  const goToPrevDay = () => {
    setReferenceDate(subDays(referenceDate, 1));
  };

  const goToNextDay = () => {
    setReferenceDate(addDays(referenceDate, 1));
  };

  const goToToday = () => {
    setReferenceDate(today);
  };

  // Generate next 5 days starting from tomorrow
  const quickDays = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(today, i + 1);
    return {
      date,
      label: formatQuickDay(date, i),
      isSelected: isSameDay(referenceDate, date),
    };
  });

  const isToday = isSameDay(referenceDate, today);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevDay}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Previous day"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="relative">
            <input
              type="date"
              value={format(referenceDate, 'yyyy-MM-dd')}
              onChange={handleDateChange}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={goToNextDay}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Next day"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={goToToday}
          className={`flex items-center gap-1 px-3 py-2 rounded text-sm transition-colors ${
            isToday
              ? 'bg-blue-600 hover:bg-blue-500'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          <Calendar size={16} />
          Today
        </button>
      </div>

      {/* Quick day buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {quickDays.map(({ date, label, isSelected }) => (
          <button
            key={date.toISOString()}
            onClick={() => setReferenceDate(date)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              isSelected
                ? 'bg-blue-600 hover:bg-blue-500'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
