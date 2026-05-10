# 🐾 Our Block — Block 1 Dog Waste Initiative

Neighbor-led website for the Thornton/Niagara/Catalina block in Burbank, CA.

## Pages

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/` | Project overview, stats, CTAs |
| Heat Map | `/map` | Live block map with poop count data |
| Donate | `/donate` | Venmo link + cost breakdown |
| Get Involved | `/request` | Neighbor sign-up form |
| Admin | `/admin` | Password-protected survey data entry |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/Dog_Poop_Project.git
cd Dog_Poop_Project
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Edit .env.local and set ADMIN_PASSWORD to something strong
```

### 3. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## Deploying to Render

1. Push your repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your `Dog_Poop_Project` GitHub repo
4. Set the build command: `npm install && npm run build`
5. Set the start command: `npm start`
6. Add environment variable: `ADMIN_PASSWORD` = your chosen password
7. Deploy!

Render will auto-deploy every time you push to `main`.

---

## Updating the heat map

### Option A — Admin UI (easiest)
1. Go to `https://your-site.onrender.com/admin`
2. Enter your admin password
3. Fill in today's poop counts per address
4. Hit "Save walk data"
5. Git commit `data/heatmap.json` and push → Render auto-deploys

### Option B — Edit JSON directly
Open `data/heatmap.json` and update the `counts` array for each address.
Each position in the array corresponds to a walk in the `walks` array.

---

## Updating site config

Edit `data/config.json` to change:
- `venmoHandle` and `venmoUrl` — your actual Venmo
- `lastUpdated` — update after each data entry
- `stats.walksCompleted`, `stationsInstalled`, `signsPosted` — track progress

---

## Setting up the contact form (Formspree)

1. Go to [formspree.io](https://formspree.io) → create a free account
2. Create a new form → copy the form ID (looks like `xabcdefg`)
3. Update `formspreeId` in `data/config.json`
4. Form submissions go to your email

---

## Adding your block map image

Copy your block map image to `public/block-map.png`.
The home page hero will display it automatically.

---

## Adding your Venmo QR code

1. Open Venmo → your profile → Share → QR code → Save image
2. Copy the image to `public/venmo-qr.png`
3. Update `app/donate/page.js` to use `<Image src="/venmo-qr.png" .../>`

---

## Tech stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Formspree** (contact form)
- **Render** (hosting)
- **JSON files** (data storage — no database needed)
