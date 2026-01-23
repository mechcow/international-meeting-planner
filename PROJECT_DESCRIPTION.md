# Project Requirements Document (PRD): Timezone Comparison App

## 1. Project Overview
**Goal:** Build a React application that visualizes overlapping time zones to facilitate scheduling meetings across global teams.
**Core Concept:** A horizontal timeline interface that allows users to compare multiple cities against a selected date, highlighting optimal "overlap hours" where working schedules align.

## 2. Tech Stack Requirements
* **Framework:** React (Latest) + Vite
* **Language:** TypeScript (Preferred) or JavaScript
* **Styling:** Tailwind CSS (for rapid, responsive grid/flex layouts)
* **Icons:** Lucide-React (or Heroicons)
* **Date Library:** `date-fns` and `date-fns-tz` (Crucial for robust timezone math)
* **State Management:** React Context API (for managing the list of active cities and global time state)
* **Persistence:** `localStorage` (Save user's selected cities/preferences)

## 3. Core Features & Functional Requirements

### A. City & Timezone Management
* **Add Location:** A search bar allowing users to input a city name.
    * *Data Source:* Use a local mapping of major cities to IANA timezones (e.g., "New York" -> `America/New_York`) or a lightweight open API.
* **Remove Location:** A delete button/icon on each city row.
* **Persistence:** The list of active cities must survive a page reload.

### B. The Timeline Interface (The "Bar")
The main view is a grid:
* **Y-Axis (Rows):** Each row represents a specific city. The left column (Sticky) displays the City Name and current Offset (e.g., "London UTC+1").
* **X-Axis (Columns):** Represents a 24-hour cycle divided into hourly blocks.
* **Current Time Indicator:** A vertical line indicating "Now" spanning across all rows.
* **Date Context:**
    * If the selected time in a city crosses midnight, the row must visually indicate the date change (e.g., a label saying "Tue" or a subtle background color shift).

### C. Navigation & Controls
* **Horizontal Scroll:** The timeline of hours must scroll horizontally while the City Name column remains sticky on the left.
* **Date Selection:**
    * **Date Picker:** A standard calendar input to select any future date.
    * **Quick Jump Buttons:** `[Today]`, `[-1 Day]`, `[+1 Day]`.
* **Reset:** A button to return the view to the current moment.

### D. "Optimal Time" Logic
* **Working Hours:**
    * Default: 9:00 AM – 5:00 PM (09:00–17:00).
    * **Override:** The user must be able to customize working hours per city (e.g., override London to 11:00–19:00).
* **Visual Suggestion (Heatmap):**
    * **Green:** Slots where *all* cities are within working hours.
    * **Yellow:** Slots where *most* cities overlap.
    * **Gray/Dimmed:** Non-working hours.

## 4. UI/UX Guidelines
* **Theme:** Dark mode preferred (better contrast for colored time blocks).
* **Responsiveness:** On desktop, show full controls. On mobile, condense the city list or allow horizontal scrolling of the entire table.
* **Interaction:** Hovering over a specific hour column should highlight that column across all cities to make reading the vertical alignment easier.

## 5. Implementation Steps for the LLM
1.  **Setup:** Initialize Vite project with Tailwind CSS.
2.  **Utilities:** Create a `TimezoneUtils` file using `date-fns-tz` to handle converting a base UTC time into local city times.
3.  **State:** Create a Context to hold `selectedCities[]`, `referenceDate`, and `workingHours` preferences.
4.  **Components:**
    * `CitySearch`: An autocomplete or simple input to add rows.
    * `TimelineGrid`: The main scrollable container.
    * `TimeBlock`: Individual cell logic (calculates color based on working hours).
5.  **Refinement:** Implement the "Daylight Savings" logic (ensure offsets are calculated based on the *selected* date, not just today's date).

## 6. Sample Data Structure
```json
// City Object Example
{
  "id": "nyc-1",
  "name": "New York",
  "timezone": "America/New_York",
  "workStart": 9,
  "workEnd": 17
}

## 7. Default Cities
* New York
* London
* Hong Kong
* Sydney
* Dubai
* Singapore