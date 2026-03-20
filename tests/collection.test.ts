import { describe, it, expect } from 'vitest';
import { Collection, TRAIT_COUNT_ATTRIBUTE_NAME } from '../src/collection';
import { EmptyCollectionError } from '../src/errors';
import { smallCollection } from './fixtures/small-collection';

describe('Collection', () => {
  it('throws EmptyCollectionError for empty input', () => {
    expect(() => new Collection([])).toThrow(EmptyCollectionError);
  });

  it('sets totalSupply correctly', () => {
    const c = new Collection(smallCollection);
    expect(c.totalSupply).toBe(5);
  });

  it('normalizes attribute names and values', () => {
    const c = new Collection([
      { tokenId: '1', attributes: { ' Hat ': ' CAP ' } },
    ]);
    const token = c.tokens[0];
    expect(token.attributes.get('hat')).toBe('cap');
  });

  it('builds correct frequency counts', () => {
    const c = new Collection(smallCollection);
    const hatCounts = c.attributeFrequencyCounts.get('hat')!;
    expect(hatCounts.get('cap')).toBe(2);
    expect(hatCounts.get('beanie')).toBe(2);
    expect(hatCounts.get('top hat')).toBe(1);

    const shirtCounts = c.attributeFrequencyCounts.get('shirt')!;
    expect(shirtCounts.get('blue')).toBe(2);
    expect(shirtCounts.get('red')).toBe(2);
    expect(shirtCounts.get('green')).toBe(1);

    const accessoryCounts = c.attributeFrequencyCounts.get('accessory')!;
    expect(accessoryCounts.get('monocle')).toBe(1);
  });

  it('injects meta_trait:trait_count attribute', () => {
    const c = new Collection(smallCollection);
    const traitCounts = c.attributeFrequencyCounts.get(TRAIT_COUNT_ATTRIBUTE_NAME)!;
    expect(traitCounts.get('2')).toBe(4);
    expect(traitCounts.get('3')).toBe(1);

    // Token 4 (3 real attributes) should have trait_count = "3"
    const token4 = c.tokens.find((t) => t.tokenId === '4')!;
    expect(token4.attributes.get(TRAIT_COUNT_ATTRIBUTE_NAME)).toBe('3');
  });

  it('computes null attribute counts', () => {
    const c = new Collection(smallCollection);
    // 4 out of 5 tokens lack the "accessory" attribute
    expect(c.nullAttributeCounts.get('accessory')).toBe(4);
    // All tokens have hat, shirt, and meta_trait:trait_count
    expect(c.nullAttributeCounts.has('hat')).toBe(false);
    expect(c.nullAttributeCounts.has('shirt')).toBe(false);
    expect(c.nullAttributeCounts.has(TRAIT_COUNT_ATTRIBUTE_NAME)).toBe(false);
  });

  it('computes entropy as a positive number', () => {
    const c = new Collection(smallCollection);
    expect(c.entropy).toBeGreaterThan(0);
  });

  it('returns zero entropy when all tokens are identical', () => {
    const identical = [
      { tokenId: '1', attributes: { color: 'red' } },
      { tokenId: '2', attributes: { color: 'red' } },
      { tokenId: '3', attributes: { color: 'red' } },
    ];
    const c = new Collection(identical);
    expect(c.entropy).toBe(0);
  });

  it('caches entropy (same reference on repeated access)', () => {
    const c = new Collection(smallCollection);
    const e1 = c.entropy;
    const e2 = c.entropy;
    expect(e1).toBe(e2);
  });

  it('includes all attribute names including meta_trait:trait_count', () => {
    const c = new Collection(smallCollection);
    expect(c.attributeNames).toContain('hat');
    expect(c.attributeNames).toContain('shirt');
    expect(c.attributeNames).toContain('accessory');
    expect(c.attributeNames).toContain(TRAIT_COUNT_ATTRIBUTE_NAME);
    expect(c.attributeNames.size).toBe(4);
  });

  it('matches Python trait-count key behavior when meta_trait:trait_count already exists', () => {
    const c = new Collection([
      {
        tokenId: '1',
        attributes: {
          hat: 'cap',
          bottom: 'jeans',
          'something another': 'special',
          'meta_trait:trait_count': '3',
        },
      },
      {
        tokenId: '2',
        attributes: {
          hat: 'cap',
          'something another': 'not special',
          'meta_trait:trait_count': '2',
        },
      },
      {
        tokenId: '3',
        attributes: {
          hat: 'bucket hat',
          new: 'very special',
          four: 'four value',
          'meta_trait:trait_count': '4',
        },
      },
      {
        tokenId: '4',
        attributes: {
          hat: 'bucket hat',
          new: 'very special',
          four: 'four value',
          'meta_trait:trait_count': '4',
        },
      },
    ]);

    expect(c.attributeFrequencyCounts.has('meta_trait:trait_count')).toBe(true);
    expect(c.attributeFrequencyCounts.has(TRAIT_COUNT_ATTRIBUTE_NAME)).toBe(true);
    expect(c.attributeFrequencyCounts.has('meta:trait_count')).toBe(false);
    expect(
      Object.fromEntries(c.attributeFrequencyCounts.get('meta_trait:trait_count')!),
    ).toEqual({
      '2': 1,
      '3': 3,
    });
    expect(c.tokens[0].attributes.get('meta_trait:trait_count')).toBe('3');
    expect(c.tokens[0].attributes.has('meta:trait_count')).toBe(false);
  });

  it('matches Python trait_count semantics for normalized "none" values', () => {
    const c = new Collection([
      {
        tokenId: '1',
        attributes: {
          hat: 'cap',
          something: 'none',
        },
      },
      {
        tokenId: '2',
        attributes: {
          hat: 'cap',
        },
      },
    ]);

    expect(c.attributeFrequencyCounts.has('meta_trait:trait_count')).toBe(true);
    expect(
      Object.fromEntries(c.attributeFrequencyCounts.get('meta_trait:trait_count')!),
    ).toEqual({
      '1': 2,
    });
    expect(c.tokens[0].attributes.get('meta_trait:trait_count')).toBe('1');
    expect(c.tokens[1].attributes.get('meta_trait:trait_count')).toBe('1');
    expect(c.tokens[0].attributes.has('meta:trait_count')).toBe(false);
    expect(c.tokens[1].attributes.has('meta:trait_count')).toBe(false);
  });

  it('treats "null" as a real trait while "none" and "" do not count', () => {
    const c = new Collection([
      {
        tokenId: '1',
        attributes: {
          hat: 'cap',
          something: 'null',
        },
      },
      {
        tokenId: '2',
        attributes: {
          hat: 'cap',
          something: 'none',
        },
      },
      {
        tokenId: '3',
        attributes: {
          hat: 'cap',
          something: '',
        },
      },
    ]);

    expect(
      Object.fromEntries(c.attributeFrequencyCounts.get(TRAIT_COUNT_ATTRIBUTE_NAME)!),
    ).toEqual({
      '1': 2,
      '2': 1,
    });
    expect(c.tokens[0].attributes.get(TRAIT_COUNT_ATTRIBUTE_NAME)).toBe('2');
    expect(c.tokens[1].attributes.get(TRAIT_COUNT_ATTRIBUTE_NAME)).toBe('1');
    expect(c.tokens[2].attributes.get(TRAIT_COUNT_ATTRIBUTE_NAME)).toBe('1');
  });
});
