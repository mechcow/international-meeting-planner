import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useTimezone } from '../context/TimezoneContext';
import { formatInTimeZone } from 'date-fns-tz';

export function CurrentTimeDisplay() {
  const { cities } = useTimezone();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (cities.length === 0) return null;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={16} className="text-blue-400" />
        <span className="text-sm font-medium text-gray-300">Current Time</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cities.map((city) => (
          <div key={city.id} className="bg-gray-700/50 rounded px-3 py-2">
            <div className="text-xs text-gray-400 truncate">{city.name}</div>
            <div className="text-sm font-mono font-medium">
              {formatInTimeZone(now, city.timezone, 'h:mm a')}
            </div>
            <div className="text-xs text-gray-500">
              {formatInTimeZone(now, city.timezone, 'EEE, MMM d')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
