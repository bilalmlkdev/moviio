![Moviio Dashboard](./assets/preview.png)

<h1 align="center">Moviio - Movie Explorer</h1>

<p align="center">A cinematic 3D carousel movie explorer powered by TMDB. Discover movies, watch trailers, and manage your watchlist through a smooth interactive experience.</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Complete-9B72FF?style=flat" alt="Status">
  <a href="https://github.com/bilalmlkdev/moviio/blob/main/LICENSE" target="_blank">
    <img src="https://img.shields.io/github/license/bilalmlkdev/moviio?style=flat" alt="License">
  </a>
  <a href="https://github.com/bilalmlkdev/moviio/stargazers" target="_blank">
    <img src="https://img.shields.io/github/stars/bilalmlkdev/moviio?style=flat" alt="GitHub stars">
  </a>
  <img src="https://img.shields.io/badge/Deployed%20on-Vercel-9B72FF?style=flat" alt="Vercel">
</p>

<p align="center">
  <a href="https://moviio.vercel.app/"><b>Explore Moviio</b></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/bilalmlkdev/moviio/issues/new?labels=bug&template=bug-report---.md">Report Issue</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/bilalmlkdev/moviio/issues/new?labels=enhancement&template=feature-request---.md">Suggest Feature</a>
</p>

<p align="center">
  <i>Created by <a href="https://bilalmlkdev.vercel.app" target="_blank">Bilal Malik</a></i><br>
  <i>Follow on GitHub <a href="https://github.com/bilalmlkdev" target="_blank">bilalmlkdev</a></i>
</p>

---

## About

Moviio is an interactive movie discovery app built around a **custom 7-card 3D wheel engine** - instead of a typical grid, movies rotate through a circular cinematic interface with CSS 3D transforms and GPU-accelerated animation.

It's powered by the TMDB API through a serverless proxy (so the API key never reaches the client), and ships as an installable Progressive Web App with offline caching.

- **Custom 3D carousel** - drag, swipe, keyboard, or auto-rotate through movies
- **Trailer overlay** - fullscreen YouTube playback with share/URL deep-linking
- **Watchlist** - persisted locally, shareable via URL
- **PWA-ready** - installable, works offline via a versioned service worker
- **Secure by design** - TMDB key stays server-side in a Vercel serverless function

## Features

| Feature | Description |
|---|---|
| 3D Movie Wheel | Custom-built carousel with layered cards and smooth 3D transitions |
| Drag & Swipe Navigation | Mouse drag, touch gestures, or button controls |
| Search & Filters | Search by title, filter by genre or release year |
| Watchlist | Saved via LocalStorage, shareable through URLs |
| Trailer Overlay | Fullscreen YouTube trailers with play/pause/share controls |
| Deep Linking | Share any movie directly via `/?movie_id=980431` |
| Keyboard Shortcuts | `←` `→` navigate, `Enter`/`Space` open trailer, `Esc` close |
| Offline Support | Installable PWA with versioned service-worker caching |

## Folder Structure

```text
moviio/
│
├── index.html          # App entry
├── style.css            # Layout, animation, 3D transforms
├── script.js             # Carousel engine + state management
├── api/tmdb.js            # Serverless TMDB proxy (keeps the API key server-side)
├── sw.js                   # Versioned service worker
├── manifest.json            # PWA manifest
└── assets/                   # Images, media, diagrams
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

> Opening `index.html` directly (or Live Server) won't work - `/api/tmdb` requires the Vercel serverless function to proxy TMDB requests.

## Usage

Navigate the 3D wheel with drag, swipe, arrow keys, or the on-screen controls. Click the active card to open its trailer in fullscreen, save it to your watchlist, or copy a shareable link. Use the search bar and genre/year filters to narrow results, or hit shuffle for something random.

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


