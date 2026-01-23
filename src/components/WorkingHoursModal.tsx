import { useState } from 'react';
import { X } from 'lucide-react';
import { useTimezone } from '../context/TimezoneContext';
import { getTimeOptions } from '../utils/timezoneUtils';
import type { City } from '../types';

interface WorkingHoursModalProps {
  city: City;
  onClose: () => void;
}

const timeOptions = getTimeOptions();

export function WorkingHoursModal({ city, onClose }: WorkingHoursModalProps) {
  const { updateWorkingHours } = useTimezone();
  const [workStart, setWorkStart] = useState(city.workStart);
  const [workEnd, setWorkEnd] = useState(city.workEnd);

  const handleSave = () => {
    updateWorkingHours(city.id, workStart, workEnd);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Working Hours - {city.name}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Start Time</label>
            <select
              value={workStart}
              onChange={(e) => setWorkStart(Number(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">End Time</label>
            <select
              value={workEnd}
              onChange={(e) => setWorkEnd(Number(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
