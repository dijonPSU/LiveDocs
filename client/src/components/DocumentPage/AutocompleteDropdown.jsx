import { useState, useEffect, useRef, useCallback } from "react";
import Trie from "../../autocomplete/trie";
import STATIC_WORDS from "../../autocomplete/dictionary";
import { getLevenshteinSuggestions } from "../../autocomplete/fuzzysearch";
import { getRankedSuggestions } from "../../utils/dataFetcher";
import { keyBoardCommands } from "../../utils/constants";
import "./styles/AutocompleteDropdown.css";

// Build Trie (I'm keeping it here since autocomplete is the only place it's used)
let sharedTrie = null;
const getSharedTrie = () => {
  if (!sharedTrie) {
    sharedTrie = new Trie();
    STATIC_WORDS.forEach((word) => sharedTrie.insert(word));
  }
  return sharedTrie;
};

export default function AutocompleteDropdown({
  quillRef,
  isVisible,
  onSuggestionSelect,
  onClose,
  position,
  currentWord,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef(null);

  // Combine Trie and fuzzy for candidates
  function getCandidates(val) {
    const trie = getSharedTrie();
    const prefixMatches = trie.getCompletions(val, 10);
    const fuzzyMatches = getLevenshteinSuggestions(val, trie, 2, 5);
    return Array.from(new Set([...prefixMatches, ...fuzzyMatches]));
  }

  // Extract current word and context
  const extractWordAndContext = useCallback(() => {
    if (!quillRef.current) return { word: "", context: "" };

    const selection = quillRef.current.getSelection();
    if (!selection) return { word: "", context: "" };

    const text = quillRef.current.getText();
    const cursorPos = selection.index;

    // Find the start of the current word
    let wordStart = cursorPos;
    while (wordStart > 0 && /\w/.test(text[wordStart - 1])) {
      wordStart--;
    }

    // Extract current word
    const word = text.slice(wordStart, cursorPos);

    // Extract context (10 words before the cursor)
    const beforeCursor = text.slice(0, wordStart).trim();
    const words = beforeCursor.split(/\s+/).filter((w) => w.length > 0);
    const contextWords = words.slice(-10);
    const context = contextWords.join(" ");

    return { word, context };
  }, [quillRef]);

  const handleSuggestionClick = useCallback(
    (suggestion) => {
      onSuggestionSelect(suggestion);
    },
    [onSuggestionSelect],
  );

  // Update suggestions when current word changes
  useEffect(() => {
    if (!isVisible || !quillRef.current) {
      setSuggestions([]);
      return;
    }

    const updateSuggestions = async () => {
      const { word, context } = extractWordAndContext();
      const wordToUse = currentWord || word;

      if (!wordToUse || wordToUse.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      setSelectedIndex(0);

      try {
        const candidates = getCandidates(wordToUse);

        if (candidates.length === 0) {
          setSuggestions([]);
          setLoading(false);
          return;
        }
        const ranked = await getRankedSuggestions(context, candidates);
        setSuggestions(ranked);
      } catch (err) {
        console.error("Error getting suggestions:", err);
        setSuggestions([]);
      }
      setLoading(false);
    };

    updateSuggestions();
  }, [isVisible, quillRef, currentWord, extractWordAndContext]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isVisible || suggestions.length === 0) return;

      switch (e.key) {
        case keyBoardCommands.DOWN:
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestions.length);
          break;
        case keyBoardCommands.UP:
          e.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + suggestions.length) % suggestions.length,
          );
          break;
        case keyBoardCommands.ENTER:
        case keyBoardCommands.TAB:
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            handleSuggestionClick(suggestions[selectedIndex]);
          }
          break;
        case keyBoardCommands.ESC:
          e.preventDefault();
          onClose();
          break;
      }
    };

    if (isVisible) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isVisible, suggestions, selectedIndex, onClose, handleSuggestionClick]);

  if (!isVisible || (!loading && suggestions.length === 0)) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="autocomplete-dropdown"
      style={{
        position: "absolute",
        left: position?.left || 0,
        top: position?.top || 0,
        zIndex: 1000,
      }}
    >
      {loading ? (
        <div className="autocomplete-loading">
          <div className="loading-spinner-small"></div>
          <span>Loading suggestions...</span>
        </div>
      ) : (
        <ul className="autocomplete-list">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className={`autocomplete-item ${index === selectedIndex ? "selected" : ""}`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="suggestion-text">{suggestion}</span>
              {currentWord && (
                <span className="suggestion-completion">
                  {suggestion.slice(currentWord.length)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
