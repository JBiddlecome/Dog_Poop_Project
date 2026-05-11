#!/usr/bin/env node
// Merges a walk JSON file (exported from the phone app) into ../data/heatmap.json.
//
// Usage (run from the Dog_Poop_Project root or PoopSurvey/):
//   node PoopSurvey/scripts/merge-walk.js walk-2026-05-11.json
//
// The walk JSON must have shape:
//   { "walkDate": "2026-05-11", "counts": { "1": 0, "2": 2, ... } }
//
// After running: review the diff, then commit + push to deploy.

const fs = require('fs');
const path = require('path');

const walkFile = process.argv[2];
if (!walkFile) {
  console.error('Usage: node merge-walk.js <walk-file.json>');
  process.exit(1);
}

const walkPath = path.resolve(walkFile);
if (!fs.existsSync(walkPath)) {
  console.error(`File not found: ${walkPath}`);
  process.exit(1);
}

const heatmapPath = path.resolve(__dirname, '..', '..', 'data', 'heatmap.json');
if (!fs.existsSync(heatmapPath)) {
  console.error(`heatmap.json not found at ${heatmapPath}`);
  process.exit(1);
}

const walkData = JSON.parse(fs.readFileSync(walkPath, 'utf8'));
const heatmap = JSON.parse(fs.readFileSync(heatmapPath, 'utf8'));

const { walkDate, counts } = walkData;

if (!walkDate || !counts) {
  console.error('Walk JSON must have "walkDate" and "counts" fields.');
  process.exit(1);
}

// Prevent duplicate walk dates
if (heatmap.walks.includes(walkDate)) {
  console.error(`Walk date ${walkDate} already exists in heatmap.json. Aborting to prevent duplicates.`);
  process.exit(1);
}

// Append the new walk date
heatmap.walks.push(walkDate);
const newWalkIndex = heatmap.walks.length - 1;

let matched = 0;
let skipped = 0;

for (const addr of heatmap.addresses) {
  const countStr = String(addr.id);
  const count = counts[countStr] ?? 0;

  // Pad counts array if prior walks are missing (shouldn't happen, but be safe)
  while (addr.counts.length < newWalkIndex) {
    addr.counts.push(0);
  }
  addr.counts.push(count);

  if (counts[countStr] !== undefined) {
    matched++;
  } else {
    skipped++;
  }
}

const totalPoops = Object.values(counts).reduce((s, n) => s + n, 0);
console.log(`Walk date:    ${walkDate}`);
console.log(`Total poops:  ${totalPoops}`);
console.log(`Addresses:    ${matched} matched, ${skipped} not in walk data (set to 0)`);

// Write back
fs.writeFileSync(heatmapPath, JSON.stringify(heatmap, null, 2) + '\n', 'utf8');
console.log(`\nUpdated: ${heatmapPath}`);
console.log('Next steps:');
console.log('  1. git diff data/heatmap.json    # review changes');
console.log('  2. Update config.json → lastUpdated and stats.walksCompleted');
console.log('  3. git add data/heatmap.json data/config.json && git commit -m "Add walk ${walkDate}"');
console.log('  4. git push   # Render auto-deploys');
