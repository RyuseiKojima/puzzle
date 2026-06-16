import { PreviewPanel } from "./components/PreviewPanel";
import { PuzzleBoard } from "./components/PuzzleBoard";
import { PuzzleControls } from "./components/PuzzleControls";
import { PuzzleStatus } from "./components/PuzzleStatus";
import { usePuzzleGame } from "./hooks/usePuzzleGame";

export default function App() {
  const puzzle = usePuzzleGame();

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Photo Puzzle</p>
          <h1>写真をパズルにする</h1>
        </div>
        <button className="icon-button" type="button" aria-label="シャッフル" title="シャッフル" onClick={puzzle.scatterPieces}>
          <span aria-hidden="true">↻</span>
        </button>
      </header>

      <PuzzleControls size={puzzle.size} onImageChange={puzzle.handleImageChange} onSizeChange={puzzle.handleSizeChange} />

      <PuzzleStatus lockedCount={puzzle.lockedCount} pieceCount={puzzle.pieces.length} progress={puzzle.progress} />

      <section className="play-area">
        <PuzzleBoard
          boardRef={puzzle.boardRef}
          boardWrapRef={puzzle.boardWrapRef}
          edges={puzzle.edges}
          getMetrics={puzzle.getMetrics}
          imageUrl={puzzle.imageUrl}
          isComplete={puzzle.isComplete}
          pieces={puzzle.pieces}
          size={puzzle.size}
          onPointerDown={puzzle.handlePointerDown}
          onPointerMove={puzzle.handlePointerMove}
          onPointerUp={puzzle.handlePointerUp}
        />

        <PreviewPanel imageUrl={puzzle.imageUrl} />
      </section>
    </main>
  );
}
