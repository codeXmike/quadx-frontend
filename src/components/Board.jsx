import { useState, useRef, useEffect } from "react";

function Board({ board, canPlay, onDrop, playersByMark, hideDropButtons, winningCells }) {
  const cols = board?.[0]?.length || 7;
  const [hoveredCol, setHoveredCol] = useState(null);
  const [animCells, setAnimCells] = useState(new Set());
  const prevBoardRef = useRef(board);

  // Detect newly placed cells and trigger animation
  useEffect(() => {
    const prev = prevBoardRef.current;
    const newAnimCells = new Set();
    if (prev && board) {
      for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[r].length; c++) {
          if (!prev[r]?.[c] && board[r][c]) {
            newAnimCells.add(`${r}-${c}`);
          }
        }
      }
    }
    if (newAnimCells.size) {
      setAnimCells(newAnimCells);
      const t = setTimeout(() => setAnimCells(new Set()), 400);
      prevBoardRef.current = board;
      return () => clearTimeout(t);
    }
    prevBoardRef.current = board;
  }, [board]);

  const winSet = new Set((winningCells || []).map(([r, c]) => `${r}-${c}`));

  function handleDrop(col) {
    if (!canPlay) return;
    onDrop(col);
  }

  return (
    <div
      className="board-outer"
      style={{
        "--board-cols": cols,
      }}
    >
      {!hideDropButtons && (
        <div className="drop-cols">
          {Array.from({ length: cols }).map((_, col) => (
            <button
              key={col}
              className="drop-btn"
              onClick={() => handleDrop(col)}
              onMouseEnter={() => setHoveredCol(col)}
              onMouseLeave={() => setHoveredCol(null)}
              disabled={!canPlay}
              title={`Drop in column ${col + 1}`}
            >
              ↓
            </button>
          ))}
        </div>
      )}

      <div className="board-grid">
        {board.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const key = `${rowIdx}-${colIdx}`;
            const color = cell ? playersByMark[cell]?.color : null;
            const isWinning = winSet.has(key);
            const isAnim = animCells.has(key);
            const isColHovered = canPlay && hoveredCol === colIdx;

            let classes = "cell";
            if (cell) classes += " filled";
            if (isWinning) classes += " winning";
            if (isAnim) classes += " drop-anim";

            return (
              <div
                key={key}
                className={classes}
                style={{
                  "--cell-color": color || (isColHovered ? "rgba(245,158,11,0.08)" : "transparent"),
                  cursor: canPlay ? "pointer" : "default",
                  background: isColHovered && !cell ? "rgba(245,158,11,0.04)" : undefined,
                  borderColor: isColHovered && !cell ? "rgba(245,158,11,0.15)" : undefined,
                }}
                onClick={() => handleDrop(colIdx)}
                onMouseEnter={() => setHoveredCol(colIdx)}
                onMouseLeave={() => setHoveredCol(null)}
                title={cell ? `${playersByMark[cell]?.username || cell}` : ""}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default Board;
