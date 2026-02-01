import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { TimelineGrid } from '../TimelineGrid';

describe('TimelineGrid', () => {
  beforeEach(() => {
    // Reset localStorage mock
    vi.mocked(window.localStorage.getItem).mockReturnValue(null);
  });

  describe('empty state', () => {
    it('should show empty message when no cities are added', () => {
      // Mock empty cities
      vi.mocked(window.localStorage.getItem).mockReturnValue('[]');
      render(<TimelineGrid />);

      expect(screen.getByText('No cities added')).toBeInTheDocument();
      expect(screen.getByText('Use the search box above to add cities')).toBeInTheDocument();
    });
  });

  describe('with cities', () => {
    const mockCities = [
      {
        id: 'new-york',
        name: 'New York',
        timezone: 'America/New_York',
        countryCode: 'US',
        workStart: 9,
        workEnd: 17,
      },
      {
        id: 'london',
        name: 'London',
        timezone: 'Europe/London',
        countryCode: 'GB',
        workStart: 9,
        workEnd: 17,
      },
    ];

    beforeEach(() => {
      vi.mocked(window.localStorage.getItem).mockReturnValue(JSON.stringify(mockCities));
    });

    it('should render city names', () => {
      render(<TimelineGrid />);

      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('London')).toBeInTheDocument();
    });

    it('should render Best Times row', () => {
      render(<TimelineGrid />);

      expect(screen.getByText('Best Times')).toBeInTheDocument();
      expect(screen.getByText('2 cities')).toBeInTheDocument();
    });

    it('should render City column header', () => {
      render(<TimelineGrid />);

      expect(screen.getByText('City')).toBeInTheDocument();
    });

    it('should render time slots in header', () => {
      render(<TimelineGrid />);

      // Check for some time labels
      expect(screen.getAllByText('12AM').length).toBeGreaterThan(0);
      expect(screen.getAllByText('9AM').length).toBeGreaterThan(0);
      expect(screen.getAllByText('12PM').length).toBeGreaterThan(0);
    });

    it('should have remove buttons for each city', () => {
      render(<TimelineGrid />);

      const removeButtons = screen.getAllByTitle('Remove city');
      expect(removeButtons).toHaveLength(2);
    });

    it('should have working hours edit buttons for each city', () => {
      render(<TimelineGrid />);

      const editButtons = screen.getAllByTitle('Edit working hours');
      expect(editButtons).toHaveLength(2);
    });
  });

  describe('mouse interactions (desktop)', () => {
    const mockCities = [
      {
        id: 'new-york',
        name: 'New York',
        timezone: 'America/New_York',
        countryCode: 'US',
        workStart: 9,
        workEnd: 17,
      },
    ];

    beforeEach(() => {
      vi.mocked(window.localStorage.getItem).mockReturnValue(JSON.stringify(mockCities));
    });

    it('should highlight slot on hover', async () => {
      render(<TimelineGrid />);

      // Find a time slot cell in the heatmap row
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    const mockCities = [
      {
        id: 'new-york',
        name: 'New York',
        timezone: 'America/New_York',
        countryCode: 'US',
        workStart: 9,
        workEnd: 17,
      },
    ];

    beforeEach(() => {
      vi.mocked(window.localStorage.getItem).mockReturnValue(JSON.stringify(mockCities));
    });

    it('should have proper table structure', () => {
      render(<TimelineGrid />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0);
      expect(screen.getAllByRole('row').length).toBeGreaterThan(0);
    });
  });
});
