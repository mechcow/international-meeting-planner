import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TimezoneProvider, useTimezone } from '../TimezoneContext';
import type { City } from '../../types';

describe('TimezoneContext', () => {
  beforeEach(() => {
    vi.mocked(window.localStorage.getItem).mockReturnValue(null);
    vi.mocked(window.localStorage.setItem).mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TimezoneProvider>{children}</TimezoneProvider>
  );

  describe('useTimezone hook', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useTimezone());
      }).toThrow('useTimezone must be used within a TimezoneProvider');
    });

    it('should return context value when used inside provider', () => {
      const { result } = renderHook(() => useTimezone(), { wrapper });

      expect(result.current).toHaveProperty('cities');
      expect(result.current).toHaveProperty('referenceDate');
      expect(result.current).toHaveProperty('meeting');
      expect(result.current).toHaveProperty('addCity');
      expect(result.current).toHaveProperty('removeCity');
      expect(result.current).toHaveProperty('updateWorkingHours');
      expect(result.current).toHaveProperty('setReferenceDate');
      expect(result.current).toHaveProperty('reorderCities');
      expect(result.current).toHaveProperty('setMeeting');
    });
  });

  describe('city management', () => {
    it('should add a city', () => {
      const { result } = renderHook(() => useTimezone(), { wrapper });

      const newCity: City = {
        id: 'test-city',
        name: 'Test City',
        timezone: 'UTC',
        countryCode: 'US',
        workStart: 9,
        workEnd: 17,
      };

      act(() => {
        result.current.addCity(newCity);
      });

      expect(result.current.cities.some(c => c.id === 'test-city')).toBe(true);
    });

    it('should not add duplicate city', () => {
      const { result } = renderHook(() => useTimezone(), { wrapper });

      const newCity: City = {
        id: 'test-city',
        name: 'Test City',
        timezone: 'UTC',
        countryCode: 'US',
        workStart: 9,
        workEnd: 17,
      };

      act(() => {
        result.current.addCity(newCity);
        result.current.addCity(newCity); // Try to add again
      });

      const testCities = result.current.cities.filter(c => c.id === 'test-city');
      expect(testCities).toHaveLength(1);
    });

    it('should remove a city', () => {
      const { result } = renderHook(() => useTimezone(), { wrapper });

      const newCity: City = {
        id: 'test-city',
        name: 'Test City',
        timezone: 'UTC',
        countryCode: 'US',
        workStart: 9,
        workEnd: 17,
      };

      act(() => {
        result.current.addCity(newCity);
      });

      expect(result.current.cities.some(c => c.id === 'test-city')).toBe(true);

      act(() => {
        result.current.removeCity('test-city');
      });

      expect(result.current.cities.some(c => c.id === 'test-city')).toBe(false);
    });

    it('should update working hours', () => {
      const { result } = renderHook(() => useTimezone(), { wrapper });

      const newCity: City = {
        id: 'test-city',
        name: 'Test City',
        timezone: 'UTC',
        countryCode: 'US',
        workStart: 9,
        workEnd: 17,
      };

      act(() => {
        result.current.addCity(newCity);
      });

      act(() => {
        result.current.updateWorkingHours('test-city', 8, 18);
      });

      const updatedCity = result.current.cities.find(c => c.id === 'test-city');
      expect(updatedCity?.workStart).toBe(8);
      expect(updatedCity?.workEnd).toBe(18);
    });
  });

  describe('meeting management', () => {
    it('should set meeting selection', () => {
      const { result } = renderHook(() => useTimezone(), { wrapper });

      expect(result.current.meeting).toBeNull();

      act(() => {
        result.current.setMeeting({ startSlot: 18, endSlot: 20 });
      });

      expect(result.current.meeting).toEqual({ startSlot: 18, endSlot: 20 });
    });

    it('should clear meeting selection', () => {
      const { result } = renderHook(() => useTimezone(), { wrapper });

      act(() => {
        result.current.setMeeting({ startSlot: 18, endSlot: 20 });
      });

      expect(result.current.meeting).not.toBeNull();

      act(() => {
        result.current.setMeeting(null);
      });

      expect(result.current.meeting).toBeNull();
    });
  });

  describe('date management', () => {
    it('should set reference date', () => {
      const { result } = renderHook(() => useTimezone(), { wrapper });

      const newDate = new Date('2025-06-15');

      act(() => {
        result.current.setReferenceDate(newDate);
      });

      expect(result.current.referenceDate.toDateString()).toBe(newDate.toDateString());
    });
  });

  describe('city reordering', () => {
    it('should reorder cities', () => {
      const { result } = renderHook(() => useTimezone(), { wrapper });

      const city1: City = {
        id: 'city-1',
        name: 'City 1',
        timezone: 'UTC',
        countryCode: 'US',
        workStart: 9,
        workEnd: 17,
      };

      const city2: City = {
        id: 'city-2',
        name: 'City 2',
        timezone: 'UTC',
        countryCode: 'US',
        workStart: 9,
        workEnd: 17,
      };

      act(() => {
        result.current.addCity(city1);
        result.current.addCity(city2);
      });

      const city1Index = result.current.cities.findIndex(c => c.id === 'city-1');
      const city2Index = result.current.cities.findIndex(c => c.id === 'city-2');

      act(() => {
        result.current.reorderCities(city1Index, city2Index);
      });

      // After reorder, city-1 should be after city-2
      const newCity1Index = result.current.cities.findIndex(c => c.id === 'city-1');
      const newCity2Index = result.current.cities.findIndex(c => c.id === 'city-2');
      expect(newCity1Index).toBeGreaterThan(newCity2Index);
    });
  });
});
