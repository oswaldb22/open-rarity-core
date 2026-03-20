import {
  RankedToken,
  TokenScore,
  InternalToken,
  InternalCollection,
} from '../types';
import { countUniqueAttributes } from '../scoring/token-features';

interface ScoredTokenWithFeatures {
  tokenId: string;
  score: number;
  uniqueAttributeCount: number;
}

function floatEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-9 * Math.max(Math.abs(a), Math.abs(b));
}

/**
 * Rank scored tokens.
 * Sort by (uniqueAttributeCount DESC, score DESC).
 * Ties get the same rank (RANK semantics, not DENSE_RANK).
 */
export function rankTokens(
  scores: TokenScore[],
  tokens: ReadonlyArray<InternalToken>,
  collection: InternalCollection,
): RankedToken[] {
  const tokenMap = new Map<string, InternalToken>();
  for (const token of tokens) {
    tokenMap.set(token.tokenId, token);
  }

  const items: ScoredTokenWithFeatures[] = scores.map((s) => ({
    tokenId: s.tokenId,
    score: s.score,
    uniqueAttributeCount: countUniqueAttributes(
      tokenMap.get(s.tokenId)!,
      collection,
    ),
  }));

  items.sort((a, b) => {
    if (a.uniqueAttributeCount !== b.uniqueAttributeCount) {
      return b.uniqueAttributeCount - a.uniqueAttributeCount;
    }
    if (!floatEqual(a.score, b.score)) {
      return b.score - a.score;
    }
    return 0;
  });

  const ranked: RankedToken[] = [];
  for (let i = 0; i < items.length; i++) {
    let rank: number;
    if (i === 0 || !floatEqual(items[i].score, items[i - 1].score)) {
      rank = i + 1;
    } else {
      rank = ranked[i - 1].rank;
    }
    ranked.push({
      tokenId: items[i].tokenId,
      score: items[i].score,
      rank,
      uniqueAttributeCount: items[i].uniqueAttributeCount,
    });
  }

  return ranked;
}
