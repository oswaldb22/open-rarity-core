import { TokenInput } from '../../src/types';

/**
 * 5-token collection for unit tests.
 *
 * Attribute distributions:
 *   hat:       cap=2, beanie=2, top hat=1
 *   shirt:     blue=2, red=2, green=1
 *   accessory: monocle=1 (null for 4 tokens)
 *   meta_trait:trait_count: 2=4, 3=1
 *
 * Token 4 is the rarest (3 unique attributes + unique trait count).
 * Tokens 1,2,3,5 all tie (same IC score, 0 unique attributes).
 */
export const smallCollection: TokenInput[] = [
  { tokenId: '1', attributes: { hat: 'cap', shirt: 'blue' } },
  { tokenId: '2', attributes: { hat: 'beanie', shirt: 'red' } },
  { tokenId: '3', attributes: { hat: 'cap', shirt: 'red' } },
  {
    tokenId: '4',
    attributes: { hat: 'top hat', shirt: 'green', accessory: 'monocle' },
  },
  { tokenId: '5', attributes: { hat: 'beanie', shirt: 'blue' } },
];
