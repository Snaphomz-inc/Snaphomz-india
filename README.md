# Snaphomz India

Landing page for the India launch of Snaphomz — built with React + Vite.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- npm (ships with Node)

## Install

```bash
npm install
```

## Run (development)

Starts the Vite dev server with hot reload.

```bash
npm run dev
```

Open the printed URL (typically http://localhost:5173) in your browser.

## Build (production)

```bash
npm run build
```

Output is written to `dist/`.

## Preview the production build

```bash
npm run preview
```

## Project structure

```
public/                  # Static assets served at /
  india-map.png          # 3D India map (hero right)
  Skyline.png            # Heritage skyline backdrop
  logo.png               # Snaphomz logo (white-on-transparent)

src/
  App.jsx                # Mounts <Header /> + <Hero />
  main.jsx               # React entry
  index.css              # Global styles, font stack, page bg
  components/
    Header.jsx / .css    # Top-left logo bar
    Hero.jsx  / .css     # Hero section: title, subtitle,
                         # feature cards, COMING SOON pill,
                         # map, skyline backdrop
```

## Editing content

- Hero copy (title, subtitle, feature cards): [src/components/Hero.jsx](src/components/Hero.jsx)
- Hero styling (colors, sizes, layout): [src/components/Hero.css](src/components/Hero.css)
- Logo / header: [src/components/Header.jsx](src/components/Header.jsx)
- Page background color and base typography: [src/index.css](src/index.css)
