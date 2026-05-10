# CLAUDE.md — Dog Poop Project

This file gives Claude Code full context on the project. Read it entirely before making any changes.

---

## Project overview

This is a **Next.js 14 website** for a neighbor-led dog waste cleanup campaign in Burbank, CA. A single neighbor (the project owner) is running it voluntarily — no HOA, no city budget. The goal is to:

1. Make neighbors aware of the problem through friendly (non-accusatory) outreach
2. Install free bag dispensers at key corners of the block
3. Track improvement over time via a public heat map updated after each survey walk
4. Collect neighbor sign-ups for yard signs and hosted bag stations via a form

The tone of **everything** — code comments, copy, UI text — should be warm, community-first, and non-judgmental. Never guilt-trip. Always neighbor-helping-neighbor.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack in one repo; API routes for admin |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Fonts | Fraunces (display) + DM Sans (body) via Google Fonts | Warm, editorial feel |
| Forms | Formspree | Zero-backend form handling |
| Data | JSON files in `/data/` | No database needed; update by editing + pushing |
| Hosting | Render (free tier, Web Service) | Simple Node deployment |
| Auth | Single env-var password (`ADMIN_PASSWORD`) | Low-tech, sufficient for one-person admin |

**No database.** All data lives in `data/heatmap.json` and `data/config.json`. The admin page writes to `heatmap.json` via the `/api/admin` route. To persist changes permanently, the updated JSON must be committed and pushed to GitHub (Render auto-deploys from `main`).

---

## Project structure

```
Dog_Poop_Project/
├── CLAUDE.md                  ← you are here
├── README.md                  ← setup instructions for humans
├── package.json
├── next.config.mjs
├── tailwind.config.js
├── postcss.config.js
├── render.yaml                ← Render deployment config
├── .env.example               ← copy to .env.local for dev
├── .gitignore
│
├── public/
│   ├── block-map.png          ← Google Maps screenshot of Block 1 (uploaded by owner)
│   └── venmo-qr.png           ← (TODO: owner must add this)
│
├── data/
│   ├── config.json            ← site-wide settings (Venmo, stats, costs)
│   └── heatmap.json           ← all 56 addresses + per-walk poop counts
│
├── app/                       ← Next.js App Router
│   ├── layout.js              ← root layout: fonts, Nav, Footer
│   ├── globals.css            ← Tailwind base + component classes
│   ├── page.js                ← Home page
│   ├── map/page.js            ← Heat map page
│   ├── donate/page.js         ← Donate/Venmo page
│   ├── request/page.js        ← Neighbor sign-up form (client component)
│   ├── admin/page.js          ← Password-protected walk data entry (client component)
│   └── api/
│       └── admin/route.js     ← POST handler: auth + addWalk actions
│
└── components/
    ├── Nav.js                 ← Sticky nav with mobile hamburger
    ├── Footer.js              ← Site footer with links + Venmo handle
    └── BlockHeatMap.js        ← SVG heat map of the block (client component)
```

---

## Color palette

Always use these — they're defined in `tailwind.config.js` and must stay consistent.

| Name | Hex | Use |
|---|---|---|
| `cream` | `#FAF8F3` | Page background |
| `ink` | `#1E1D1A` | Primary text, headings |
| `sage` | `#4A7C59` | Primary green — CTAs, success, Niagara side |
| `sage-light` | `#D4E8DA` | Light green fills, callout backgrounds |
| `sage-dark` | `#2E5438` | Hover states, dark green text |
| `gold` | `#C8973A` | Accent amber — donations, cost callouts |
| `gold-light` | `#FDF3E0` | Light amber fills |
| `gold-dark` | `#8A6220` | Dark amber text |
| `mauve` | `#7A6B8A` | Secondary — map borders, Catalina side |
| `mauve-light` | `#EDE9F3` | Light mauve fills |
| `muted` | `#888780` | Secondary text, labels |
| `rule` | `#D4CFC5` | Borders, dividers |

**Never** use raw hex values in components. Always use Tailwind color classes from this palette.

---

## Data schemas

### `data/config.json`

```json
{
  "siteName": "Our Block",
  "tagline": "...",
  "blockName": "Block 1",
  "streets": ["N Niagara St", "N Catalina St", "Thornton Ave"],
  "bounds": { "north": "Thornton Ave", "south": "Empire Ave", "west": "N Niagara St", "east": "N Catalina St" },
  "city": "Burbank, CA 91504",
  "venmoHandle": "@ThorntonBlock1",        // UPDATE: owner's real Venmo handle
  "venmoUrl": "https://venmo.com/...",     // UPDATE: real Venmo URL
  "websiteUrl": "https://...",             // UPDATE: real Render URL after deploy
  "formspreeId": "YOUR_FORMSPREE_ID",      // UPDATE: from formspree.io dashboard
  "plannedStations": 5,
  "costPerStation": 35,
  "plannedSigns": 10,
  "costPerSignPack": 15,
  "lastUpdated": "YYYY-MM-DD",            // UPDATE: after each data entry
  "stats": {
    "totalAddresses": 56,
    "estimatedUnits": 100,
    "walksCompleted": 0,                  // INCREMENT: after each walk
    "stationsInstalled": 0,               // INCREMENT: as stations go up
    "signsPosted": 0                      // INCREMENT: as signs are placed
  }
}
```

### `data/heatmap.json`

```json
{
  "walks": ["2025-05-15", "2025-05-22"],   // ISO date strings, one per walk
  "addresses": [
    {
      "id": 1,
      "address": "2800 Thornton Ave",
      "street": "Thornton",               // "Thornton" | "Catalina" | "Niagara"
      "units": 3,                         // estimated residential units
      "confirmed": true,                  // true = units verified from public records
      "counts": [2, 1],                   // one integer per walk; index matches walks[]
      "note": "optional note"             // optional
    }
  ]
}
```

**Heat map color scale** (defined in `BlockHeatMap.js`):

| Average count | Color | Label |
|---|---|---|
| 0 / no data | `#F1EFE8` gray | None |
| < 1 | `#FDF3E0` pale amber | Rare |
| 1–2 | `#FAC775` amber | Low |
| 3–5 | `#EF9F27` orange | Medium |
| 5–6 | `#D85A30` dark orange | High |
| 6+ | `#A32D2D` red | Hot spot |

---

## The block — all 56 addresses

Block 1 is bounded by **Thornton Ave (N)**, **Empire Ave (S)**, **N Niagara St (W)**, **N Catalina St (E)**. The Catalina Activity Center is inside the block interior.

### Thornton Ave (2 addresses — north end)
| Address | Units | Confirmed |
|---|---|---|
| 2800 Thornton Ave | 3 | ✓ |
| 2814 Thornton Ave | 1 (est.) | |

### N Catalina St (25 addresses — east sidewalk, faces east)
| Address | Units | Notes |
|---|---|---|
| 2345 N Catalina St | 1 | ✓ |
| 2341 N Catalina St B | ~2 | Likely duplex |
| 2337 N Catalina St | 1 | ✓ SFH |
| 2333 N Catalina St | 1 | ✓ SFH |
| 2331 N Catalina St | 1 (est.) | |
| 2323 N Catalina St | 8+ | ✓ Part of 2321–2323 complex |
| 2321 N Catalina St | 0 | Same complex as 2323; counted there |
| 2319 N Catalina St | 1 (est.) | |
| 2313 N Catalina St | 1 (est.) | |
| 2311 N Catalina St | 1 (est.) | |
| 2307 N Catalina St | 1 (est.) | |
| 2301 N Catalina St | ~2 (est.) | |
| 2255 N Catalina St | 1 (est.) | |
| 2251 N Catalina St | ~2 (est.) | Listed twice — likely duplex |
| 2247 N Catalina St | 1 (est.) | |
| 2243 N Catalina St | 1 (est.) | |
| 2239 N Catalina St | 6 | ✓ Multi-family |
| 2235 N Catalina St | 1 (est.) | |
| 2233 N Catalina St | 1 | ✓ SFH |
| 2227 N Catalina St | 1 (est.) | |
| 2225 N Catalina St | 1 (est.) | |
| **2223 N Catalina St** | **20** | ✓ **Apartment building — contact property manager** |
| 2221 N Catalina St | 1 (est.) | |
| 2219 N Catalina St | 1 (est.) | |
| 2215 N Catalina St | 1 (est.) | |

### N Niagara St (29 addresses — west sidewalk, faces west)
| Address | Units | Notes |
|---|---|---|
| 2212 N Niagara St | 1 (est.) | |
| 2220 N Niagara St | 4 | ✓ 4-plex |
| 2222 N Niagara St | 1 (est.) | |
| 2226 N Niagara St | 1 | ✓ SFH |
| 2230 N Niagara St | 1 (est.) | |
| 2234 N Niagara St | 1 (est.) | |
| 2236 N Niagara St | ~2 (est.) | Has ½ address next door — likely duplex |
| 2236½ N Niagara St | 0 | Counted with 2236 |
| 2238 N Niagara St | 1 (est.) | |
| 2246 N Niagara St | 1 (est.) | |
| 2300 N Niagara St | 1 (est.) | |
| 2302 N Niagara St | 1 (est.) | |
| 2304 N Niagara St | 3 | ✓ Multi-family |
| 2306 N Niagara St | 1 (est.) | |
| 2310 N Niagara St | 1 (est.) | |
| 2312 N Niagara St | 1 (est.) | |
| 2314 N Niagara St | 1 (est.) | |
| 2316 N Niagara St | 1 (est.) | |
| 2318 N Niagara St | 1 (est.) | |
| 2320 N Niagara St | 1 (est.) | |
| 2324 N Niagara St | 1 (est.) | |
| 2328 N Niagara St | 1 (est.) | |
| 2330 N Niagara St | 1 (est.) | |
| 2334 N Niagara St | 1 (est.) | |
| 2336 N Niagara St | 1 (est.) | |
| 2338 N Niagara St | 1 (est.) | |
| 2340 N Niagara St | ~3 (est.) | ~6 beds / 4 baths |
| 2344 N Niagara St | ~4 (est.) | ~11 beds / 4 baths |
| 2346 N Niagara St | 1 (est.) | |

---

## What's built

- [x] Full Next.js App Router project structure
- [x] Tailwind CSS with custom palette + component classes
- [x] Sticky responsive nav (desktop + mobile hamburger)
- [x] Footer with Venmo link and block info
- [x] **Home page** — hero with block map image, stats bar, plan cards, cost callout, help cards
- [x] **Heat map page** — SVG block visualization with color-coded address rows, click-to-detail tooltip, survey summary, hot spots list
- [x] **Donate page** — Venmo link card (QR placeholder), line-item cost table, project promise list
- [x] **Request page** — multi-checkbox interest form via Formspree
- [x] **Admin page** — password-gated walk data entry form (grouped by street)
- [x] `/api/admin` route — handles auth + addWalk actions, writes to `heatmap.json`
- [x] All 56 addresses seeded in `heatmap.json` with confirmed unit counts
- [x] `render.yaml` for one-click Render deployment
- [x] Block map image in `/public/block-map.png`

---

## What still needs to be done

These are known TODOs. When the owner asks you to work on them, these are the specs:

### High priority
- [ ] **Real Venmo QR** — owner adds `public/venmo-qr.png`; update `app/donate/page.js` to render it via `<Image src="/venmo-qr.png"/>`
- [ ] **Formspree ID** — owner creates account at formspree.io, updates `config.json → formspreeId`
- [ ] **Real Venmo handle + URL** — update `config.json`
- [ ] **Real site URL** — update `config.json → websiteUrl` after Render deploy; regenerate flyer QR codes

### Nice to have
- [ ] **Progress tracker on donate page** — a simple fundraising bar showing dollars raised vs. goal. Requires owner to manually update a `raised` field in `config.json`
- [ ] **Station map overlay** — mark planned/installed bag station locations on the heat map SVG (4 corners + 2 mid-block)
- [ ] **Before/after chart** — a simple Chart.js line chart on the map page showing total weekly poop count over time (aggregate of all addresses per walk date)
- [ ] **Email admin notifications** — when a new /request form is submitted, send a notification email. Can use Formspree's built-in email delivery — no code change needed
- [ ] **OG image** — add a custom `opengraph-image.js` in `app/` so the site previews nicely when shared on Nextdoor or iMessage
- [ ] **Neighbor testimonials section** — once a few neighbors engage, add a simple static testimonials section to the home page
- [ ] **Mobile heat map improvements** — the SVG currently renders with small text on narrow screens; consider a list-based fallback for screens under 480px

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ADMIN_PASSWORD` | Yes | Password for `/admin` page. Set in Render dashboard. |
| `NODE_ENV` | Auto | Set to `production` by Render automatically |

Never commit `.env.local` to git. The `.env.example` file shows the template.

---

## How to add a new survey walk

**Via admin UI (preferred):**
1. Go to `/admin` → enter password
2. Select walk date, enter counts per address
3. Hit "Save walk data"
4. Git pull the updated `data/heatmap.json`, commit, push → Render auto-deploys

**Via JSON directly:**
1. Open `data/heatmap.json`
2. Add the date string to `walks[]`
3. For each address in `addresses[]`, append the count (integer) to its `counts[]` array
4. The index must match — `walks[0]` corresponds to `counts[0]` for every address
5. Update `config.json → lastUpdated` and `stats.walksCompleted`
6. Commit and push

---

## Render deployment notes

- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- **Node version:** 18+
- **Port:** Next.js reads `$PORT` automatically via `"start": "next start -p $PORT"` in `package.json`
- The free Render tier spins down after inactivity — first load after sleep takes ~30s. This is fine for a low-traffic neighbor site.
- Because Render's filesystem is ephemeral, `/api/admin` writes to `data/heatmap.json` at runtime. **Those writes do not persist across deploys or restarts.** Always commit the updated JSON to GitHub immediately after using the admin UI.

---

## Design principles — always follow these

1. **Warm tone.** Every label, button, and message should feel like it was written by a friendly neighbor, not a government agency.
2. **No guilt.** Never imply dog owners are bad people. Frame everything as making it *easier* to do the right thing.
3. **Transparency.** The heat map, donation totals, and project stats are all public. No secrets.
4. **Mobile-first.** Most neighbors will view this on a phone after getting the flyer. Every page must work well on a 390px screen.
5. **Low maintenance.** The owner is a single person doing this voluntarily. Every feature should be as simple as possible to operate. When in doubt, simpler wins.
6. **Consistent palette.** Always use the Tailwind color classes from `tailwind.config.js`. No hardcoded hex values in components.

---

## Key files to read before making changes

| Task | Read first |
|---|---|
| Changing the heat map visualization | `components/BlockHeatMap.js` |
| Adding a new page | `app/layout.js`, `components/Nav.js` |
| Changing site-wide copy or settings | `data/config.json` |
| Adding/editing address data | `data/heatmap.json` |
| Changing the color scheme | `tailwind.config.js`, `app/globals.css` |
| Modifying the admin walk-entry | `app/admin/page.js`, `app/api/admin/route.js` |
| Updating the request form | `app/request/page.js` (uses Formspree) |
