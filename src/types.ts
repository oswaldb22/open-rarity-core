/** Plain object input — what users pass in */
export interface TokenInput {
  tokenId: string;
  attributes: Record<string, string | number | Date>;
}

/** Score output from the IC scoring engine */
export interface TokenScore {
  tokenId: string;
  score: number;
}

/** Fully ranked token with score, rank, and unique attribute count */
export interface RankedToken {
  tokenId: string;
  score: number;
  rank: number;
  uniqueAttributeCount: number;
}

/** Extensibility point for alternative scoring algorithms */
export interface ScoringHandler {
  scoreTokens(
    collection: InternalCollection,
    tokens: InternalToken[],
  ): TokenScore[];
}

/** Normalized token used internally */
export interface InternalToken {
  tokenId: string;
  attributes: Map<string, string>;
}

/** Read-only view of collection data for scoring handlers */
export interface InternalCollection {
  readonly totalSupply: number;
  readonly attributeNames: ReadonlySet<string>;
  readonly attributeFrequencyCounts: ReadonlyMap<
    string,
    ReadonlyMap<string, number>
  >;
  readonly nullAttributeCounts: ReadonlyMap<string, number>;
  readonly entropy: number;
  readonly hasUnsupportedNumericOrDate: boolean;
}
