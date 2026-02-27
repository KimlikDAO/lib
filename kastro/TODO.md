# Kastro roadmap

Integrated server: build on demand, hash-aware. Non-dep hashing mode is removed; content hashing only.

---

## Modes

### Dev

- Serve files as-is: no font building, no png crush, etc. Serve assets as fast as possible.
- Some computation still needed at least for HTML render.
- Prefer serving JS piecemeal without bundling (e.g. for debugging). Bun build is fast but un-bundled may help.
- Lower priority: dev is far from release; focus on release path.

### Compiled

- **Highest priority.** Make `kdjs --fast` work with the existing CSS and JSX transformers.
- Expose transformers to kdjs in an esbuild-plugin-style API (e.g. `kastro/util/plugin.js` to rhyme with `kdjs/util/plugin`).
- All assets built to the max; content-hash + disk cache so build cost is mainly at startup.

### Release

- Already working: walk all pages and build with `kdjs --fast` off.

---

## Roadmap

### 1. `kastro serve` (Bun server)

- Implement a **Bun server** that works today with **kdjs slow mode** (full optimization), since fast mode is not yet wired for JSX/CSS transforms.
- Single integrated server; no canary server. This server should embody the full server behavior.

### 2. Fast mode support

- Add support for kdjs fast mode with JSX and CSS transforms.
- Provide a kastro plugin (e.g. `lib/kastro/util/plugin.js`) that kdjs can use, analogous to `kdjs/util/plugin.js`.

### 3. `kastro deploy` and ETAGs

- Make `kastro deploy` work again.
- **ETAG hashes must always be computed** for correctness and caching.

---

## Deploy / KV / assets

**Current situation**

- `kvPageWorker` had a good property: old/stale FE versions could still fetch assets; we never cleared assets.
- Now each deployment is a **bundle of needed assets** and the **old bundle is erased**.
- **Piggyback problem:** when a new app is deployed, side apps still piggyback on the previous app’s assets, which may no longer exist (except when the hash stayed the same).

**Proposed: two-stage deploy with KV fallback**

- **Stage 1:** Write the bundle (small, content-hashed). Fast replication across CF pops and lower eviction.
- **Stage 2:** Upload assets to KV for use in the **next** upgrade.
- **Serving:** Prefer serving from the bundle; **fallback to KV** when an asset is not in the current bundle.

**Benefits**

- Bundle stays tiny → fast replication, fewer evictions.
- We never “forget” an asset; everything lives in KV.
- Serving from bundle is much faster than CF cache, so we effectively bypass it when the asset is in the bundle.

---

## Summary checklist

- **1.** Create `kastro serve` (Bun server) using kdjs slow mode; no canary, single integrated server.
- **2.** Add fast mode: make `kdjs --fast` work with JSX + CSS via kastro plugin (e.g. `kastro/util/plugin.js`).
- **3.** Restore `kastro deploy`; ensure ETAG hashes are always computed.
- **4.** Deploy: two-stage (bundle + KV upload); serve from bundle with KV fallback for missing assets.

