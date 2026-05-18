import GpsHeatMap from '@/components/GpsHeatMap';
import walksData from '@/data/walks.json';
import config from '@/data/config.json';

export const metadata = {
  title: 'Block 1 Heat Map — Our Block',
  description: 'Live map of dog waste survey data for Block 1 in Burbank.',
};

function poopColor(count) {
  if (count >= 7) return '#dc2626';
  if (count >= 4) return '#ea580c';
  if (count >= 2) return '#ca8a04';
  return '#16a34a';
}

function aggregateLocations(walks) {
  const byAddr = new Map();
  for (const walk of walks) {
    for (const loc of walk.locations) {
      if (byAddr.has(loc.address)) {
        const e = byAddr.get(loc.address);
        e.total += loc.count;
        e.walkCount += 1;
      } else {
        byAddr.set(loc.address, { ...loc, total: loc.count, walkCount: 1 });
      }
    }
  }
  return Array.from(byAddr.values())
    .map(e => ({ ...e, avg: e.total / e.walkCount }))
    .sort((a, b) => b.avg - a.avg);
}

function MapLegend() {
  const items = [
    { color: '#16a34a', label: '1 poop' },
    { color: '#ca8a04', label: '2–3 poops' },
    { color: '#ea580c', label: '4–6 poops' },
    { color: '#dc2626', label: '7+ poops' },
  ];
  return (
    <div className="flex flex-wrap gap-4 justify-center mt-4">
      {items.map(i => (
        <div key={i.label} className="flex items-center gap-2 text-xs text-muted">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: i.color }} />
          {i.label}
        </div>
      ))}
    </div>
  );
}

function SurveySummary({ walks, locations }) {
  const total    = locations.reduce((s, l) => s + l.total, 0);
  const hotSpots = locations.slice(0, 5);

  return (
    <div className="grid sm:grid-cols-3 gap-4 mb-8">
      <div className="card text-center">
        <p className="font-display text-3xl font-bold text-sage">{walks.length}</p>
        <p className="text-xs text-muted mt-1">Survey walks completed</p>
      </div>
      <div className="card text-center">
        <p className="font-display text-3xl font-bold text-gold-dark">{total}</p>
        <p className="text-xs text-muted mt-1">Total piles logged</p>
      </div>
      <div className="card text-center">
        <p className="font-display text-3xl font-bold text-ink">{locations.length}</p>
        <p className="text-xs text-muted mt-1">Addresses with recorded waste</p>
      </div>

      {hotSpots.length > 0 && (
        <div className="card sm:col-span-3">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Top hot spots (avg per walk)</p>
          <div className="flex flex-col gap-2">
            {hotSpots.map((loc, i) => (
              <div key={loc.address} className="flex items-center gap-3 text-sm">
                <span className="w-5 h-5 rounded bg-gold-light text-gold-dark text-xs
                                 font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-ink">{loc.address}</span>
                <span className="text-xs text-muted">{loc.walkCount}w</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: poopColor(loc.avg) }}
                >
                  {loc.avg.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  const { walks } = walksData;
  const locations  = aggregateLocations(walks);
  const lastWalk   = walks.length > 0 ? walks[walks.length - 1].date : null;

  return (
    <div className="section">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold mb-3">Block 1 Heat Map</h1>
        <p className="text-muted max-w-lg mx-auto text-sm leading-relaxed">
          Each circle shows where dog waste was spotted during survey walks.
          Larger, redder circles mean more piles at that address.
          Tap any circle for the address and count.
        </p>
        {lastWalk && (
          <p className="text-xs text-muted mt-2">
            Last walk: <strong>{lastWalk}</strong> · {walks.length} walk{walks.length !== 1 ? 's' : ''} recorded
          </p>
        )}
      </div>

      <SurveySummary walks={walks} locations={locations} />

      {walks.length === 0 && (
        <div className="bg-sage-light border border-sage text-sage-dark rounded-xl p-4 text-sm text-center mb-6">
          📋 Survey data collection is underway. Check back after the first morning walk!
        </div>
      )}

      <GpsHeatMap walks={walks} />
      <MapLegend />

      <div className="mt-10 card text-sm text-muted leading-relaxed">
        <p className="font-medium text-ink mb-2">How this data is collected</p>
        <p>
          Your neighbor walks both sides of the block using a custom Android app that
          records a GPS location every time fresh waste is spotted. Each dot on the map
          is a real address where waste was found — the color shows how many total piles
          have been recorded there across all survey walks.
        </p>
        <p className="mt-2">
          Circle size and color reflect the <em>average piles per walk</em> for that address —
          only walks where that street was actually surveyed count toward the average.
          If Catalina St was only walked once, its average is based on that one walk,
          not diluted by days when only Niagara St was covered.
        </p>
      </div>
    </div>
  );
}
