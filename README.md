![Moviio Dashboard](./assets/preview.png)

<!-- <p align="center">
  <a href="https://moviio.vercel.app/">
    <img src="./assets/favicon.svg" width="110" alt="Moviio Logo">
  </a>
</p> -->

<h1 align="center">Moviio - Movie Explorer</h1>

*<p align="center">A cinematic 3D carousel movie explorer powered by TMDB. Discover movies, watch trailers, and manage your watchlist through a smooth interactive experience.</p>*




<p align="center">
  <img src="https://img.shields.io/badge/Status-Complete-9B72FF?style=flat" />
  <img src="https://img.shields.io/badge/License-MIT-9B72FF?style=flat" />
  <a href="https://github.com/byllzz">
    <img src="https://img.shields.io/badge/Author-Bilal%20Malik-9B72FF?style=flat" />
  </a>
  <img src="https://img.shields.io/badge/Deployed%20on-Vercel-9B72FF?style=flat" />
</p>

<p align="center">
  <a href="https://moviio.vercel.app/">
    <b style="color:#9B72FF">Explore Moviio</b>
  </a>
  &nbsp; • &nbsp;
  <a href="https://github.com/byllzz/moviio/issues/new?labels=bug&template=bug-report---.md">
     <b style="color:#9B72FF">Report Issue</b>
  </a>
  &nbsp; • &nbsp;
  <a href="https://github.com/byllzz/moviio/issues/new?labels=enhancement&template=feature-request---.md">
     <b style="color:#9B72FF">Suggest Feature</b>
  </a>
</p>

<br>

# About Moviio

Welcome to **Moviio** - a modern interactive movie discovery application designed to deliver an immersive cinematic experience directly in your browser.

Unlike traditional movie browsing layouts, Moviio uses a **custom-built 7-card 3D wheel engine** that allows users to explore movies through a circular cinematic interface.

Powered by **TMDB**, Moviio provides real-time movie information, trailers, ratings, genres, and metadata while maintaining smooth GPU-accelerated animations and responsive performance.



# Why Moviio?

| Feature | Highlights |
|---------|------------|
| **3D Movie Wheel** | Custom-built carousel engine with CSS 3D transforms and smooth animations |
| **Cinema Experience** | Fullscreen trailer overlay with YouTube integration and playback controls |
| **Smart Watchlist** | Save movies permanently using LocalStorage with URL sharing support |
| **Movie Discovery** | Browse popular, upcoming, top-rated movies with search and filters |
| **Performance Focused** | Lightweight vanilla JavaScript architecture with optimized animations |
| **Progressive Web App** | Installable experience with offline caching support |

# Moviio Features

## Complete Feature List

| # | Feature | Description |
|---|---------|-------------|
| 01 | **7-Card 3D Wheel** | Custom-built movie carousel with 3D perspective, layered cards, and smooth transitions |
| 02 | **Drag & Swipe Navigation** | Navigate movies using mouse drag, touch gestures, or buttons |
| 03 | **Auto Rotate Mode** | Automatically rotates movies with hover pause support |
| 04 | **TMDB Integration** | Fetches popular, upcoming, and top-rated movies in real time |
| 05 | **Search & Filters** | Search movies and filter by genre or release year |
| 06 | **Watchlist System** | Save favorite movies using LocalStorage persistence |
| 07 | **Trailer Overlay** | Watch official YouTube trailers in fullscreen mode |
| 08 | **Trailer Controls** | Play, pause, fullscreen, and share controls |
| 09 | **Movie Details** | Displays runtime, genres, director, and top cast information |
| 10 | **Shuffle Discovery** | Discover random movies from available pages |
| 11 | **Parallax Tilt Effect** | Interactive 3D tilt animation on active movie cards |
| 12 | **URL Deep Linking** | Share movies using direct URLs like `/?movie_id=980431` |
| 13 | **Progressive Web App** | Installable on desktop and mobile with offline caching |
| 14 | **Keyboard Shortcuts** | Navigate using keyboard controls |
| 15 | **Shortcut Menu** | Quick reference panel for available shortcuts |
| 16 | **Loading Feedback** | Smooth loading overlay while fetching movie data |
| 17 | **Empty States** | Friendly messages when filters return no results |

# Usage

| Feature | Details |
|---------|---------|
| **Browse Movies** | Explore movies through the custom 3D wheel using buttons, drag, swipe, or arrow keys |
| **Search & Filter** | Search by title and filter movies by genre or release year |
| **Watchlist** | Save movies with ❤️ and access them anytime through LocalStorage |
| **Trailers** | Open the active movie card to watch official YouTube trailers |
| **Trailer Controls** | Play/Pause • Fullscreen • Share movie link |
| **Auto Rotate** | Automatically cycle through movies with hover pause support |
| **Shuffle** | Load random movies for discovery |
| **Keyboard Controls** | Use shortcuts for faster navigation |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` `→` | Navigate movies |
| `Enter` / `Space` | Open active movie trailer |
| `Esc` | Close trailer overlay |

## Sharing Movies

Share any movie directly using:

```text
/?movie_id=980431
# Live Demo
```

 > Explore movies, watch trailers, discover new films, and manage your personal watchlist directly in your browser.

# Architecture & Folder Structure

| File | Description |
|------|-------------|
| `index.html` | Main application entry |
| `style.css` | Global styles, animations, and layouts |
| `script.js` | Carousel engine, state management, and UI logic |
| `api/tmdb.js` | Serverless TMDB API proxy |
| `vercel.json` | Vercel configuration |
| `manifest.json` | Progressive Web App manifest |
| `sw.js` | Service worker with versioned caching |
| `assets/` | Images, media, and diagrams |

# Visual Overview

## Development Roadmap

<p align="center">
  <img
    src="./assets/charts/projectBuild-process.png"
    alt="Development Roadmap"
    width="650"
  />
</p>

## Runtime Architecture

<p align="center">
  <img
    src="./assets/charts/project-flow.png"
    alt="Runtime Architecture"
    width="650"
  />
</p>

> These diagrams were created with Mermaid. PNG versions are included for fast rendering across platforms.



# Built With

Moviio is built using modern web technologies with a lightweight frontend architecture and a serverless API layer.

## Technologies

| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic structure and PWA support |
| **CSS3** | Layouts, animations, responsive design, and 3D transforms |
| **Vanilla JavaScript (ES6+)** | Application logic, state management, and API handling |
| **TMDB API** | Movie data, trailers, ratings, and metadata |
| **YouTube IFrame API** | Trailer playback |
| **Vercel** | Hosting and serverless functions |

## Tech Stack Badges

<p align="left">
  <img src="https://skillicons.dev/icons?i=html,css,js,vercel" alt="HTML CSS JavaScript Vercel" />
</p>

# Getting Started

Run Moviio locally with these steps.

## Requirements

- Modern browser
- VS Code (recommended)
- TMDB API Key
- Vercel CLI

## Installation

```bash
git clone https://github.com/byllzz/moviio.git
cd moviio
npm install -g vercel
```

Create `.env`:

```env
TMDB_KEY=your_tmdb_api_key
```

Start the project:

```bash
vercel dev
```

> Direct `index.html` or Live Server will not work because `/api/tmdb` requires the Vercel serverless function.

## Contributing

Contributions are welcome!

```bash
git checkout -b feat/new-feature
git commit -m "Add feature"
git push origin feat/new-feature
```

Open a Pull Request after making changes.

Guidelines:

- Keep code clean
- Follow the project structure
- Test changes before submitting

## Support

Help improve Moviio:

- Star the repository
- Report bugs
- Suggest features
- Contribute

# Contributors

A huge thank you to everyone who has contributed to Moviio! ❤️

<a href="https://github.com/byllzz/moviio/graphs/contributors">
  <img
    src="https://contrib.rocks/image?repo=byllzz/moviio"
    alt="Project Contributors"
  />
</a>

<p align="right">
  <a href="#moviio">⬆ Back to Top</a>
</p>

## Author

<img src="https://github.com/byllzz.png" width="80" height="80" alt="Bilal Malik Profile" />

### Bilal Malik (byllzz)
<p align="left">

[![GitHub](https://img.shields.io/badge/GitHub-byllzz-9B72FF?style=flat&logo=github&logoColor=white)](https://github.com/byllzz)
[![X](https://img.shields.io/badge/Tweet-@bilalmlkdev-9B72FF?style=flat&logo=x&logoColor=white)](https://x.com/bilalmlkdev)
[![Portfolio](https://img.shields.io/badge/Portfolio-bilalmlkdev.vercel.app-9B72FF?style=flat&logo=vercel&logoColor=white)](https://bilalmlkdev.vercel.app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Bilal%20Malik-9B72FF?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/bilalmlkdev/)
[![Email](https://img.shields.io/badge/Email-bilalmlkdev@gmail.com-9B72FF?style=flat&logo=gmail&logoColor=white)](mailto:bilalmlkdev@gmail.com)

</p>

<p align="left">
If you enjoyed this project, consider giving it a ⭐ on GitHub!
</p>

# License (MIT)

This project is licensed under the **MIT License**.

```text
MIT License

Copyright (c) 2026 Bilal Malik

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software.

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
© 2026 Moviio. Licensed under the **MIT License**.
