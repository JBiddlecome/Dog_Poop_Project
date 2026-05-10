import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'heatmap.json');

function readData() {
  return JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
}

function writeData(data) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(req) {
  const body = await req.json();
  const { action, password } = body;

  // Validate password
  const adminPw = process.env.ADMIN_PASSWORD;
  if (!adminPw || password !== adminPw) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (action === 'auth') {
    const data = readData();
    return NextResponse.json({ ok: true, addresses: data.addresses });
  }

  if (action === 'addWalk') {
    const { date, counts } = body;
    if (!date || !Array.isArray(counts)) {
      return NextResponse.json({ ok: false, error: 'Missing date or counts' }, { status: 400 });
    }
    try {
      const data = readData();
      // Add walk date to walks array
      data.walks = data.walks || [];
      if (!data.walks.includes(date)) data.walks.push(date);
      // Append each count to the address's counts array
      const walkIndex = data.walks.indexOf(date);
      data.addresses = data.addresses.map(addr => {
        const entry = counts.find(c => c.id === addr.id);
        const count = entry ? entry.count : 0;
        // Ensure counts array is long enough
        while (addr.counts.length < data.walks.length - 1) addr.counts.push(0);
        addr.counts[walkIndex] = count;
        return addr;
      });
      writeData(data);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
}
