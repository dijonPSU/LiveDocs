class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Inserts a word into the Trie
   * @param {string} word - The word to insert
   */
  insert(word) {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      // If the child node doesn't exist, create it
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char]; // Move to the next char
    }
    node.isEndOfWord = true;
  }

  /**
   * Returns all words in the Trie that start with the given prefix
   * @param {string} prefix - Prefix string to search for
   * @param {number} limit - Max number of completions to return
   * @returns {string[]} Array of completed words
   */
  getCompletions(prefix, limit = 10) {
    let node = this.root;


    for (const char of prefix.toLowerCase()) {
      if (!node.children[char]) {
        return []; // No words found with this prefix
      }
      node = node.children[char];
    }
    const results = [];
    // Find all words from this node onward
    this._dfs(node, prefix.toLowerCase(), results, limit);
    return results;
  }

  /**
   * Basic DFS helper to collect words from the Trie
   * @param {TrieNode} node - Current Trie node
   * @param {string} prefix - Accumulated prefix so far
   * @param {string[]} results - Collected results
   * @param {number} limit - Maximum number of words to collect
   */

  _dfs(node, prefix, results, limit) {
    if (results.length >= limit) return;
    if (node.isEndOfWord){
      // If word ends here, add to results
      results.push(prefix);
    }
    for (const char in node.children) {
      this._dfs(node.children[char], prefix + char, results, limit);
      if (results.length >= limit) break;
    }
  }

  /**
   * Returns all words stored in the Trie
   * @returns {string[]} All words in the Trie
   */
  getAllWords() {
    const results = [];
    this._dfs(this.root, "", results, Infinity);
    return results;
  }
}

export default Trie;
