# Author: Ruben Rehal
# Date: 03/08/2026
 
import random
from english_words import get_english_words_set


# grab the full lowercase english word set on startup
# gcide is a good general-purpose dictionary, alpha=True strips non-alpha chars
_clean_words = get_english_words_set(["gcide"], alpha=True, lower=True)

# build lookup dicts by word length for quick access
# valid_guesses = any real word of that length
# target_words = same but excluding plurals (words ending in 's')
_valid_guesses = {}
_target_words = {}

for length in range(5, 9):
    _valid_guesses[length] = {w for w in _clean_words if len(w) == length}
    # filter out likely plurals for target words - not perfect but good enough
    _target_words[length] = {w for w in _valid_guesses[length] if not w.endswith("s")}


def get_random_target(length: int) -> str:
    """Pick a random target word of the given length."""
    words = list(_target_words[length])
    return random.choice(words)


def is_valid_word(word: str, length: int) -> bool:
    """Check if a word is a real english word of the right length."""
    return word.lower() in _valid_guesses.get(length, set())
