import Link from 'next/link';
import config from '@/data/config.json';

export default function Footer() {
  return (
    <footer className="border-t border-rule bg-cream mt-16">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-6 text-sm text-muted">
        <div>
          <p className="font-display font-semibold text-ink text-base mb-1">🐾 Our Block</p>
          <p>N Niagara St · N Catalina St · Thornton to Empire</p>
          <p>{config.city}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-medium text-ink">Links</p>
          <Link href="/map"     className="hover:text-sage transition-colors">Heat Map</Link>
          <Link href="/donate"  className="hover:text-sage transition-colors">Donate</Link>
          <Link href="/request" className="hover:text-sage transition-colors">Get Involved</Link>
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-medium text-ink">This project</p>
          <p>100% neighbor-funded</p>
          <p>No HOA · No city budget</p>
          <a href={config.venmoUrl} target="_blank" rel="noopener noreferrer"
             className="text-sage hover:underline">{config.venmoHandle}</a>
        </div>
      </div>
      <div className="border-t border-rule py-3 text-center text-xs text-muted">
        Volunteer-run · Last updated {config.lastUpdated} · Data collected by your neighbor
      </div>
    </footer>
  );
}
