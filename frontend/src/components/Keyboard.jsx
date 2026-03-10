/* 
Author: Ruben Rehal
Date: 03/08/2026
*/

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["Enter", "z", "x", "c", "v", "b", "n", "m", "Backspace"],
];

function Keyboard({ onKey, letterStates }) {
  const getKeyClass = (key) => {
    // Enter and Backspace don't get colored
    if (key === "Enter" || key === "Backspace") return "key wide";
    const state = letterStates[key];
    if (state) return `key ${state}`;
    return "key";
  };

  const getLabel = (key) => {
    if (key === "Backspace") return "⌫";
    return key;
  };

  return (
    <div className="keyboard">
      {ROWS.map((row, rowIndex) => (
        <div className="keyboard-row" key={rowIndex}>
          {row.map((key) => (
            <button
              className={getKeyClass(key)}
              key={key}
              onClick={() => onKey(key)}
            >
              {getLabel(key)}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Keyboard;
