import { describe, it, expect } from 'vitest';
import { rankCollection, scoreCollection, Collection } from '../src/index';
import { smallCollection } from './fixtures/small-collection';

describe('rankCollection (end-to-end)', () => {
  it('returns ranked tokens with correct structure', () => {
    const ranked = rankCollection(smallCollection);
    expect(ranked).toHaveLength(5);
    for (const r of ranked) {
      expect(r).toHaveProperty('tokenId');
      expect(r).toHaveProperty('score');
      expect(r).toHaveProperty('rank');
      expect(r).toHaveProperty('uniqueAttributeCount');
    }
  });

  it('ranks token 4 first (rarest)', () => {
    const ranked = rankCollection(smallCollection);
    expect(ranked[0].tokenId).toBe('4');
    expect(ranked[0].rank).toBe(1);
  });

  it('gives remaining tokens rank 2 (all tied)', () => {
    const ranked = rankCollection(smallCollection);
    const rest = ranked.slice(1);
    for (const r of rest) {
      expect(r.rank).toBe(2);
    }
  });

  it('all scores are positive', () => {
    const ranked = rankCollection(smallCollection);
    for (const r of ranked) {
      expect(r.score).toBeGreaterThan(0);
    }
  });
});

describe('scoreCollection', () => {
  it('returns scores without rank information', () => {
    const scores = scoreCollection(smallCollection);
    expect(scores).toHaveLength(5);
    for (const s of scores) {
      expect(s).toHaveProperty('tokenId');
      expect(s).toHaveProperty('score');
      expect(s).not.toHaveProperty('rank');
    }
  });

  it('produces same scores as rankCollection', () => {
    const scores = scoreCollection(smallCollection);
    const ranked = rankCollection(smallCollection);

    for (const s of scores) {
      const r = ranked.find((r) => r.tokenId === s.tokenId)!;
      expect(s.score).toBeCloseTo(r.score, 10);
    }
  });
});

describe('Power user API', () => {
  it('Collection class is exported and usable', () => {
    const c = new Collection(smallCollection);
    expect(c.totalSupply).toBe(5);
    expect(c.entropy).toBeGreaterThan(0);
    expect(c.tokens).toHaveLength(5);
  });
});

describe('edge cases', () => {
  it('handles single token collection', () => {
    const ranked = rankCollection([
      { tokenId: '1', attributes: { color: 'red' } },
    ]);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].score).toBe(0); // entropy is 0, score is 0
  });

  it('normalizes attribute names and values', () => {
    const ranked = rankCollection([
      { tokenId: '1', attributes: { ' Color ': ' RED ' } },
      { tokenId: '2', attributes: { color: 'red' } },
    ]);
    // After normalization, both tokens are identical
    expect(ranked[0].score).toBe(ranked[1].score);
  });

  it('handles tokens with different attribute sets (null attributes)', () => {
    const ranked = rankCollection([
      { tokenId: '1', attributes: { color: 'red', hat: 'cap' } },
      { tokenId: '2', attributes: { color: 'blue' } },
    ]);
    expect(ranked).toHaveLength(2);
    // With only 2 tokens, every value (including null) has freq=1,
    // so both tokens have the same IC. But token 1 has more unique
    // attributes so it ranks first.
    expect(ranked[0].tokenId).toBe('1');
    expect(ranked[0].uniqueAttributeCount).toBeGreaterThan(
      ranked[1].uniqueAttributeCount,
    );
  });
});
