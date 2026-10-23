import { CitySearch } from './components/CitySearch';
import { TimelineGrid } from './components/TimelineGrid';
import { DateControls } from './components/DateControls';
import { MeetingDisplay } from './components/MeetingDisplay';
import { Logo } from './components/Logo';
import { SuggestedTimes } from './components/SuggestedTimes';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header: logo, city search and date controls in one bar */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-[1600px] mx-auto px-3 md:px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Logo />
          <div className="order-last w-full md:order-none md:w-64">
            <CitySearch />
          </div>
          <div className="ml-auto">
            <DateControls />
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-3 md:px-4 py-3">
        {/* Best upcoming half-hour slots */}
        <SuggestedTimes />

        {/* Meeting Selection Display */}
        <MeetingDisplay />

        {/* Hint + legend */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 mb-2 text-xs">
          <p className="text-gray-500">
            Drag across the timeline to select a meeting time · clock icon on a city edits its hours
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-400">
            <LegendSwatch className="bg-green-600" label="Working" />
            <LegendSwatch className="bg-gray-700" label="Not working" />
            <LegendSwatch className="holiday-slot" label="Holiday" />
            <LegendSwatch className="bg-gray-800 border border-gray-700" label="Past" />
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3 bg-red-500" />
              <span>Now</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 mr-0.5">Best:</span>
              <div className="w-2.5 h-2.5 rounded-sm bg-red-700" />
              <div className="w-2.5 h-2.5 rounded-sm bg-orange-600" />
              <div className="w-2.5 h-2.5 rounded-sm bg-yellow-600" />
              <div className="w-2.5 h-2.5 rounded-sm bg-lime-600" />
              <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
              <span className="ml-0.5">few → all</span>
            </div>
          </div>
        </div>

        {/* Timeline Grid */}
        <TimelineGrid />
      </main>
    </div>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded-sm ${className}`} />
      <span>{label}</span>
    </div>
  );
}

export default App;
