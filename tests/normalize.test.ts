import { describe, it, expect } from 'vitest';
import { normalizeString } from '../src/utils/normalize';

describe('normalizeString', () => {
  it('lowercases uppercase letters', () => {
    expect(normalizeString('Hello')).toBe('hello');
    expect(normalizeString('ALLCAPS')).toBe('allcaps');
  });

  it('trims whitespace', () => {
    expect(normalizeString('  padded  ')).toBe('padded');
    expect(normalizeString('\thello\n')).toBe('hello');
  });

  it('lowercases and trims together', () => {
    expect(normalizeString('  Blue Shirt  ')).toBe('blue shirt');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(normalizeString('   ')).toBe('');
  });

  it('passes through already-normalized strings', () => {
    expect(normalizeString('cap')).toBe('cap');
  });
});
