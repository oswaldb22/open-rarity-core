import { InternalCollection, InternalToken, TokenScore } from '../types';
import {
  InvalidTokenError,
  UNSUPPORTED_NUMERIC_DATE_TRAITS_MESSAGE,
} from '../errors';

/**
 * Score tokens using Information Content (IC) with entropy normalization.
 *
 * For each token, IC = sum of log2(totalSupply / count) across all collection attributes,
 * using the token's value frequency or the null frequency if the token lacks that attribute.
 * Final score = IC / collectionEntropy.
 */
export function scoreTokens(
  collection: InternalCollection,
  tokens: ReadonlyArray<InternalToken>,
): TokenScore[] {
  if (collection.hasUnsupportedNumericOrDate) {
    throw new InvalidTokenError(UNSUPPORTED_NUMERIC_DATE_TRAITS_MESSAGE);
  }

  const {
    totalSupply,
    attributeNames,
    attributeFrequencyCounts,
    nullAttributeCounts,
    entropy,
  } = collection;

  if (entropy === 0) {
    return tokens.map((t) => ({ tokenId: t.tokenId, score: 0 }));
  }

  return tokens.map((token) => {
    let ic = 0;

    for (const attrName of attributeNames) {
      const value = token.attributes.get(attrName);
      let count: number;

      if (value !== undefined) {
        count = attributeFrequencyCounts.get(attrName)!.get(value)!;
      } else {
        count = nullAttributeCounts.get(attrName) ?? 0;
      }

      if (count > 0) {
        ic += Math.log2(totalSupply / count);
      }
    }

    return {
      tokenId: token.tokenId,
      score: ic / entropy,
    };
  });
}
