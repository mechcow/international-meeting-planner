// Maps cities to the date-holidays subdivision (state / province / region) that
// sets their public holidays. Many countries have holidays that only apply in
// some states, so country-level lookups alone miss days people are off.

// City name -> subdivision, per country. Used first because @vvo/tzdb groups
// several states under one timezone (e.g. Melbourne and Canberra are listed
// under Australia/Sydney, Philadelphia under America/New_York).
export const citySubdivisions: Record<string, Record<string, string>> = {
  US: {
    'new york': 'NY', 'new york city': 'NY', 'brooklyn': 'NY', 'queens': 'NY',
    'philadelphia': 'PA', 'boston': 'MA', 'washington': 'DC', 'washington, d.c.': 'DC',
    'miami': 'FL', 'atlanta': 'GA', 'detroit': 'MI', 'charlotte': 'NC',
    'jacksonville': 'FL', 'columbus': 'OH', 'indianapolis': 'IN', 'baltimore': 'MD',
    'chicago': 'IL', 'houston': 'TX', 'san antonio': 'TX', 'dallas': 'TX', 'austin': 'TX',
    'minneapolis': 'MN', 'nashville': 'TN', 'new orleans': 'LA', 'milwaukee': 'WI',
    'kansas city': 'MO', 'st. louis': 'MO',
    'denver': 'CO', 'colorado springs': 'CO', 'el paso': 'TX', 'albuquerque': 'NM',
    'salt lake city': 'UT', 'boise': 'ID',
    'phoenix': 'AZ', 'tucson': 'AZ', 'mesa': 'AZ', 'chandler': 'AZ',
    'los angeles': 'CA', 'san diego': 'CA', 'san jose': 'CA', 'san francisco': 'CA',
    'seattle': 'WA', 'portland': 'OR', 'las vegas': 'NV',
    'anchorage': 'AK', 'fairbanks': 'AK', 'juneau': 'AK',
    'honolulu': 'HI',
  },
  CA: {
    'toronto': 'ON', 'ottawa': 'ON', 'mississauga': 'ON', 'montréal': 'QC', 'montreal': 'QC',
    'quebec city': 'QC', 'québec': 'QC', 'vancouver': 'BC', 'surrey': 'BC', 'victoria': 'BC',
    'burnaby': 'BC', 'calgary': 'AB', 'edmonton': 'AB', 'winnipeg': 'MB', 'regina': 'SK',
    'saskatoon': 'SK', 'halifax': 'NS', 'dartmouth': 'NS', 'moncton': 'NB',
    "st. john's": 'NL', 'whitehorse': 'YT',
  },
  AU: {
    'sydney': 'NSW', 'newcastle': 'NSW', 'melbourne': 'VIC', 'canberra': 'ACT',
    'brisbane': 'QLD', 'gold coast': 'QLD', 'sunshine coast': 'QLD',
    'perth': 'WA', 'adelaide': 'SA', 'hobart': 'TAS', 'darwin': 'NT', 'alice springs': 'NT',
  },
  GB: {
    'london': 'ENG', 'birmingham': 'ENG', 'manchester': 'ENG', 'leeds': 'ENG', 'liverpool': 'ENG',
    'bristol': 'ENG', 'glasgow': 'SCT', 'edinburgh': 'SCT', 'cardiff': 'WLS', 'belfast': 'NIR',
  },
  DE: {
    'berlin': 'BE', 'hamburg': 'HH', 'munich': 'BY', 'münchen': 'BY', 'köln': 'NW', 'cologne': 'NW',
    'frankfurt': 'HE', 'stuttgart': 'BW', 'düsseldorf': 'NW', 'dresden': 'SN', 'leipzig': 'SN',
    'hannover': 'NI', 'bremen': 'HB',
  },
  CH: {
    'zürich': 'ZH', 'zurich': 'ZH', 'genève': 'GE', 'geneva': 'GE', 'basel': 'BS',
    'lausanne': 'VD', 'bern': 'BE', 'lugano': 'TI',
  },
  ES: {
    'madrid': 'MD', 'barcelona': 'CT', 'valencia': 'VC', 'zaragoza': 'AR', 'sevilla': 'AN',
    'seville': 'AN', 'málaga': 'AN', 'bilbao': 'PV',
    'las palmas de gran canaria': 'CN', 'santa cruz de tenerife': 'CN',
  },
  IN: {
    'mumbai': 'MH', 'pune': 'MH', 'delhi': 'DL', 'new delhi': 'DL', 'bengaluru': 'KA',
    'bangalore': 'KA', 'hyderabad': 'TG', 'chennai': 'TN', 'kolkata': 'WB', 'ahmedabad': 'GJ',
  },
  BR: {
    'são paulo': 'SP', 'sao paulo': 'SP', 'rio de janeiro': 'RJ', 'belo horizonte': 'MG',
    'salvador': 'BA', 'brasília': 'DF', 'brasilia': 'DF', 'manaus': 'AM',
  },
  NZ: {
    'auckland': 'AUK', 'wellington': 'WGN', 'christchurch': 'CAN',
  },
  MY: {
    'kuala lumpur': '14', 'johor bahru': '01', 'petaling jaya': '10',
  },
  AT: {
    'vienna': '9', 'wien': '9', 'graz': '6', 'linz': '4', 'salzburg': '5', 'innsbruck': '7',
  },
};

// Timezone -> subdivision, for zones that fall within a single subdivision.
export const timezoneSubdivisions: Record<string, string> = {
  'Australia/Sydney': 'NSW',
  'Australia/Melbourne': 'VIC',
  'Australia/Brisbane': 'QLD',
  'Australia/Perth': 'WA',
  'Australia/Adelaide': 'SA',
  'Australia/Hobart': 'TAS',
  'Australia/Darwin': 'NT',
  'Pacific/Honolulu': 'HI',
  'America/Anchorage': 'AK',
  'America/Phoenix': 'AZ',
  'America/Vancouver': 'BC',
  'America/Edmonton': 'AB',
  'America/Winnipeg': 'MB',
  'America/Regina': 'SK',
  'America/Halifax': 'NS',
  'America/St_Johns': 'NL',
  'America/Whitehorse': 'YT',
  'Atlantic/Canary': 'CN',
};

export function inferSubdivision(
  cityName: string,
  timezone: string,
  countryCode: string
): string | undefined {
  const byCity = citySubdivisions[countryCode]?.[cityName.trim().toLowerCase()];
  if (byCity) return byCity;
  return timezoneSubdivisions[timezone];
}
