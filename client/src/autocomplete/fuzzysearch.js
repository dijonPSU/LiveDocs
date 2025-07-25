/**
 * Returns the minimum number of single-character edits required to change string a into string b
 * @param {string} a - First string
 * @param {string} b - Second string
 * @param {number} maxDistance - Maximum allowed distance for early exit
 * @returns {number} Computed Levenshtein distance
 */
export function levenshtein(a, b, maxDistance = Infinity) {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

  // Swap to make a the shorter string for optimization
  if (a.length > b.length) [a, b] = [b, a];

  // DP table
  let prev = Array(a.length + 1).fill(0);
  let curr = Array(a.length + 1).fill(0);

  for (let i = 0; i <= a.length; i++) {
    prev[i] = i;
  }

  // Fill DP table
  for (let j = 1; j <= b.length; j++) {
    curr[0] = j;

    // Track the minimum in the current row for early exit
    let minInRow = curr[0];

    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      // Compute the minimum cost of insertion, deletion, or substitution
      curr[i] = Math.min(prev[i] + 1, curr[i - 1] + 1, prev[i - 1] + cost);
      minInRow = Math.min(minInRow, curr[i]);
    }
    // Early exit if minimum value in row exceeds maxDistance
    if (minInRow > maxDistance) return maxDistance + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[a.length];
}

/**
 * Returns a list of words from the Trie that are within a certain Levenshtein distance of the input
 * @param {string} input - User input string to match against
 * @param {Trie} trie - Trie instance to use for vocabulary.
 * @param {number} maxDistance - Maximum edit distance allowed
 * @param {number} limit - Maximum number of suggestions to return
 * @returns {string[]} List of matched words sorted by edit distance
 */
export function getLevenshteinSuggestions(
  input,
  trie,
  maxDistance = 2,
  limit = 5,
) {
  // Get all words from the Trie
  const allWords = trie.getAllWords();
  // Map each word to its distance, filter by allowed distance, sort by closeness
  const matches = allWords
    .map((word) => ({
      word,
      dist: levenshtein(input.toLowerCase(), word.toLowerCase(), maxDistance),
    }))
    .filter((obj) => obj.dist <= maxDistance)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map((obj) => obj.word);
  return matches;
}
