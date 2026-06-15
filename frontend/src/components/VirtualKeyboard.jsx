import React from "react";

export default function VirtualKeyboard({
  type = "qwerty", // "qwerty" or "numeric"
  onKey,           // Callback when any key is pressed: (key: string) => void
  onClose          // Callback when the "Done" key is pressed
}) {
  const qwertyLayout = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "-"],
    ["z", "x", "c", "v", "b", "n", "m", ",", ".", "Backspace"],
    ["Space", "Clear", "Done"]
  ];

  const numericLayout = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["Clear", "0", "Backspace"],
    ["Done"]
  ];

  const layout = type === "numeric" ? numericLayout : qwertyLayout;

  const handleKeyClick = (e, key) => {
    e.preventDefault(); // Prevent focus loss on the input field
    if (key === "Done") {
      if (onClose) onClose();
    } else {
      if (onKey) onKey(key);
    }
  };

  return (
    <div className={`virtual-keyboard ${type}-layout`} onMouseDown={(e) => e.preventDefault()}>
      <div className="keyboard-header">
        <span className="keyboard-title">
          {type === "numeric" ? "On-Screen Number Pad" : "On-Screen Keyboard"}
        </span>
        <button className="keyboard-close-btn" onClick={onClose} title="Close keyboard">
          &times;
        </button>
      </div>
      <div className="keyboard-keys">
        {layout.map((row, rIndex) => (
          <div key={rIndex} className="keyboard-row">
            {row.map((key) => {
              let btnClass = "key-btn";
              let displayLabel = key;

              if (key === "Backspace") {
                btnClass += " key-backspace";
                displayLabel = "⌫";
              } else if (key === "Space") {
                btnClass += " key-space";
                displayLabel = "Space";
              } else if (key === "Clear") {
                btnClass += " key-clear";
                displayLabel = "Clear";
              } else if (key === "Done") {
                btnClass += " key-done";
                displayLabel = "Done ✔";
              }

              return (
                <button
                  key={key}
                  className={btnClass}
                  onClick={(e) => handleKeyClick(e, key)}
                  type="button"
                >
                  {displayLabel}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
