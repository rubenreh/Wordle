/* 
Author: Ruben Rehal
Date: 03/08/2026
*/

import { useState, useEffect, useCallback } from "react";
import GameBoard from "./components/GameBoard";
import Keyboard from "./components/Keyboard";
import "./App.css";

const API_URL = "http://localhost:8000";

function App() {
  // game setup
  const [wordLength, setWordLength] = useState(5);
  const [gameId, setGameId] = useState(null);
  const [game, setGame] = useState(null);

  // what the user is currently typing
  const [currentGuess, setCurrentGuess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // clear error messages after a couple seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 2500);
    return () => clearTimeout(timer);
  }, [error]);

  // --- API calls ---

  const startNewGame = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word_length: wordLength }),
      });
      const data = await res.json();
      setGameId(data.game_id);
      setGame(data);
      setCurrentGuess("");
      setError("");
    } catch (err) {
      console.error("Failed to create game:", err);
      setError("Could not connect to the server");
    }
    setLoading(false);
  };

  const submitGuess = useCallback(async () => {
    if (!gameId || !game) return;
    if (currentGuess.length !== game.word_length) return;
    if (game.status !== "in_progress") return;

    try {
      const res = await fetch(`${API_URL}/games/${gameId}/guesses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: currentGuess }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.detail || "Invalid guess");
        return;
      }

      const data = await res.json();
      setGame(data);
      setCurrentGuess("");
    } catch (err) {
      console.error("Failed to submit guess:", err);
      setError("Something went wrong");
    }
  }, [gameId, game, currentGuess]);

  // --- Keyboard input handling ---

  const handleKey = useCallback(
    (key) => {
      if (!game || game.status !== "in_progress") return;

      if (key === "Enter") {
        submitGuess();
      } else if (key === "Backspace") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (key.length === 1 && key.match(/[a-z]/i)) {
        setCurrentGuess((prev) => {
          if (prev.length >= game.word_length) return prev;
          return prev + key.toLowerCase();
        });
      }
    },
    [game, submitGuess]
  );

  // listen for physical keyboard
  useEffect(() => {
    const onKeyDown = (e) => {
      // don't capture if user is focused on some other input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      handleKey(e.key);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  // --- Build letter states for the keyboard colors ---
  // Priority: green > yellow > gray
  const letterStates = {};
  if (game) {
    for (const guess of game.guesses) {
      for (const fb of guess.feedback) {
        const prev = letterStates[fb.letter];
        if (fb.result === "green") {
          letterStates[fb.letter] = "green";
        } else if (fb.result === "yellow" && prev !== "green") {
          letterStates[fb.letter] = "yellow";
        } else if (!prev) {
          letterStates[fb.letter] = "gray";
        }
      }
    }
  }

  // --- New game screen (no active game) ---

  if (!gameId || !game) {
    return (
      <div className="app">
        <h1 className="title">Wordle</h1>
        <div className="new-game-screen">
          <p>Choose the word length to get started:</p>
          <div className="length-picker">
            {[5, 6, 7, 8].map((len) => (
              <button
                key={len}
                className={`length-btn ${wordLength === len ? "selected" : ""}`}
                onClick={() => setWordLength(len)}
              >
                {len}
              </button>
            ))}
          </div>
          <p className="hint">
            You&apos;ll get {wordLength + 1} guesses to find a {wordLength}-letter word.
          </p>
          <button
            className="start-btn"
            onClick={startNewGame}
            disabled={loading}
          >
            {loading ? "Starting..." : "Start Game"}
          </button>
        </div>
      </div>
    );
  }

  // --- Active game ---

  const gameOver = game.status === "won" || game.status === "lost";

  return (
    <div className="app">
      <h1 className="title">Wordle</h1>

      {error && <div className="error-toast">{error}</div>}

      <GameBoard
        guesses={game.guesses}
        currentGuess={currentGuess}
        wordLength={game.word_length}
        maxGuesses={game.max_guesses}
      />

      <Keyboard onKey={handleKey} letterStates={letterStates} />

      {gameOver && (
        <div className="game-over">
          {game.status === "won" ? (
            <p className="result-msg win">Nice! You got it!</p>
          ) : (
            <p className="result-msg lose">
              The word was <strong>{game.answer}</strong>
            </p>
          )}
          <button className="start-btn" onClick={() => { setGameId(null); setGame(null); }}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
