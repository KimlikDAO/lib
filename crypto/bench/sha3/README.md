# Keccak-256 benches (sha3)

## Names and history (ground truth)

- **`sha3_orig.js`** is **not** “the original” implementation. It is an **older** branch that was already heavily optimized. The final Keccak core + pipeline live in **`sha3.ts`**.
- On **full-pipeline** benchmarks (same entrypoint semantics you care about), the **Uint32Array scratch** version of `sha3` **beat `sha3_orig`**. Both were written/optimized here; the better pipeline was kept.
- The move to **`Array(50)`** scratch came **after** that — e.g. for kdjs/GCC, codegen, or other constraints — not because a Bun microbench said Array wins on `f(s)` alone.

So: **Uint32Array sha3 > sha3_orig** in the author’s intended measurement; **Array** is a later choice for the current toolchain/shape.

## Why conformance still looks confusing

**`crypto/test/sha3/conformance.test.js`** (timed block) still compares **two different string pipelines**, not a clean scratch-tape A/B:

| | **`sha3.ts` → `keccak256`** | **`sha3_orig.js`** |
|--|-----------------------------|---------------------|
| String → bytes | `TextEncoder.encode` | Fused `charCodeAt` + UTF-8 into `Uint32Array` blocks |
| Scratch `s` | `Array(50)` (current) | `Uint32Array(50)` |
| Output | `Uint8Array(32)` + `.toHex()` | `hex.from(…)` over state bytes |

If orig “wins” that timer, it can still be **encoder + layout + hex**, not “sha3_orig is the faster algorithm overall.” Your **Uint32Array sha3 vs sha3_orig** comparison was the right way to decide between those two designs.

## What the benches here measure (Bun / V8)

These runs are **VM-specific**. On current Bun we often see **`f(number[])` faster than `f(Uint32Array)`** on the hot loop alone — that does **not** overturn full-pipeline results where Uint32Array sha3 beat sha3_orig (different mix of alloc, `f`, output, and compiler).

1. **`scratchTape.bench.ts`** — XOR + `f(s)` only.  
2. **`keccak256Uint8Scratch.bench.ts`** — same bytes as `keccak256Uint8`; scratch + output path only.  
3. **`pipeline.bench.ts`** — string → hash: orig vs `TextEncoder` + current `keccak256Uint8` (noisy, ~few %).  
4. **`keccak256.bench.ts`** / **`keccak256Uint32.bench.ts`** — aligned-word / Uint8 paths.

Use them to compare **Bun behaviour** or regressions, not to relitigate “Uint32Array sha3 vs sha3_orig” unless you mirror the **same** entrypoint and build you used when you picked the winner.

## Commands (from `lib/`)

```sh
bun run crypto/bench/sha3/scratchTape.bench.ts
bun run crypto/bench/sha3/keccak256Uint8Scratch.bench.ts
bun run crypto/bench/sha3/pipeline.bench.ts
bun run crypto/bench/sha3/keccak256.bench.ts
bun run crypto/bench/sha3/keccak256Uint32.bench.ts
```
