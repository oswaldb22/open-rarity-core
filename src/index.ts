import { TokenInput, RankedToken, TokenScore } from './types';
import { Collection } from './collection';
import { scoreTokens } from './scoring/information-content';
import { rankTokens } from './ranking/ranker';

// Re-export all public types and classes
export type {
  TokenInput,
  RankedToken,
  TokenScore,
  ScoringHandler,
  InternalCollection,
  InternalToken,
} from './types';
export { Collection } from './collection';
export { TRAIT_COUNT_ATTRIBUTE_NAME } from './collection';
export { scoreTokens } from './scoring/information-content';
export { rankTokens } from './ranking/ranker';
export { computeEntropy } from './scoring/entropy';
export { countUniqueAttributes } from './scoring/token-features';
export {
  EmptyCollectionError,
  InvalidTokenError,
  UNSUPPORTED_NUMERIC_DATE_TRAITS_MESSAGE,
} from './errors';

/**
 * Score a collection of tokens using IC scoring with entropy normalization.
 */
export function scoreCollection(inputs: TokenInput[]): TokenScore[] {
  const collection = new Collection(inputs);
  return scoreTokens(collection, collection.tokens);
}

/**
 * Score and rank a collection of tokens. One-liner API.
 */
export function rankCollection(inputs: TokenInput[]): RankedToken[] {
  const collection = new Collection(inputs);
  const scores = scoreTokens(collection, collection.tokens);
  return rankTokens(scores, collection.tokens, collection);
}
