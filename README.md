# OpenRarity JS

A zero-dependency TypeScript port of [OpenRarity](https://github.com/ProjectOpenSea/open-rarity) — the open-source NFT rarity scoring library backed by OpenSea, Proof, icy.tools, and Curio.

Scores NFT rarity using **Information Content (IC)** with Shannon entropy normalization. Produces identical scoring results to the Python implementation, but runs in any JavaScript environment (browser, Node, Deno, Bun) with no native dependencies.

## Features

- **Zero runtime dependencies** — pure TypeScript math, no numpy equivalent needed
- **Browser-compatible** — works in any ES2020+ environment
- **Tree-shakeable** — ESM + CJS dual-publish with full type declarations
- **Tiny bundle** — ~7 KB (ESM)
- **Faithful port** — same IC scoring algorithm, same ranking semantics, same results

## Install

```bash
npm install open-rarity-core
# or
pnpm add open-rarity-core
```

## Quick start

```typescript
import { rankCollection } from 'open-rarity-core';

const ranked = rankCollection([
  { tokenId: '1', attributes: { hat: 'cap', shirt: 'blue' } },
  { tokenId: '2', attributes: { hat: 'beanie', shirt: 'red' } },
  { tokenId: '3', attributes: { hat: 'top hat', shirt: 'green', accessory: 'monocle' } },
]);

console.log(ranked);
// [
//   { tokenId: '3', score: 2.07, rank: 1, uniqueAttributeCount: 4 },
//   { tokenId: '1', score: 0.73, rank: 2, uniqueAttributeCount: 0 },
//   { tokenId: '2', score: 0.73, rank: 2, uniqueAttributeCount: 0 },
// ]
```

## API

### Tier 1: One-liner

#### `rankCollection(inputs: TokenInput[]): RankedToken[]`

Score and rank an entire collection. Returns tokens sorted by rank (rarest first).

```typescript
const ranked = rankCollection(tokens);
```

### Tier 2: Score without ranking

#### `scoreCollection(inputs: TokenInput[]): TokenScore[]`

Score tokens without assigning ranks. Useful when you need raw IC scores but handle ranking yourself.

```typescript
const scores = scoreCollection(tokens);
// [{ tokenId: '1', score: 0.73 }, ...]
```

### Tier 3: Power user

Use the `Collection` class and lower-level functions for full control.

```typescript
import { Collection, scoreTokens, rankTokens } from 'open-rarity-core';

const collection = new Collection(tokens);

// Access precomputed collection data
collection.totalSupply;              // number of tokens
collection.entropy;                  // Shannon entropy (cached)
collection.attributeNames;           // Set of all attribute names
collection.attributeFrequencyCounts; // Map<attrName, Map<value, count>>
collection.nullAttributeCounts;      // Map<attrName, count> (tokens missing that attr)

// Score and rank separately
const scores = scoreTokens(collection, collection.tokens);
const ranked = rankTokens(scores, collection.tokens, collection);
```

### Types

```typescript
interface TokenInput {
  tokenId: string;
  attributes: Record<string, string | number | Date>;
}

interface TokenScore {
  tokenId: string;
  score: number;
}

interface RankedToken {
  tokenId: string;
  score: number;
  rank: number;
  uniqueAttributeCount: number;
}
```

### Additional exports

| Export | Description |
|--------|-------------|
| `Collection` | Class that precomputes frequency maps, null attributes, and entropy |
| `computeEntropy(probabilities)` | Shannon entropy from an array of probabilities |
| `countUniqueAttributes(token, collection)` | Count attributes with frequency = 1 for a token |
| `EmptyCollectionError` | Thrown when constructing a collection with no tokens |
| `InvalidTokenError` | Thrown for unsupported attribute types |
| `ScoringHandler` | Interface for implementing alternative scoring algorithms |
| `TRAIT_COUNT_ATTRIBUTE_NAME` | The `meta_trait:trait_count` constant injected per token |

## How it works

1. **Collection construction** — single O(N\*M) pass normalizes attributes (lowercase + trim), builds frequency maps, and injects a `meta_trait:trait_count` attribute per token (count of non-null, non-`"none"`, non-empty traits).

2. **IC scoring** — for each token, sums `log2(totalSupply / count)` across all collection attributes, using the token's value frequency or the null frequency if missing. Normalizes by dividing by collection entropy.

3. **Ranking** — sorts by `(uniqueAttributeCount DESC, score DESC)`, assigns 1-based ranks with RANK semantics (ties get the same rank; next rank skips).

## Differences from the Python library

| | Python | TypeScript |
|---|---|---|
| Dependencies | numpy, Pydantic | None |
| Token identifiers | EVM/Solana classes | Plain `string` tokenId |
| Token standard | `TokenStandard` enum | Dropped (unused by scoring) |
| Scoring handlers | 5 shipped | IC only (with `ScoringHandler` interface for extensibility) |
| Numeric/date traits | Accepted but unsupported | Same — throws at scoring time |
| Input format | `Token` class instances | Plain `{ tokenId, attributes }` objects |

## Development

```bash
pnpm install
pnpm test          # run tests
pnpm test:watch    # run tests in watch mode
pnpm build         # build ESM + CJS + .d.ts
```

## License

[Apache 2.0](LICENSE)

Based on [OpenRarity](https://github.com/ProjectOpenSea/open-rarity) by OpenSea, icy.tools, Curio, and Proof.
