import { describe, it, expect } from 'vitest';
import { computeEntropy } from '../src/scoring/entropy';

describe('computeEntropy', () => {
  it('returns 0 for a single certain event (p=1)', () => {
    expect(computeEntropy([1])).toBe(0);
  });

  it('returns 1 for two equally likely events', () => {
    expect(computeEntropy([0.5, 0.5])).toBeCloseTo(1, 10);
  });

  it('returns log2(n) for n equally likely events', () => {
    const n = 8;
    const probs = Array(n).fill(1 / n);
    expect(computeEntropy(probs)).toBeCloseTo(Math.log2(n), 10);
  });

  it('handles zero probabilities gracefully', () => {
    expect(computeEntropy([0, 1, 0])).toBe(0);
  });

  it('computes correct entropy for a known distribution', () => {
    // P = [0.25, 0.25, 0.5]
    // H = 0.25*2 + 0.25*2 + 0.5*1 = 1.5
    expect(computeEntropy([0.25, 0.25, 0.5])).toBeCloseTo(1.5, 10);
  });

  it('returns 0 for empty input', () => {
    expect(computeEntropy([])).toBe(0);
  });
});
