import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { getTimeZones } from '@vvo/tzdb';
import type { City, TimezoneState, MeetingSelection } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { defaultCities } from '../data/defaultCities';

// Build a map from timezone to country code for migration
const timezoneToCountry = new Map<string, string>();
for (const tz of getTimeZones()) {
  timezoneToCountry.set(tz.name, tz.countryCode);
}

// Migrate cities that don't have countryCode
function migrateCities(cities: City[]): City[] {
  return cities.map(city => {
    if (city.countryCode) return city;
    const countryCode = timezoneToCountry.get(city.timezone) || 'US';
    return { ...city, countryCode };
  });
}

const TimezoneContext = createContext<TimezoneState | null>(null);

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const [storedCities, setStoredCities] = useLocalStorage<City[]>('timezone-cities', defaultCities);
  const [cities, setCities] = useState<City[]>(() => migrateCities(storedCities));
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [meeting, setMeeting] = useState<MeetingSelection | null>(null);

  useEffect(() => {
    setStoredCities(cities);
  }, [cities, setStoredCities]);

  const addCity = useCallback((city: City) => {
    setCities((prev) => {
      if (prev.some((c) => c.id === city.id)) {
        return prev;
      }
      return [...prev, city];
    });
  }, []);

  const removeCity = useCallback((id: string) => {
    setCities((prev) => prev.filter((city) => city.id !== id));
  }, []);

  const updateWorkingHours = useCallback((id: string, start: number, end: number) => {
    setCities((prev) =>
      prev.map((city) =>
        city.id === id ? { ...city, workStart: start, workEnd: end } : city
      )
    );
  }, []);

  const reorderCities = useCallback((fromIndex: number, toIndex: number) => {
    setCities((prev) => {
      const newCities = [...prev];
      const [removed] = newCities.splice(fromIndex, 1);
      newCities.splice(toIndex, 0, removed);
      return newCities;
    });
  }, []);

  const value: TimezoneState = {
    cities,
    referenceDate,
    meeting,
    addCity,
    removeCity,
    updateWorkingHours,
    setReferenceDate,
    reorderCities,
    setMeeting,
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone(): TimezoneState {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
}
