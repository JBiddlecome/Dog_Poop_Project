import config from '@/data/config.json';

export const metadata = {
  title: 'Donate — Our Block',
  description: 'Support the Block 1 dog waste initiative with a small Venmo donation.',
};

const lineItems = [
  { item: `${config.plannedStations} bag dispensers`,    qty: config.plannedStations, unit: config.costPerStation },
  { item: `${config.plannedSigns} yard signs`,           qty: config.plannedSigns,    unit: config.costPerSignPack },
  { item: 'Bag refills (3-month supply)',                qty: 3,                       unit: 12 },
  { item: 'Flyers & printing',                          qty: 1,                       unit: 15 },
];

export default function DonatePage() {
  const total = lineItems.reduce((s, l) => s + l.qty * l.unit, 0);

  return (
    <div className="section max-w-3xl">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-bold mb-3">Support the project</h1>
        <p className="text-muted leading-relaxed">
          100% of donations go directly to bag stations and signs. No admin fees.
          No HOA. Just neighbors helping neighbors.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">

        {/* Venmo card */}
        <div className="card text-center flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center text-2xl">
            💛
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold mb-1">Donate via Venmo</h2>
            <p className="text-muted text-sm">Any amount helps. Even $3 buys a bag roll.</p>
          </div>

          {/* QR placeholder — replace src with real Venmo QR image */}
          <div className="border-2 border-dashed border-rule rounded-xl p-4 flex flex-col items-center gap-3 w-full">
            <div className="w-40 h-40 bg-cream rounded-lg flex items-center justify-center text-muted text-xs text-center p-4">
              Place your Venmo QR code image here
              <br/>(add to /public/venmo-qr.png)
            </div>
            <a
              href={config.venmoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold w-full justify-center"
            >
              Open in Venmo → {config.venmoHandle}
            </a>
          </div>

          <p className="text-xs text-muted">
            Can't use Venmo? Reach out via the{' '}
            <a href="/request" className="text-sage underline">contact form</a> and
            we'll find another way.
          </p>
        </div>

        {/* Cost breakdown */}
        <div className="flex flex-col gap-5">
          <div className="card">
            <h2 className="font-display text-lg font-bold mb-4">Where your money goes</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-rule">
                  <th className="text-left text-xs text-muted pb-2 font-medium">Item</th>
                  <th className="text-right text-xs text-muted pb-2 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map(l => (
                  <tr key={l.item} className="border-b border-rule last:border-0">
                    <td className="py-2.5 text-ink">{l.item}</td>
                    <td className="py-2.5 text-right text-muted">
                      ${(l.qty * l.unit).toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-ink/20">
                  <td className="py-3 font-semibold text-ink">Total</td>
                  <td className="py-3 text-right font-bold text-sage text-lg">
                    ${total.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card bg-gold-light border-gold/30">
            <p className="text-sm font-medium text-gold-dark mb-1">
              That's ~$3 per household
            </p>
            <p className="text-xs text-muted">
              Our block has ~{config.stats.estimatedUnits} residential units. If even
              30 households chip in $10, the project is fully funded for the first year.
            </p>
          </div>

          <div className="card">
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
              Project promise
            </p>
            <ul className="text-sm text-muted space-y-1.5">
              {[
                'Every station personally maintained by your neighbor',
                'Heat map updated after every survey walk',
                'Donation totals posted publicly here',
                'Leftover funds roll over to refill bags',
              ].map(p => (
                <li key={p} className="flex gap-2">
                  <span className="text-sage mt-0.5">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
