import { TokenInput, InternalToken, InternalCollection } from './types';
import { normalizeString } from './utils/normalize';
import { EmptyCollectionError, InvalidTokenError } from './errors';
import { computeEntropy } from './scoring/entropy';

export const TRAIT_COUNT_ATTRIBUTE_NAME = 'meta_trait:trait_count';

export class Collection implements InternalCollection {
  readonly totalSupply: number;
  readonly attributeNames: ReadonlySet<string>;
  readonly attributeFrequencyCounts: ReadonlyMap<
    string,
    ReadonlyMap<string, number>
  >;
  readonly hasUnsupportedNumericOrDate: boolean;
  readonly tokens: ReadonlyArray<InternalToken>;

  private _nullAttributeCounts: ReadonlyMap<string, number> | null = null;
  private _entropy: number | null = null;

  constructor(inputs: TokenInput[]) {
    if (inputs.length === 0) {
      throw new EmptyCollectionError();
    }

    this.totalSupply = inputs.length;

    // Single O(N*M) pass: normalize attributes and build frequency maps
    const frequencyCounts = new Map<string, Map<string, number>>();
    const tokens: InternalToken[] = [];
    let hasUnsupportedNumericOrDate = false;

    for (const input of inputs) {
      const normalizedAttrs = new Map<string, string>();
      let numericOrDateTraitCount = 0;

      for (const [name, value] of Object.entries(input.attributes)) {
        const normName = normalizeString(name);

        if (typeof value === 'string') {
          normalizedAttrs.set(normName, normalizeString(value));
          continue;
        }

        if (typeof value === 'number' || value instanceof Date) {
          hasUnsupportedNumericOrDate = true;
          if (normName !== TRAIT_COUNT_ATTRIBUTE_NAME) {
            numericOrDateTraitCount += 1;
          }
          continue;
        }

        throw new InvalidTokenError(
          `Provided attribute value has invalid type: ${typeof value}`,
        );
      }

      let stringTraitCount = 0;
      for (const [attrName, attrValue] of normalizedAttrs) {
        if (attrName !== TRAIT_COUNT_ATTRIBUTE_NAME) {
          let valueCounts = frequencyCounts.get(attrName);
          if (!valueCounts) {
            valueCounts = new Map<string, number>();
            frequencyCounts.set(attrName, valueCounts);
          }
          valueCounts.set(attrValue, (valueCounts.get(attrValue) ?? 0) + 1);
        }

        if (
          attrName !== TRAIT_COUNT_ATTRIBUTE_NAME &&
          attrValue !== 'none' &&
          attrValue !== ''
        ) {
          stringTraitCount += 1;
        }
      }

      const traitCount = String(stringTraitCount + numericOrDateTraitCount);
      normalizedAttrs.set(TRAIT_COUNT_ATTRIBUTE_NAME, traitCount);
      tokens.push({ tokenId: input.tokenId, attributes: normalizedAttrs });
    }

    // Inject the OpenRarity meta trait count after string normalization.
    const traitCountCounts = new Map<string, number>();
    for (const token of tokens) {
      const count = token.attributes.get(TRAIT_COUNT_ATTRIBUTE_NAME)!;
      traitCountCounts.set(count, (traitCountCounts.get(count) ?? 0) + 1);
    }
    frequencyCounts.set(TRAIT_COUNT_ATTRIBUTE_NAME, traitCountCounts);

    this.attributeFrequencyCounts = frequencyCounts;
    this.attributeNames = new Set(frequencyCounts.keys());
    this.hasUnsupportedNumericOrDate = hasUnsupportedNumericOrDate;
    this.tokens = tokens;
  }

  get nullAttributeCounts(): ReadonlyMap<string, number> {
    if (this._nullAttributeCounts === null) {
      const nullCounts = new Map<string, number>();
      for (const attrName of this.attributeNames) {
        let count = 0;
        for (const token of this.tokens) {
          if (!token.attributes.has(attrName)) {
            count++;
          }
        }
        if (count > 0) {
          nullCounts.set(attrName, count);
        }
      }
      this._nullAttributeCounts = nullCounts;
    }
    return this._nullAttributeCounts;
  }

  get entropy(): number {
    if (this._entropy === null) {
      const probabilities: number[] = [];
      for (const attrName of this.attributeNames) {
        const valueCounts = this.attributeFrequencyCounts.get(attrName)!;
        for (const count of valueCounts.values()) {
          probabilities.push(count / this.totalSupply);
        }
        const nullCount = this.nullAttributeCounts.get(attrName) ?? 0;
        if (nullCount > 0) {
          probabilities.push(nullCount / this.totalSupply);
        }
      }
      this._entropy = computeEntropy(probabilities);
    }
    return this._entropy;
  }
}
