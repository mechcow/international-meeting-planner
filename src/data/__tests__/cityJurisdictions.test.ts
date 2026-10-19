import { describe, it, expect } from 'vitest';
import Holidays from 'date-holidays';
import { getTimeZones } from '@vvo/tzdb';
import { citySubdivisions, timezoneSubdivisions, inferSubdivision } from '../cityJurisdictions';

describe('inferSubdivision', () => {
  it('maps cities that share a timezone to their own state', () => {
    // @vvo/tzdb lists Melbourne and Canberra under Australia/Sydney
    expect(inferSubdivision('Sydney', 'Australia/Sydney', 'AU')).toBe('NSW');
    expect(inferSubdivision('Melbourne', 'Australia/Sydney', 'AU')).toBe('VIC');
    expect(inferSubdivision('Canberra', 'Australia/Sydney', 'AU')).toBe('ACT');
    expect(inferSubdivision('New York City', 'America/New_York', 'US')).toBe('NY');
    expect(inferSubdivision('Philadelphia', 'America/New_York', 'US')).toBe('PA');
    expect(inferSubdivision('Montréal', 'America/Toronto', 'CA')).toBe('QC');
  });

  it('is case-insensitive on city names', () => {
    expect(inferSubdivision('san francisco', 'America/Los_Angeles', 'US')).toBe('CA');
  });

  it('falls back to a single-state timezone', () => {
    expect(inferSubdivision('Logan City', 'Australia/Brisbane', 'AU')).toBe('QLD');
    expect(inferSubdivision('Pearl City', 'Pacific/Honolulu', 'US')).toBe('HI');
  });

  it('returns undefined when the jurisdiction is unknown', () => {
    expect(inferSubdivision('Tokyo', 'Asia/Tokyo', 'JP')).toBeUndefined();
    expect(inferSubdivision('Brooklyn Park', 'America/Chicago', 'US')).toBeUndefined();
  });
});

describe('jurisdiction data', () => {
  const hd = new Holidays();

  it('only uses subdivision codes date-holidays knows about', () => {
    for (const [country, cities] of Object.entries(citySubdivisions)) {
      const states = hd.getStates(country) ?? {};
      for (const [city, code] of Object.entries(cities)) {
        expect(states, `${country}:${city}`).toHaveProperty(code);
      }
    }
  });

  it('only maps timezones to valid subdivisions of their country', () => {
    const zoneCountry = new Map<string, string>();
    for (const tz of getTimeZones()) {
      for (const name of tz.group) zoneCountry.set(name, tz.countryCode);
    }
    for (const [tz, code] of Object.entries(timezoneSubdivisions)) {
      const country = zoneCountry.get(tz);
      expect(country, tz).toBeDefined();
      expect(hd.getStates(country!) ?? {}, tz).toHaveProperty(code);
    }
  });
});
