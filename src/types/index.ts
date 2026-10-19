export interface City {
  id: string;
  name: string;
  timezone: string;
  countryCode: string;
  // date-holidays subdivision code (state / province / region), e.g. 'NSW', 'NY'.
  // '' means nationwide holidays only; undefined means not yet resolved.
  subdivision?: string;
  workStart: number;
  workEnd: number;
}

export interface MeetingSelection {
  startSlot: number;
  endSlot: number;
}

export interface TimezoneState {
  cities: City[];
  referenceDate: Date;
  meeting: MeetingSelection | null;
  addCity: (city: City) => void;
  removeCity: (id: string) => void;
  updateWorkingHours: (id: string, start: number, end: number) => void;
  updateSubdivision: (id: string, subdivision: string | undefined) => void;
  setReferenceDate: (date: Date) => void;
  reorderCities: (fromIndex: number, toIndex: number) => void;
  setMeeting: (meeting: MeetingSelection | null) => void;
}

export interface TimezoneCityData {
  name: string;
  alternativeName: string;
  countryName: string;
  mainCities: string[];
  rawOffsetInMinutes: number;
  abbreviation: string;
  rawFormat: string;
  currentTimeOffsetInMinutes: number;
  currentTimeFormat: string;
}
