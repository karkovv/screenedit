# ScreenEdit

Edit and style screenshots and images online. Upload, crop, add background, shadows, rounded corners, text overlays — then download PNG/JPEG/WebP or copy to clipboard.

**→ https://screenedit.online**

## Features

### Image styling
- **Drag & drop**, click upload, or **Ctrl+V** paste (max 50 MB)
- **Crop** with rule-of-thirds overlay
- **Background**: Solid color, Gradient (angle + two-color pickers), or Transparent
- Custom **canvas size**, border radius (bg + image), **shadow** (offset, blur, spread, opacity, color)
- 9 **image position** presets (grid 3×3), image size slider (10–100%)

### Text overlays
- Add text — drag it anywhere, resize and rotate with handles
- **21 fonts**: Inter, Open Sans, Lato, Roboto, Montserrat, Nunito, Poppins, Ubuntu, Playfair Display, Fira Code, Space Grotesk, DM Sans, Bebas Neue + system fonts (Arial, Verdana, Georgia…)
- **Weight** (100–900), **italic**, font size (8–400 px), custom color
- **Rotation** with dedicated handle — hold **Shift** for 45° snap
- 8 **resize handles** (edges + corners) — proportional scaling
- **Text shadow**: toggle, offset X/Y, blur, opacity, color (same controls as image shadow)
- **Shift + drag** locks movement to horizontal or vertical axis

### Export & UX
- Download: **PNG**, **JPEG**, **WebP**
- **Copy to clipboard** (desktop)
- **Undo / Redo** (Ctrl+Z / Ctrl+Shift+Z) — works across crop, delete, settings
- EN / RU interface (auto-detected from browser)
- Dark theme by default, toggle to light
- **Donation** popup with QR code
- `/privacy` page (GDPR, Google Fonts, Vercel)
- All processing in browser — nothing leaves your machine

## Tech stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS 4 + motion (animations)
- Canvas API — export rendering
- react-image-crop, Lucide React, react-router v7
- @uiw/react-color-sketch

## Run locally

```bash
npm install
npm run dev
```
