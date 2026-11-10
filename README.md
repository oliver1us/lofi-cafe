<p align="center">
  <strong><big>Find your focus, one beat at a time.</big></strong><br>
  Inspired by <a href="https://www.lofi.cafe/">lofi.cafe</a> · extended with mixable ambient sounds.
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white">
  <img alt="Docker Compose" src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white">
</p>

---

## Quick start

### 💻 Node.js

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Open **http://localhost:5173**.

### 🐳 Docker

Requires Docker Compose v2.20 or newer.

```bash
docker compose up -d --build --wait
```

Open **http://localhost:8080**. Stop the app with:

```bash
docker compose down
```

## ✨ Features

- 🎧 YouTube lofi radio with station selection and playback controls.
- 🌧️ Mix rain, ocean, wind, forest, river, and fire sounds independently.
- ⏱️ Pomodoro timer, animated backgrounds, keyboard shortcuts, and mobile layout.
- 💾 Settings saved in your browser; ambient audio never autoplays after reload.

## 🛠️ Useful commands

```bash
npm run build                 # Production build
npm start                     # Serve the production build
npm test                      # Run browser tests (requires Playwright Chromium)
npm run assets:sync           # Verify/download local media assets
```

## ℹ️ Notes

- YouTube streams require an internet connection and may be unavailable or restricted in some regions.
- The listener count only represents users connected to this instance.
- The ambient sounds are original synthesized effects, not recordings.
- Original artwork, media, fonts, and branding remain the property of their respective owners. Check applicable permissions before redistributing them.
