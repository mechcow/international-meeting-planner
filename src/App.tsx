import { CitySearch } from './components/CitySearch';
import { TimelineGrid } from './components/TimelineGrid';
import { DateControls } from './components/DateControls';
import { CurrentTimeDisplay } from './components/CurrentTimeDisplay';
import { MeetingDisplay } from './components/MeetingDisplay';
import logo from './assets/logo.png';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6">
        {/* Header */}
        <header className="mb-6">
          <img src={logo} alt="International Meeting Planner" className="h-12 md:h-16 mb-2" />
          <p className="text-gray-400 text-sm md:text-base">
            Drag across the timeline to select a meeting time
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="flex-1 max-w-sm">
            <CitySearch />
          </div>
          <DateControls />
        </div>

        {/* Current Time Display */}
        <CurrentTimeDisplay />

        {/* Meeting Selection Display */}
        <MeetingDisplay />

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
          <span className="text-gray-500">City rows:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-600" />
            <span className="text-gray-400">Working</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-700" />
            <span className="text-gray-400">Not working</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-800" />
            <span className="text-gray-400">Past</span>
          </div>
          <span className="text-gray-500 ml-2">Best times:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-700" />
            <div className="w-3 h-3 rounded bg-orange-600" />
            <div className="w-3 h-3 rounded bg-yellow-600" />
            <div className="w-3 h-3 rounded bg-lime-600" />
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-gray-400 ml-1">Few → All</span>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <div className="w-4 h-4 rounded ring-2 ring-blue-500" />
            <span className="text-gray-400">Selected</span>
          </div>
        </div>

        {/* Timeline Grid */}
        <TimelineGrid />

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>Click and drag to select meeting times. Click the clock icon to customize working hours.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
