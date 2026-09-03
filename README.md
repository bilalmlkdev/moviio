<div align="center">

  <a href="https://moviio.vercel.app/">
    <img src="./assets/favicon.svg" alt="JS Practice Projects" width="100%" height="120">
  </a>

# Moviio - Movie Explorer

A cinematic <a href="https://moviio.vercel.app/">3D carousel movie explorer</a> powered by TMDB.Discover movies,
<br />
 watch trailers, and save favourites through a smooth interactive experience.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Site-black?style=for-the-badge)](https://moviio.vercel.app)
[![GitHub Stars](https://img.shields.io/github/stars/bilalmlkdev/moviio?style=for-the-badge&logo=github&color=yellow)](https://github.com/bilalmlkdev/moviio.git)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)

</div>

<p align="center">
  <i>Created by <a href="https://bilalmlkdev.vercel.app" target="_blank">Bilal Malik</a></i><br>
  <i>Follow on Github <a href="https://github.com/bilalmlkdev" target="_blank">bilalmlkdev</a></i>
</p>


[![JS Practice Projects Dashboard](https://raw.githubusercontent.com/bilalmlkdev/moviio/main/assets/dashboardDark.png)](https://moviio.vercel.app/)



## About

Moviio is an interactive movie discovery app split into a marketing landing page and a separate app view - a **custom 7-card 3D wheel engine** where movies rotate through a circular cinematic interface with CSS 3D transforms.

It's powered by the TMDB API through a serverless proxy (so the API key never reaches the client), ships as an installable Progressive Web App with offline caching, and supports full light/dark theming.

- **Two-page structure** - `index.html` is the marketing landing page, `app.html` is the movie explorer itself
- **Custom 3D carousel** - drag, swipe, keyboard, or auto-rotate through movies
- **Trailer overlay** - fullscreen YouTube playback with cast, director, runtime, and genres
- **Favourites** - heart any movie to save it locally, browse them in a dedicated popup
- **Light/dark theme** - full theming across both pages, persisted via localStorage
- **PWA-ready** - installable, works offline via a versioned service worker
- **Secure by design** - TMDB key stays server-side in a Vercel serverless function

## Features

| Feature | Description |
|---|---|
| 3D Movie Wheel | Custom-built carousel with layered cards and smooth 3D transitions |
| Drag & Swipe Navigation | Mouse drag, touch gestures, or button controls |
| Search & Filters | Search by title, filter by genre or release year, with custom dropdowns |
| Favourites | Heart any movie to save it via LocalStorage - browse them in a popup |
| Trailer Overlay | Fullscreen YouTube trailers with cast, director, runtime, and share |
| Deep Linking | Share any movie directly via `/trailer.html?movie_id=980431` |
| Keyboard Shortcuts | `←` `→` navigate, `Enter`/`Space` open trailer, `Esc` close overlays |
| Instructions Modal | In-app guide covering controls and keyboard shortcuts |
| Offline Support | Installable PWA with versioned service-worker caching |

## Folder Structure

```text
moviio/
│
├── index.html            # Landing page
├── app.html               # Movie explorer app
├── styles/                 # Modular CSS (variables, base, header, hero, carousel, trailer, modal, favourites, dropdown)
├── scripts/                  # Modular JS (main, api, carousel, controls, trailer, favourites, ui, modal, state, utils)
├── landing.css               # Landing page styles
├── theme.js                   # Shared theme toggle logic
├── api/tmdb.js                 # Serverless TMDB proxy (keeps the API key server-side)
├── sw.js                        # Versioned service worker
├── manifest.json                 # PWA manifest
└── assets/                        # Images, media, diagrams
```

## Getting Started

**Requirements:** a modern browser, Vercel CLI, and a [TMDB API key](https://www.themoviedb.org/settings/api).

```bash
git clone https://github.com/bilalmlkdev/moviio.git
cd moviio
npm install -g vercel
```

Create a `.env` file:

```env
TMDB_KEY=your_tmdb_api_key
```

Then run:

```bash
vercel dev
```

> Opening the HTML files directly (or Live Server) won't work - `/api/tmdb` requires the Vercel serverless function to proxy TMDB requests.

## Usage

Start on the landing page and click through to the app. Navigate the 3D wheel with drag, swipe, arrow keys, or the on-screen controls. Click the active card to open its trailer in fullscreen, heart it to save to favourites, or copy a shareable link. Use search, genre, and year filters to narrow results, or hit shuffle for something random. Open the instructions button in the header for a full walkthrough.

## Contributing

Contributions are welcome - bug reports, feature ideas, or code improvements.

```bash
git checkout -b feat/your-feature-name
# make your changes
git commit -m "Add your feature"
git push origin feat/your-feature-name
```

Then open a pull request describing your changes.

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for details.

```text
MIT License

Copyright (c) 2026 Bilal Malik

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
