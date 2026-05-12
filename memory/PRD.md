# Laptopia — Coming Soon Landing

## Original problem statement
Create a landing page, just hero section, no logo, no heading, no footer, just attached video 100% width 100vh height, and heading on the left side of the screen "Laptopia", subheading "Gde tehnologija ponovo oživi. Uskoro." Use Fugaz One Google font for heading, and Sanchez for subheading.

## User choices
- Text color: rgba(0, 0, 0, 0.8)
- Text alignment: left
- Video behavior: autoplay + muted + loop (defaults)

## Architecture
- Frontend only (React + Tailwind, FastAPI/Mongo untouched)
- Files: `frontend/src/App.js`, `frontend/src/App.css`, `frontend/public/index.html`
- Video served from provided CDN URL
- Google Fonts: Fugaz One (heading), Sanchez (subheading)

## Implemented (2026-05-12)
- Full-bleed (100vw × 100vh) background video, object-fit cover
- Hero text block left-aligned, vertically centered
- Responsive type via `clamp()`
- `data-testid` on hero, video, title, subtitle

## Backlog / P1
- Email capture for launch notifications
- Add Laptopia favicon + social meta (OG image)
- Light analytics goal (notify-me click)
