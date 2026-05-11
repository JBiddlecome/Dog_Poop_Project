# Poop Survey — Android App

Walk your block, tap a button, count the poops. GPS auto-selects the nearest address.

## First-time setup

```bash
cd PoopSurvey
npm install
```

Install **Expo Go** on your Android phone from the Play Store.

## Before your first walk — geocode addresses

The app ships with approximate GPS coordinates. Run this once to get accurate ones:

```bash
node scripts/geocode-addresses.js
```

Takes ~1 minute (rate-limited to 1 req/sec). Overwrites `data/addresses.js` with real coordinates. Restart Expo after.

## Running the app

```bash
npx expo start --android
```

Scan the QR code with Expo Go. The app will load on your phone.

## Workflow

1. **Start Walk** — tap "Start Walk" (defaults to today's date)
2. **Survey** — GPS picks the nearest address as you walk. Tap **+** for each poop you see, or type a number and tap **Set**. Tap the address name to manually override.
3. **End Walk** — tap "End" in the top-right corner
4. **Export** — tap "Copy JSON" or "Share File" to get the walk data off your phone

## Merging walk data into the website

After your walk, get the JSON onto your laptop (email it, AirDrop it, paste from clipboard), then:

```bash
# From the Dog_Poop_Project root:
node PoopSurvey/scripts/merge-walk.js /path/to/walk-2026-05-11.json
```

Then review and push:

```bash
git diff data/heatmap.json
# also update config.json → lastUpdated and stats.walksCompleted
git add data/heatmap.json data/config.json
git commit -m "Add walk 2026-05-11"
git push
```

Render auto-deploys. The heat map updates live.

## Files

```
PoopSurvey/
├── App.js                        simple state-machine navigation
├── screens/
│   ├── StartWalk.js              date picker + start/resume
│   ├── Survey.js                 GPS counter UI (main screen)
│   └── Summary.js                review + export
├── data/
│   └── addresses.js              all 57 addresses with lat/lng
├── utils/
│   ├── haversine.js              distance calculation
│   ├── nearest.js                find closest address to GPS position
│   └── storage.js                AsyncStorage helpers
└── scripts/
    ├── geocode-addresses.js      one-time geocoding (run on laptop)
    └── merge-walk.js             merge exported walk into heatmap.json
```
