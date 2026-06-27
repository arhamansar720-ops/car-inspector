# Inspector — AI Car Listing Analyzer

Paste a cars.com URL, dealer listing URL, or 17-character VIN and get:

1. **AI defect report** — Claude reads the listing photos and flags panel gaps, paint mismatch, rust, dents, interior wear, etc.
2. **Reference 3D model** — interactive Three.js viewer (generic shape by body type, color-tinted to match the listing)
3. **Advisor chat** — ask anything about the listing; Claude gives blunt buy advice
4. **Cosmetic customize** — swap paint color and wheel finish on the 3D model (preview only)

## Deploy to Vercel

1. Upload this folder to a new GitHub repo
2. Import the repo at vercel.com/new
3. Add environment variable: `ANTHROPIC_API_KEY` = your key from console.anthropic.com
4. Deploy — Vercel picks up `vercel.json` automatically

## Local dev

```bash
cp .env.local.example .env.local
# fill in ANTHROPIC_API_KEY
npm install --legacy-peer-deps
npm run dev
```

## Notes

- No database — inspections are stored in `localStorage` (last 10)
- No Carfax/AutoCheck — full history requires a paid partner API (VinAudit). Flagged in the UI.
- The 3D viewer shows a **generic reference model**, not a reconstruction of the photographed vehicle
- AI defect detection is best-effort from photos — always inspect in person
