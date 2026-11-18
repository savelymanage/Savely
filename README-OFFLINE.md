# Savely Offline-First PWA

## Deploy
1. Upload the contents of this folder to the same directory on an HTTPS web host (or run it on `http://localhost`).
2. Open `index.html` once while online. This installs the Service Worker and caches the app shell.
3. Use the browser's Install App / Add to Home Screen command.
4. Reopen Savely from its installed app icon. Core finance workflows are available offline.

A Service Worker cannot run from a `file://` URL. Use HTTPS or localhost; this is a browser security requirement.

## Offline storage
- Existing Savely `localStorage` data format is preserved for compatibility with the current application code.
- Every localStorage write is mirrored into IndexedDB (`savely-offline-db-v1`, object store `kv`).
- On startup, missing localStorage keys are recovered from IndexedDB.
- This includes the main `savely_html_v1` financial dataset and app preferences written through localStorage.

## Offline behavior and limits
Savings, salary/income, debt, expense records, goals, transaction history, calendars and other data already stored locally remain usable offline, including local calculations, forms, editing, charts and SPA navigation.

Features whose data comes from third-party services still require a connection for fresh data: weather, live maps/traffic tiles, geocoding, remote holiday feeds, remote video/embeds, external links, optional cloud sign-in/sync, and any API-backed content. The Service Worker caches eligible static CDN resources after a successful fetch, but it cannot make remote APIs or live map tiles work without a network. The app does not depend on those services for local financial record keeping.

## Backups
IndexedDB and browser storage survive refreshes, app closure and device restarts, but clearing site data, uninstalling the browser, device failure, or storage eviction can still remove local data. Keep using Savely's existing export/backup feature for an independent copy.
