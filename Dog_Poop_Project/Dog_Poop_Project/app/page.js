import Link from 'next/link';
import Image from 'next/image';
import config from '@/data/config.json';

const steps = [
  {
    num: '01',
    color: 'bg-sage-light text-sage-dark',
    icon: '🪧',
    title: 'Friendly yard signs',
    body: 'We're asking willing neighbors to post a positive, welcoming sign — not a guilt trip, just a gentle reminder that most of us do the right thing.',
  },
  {
    num: '02',
    color: 'bg-gold-light text-gold-dark',
    icon: '🐾',
    title: '5 free bag stations',
    body: `We'll install ${config.plannedStations} poop bag dispensers at key corners — each stocked with ~200 bags. Your neighbor personally refills every one.`,
  },
  {
    num: '03',
    color: 'bg-mauve-light text-mauve',
    icon: '📊',
    title: 'Data-driven progress',
    body: 'We walk the block regularly and log counts by address. The heat map on this site updates as things improve — so you can see the difference.',
  },
];

export default function Home() {
  const { stats, plannedStations, costPerStation, plannedSigns, costPerSignPack } = config;
  const totalCost = plannedStations * costPerStation + plannedSigns * costPerSignPack;

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-rule">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-medium tracking-widest uppercase text-sage mb-4">
              {config.city}
            </span>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-ink leading-tight mb-4">
              Our Block.
              <br />
              <span className="text-sage">Our Pride.</span>
            </h1>
            <p className="text-lg text-muted leading-relaxed mb-8">
              A neighbor-led effort to keep our sidewalks clean — with friendly signs,
              free bag stations, and zero judgment.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/map" className="btn-sage">View the heat map →</Link>
              <Link href="/request" className="btn-outline">Get a free sign</Link>
            </div>
          </div>

          {/* Block map image */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-mauve-light shadow-sm">
            <Image
              src="/block-map.png"
              alt="Google Maps view of Block 1 — N Niagara St to N Catalina St, Thornton to Empire"
              width={500}
              height={740}
              className="w-full object-cover"
              priority
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/70 to-transparent p-4">
              <p className="text-white text-xs font-medium">
                Block 1 · N Niagara to N Catalina · Thornton to Empire
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-b border-rule bg-white">
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: stats.totalAddresses, label: 'Addresses on block' },
            { value: `~${stats.estimatedUnits}`, label: 'Residential units' },
            { value: `${stats.walksCompleted}`, label: 'Survey walks done' },
            { value: `${stats.stationsInstalled} / ${plannedStations}`, label: 'Stations installed' },
          ].map(s => (
            <div key={s.label}>
              <p className="font-display text-3xl font-bold text-sage">{s.value}</p>
              <p className="text-xs text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The Plan ── */}
      <section className="section">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold mb-3">Here's the plan</h2>
          <p className="text-muted max-w-xl mx-auto">
            No lectures. No complaints. Just a simple, affordable, neighbor-run system
            that makes it easy to do the right thing.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map(s => (
            <div key={s.num} className="card flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${s.color}`}>
                  {s.icon}
                </span>
                <span className="font-display font-semibold text-sm text-muted">{s.num}</span>
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cost callout ── */}
      <section className="border-y border-rule bg-gold-light">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold mb-2">
              Total cost: <span className="text-gold-dark">~${totalCost}</span>
            </h2>
            <p className="text-muted text-sm max-w-md">
              That's less than $3 per household on our block. {plannedStations} bag stations × $
              {costPerStation} each, {plannedSigns} signs × ${costPerSignPack} each.
              Bag refills cost ~$12 every 3 months.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/donate" className="btn-gold">Support with Venmo →</Link>
            <Link href="/request" className="btn-outline">I want to help</Link>
          </div>
        </div>
      </section>

      {/* ── How you can help ── */}
      <section className="section">
        <h2 className="font-display text-3xl font-bold text-center mb-10">How you can help</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { icon: '🪧', title: 'Post a sign',       body: 'Want a free, friendly yard sign placed in your yard? Just say the word.', href: '/request' },
            { icon: '🐾', title: 'Host a station',    body: 'Have a spot by your sidewalk? We'll install and maintain the dispenser.', href: '/request' },
            { icon: '💛', title: 'Donate $3–10',      body: 'Scan the Venmo QR on the donate page. 100% goes to bags and signs.', href: '/donate' },
            { icon: '📢', title: 'Spread the word',   body: 'Share this site with a neighbor. The more who know, the better it works.', href: null },
          ].map(h => (
            <div key={h.title} className="card text-center flex flex-col items-center gap-3">
              <span className="text-3xl">{h.icon}</span>
              <h3 className="font-display font-semibold">{h.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{h.body}</p>
              {h.href && (
                <Link href={h.href} className="text-sm text-sage font-medium hover:underline mt-auto">
                  {h.title === 'Donate $3–10' ? 'Go to donate page →' : 'Sign up →'}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
