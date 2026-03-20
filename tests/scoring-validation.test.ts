import { describe, it, expect } from 'vitest';
import { rankCollection, scoreCollection } from '../src';
import type { TokenInput } from '../src/types';

describe('Python parity: scoring validation', () => {
  it('rejects numeric traits with the upstream error message', () => {
    const numericInput = [
      {
        tokenId: '1',
        attributes: {
          hat: 'cap',
          level: 1,
        },
      },
    ] as unknown as TokenInput[];

    expect(() => scoreCollection(numericInput)).toThrowError(
      'OpenRarity currently does not support collections with numeric or date traits',
    );
  });

  it('rejects date traits with the upstream numeric/date error message', () => {
    const dateInput = [
      {
        tokenId: '1',
        attributes: {
          hat: 'cap',
          created: new Date('2024-01-01T00:00:00.000Z'),
        },
      },
    ] as unknown as TokenInput[];

    expect(() => rankCollection(dateInput)).toThrowError(
      'OpenRarity currently does not support collections with numeric or date traits',
    );
  });
});
