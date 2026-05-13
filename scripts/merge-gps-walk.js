#!/usr/bin/env node
// Merges a GPS walk JSON (exported from the Android app) into data/walks.json.
//
// Usage (run from the Dog_Poop_Project root):
//   node scripts/merge-gps-walk.js PoopSurvey/scripts/walk-2026-05-13.json
//
// The walk JSON must have the shape the Android app exports:
//   { "walkDate": "2026-05-13", "locations": [{ "address", "lat", "lng", "count" }] }
//
// After running: review the diff, then commit + push to deploy.

const fs   = require('fs');
const path = require('path');

const walkFile = process.argv[2];
if (!walkFile) {
  console.error('Usage: node scripts/merge-gps-walk.js <walk-file.json>');
  process.exit(1);
}

const walkPath = path.resolve(walkFile);
if (!fs.existsSync(walkPath)) {
  console.error(`File not found: ${walkPath}`);
  process.exit(1);
}

const walksPath = path.resolve(__dirname, '..', 'data', 'walks.json');
if (!fs.existsSync(walksPath)) {
  console.error(`walks.json not found at ${walksPath}`);
  process.exit(1);
}

const walkData  = JSON.parse(fs.readFileSync(walkPath, 'utf8'));
const walksFile = JSON.parse(fs.readFileSync(walksPath, 'utf8'));

const { walkDate, locations } = walkData;

if (!walkDate || !Array.isArray(locations)) {
  console.error('Walk JSON must have "walkDate" and "locations" array fields.');
  process.exit(1);
}

if (locations.some(l => l.lat == null || l.lng == null)) {
  console.error('Every location must have lat and lng coordinates.');
  process.exit(1);
}

// Prevent duplicate walk dates
if (walksFile.walks.some(w => w.date === walkDate)) {
  console.error(`Walk date ${walkDate} already exists in walks.json. Aborting to prevent duplicates.`);
  process.exit(1);
}

walksFile.walks.push({ date: walkDate, locations });

const totalPoops  = locations.reduce((s, l) => s + l.count, 0);
const topLocation = [...locations].sort((a, b) => b.count - a.count)[0];

console.log(`Walk date:    ${walkDate}`);
console.log(`Locations:    ${locations.length}`);
console.log(`Total poops:  ${totalPoops}`);
if (topLocation) {
  console.log(`Top spot:     ${topLocation.address} (${topLocation.count})`);
}

fs.writeFileSync(walksPath, JSON.stringify(walksFile, null, 2) + '\n', 'utf8');
console.log(`\nUpdated: ${walksPath}`);
console.log('Next steps:');
console.log('  1. git diff data/walks.json');
console.log(`  2. git add data/walks.json && git commit -m "Add walk ${walkDate}"`);
console.log('  3. git push   # Render auto-deploys');
