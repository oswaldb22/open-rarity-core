import { describe, it, expect } from 'vitest';
import { Collection, TRAIT_COUNT_ATTRIBUTE_NAME } from '../src/collection';
import { scoreTokens } from '../src/scoring/information-content';
import { countUniqueAttributes } from '../src/scoring/token-features';
import { smallCollection } from './fixtures/small-collection';

describe('scoreTokens', () => {
  it('produces one score per token', () => {
    const c = new Collection(smallCollection);
    const scores = scoreTokens(c, c.tokens);
    expect(scores).toHaveLength(5);
  });

  it('scores the rarest token highest', () => {
    const c = new Collection(smallCollection);
    const scores = scoreTokens(c, c.tokens);
    const token4Score = scores.find((s) => s.tokenId === '4')!;
    const otherScores = scores.filter((s) => s.tokenId !== '4');

    for (const s of otherScores) {
      expect(token4Score.score).toBeGreaterThan(s.score);
    }
  });

  it('gives identical scores to tokens with same attribute distributions', () => {
    const c = new Collection(smallCollection);
    const scores = scoreTokens(c, c.tokens);
    // Tokens 1,2,3,5 have the same frequency pattern (2,2,null,4)
    const [s1, s2, s3, s5] = ['1', '2', '3', '5'].map(
      (id) => scores.find((s) => s.tokenId === id)!.score,
    );
    expect(s1).toBeCloseTo(s2, 10);
    expect(s2).toBeCloseTo(s3, 10);
    expect(s3).toBeCloseTo(s5, 10);
  });

  it('returns all zeros when entropy is 0 (identical tokens)', () => {
    const identical = [
      { tokenId: '1', attributes: { color: 'red' } },
      { tokenId: '2', attributes: { color: 'red' } },
    ];
    const c = new Collection(identical);
    const scores = scoreTokens(c, c.tokens);
    for (const s of scores) {
      expect(s.score).toBe(0);
    }
  });

  it('computes expected IC score for token 4 by hand', () => {
    const c = new Collection(smallCollection);
    const scores = scoreTokens(c, c.tokens);
    const token4Score = scores.find((s) => s.tokenId === '4')!;

    // Token 4: hat=top hat(1), shirt=green(1), accessory=monocle(1), trait_count=3(1)
    // IC = 4 * log2(5/1) = 4 * log2(5)
    const expectedIC = 4 * Math.log2(5);
    const expectedNormalized = expectedIC / c.entropy;
    expect(token4Score.score).toBeCloseTo(expectedNormalized, 10);
  });

  it('computes expected IC score for token 1 by hand', () => {
    const c = new Collection(smallCollection);
    const scores = scoreTokens(c, c.tokens);
    const token1Score = scores.find((s) => s.tokenId === '1')!;

    // Token 1: hat=cap(2), shirt=blue(2), null accessory(4), trait_count=2(4)
    const expectedIC =
      Math.log2(5 / 2) + Math.log2(5 / 2) + Math.log2(5 / 4) + Math.log2(5 / 4);
    const expectedNormalized = expectedIC / c.entropy;
    expect(token1Score.score).toBeCloseTo(expectedNormalized, 10);
  });
});

describe('countUniqueAttributes', () => {
  it('counts zero unique attributes for common tokens', () => {
    const c = new Collection(smallCollection);
    const token1 = c.tokens.find((t) => t.tokenId === '1')!;
    expect(countUniqueAttributes(token1, c)).toBe(0);
  });

  it('counts unique attributes for the rarest token', () => {
    const c = new Collection(smallCollection);
    const token4 = c.tokens.find((t) => t.tokenId === '4')!;
    // top hat(1), green(1), monocle(1), trait_count=3(1) → 4 unique
    expect(countUniqueAttributes(token4, c)).toBe(4);
  });

  it('exports the upstream trait-count constant', () => {
    expect(TRAIT_COUNT_ATTRIBUTE_NAME).toBe('meta_trait:trait_count');
  });
});
