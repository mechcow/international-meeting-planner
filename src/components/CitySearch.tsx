import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { getTimeZones } from '@vvo/tzdb';
import { useTimezone } from '../context/TimezoneContext';
import type { City } from '../types';

const timezones = getTimeZones();

interface SearchResult {
  id: string;
  name: string;
  timezone: string;
  countryCode: string;
  countryName: string;
}

function getSearchResults(query: string): SearchResult[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const tz of timezones) {
    // Search in main cities
    for (const city of tz.mainCities) {
      if (city.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `${city.toLowerCase().replace(/\s+/g, '-')}-${tz.name}`,
          name: city,
          timezone: tz.name,
          countryCode: tz.countryCode,
          countryName: tz.countryName,
        });
      }
    }

    // Search by timezone name or alternative name
    if (
      tz.name.toLowerCase().includes(lowerQuery) ||
      tz.alternativeName.toLowerCase().includes(lowerQuery)
    ) {
      const mainCity = tz.mainCities[0];
      if (mainCity && !results.some((r) => r.timezone === tz.name)) {
        results.push({
          id: `${mainCity.toLowerCase().replace(/\s+/g, '-')}-${tz.name}`,
          name: mainCity,
          timezone: tz.name,
          countryCode: tz.countryCode,
          countryName: tz.countryName,
        });
      }
    }
  }

  // Sort by relevance (exact match first, then alphabetically)
  return results
    .sort((a, b) => {
      const aExact = a.name.toLowerCase() === lowerQuery;
      const bExact = b.name.toLowerCase() === lowerQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 10);
}

export function CitySearch() {
  const { cities, addCity } = useTimezone();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setResults(getSearchResults(query));
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    const isDuplicate = cities.some((c) => c.timezone === result.timezone);
    if (isDuplicate) {
      setQuery('');
      setIsOpen(false);
      return;
    }

    const newCity: City = {
      id: result.id,
      name: result.name,
      timezone: result.timezone,
      countryCode: result.countryCode,
      workStart: 9,
      workEnd: 17,
    };

    addCity(newCity);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        handleSelect(results[selectedIndex]);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const existingTimezones = new Set(cities.map((c) => c.timezone));

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Add city..."
          className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto z-50"
        >
          {results.map((result, index) => {
            const isDuplicate = existingTimezones.has(result.timezone);
            return (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                disabled={isDuplicate}
                className={`w-full text-left px-4 py-2 flex items-center justify-between transition-colors ${
                  index === selectedIndex ? 'bg-gray-700' : ''
                } ${isDuplicate ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
              >
                <div>
                  <div className="font-medium">{result.name}</div>
                  <div className="text-xs text-gray-400">
                    {result.countryName} • {result.timezone}
                  </div>
                </div>
                {isDuplicate ? (
                  <span className="text-xs text-gray-500">Added</span>
                ) : (
                  <Plus size={16} className="text-gray-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
