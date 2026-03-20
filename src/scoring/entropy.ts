/**
 * Compute Shannon entropy from an array of probabilities.
 * H = sum(p * log2(1/p)) for each p > 0
 */
export function computeEntropy(probabilities: number[]): number {
  let entropy = 0;
  for (const p of probabilities) {
    if (p > 0) {
      entropy += p * Math.log2(1 / p);
    }
  }
  return entropy;
}
