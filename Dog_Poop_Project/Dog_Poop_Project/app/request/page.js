'use client';
import { useState } from 'react';
import config from '@/data/config.json';

const FORMSPREE_URL = `https://formspree.io/f/${config.formspreeId}`;

const interests = [
  { value: 'sign',      label: '🪧 I want a free yard sign placed in my yard' },
  { value: 'station',   label: '🐾 I want a bag station hosted near my sidewalk' },
  { value: 'volunteer', label: '🤝 I want to help with walks or distribution' },
  { value: 'donate',    label: '💛 I already donated / I plan to donate' },
  { value: 'other',     label: '💬 Something else (see notes)' },
];

export default function RequestPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [selected,  setSelected]  = useState([]);

  function toggle(val) {
    setSelected(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.target);
    fd.append('interests', selected.join(', '));
    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        body: fd,
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError('Something went wrong. Please try again or email us directly.');
      }
    } catch {
      setError('Network error — please try again.');
    }
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="section max-w-lg text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="font-display text-3xl font-bold mb-3">You're in!</h1>
        <p className="text-muted leading-relaxed">
          Thanks for getting involved. Your neighbor will be in touch within a few days
          to follow up on your request. Welcome to the team!
        </p>
        <a href="/" className="btn-sage mt-6 inline-flex">Back to home →</a>
      </div>
    );
  }

  return (
    <div className="section max-w-2xl">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold mb-3">Get involved</h1>
        <p className="text-muted leading-relaxed">
          No pressure, no commitment. Just let us know what you're interested in and
          your neighbor will follow up. Takes 60 seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-6">

        {/* Interest checkboxes */}
        <div>
          <label className="label">I'm interested in (select all that apply)</label>
          <div className="flex flex-col gap-2 mt-2">
            {interests.map(opt => (
              <label key={opt.value}
                     className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className="w-4 h-4 rounded border-rule accent-sage"
                />
                <span className="text-sm text-ink group-hover:text-sage transition-colors">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input id="name" name="name" type="text" required
                 placeholder="First name is fine"
                 className="input"/>
        </div>

        {/* Address */}
        <div>
          <label className="label" htmlFor="address">Your address on the block</label>
          <input id="address" name="address" type="text" required
                 placeholder="e.g. 2234 N Niagara St"
                 className="input"/>
          <p className="text-xs text-muted mt-1">
            So we know where to drop a sign or install a station.
          </p>
        </div>

        {/* Contact */}
        <div>
          <label className="label" htmlFor="contact">Best way to reach you (optional)</label>
          <input id="contact" name="contact" type="text"
                 placeholder="Email or phone — whatever you prefer"
                 className="input"/>
        </div>

        {/* Notes */}
        <div>
          <label className="label" htmlFor="notes">Any notes or questions?</label>
          <textarea id="notes" name="notes" rows={3}
                    placeholder="Anything you'd like us to know..."
                    className="input resize-none"/>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button type="submit" disabled={loading || selected.length === 0}
                className="btn-sage justify-center disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Submitting…' : 'Send →'}
        </button>

        <p className="text-xs text-muted text-center">
          Your info goes only to your neighbor running this project.
          Nothing is sold or shared.
        </p>
      </form>
    </div>
  );
}
