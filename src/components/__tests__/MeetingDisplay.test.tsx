import { describe, it, expect, vi, beforeEach } from 'vitest';
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
});
