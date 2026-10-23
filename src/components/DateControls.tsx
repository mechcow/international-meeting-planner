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

  const pill = (selected: boolean) =>
    `px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
      selected ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
    }`;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        <button
          onClick={goToPrevDay}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors"
          title="Previous day"
        >
          <ChevronLeft size={18} />
        </button>
        <input
          type="date"
          value={format(referenceDate, 'yyyy-MM-dd')}
          onChange={handleDateChange}
          className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={goToNextDay}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors"
          title="Next day"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Today + quick day buttons as one segmented control */}
      <div className="flex items-center gap-0.5 bg-gray-800 border border-gray-700 rounded-lg p-0.5">
        <button onClick={goToToday} className={`flex items-center gap-1 ${pill(isToday)}`}>
          <Calendar size={13} />
          Today
        </button>
        {quickDays.map(({ date, label, isSelected }, i) => (
          <button
            key={date.toISOString()}
            onClick={() => setReferenceDate(date)}
            className={`${pill(isSelected)} ${i > 0 ? 'hidden xl:inline-block' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
