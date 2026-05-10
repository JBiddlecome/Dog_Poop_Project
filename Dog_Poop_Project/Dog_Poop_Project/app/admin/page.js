'use client';
import { useState } from 'react';

// Simple password-protected admin UI to submit new survey walk data.
// Data is POSTed to /api/admin which writes to data/heatmap.json.
// Requires ADMIN_PASSWORD env variable set in Render dashboard.

export default function AdminPage() {
  const [password, setPassword]   = useState('');
  const [authed,   setAuthed]     = useState(false);
  const [counts,   setCounts]     = useState({});
  const [walkDate, setWalkDate]   = useState(new Date().toISOString().split('T')[0]);
  const [addresses, setAddresses] = useState([]);
  const [status,   setStatus]     = useState('');
  const [loading,  setLoading]    = useState(false);

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'auth', password }),
    });
    const data = await res.json();
    if (data.ok) {
      setAuthed(true);
      setAddresses(data.addresses);
      // Init counts to 0
      const init = {};
      data.addresses.forEach(a => { init[a.id] = 0; });
      setCounts(init);
    } else {
      setStatus('Wrong password.');
    }
    setLoading(false);
  }

  async function submitWalk(e) {
    e.preventDefault();
    setLoading(true);
    const walkCounts = Object.entries(counts).map(([id, count]) => ({
      id: parseInt(id), count: parseInt(count) || 0,
    }));
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addWalk', password, date: walkDate, counts: walkCounts }),
    });
    const data = await res.json();
    setStatus(data.ok ? '✓ Walk saved! Push to GitHub to update the live site.' : `Error: ${data.error}`);
    setLoading(false);
  }

  if (!authed) {
    return (
      <div className="section max-w-sm">
        <h1 className="font-display text-2xl font-bold mb-6">Admin login</h1>
        <form onSubmit={login} className="card flex flex-col gap-4">
          <div>
            <label className="label">Password</label>
            <input type="password" value={password}
                   onChange={e => setPassword(e.target.value)}
                   className="input" required/>
          </div>
          {status && <p className="text-sm text-red-600">{status}</p>}
          <button type="submit" disabled={loading} className="btn-sage justify-center">
            {loading ? 'Checking…' : 'Log in →'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="section max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-2">Log a survey walk</h1>
      <p className="text-muted text-sm mb-6">
        Enter today's poop counts per address. Only record what you see — leave 0 for none.
      </p>

      <form onSubmit={submitWalk} className="flex flex-col gap-4">
        <div className="card">
          <label className="label">Walk date</label>
          <input type="date" value={walkDate}
                 onChange={e => setWalkDate(e.target.value)}
                 className="input max-w-xs"/>
        </div>

        {['Niagara', 'Catalina', 'Thornton'].map(street => {
          const group = addresses.filter(a => a.street === street);
          if (!group.length) return null;
          return (
            <div key={street} className="card">
              <p className="font-medium text-ink mb-3 text-sm">
                {street === 'Niagara' ? 'N Niagara St (west side)' :
                 street === 'Catalina' ? 'N Catalina St (east side)' : 'Thornton Ave'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {group.map(a => (
                  <div key={a.id}>
                    <label className="text-xs text-muted block mb-1 truncate">
                      {a.address.split(' ').slice(0,-3).join(' ')}
                    </label>
                    <input
                      type="number" min="0" max="20"
                      value={counts[a.id] ?? 0}
                      onChange={e => setCounts(p => ({ ...p, [a.id]: e.target.value }))}
                      className="input text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {status && (
          <p className={`text-sm px-3 py-2 rounded-lg ${
            status.startsWith('✓')
              ? 'bg-sage-light text-sage-dark'
              : 'bg-red-50 text-red-600'
          }`}>{status}</p>
        )}

        <button type="submit" disabled={loading} className="btn-sage justify-center self-start">
          {loading ? 'Saving…' : 'Save walk data →'}
        </button>
      </form>
    </div>
  );
}
