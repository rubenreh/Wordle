/* 
Author: Ruben Rehal
Date: 03/08/2026
*/

function GameBoard({ guesses, currentGuess, wordLength, maxGuesses }) {
  // figure out how many empty rows we need after the current guess row
  const emptyRows = maxGuesses - guesses.length - (guesses.length < maxGuesses ? 1 : 0);

  return (
    <div className="board">
      {/* completed guesses with feedback colors */}
      {guesses.map((guess, rowIndex) => (
        <div className="board-row" key={rowIndex}>
          {guess.feedback.map((fb, i) => (
            <div className={`tile ${fb.result}`} key={i}>
              {fb.letter}
            </div>
          ))}
        </div>
      ))}

      {/* the row the player is currently typing in */}
      {guesses.length < maxGuesses && (
        <div className="board-row">
          {Array.from({ length: wordLength }).map((_, i) => (
            <div
              className={`tile ${currentGuess[i] ? "filled" : ""}`}
              key={i}
            >
              {currentGuess[i] || ""}
            </div>
          ))}
        </div>
      )}

      {/* remaining empty rows */}
      {Array.from({ length: emptyRows }).map((_, rowIndex) => (
        <div className="board-row" key={`empty-${rowIndex}`}>
          {Array.from({ length: wordLength }).map((_, i) => (
            <div className="tile" key={i}></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default GameBoard;
