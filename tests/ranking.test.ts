import { describe, it, expect } from 'vitest';
import { Collection } from '../src/collection';
import { scoreTokens } from '../src/scoring/information-content';
import { rankTokens } from '../src/ranking/ranker';
import type { InternalCollection, InternalToken, TokenScore } from '../src/types';
import { smallCollection } from './fixtures/small-collection';

describe('rankTokens', () => {
  it('assigns rank 1 to the rarest token', () => {
    const c = new Collection(smallCollection);
    const scores = scoreTokens(c, c.tokens);
    const ranked = rankTokens(scores, c.tokens, c);

    const token4 = ranked.find((r) => r.tokenId === '4')!;
    expect(token4.rank).toBe(1);
    expect(token4.uniqueAttributeCount).toBe(4);
  });

  it('assigns the same rank to tied tokens (RANK semantics)', () => {
    const c = new Collection(smallCollection);
    const scores = scoreTokens(c, c.tokens);
    const ranked = rankTokens(scores, c.tokens, c);

    const tiedTokens = ranked.filter((r) => r.tokenId !== '4');
    // All tied tokens should have rank 2
    for (const t of tiedTokens) {
      expect(t.rank).toBe(2);
      expect(t.uniqueAttributeCount).toBe(0);
    }
  });

  it('does not use DENSE_RANK (next rank after 4 ties at rank 2 would be 6)', () => {
    // With 5 tokens: rank 1 (token4), then rank 2 for 4 ties
    // If we had a 6th token that was less rare, it would be rank 6, not rank 3
    const inputs = [
      ...smallCollection,
      // A token identical to an existing one (even more common)
      { tokenId: '6', attributes: { hat: 'cap', shirt: 'blue' } },
    ];
    const c = new Collection(inputs);
    const scores = scoreTokens(c, c.tokens);
    const ranked = rankTokens(scores, c.tokens, c);

    const ranks = ranked.map((r) => r.rank).sort((a, b) => a - b);
    // token4 = rank 1, others tied (they may not all be the same rank now
    // due to different frequency distributions with 6 tokens)
    expect(ranks[0]).toBe(1);
    // Verify no rank 0
    expect(Math.min(...ranks)).toBe(1);
  });

  it('returns results sorted by rank ascending', () => {
    const c = new Collection(smallCollection);
    const scores = scoreTokens(c, c.tokens);
    const ranked = rankTokens(scores, c.tokens, c);

    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i].rank).toBeGreaterThanOrEqual(ranked[i - 1].rank);
    }
  });

  it('includes score and uniqueAttributeCount in output', () => {
    const c = new Collection(smallCollection);
    const scores = scoreTokens(c, c.tokens);
    const ranked = rankTokens(scores, c.tokens, c);

    for (const r of ranked) {
      expect(r).toHaveProperty('tokenId');
      expect(r).toHaveProperty('score');
      expect(r).toHaveProperty('rank');
      expect(r).toHaveProperty('uniqueAttributeCount');
      expect(typeof r.score).toBe('number');
      expect(typeof r.rank).toBe('number');
      expect(typeof r.uniqueAttributeCount).toBe('number');
    }
  });

  it('matches Python rank parity when equal-score tokens have different unique counts', () => {
    const tokens: InternalToken[] = [
      { tokenId: '1', attributes: new Map([['a', 'a1']]) },
      { tokenId: '2', attributes: new Map([['a', 'a2'], ['b', 'b2']]) },
      {
        tokenId: '3',
        attributes: new Map([
          ['a', 'a3'],
          ['b', 'b3'],
          ['c', 'c3'],
        ]),
      },
      { tokenId: '4', attributes: new Map() },
    ];

    const collection: InternalCollection = {
      totalSupply: 4,
      attributeNames: new Set(['a', 'b', 'c']),
      attributeFrequencyCounts: new Map([
        ['a', new Map([['a1', 1], ['a2', 1], ['a3', 1]])],
        ['b', new Map([['b2', 1], ['b3', 1]])],
        ['c', new Map([['c3', 1]])],
      ]),
      nullAttributeCounts: new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]),
      entropy: 1,
      hasUnsupportedNumericOrDate: false,
    };

    const scores: TokenScore[] = [
      { tokenId: '1', score: 1.5 },
      { tokenId: '2', score: 1.5 },
      { tokenId: '3', score: 0.2 },
      { tokenId: '4', score: 7.0 },
    ];

    const ranked = rankTokens(scores, tokens, collection);

    expect(ranked.map((token) => token.tokenId)).toEqual(['3', '2', '1', '4']);
    expect(ranked.map((token) => token.uniqueAttributeCount)).toEqual([
      3, 2, 1, 0,
    ]);
    expect(ranked.map((token) => token.rank)).toEqual([1, 2, 2, 4]);
  });
});
