// Weighted sampling without replacement: higher-weight items tend to land
// earlier in the result. O(n²), fine for vocabulary-list sizes.
export function weightedShuffle<T>(
  items: T[],
  weightOf: (item: T) => number,
  random: () => number = Math.random,
): T[] {
  const pool = items.map(item => ({
    item,
    weight: Math.max(0.01, weightOf(item)),
  }));
  const result: T[] = [];
  while (pool.length > 0) {
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let target = random() * total;
    let index = 0;
    while (index < pool.length - 1 && target >= pool[index].weight) {
      target -= pool[index].weight;
      index++;
    }
    result.push(pool.splice(index, 1)[0].item);
  }
  return result;
}
