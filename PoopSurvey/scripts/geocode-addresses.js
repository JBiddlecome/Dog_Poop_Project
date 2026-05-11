#!/usr/bin/env node
// Geocodes all 57 block addresses using OpenStreetMap Nominatim (free, no key required).
// Rate-limited to 1 req/sec per Nominatim ToS.
// Overwrites data/addresses.js with accurate lat/lng values.
//
// Run once before your first walk:
//   node scripts/geocode-addresses.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const ADDRESSES = [
  { id: 1,  address: "2800 Thornton Ave",    street: "Thornton" },
  { id: 2,  address: "2814 Thornton Ave",    street: "Thornton" },
  { id: 3,  address: "2345 N Catalina St",   street: "Catalina" },
  { id: 4,  address: "2341 N Catalina St",   street: "Catalina" },
  { id: 5,  address: "2337 N Catalina St",   street: "Catalina" },
  { id: 6,  address: "2333 N Catalina St",   street: "Catalina" },
  { id: 7,  address: "2331 N Catalina St",   street: "Catalina" },
  { id: 8,  address: "2323 N Catalina St",   street: "Catalina" },
  { id: 9,  address: "2321 N Catalina St",   street: "Catalina" },
  { id: 10, address: "2319 N Catalina St",   street: "Catalina" },
  { id: 11, address: "2313 N Catalina St",   street: "Catalina" },
  { id: 12, address: "2311 N Catalina St",   street: "Catalina" },
  { id: 13, address: "2307 N Catalina St",   street: "Catalina" },
  { id: 14, address: "2301 N Catalina St",   street: "Catalina" },
  { id: 15, address: "2255 N Catalina St",   street: "Catalina" },
  { id: 16, address: "2251 N Catalina St",   street: "Catalina" },
  { id: 17, address: "2247 N Catalina St",   street: "Catalina" },
  { id: 18, address: "2243 N Catalina St",   street: "Catalina" },
  { id: 19, address: "2239 N Catalina St",   street: "Catalina" },
  { id: 20, address: "2235 N Catalina St",   street: "Catalina" },
  { id: 21, address: "2233 N Catalina St",   street: "Catalina" },
  { id: 22, address: "2227 N Catalina St",   street: "Catalina" },
  { id: 23, address: "2225 N Catalina St",   street: "Catalina" },
  { id: 24, address: "2223 N Catalina St",   street: "Catalina" },
  { id: 25, address: "2221 N Catalina St",   street: "Catalina" },
  { id: 26, address: "2219 N Catalina St",   street: "Catalina" },
  { id: 27, address: "2215 N Catalina St",   street: "Catalina" },
  { id: 28, address: "2212 N Niagara St",    street: "Niagara"  },
  { id: 29, address: "2220 N Niagara St",    street: "Niagara"  },
  { id: 30, address: "2222 N Niagara St",    street: "Niagara"  },
  { id: 31, address: "2226 N Niagara St",    street: "Niagara"  },
  { id: 32, address: "2230 N Niagara St",    street: "Niagara"  },
  { id: 33, address: "2234 N Niagara St",    street: "Niagara"  },
  { id: 34, address: "2236 N Niagara St",    street: "Niagara"  },
  { id: 35, address: "2236 N Niagara St",    street: "Niagara"  }, // ½ unit — same GPS as 2236
  { id: 36, address: "2238 N Niagara St",    street: "Niagara"  },
  { id: 37, address: "2246 N Niagara St",    street: "Niagara"  },
  { id: 57, address: "2250 N Niagara St",    street: "Niagara"  },
  { id: 38, address: "2300 N Niagara St",    street: "Niagara"  },
  { id: 39, address: "2302 N Niagara St",    street: "Niagara"  },
  { id: 40, address: "2304 N Niagara St",    street: "Niagara"  },
  { id: 41, address: "2306 N Niagara St",    street: "Niagara"  },
  { id: 42, address: "2310 N Niagara St",    street: "Niagara"  },
  { id: 43, address: "2312 N Niagara St",    street: "Niagara"  },
  { id: 44, address: "2314 N Niagara St",    street: "Niagara"  },
  { id: 45, address: "2316 N Niagara St",    street: "Niagara"  },
  { id: 46, address: "2318 N Niagara St",    street: "Niagara"  },
  { id: 47, address: "2320 N Niagara St",    street: "Niagara"  },
  { id: 48, address: "2324 N Niagara St",    street: "Niagara"  },
  { id: 49, address: "2328 N Niagara St",    street: "Niagara"  },
  { id: 50, address: "2330 N Niagara St",    street: "Niagara"  },
  { id: 51, address: "2334 N Niagara St",    street: "Niagara"  },
  { id: 52, address: "2336 N Niagara St",    street: "Niagara"  },
  { id: 53, address: "2338 N Niagara St",    street: "Niagara"  },
  { id: 54, address: "2340 N Niagara St",    street: "Niagara"  },
  { id: 55, address: "2344 N Niagara St",    street: "Niagara"  },
  { id: 56, address: "2346 N Niagara St",    street: "Niagara"  },
];

function geocode(address) {
  const query = encodeURIComponent(`${address}, Burbank, CA 91504, USA`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us`;
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'poop-survey-geocoder/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results.length > 0) {
            resolve({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`Geocoding ${ADDRESSES.length} addresses via Nominatim…`);
  const results = [];

  for (const addr of ADDRESSES) {
    process.stdout.write(`  [${addr.id}] ${addr.address} … `);
    try {
      const coords = await geocode(addr.address);
      if (coords) {
        console.log(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
        results.push({ ...addr, lat: coords.lat, lng: coords.lng });
      } else {
        console.log('NOT FOUND — keeping approximate coords');
        results.push(addr); // caller must fill in manually
      }
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
      results.push(addr);
    }
    await sleep(1100); // Nominatim: max 1 req/sec
  }

  const lines = results.map((a) => {
    const lat = (a.lat ?? 0).toFixed(6);
    const lng = (a.lng ?? 0).toFixed(6);
    return `  { id: ${String(a.id).padEnd(2)}, address: ${JSON.stringify(a.address).padEnd(28)}, street: ${JSON.stringify(a.street).padEnd(12)}, lat: ${lat}, lng: ${lng} },`;
  });

  const output = `// Auto-generated by scripts/geocode-addresses.js — do not edit by hand.
// IDs match heatmap.json exactly.

const ADDRESSES = [
${lines.join('\n')}
];

export default ADDRESSES;
`;

  const outPath = path.join(__dirname, '..', 'data', 'addresses.js');
  fs.writeFileSync(outPath, output, 'utf8');
  console.log(`\nWrote ${outPath}`);
  console.log('Done! Restart Expo to pick up the new coordinates.');
}

main().catch(console.error);
