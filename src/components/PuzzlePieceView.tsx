import type { CSSProperties, PointerEvent } from "react";
import type { EdgeMap, Metrics, PuzzlePiece, PuzzleSize } from "../types";
import { createPiecePath } from "../utils/puzzle";

type PuzzlePieceViewProps = {
  piece: PuzzlePiece;
  imageUrl: string;
  metrics: Metrics;
  edges: EdgeMap;
  size: PuzzleSize;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>, pieceId: number) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLButtonElement>, pieceId: number) => void;
};

export function PuzzlePieceView({
  piece,
  imageUrl,
  metrics,
  edges,
  size,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: PuzzlePieceViewProps) {
  const path = createPiecePath(piece, metrics, edges);
  const clipId = `piece-clip-${size}-${piece.row}-${piece.col}`;
  const imageX = metrics.tabSize - piece.col * metrics.pieceWidth;
  const imageY = metrics.tabSize - piece.row * metrics.pieceHeight;
  const zIndex = piece.locked ? 1 : undefined;

  return (
    <button
      type="button"
      className={`piece ${piece.locked ? "locked" : ""}`}
      style={
        {
          "--piece-w": `${metrics.visualWidth}px`,
          "--piece-h": `${metrics.visualHeight}px`,
          "--rotation": `${piece.rotation}deg`,
          transform: `translate3d(${piece.x}px, ${piece.y}px, 0)`,
          zIndex,
        } as CSSProperties
      }
      aria-label={`ピース ${piece.id + 1}`}
      onPointerDown={(event) => onPointerDown(event, piece.id)}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => onPointerUp(event, piece.id)}
      onPointerCancel={(event) => onPointerUp(event, piece.id)}
    >
      <svg className="piece-svg" viewBox={`0 0 ${metrics.visualWidth} ${metrics.visualHeight}`} aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <path d={path} />
          </clipPath>
        </defs>
        <image
          href={imageUrl}
          x={imageX}
          y={imageY}
          width={metrics.boardWidth}
          height={metrics.boardHeight}
          preserveAspectRatio="none"
          clipPath={`url(#${clipId})`}
        />
        <path className="piece-outline" d={path} />
      </svg>
    </button>
  );
}
