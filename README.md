# Dot Labs | Creative Agency (Cloned)

A 1:1, pixel-perfect clone of [Dot Labs](https://dotlabsupdated.framer.website/).

## Features Included
- **Full Design Fidelity**: 1:1 match of all fonts, layouts, color palettes, and typographic scales (Geist, Syne, Roboto Condensed, and Inter).
- **All High-Resolution Assets & Media**: 195+ local assets (~146 MB) downloaded locally into `/assets/`, including all project photography, background videos (`.mp4`), icons, and vector graphics.
- **Complete Interactive Animations**:
  - Interactive "Hello There" intro preloader & curtain reveal
  - Interactive WebGL/Canvas gradient waves and custom shaders
  - Scroll-triggered parallax media transitions and reveal effects
  - Lenis smooth scroll styling
  - Dynamic navbar (`dot.labs`, `— Menu`, `● Let's talk`)
- **All Pages & Routes**:
  - Home (`/` or `index.html`)
  - Works showcase (`/works` or `works.html`)
  - About studio (`/about` or `about.html`)
  - Contact page (`/contact` or `contact.html`)
  - Thank You confirmation (`/thank-you` or `thank-you.html`)
  - CMS Work Detail pages (`/works/36ixtybooths`, `/works/pai-creator-summit`, `/works/pai-convention-hall`, `/works/mystoria-agency`, `/works/ayunurt`, `/works/skmei`, `/works/aicjklu`)
- **Unbranded & Clean**: Remote telemetry and "Made in Framer" watermark badges disabled and stubbed for a clean, private agency deployment.
- **Local Dev Server**: Built-in HTTP server (`server.js`) with support for video streaming (HTTP 206 range requests), MIME type negotiation, and clean extension-less routing.

## Quick Start

### 1. Run the local development server
```bash
npm run dev
# or
npm start
# or
node server.js
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
```text
├── index.html              # Home page
├── works.html              # Curated works portfolio
├── about.html              # Studio story & capabilities
├── contact.html            # Contact & inquiry page
├── thank-you.html          # Submission confirmation
├── works/                  # Project detail pages (CMS)
│   ├── 36ixtybooths.html
│   ├── pai-creator-summit.html
│   ├── pai-convention-hall.html
│   ├── mystoria-agency.html
│   ├── ayunurt.html
│   ├── skmei.html
│   └── aicjklu.html
├── assets/                 # All offline media and bundles
│   ├── images/             # All project imagery & photography
│   ├── assets/             # Ambient loop background videos (.mp4)
│   ├── fonts/              # Custom web fonts (Geist, Syne, Roboto)
│   ├── css/                # Lenis smooth scroll & typography styles
│   ├── sites/              # Interactive animation & runtime chunks
│   ├── cms/                # Offline CMS content data
│   └── js/                 # Local tracking & badge shims
├── server.js               # Dev server with route handling & video streaming
└── package.json            # NPM scripts
```
