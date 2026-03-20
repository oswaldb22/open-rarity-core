import { InternalToken, InternalCollection } from '../types';

/**
 * Count how many of this token's attribute values appear exactly once
 * in the entire collection (i.e., are unique to this token).
 */
export function countUniqueAttributes(
  token: InternalToken,
  collection: InternalCollection,
): number {
  let count = 0;
  for (const attrName of collection.attributeNames) {
    const value = token.attributes.get(attrName);
    if (value !== undefined) {
      const freq = collection.attributeFrequencyCounts.get(attrName)!.get(value)!;
      if (freq === 1) {
        count++;
      }
    }
  }
  return count;
}
