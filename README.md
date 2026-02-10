# Todo PWA

A simple, offline-first todo list application built as a Progressive Web App.

## Features

- Add, edit, delete, and toggle todos
- Filter by All / Active / Completed
- Clear all completed todos at once
- Double-click or press Enter on a todo to edit inline
- Offline support via Service Worker
- Data persisted to Local Storage
- Installable as a standalone PWA
- Accessible (ARIA labels, keyboard navigation, live regions)

## Architecture

The app follows the **State-Action-Model (SAM)** pattern:

```
User Interaction → Action → Model → State → DOM
```

- **Model** — holds authoritative state, enforces business rules, persists to Local Storage
- **Actions** — interpret user interactions and propose state changes to the model
- **State** — renders the current model state to the DOM

## Project Structure

```
├── index.html          # Main HTML shell
├── app.js              # Application logic (SAM architecture)
├── styles.css          # Styles
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline caching
├── icons/              # App icons (SVG)
├── tests/              # Browser-based tests
└── docs/               # Specifications and user stories
```

## Getting Started

Serve the project with any static file server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js (npx)
npx serve .
```

Then open `http://localhost:8000` in your browser.

## Tests

Open `tests/index.html` in a browser to run the test suite.

## License

MIT
