# Scripts (no package.json – this dir is not an npm package)

Run from this directory. Dependencies are in `lib/package.json`: `acorn`, `acorn-jsx`, `typescript`, `esbuild` (dev). Install from repo root or from `lib/` so that `acorn` resolves (e.g. `bun install` at dapp root, or `cd lib && bun install`).

- **Build**
  ```bash
  esbuild src/index.ts --bundle --format=esm --outfile=index.js --platform=node --external:acorn
  ```

- **Test**
  ```bash
  bun test test/
  ```

- **Test (update snapshots)** (if you add snapshot tests later)
  ```bash
  UPDATE_SNAPSHOT=true bun test test/ && prettier --write .
  ```

- **Type-check**
  ```bash
  tsc --noEmit
  ```

- **Format**
  ```bash
  prettier --write .
  ```

- **Lint**
  ```bash
  prettier --check .
  ```
