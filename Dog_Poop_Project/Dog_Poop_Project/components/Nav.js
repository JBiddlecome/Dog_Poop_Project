'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import clsx from 'clsx';

const links = [
  { href: '/',        label: 'Home'    },
  { href: '/map',     label: 'Heat Map' },
  { href: '/donate',  label: 'Donate'  },
  { href: '/request', label: 'Get Involved' },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur border-b border-rule">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-display font-semibold text-lg text-ink hover:text-sage transition-colors">
          🐾 Our Block
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'text-sm font-medium transition-colors',
                path === l.href
                  ? 'text-sage border-b-2 border-sage pb-0.5'
                  : 'text-muted hover:text-ink'
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/donate" className="btn-sage py-1.5 px-4 text-xs">
            Donate via Venmo
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-ink p-1"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"
               viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-rule bg-cream px-6 py-4 flex flex-col gap-4">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={clsx(
                'text-sm font-medium',
                path === l.href ? 'text-sage' : 'text-muted'
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/donate" className="btn-sage self-start" onClick={() => setOpen(false)}>
            Donate via Venmo
          </Link>
        </div>
      )}
    </header>
  );
}
