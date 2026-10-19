import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEffect } from 'react';
import { useTimezone } from '../../context/TimezoneContext';
import { render, screen } from '../../test/test-utils';
import { MeetingDisplay } from '../MeetingDisplay';

describe('MeetingDisplay', () => {
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

  it('should not render when no meeting is selected', () => {
    render(<MeetingDisplay />);

    // The component returns null when no meeting is selected
    expect(screen.queryByText('Selected Meeting')).not.toBeInTheDocument();
  });

  describe('public holidays', () => {
    function SelectMeeting({ startSlot, endSlot }: { startSlot: number; endSlot: number }) {
      const { setMeeting } = useTimezone();
      useEffect(() => {
        setMeeting({ startSlot, endSlot });
      }, [setMeeting, startSlot, endSlot]);
      return <MeetingDisplay />;
    }

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should flag cities that are off for a public holiday', () => {
      // Noon on Christmas Day in the viewer's timezone. London's local date is
      // Dec 25 for any viewer from UTC-11 to UTC+11; New York's depends on the viewer.
      vi.setSystemTime(new Date(2025, 11, 25, 12, 0, 0));
      render(<SelectMeeting startSlot={24} endSlot={25} />);

      expect(screen.getAllByText('Off: Christmas Day').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/cit(y is|ies are) off for a public holiday/)).toBeInTheDocument();
    });

    it('should not flag a regular working day', () => {
      vi.setSystemTime(new Date(2025, 2, 12, 12, 0, 0));
      render(<SelectMeeting startSlot={24} endSlot={25} />);

      expect(screen.getByText(/Selected Meeting/)).toBeInTheDocument();
      expect(screen.queryByText(/Off:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/off for a public holiday/)).not.toBeInTheDocument();
    });
  });
});
