import type { PointerEvent, RefObject } from "react";
import type { EdgeMap, Metrics, PuzzlePiece, PuzzleSize } from "../types";
import { PuzzlePieceView } from "./PuzzlePieceView";

type PuzzleBoardProps = {
  boardRef: RefObject<HTMLDivElement>;
  boardWrapRef: RefObject<HTMLDivElement>;
  edges: EdgeMap;
  getMetrics: () => Metrics;
  imageUrl: string;
  isComplete: boolean;
  pieces: PuzzlePiece[];
  size: PuzzleSize;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>, pieceId: number) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLButtonElement>, pieceId: number) => void;
};

export function PuzzleBoard({
  boardRef,
  boardWrapRef,
  edges,
  getMetrics,
  imageUrl,
  isComplete,
  pieces,
  size,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: PuzzleBoardProps) {
  const metrics = getMetrics();

  return (
    <div className="board-wrap" ref={boardWrapRef}>
      <div
        className={`board ${imageUrl ? "" : "empty"}`}
        ref={boardRef}
        aria-label="パズル盤面"
        style={{ backgroundSize: `${100 / size}% ${100 / size}%` }}
      >
        {pieces.map((piece) => (
          <PuzzlePieceView
            key={piece.id}
            piece={piece}
            imageUrl={imageUrl}
            metrics={metrics}
            edges={edges}
            size={size}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        ))}
      </div>
      <div className="complete-banner" hidden={!isComplete}>
        <strong>完成！</strong>
        <span>別の写真でも遊べます</span>
      </div>
    </div>
  );
}
