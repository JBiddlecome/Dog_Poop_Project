import BlockHeatMap from '@/components/BlockHeatMap';
import heatmapData from '@/data/heatmap.json';
import config from '@/data/config.json';

export const metadata = {
  title: 'Block 1 Heat Map — Our Block',
  description: 'Live heat map of dog waste survey data for Block 1 in Burbank.',
};

function Legend() {
  const items = [
    { color: '#F1EFE8', label: 'No data / none' },
    { color: '#FAC775', label: 'Rare (< 1 avg)' },
    { color: '#EF9F27', label: 'Low (1–2 avg)' },
    { color: '#D85A30', label: 'Medium (3–5 avg)' },
    { color: '#A32D2D', label: 'Hot spot (6+)' },
  ];
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-4">
      {items.map(i => (
        <div key={i.label} className="flex items-center gap-1.5 text-xs text-muted">
          <span className="w-4 h-4 rounded" style={{ background: i.color, border: '1px solid #D4CFC5' }}/>
          {i.label}
        </div>
      ))}
    </div>
  );
}

function SurveySummary({ walks, addresses }) {
  const totalCounts = addresses.flatMap(a => a.counts);
  const total       = totalCounts.reduce((a, b) => a + b, 0);
  const hotSpots    = addresses
    .filter(a => a.counts.length > 0)
    .map(a => ({ ...a, avg: a.counts.reduce((x,y)=>x+y,0)/a.counts.length }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

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
        <p className="font-display text-3xl font-bold text-ink">
          {addresses.filter(a => a.counts.some(c => c > 0)).length}
        </p>
        <p className="text-xs text-muted mt-1">Addresses with recorded waste</p>
      </div>

      {hotSpots.length > 0 && (
        <div className="card sm:col-span-3">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Top hot spots</p>
          <div className="flex flex-col gap-2">
            {hotSpots.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3 text-sm">
                <span className="w-5 h-5 rounded bg-gold-light text-gold-dark text-xs
                                 font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-ink">{a.address.replace(', Burbank, CA 91504','')}</span>
                <span className="text-muted">{a.avg.toFixed(1)} avg / walk</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  const { addresses, walks } = heatmapData;

  return (
    <div className="section">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold mb-3">Block 1 Heat Map</h1>
        <p className="text-muted max-w-lg mx-auto text-sm leading-relaxed">
          Each cell shows the average number of poop piles spotted in front of that
          address per survey walk. Click any address for details.
        </p>
        <p className="text-xs text-muted mt-2">
          Last updated: <strong>{config.lastUpdated}</strong> · {walks.length} walk{walks.length !== 1 ? 's' : ''} recorded
        </p>
      </div>

      <SurveySummary walks={walks} addresses={addresses} />

      {walks.length === 0 && (
        <div className="bg-sage-light border border-sage text-sage-dark rounded-xl p-4 text-sm text-center mb-6">
          📋 Survey data collection is underway. Check back after the first morning walk!
        </div>
      )}

      <BlockHeatMap data={addresses} />
      <Legend />

      <div className="mt-10 card text-sm text-muted leading-relaxed">
        <p className="font-medium text-ink mb-2">How this data is collected</p>
        <p>
          Your neighbor walks both sides of the block (N Niagara St and N Catalina St)
          in the early morning and records fresh waste counts per address on a paper survey sheet.
          Counts are logged here after each walk. The heat map updates as the project progresses
          so everyone can see whether the bag stations and signs are making a difference.
        </p>
        <p className="mt-2">
          Numbers represent <em>average piles per walk</em> — so an address showing 3.0 had
          3 piles on average every time that stretch of sidewalk was checked.
        </p>
      </div>
    </div>
  );
}
