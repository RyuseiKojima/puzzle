import { useRef } from "react";
import type { Dispatch, MutableRefObject, PointerEvent, RefObject, SetStateAction } from "react";
import type { Metrics, PuzzlePiece } from "../types";
import { clamp, rotate } from "../utils/puzzle";

type UsePieceDragParams = {
  applySnap: (piece: PuzzlePiece, metrics: Metrics) => PuzzlePiece;
  boardRef: RefObject<HTMLDivElement>;
  getMetrics: () => Metrics;
  pieces: PuzzlePiece[];
  setPieces: Dispatch<SetStateAction<PuzzlePiece[]>>;
  zIndexRef: MutableRefObject<number>;
};

export function usePieceDrag({ applySnap, boardRef, getMetrics, pieces, setPieces, zIndexRef }: UsePieceDragParams) {
  const activePieceRef = useRef<number | null>(null);
  const pointerOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>, pieceId: number) => {
    const piece = pieces.find((item) => item.id === pieceId);
    if (!piece || piece.locked) return;

    const rect = event.currentTarget.getBoundingClientRect();
    activePieceRef.current = pieceId;
    pointerOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    didDragRef.current = false;
    zIndexRef.current += 1;
    event.currentTarget.style.zIndex = String(zIndexRef.current);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const activeId = activePieceRef.current;
    const board = boardRef.current;
    if (activeId === null || !board) return;

    const dragDistance = Math.hypot(event.clientX - dragStartRef.current.x, event.clientY - dragStartRef.current.y);
    if (dragDistance > 8) didDragRef.current = true;

    const boardRect = board.getBoundingClientRect();
    const metrics = getMetrics();
    const nextX = event.clientX - boardRect.left - pointerOffsetRef.current.x;
    const nextY = event.clientY - boardRect.top - pointerOffsetRef.current.y;

    setPieces((currentPieces) =>
      currentPieces.map((piece) =>
        piece.id === activeId
          ? {
              ...piece,
              x: clamp(nextX, metrics.minX, metrics.maxX),
              y: clamp(nextY, metrics.minY, metrics.maxY),
            }
          : piece
      )
    );
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>, pieceId: number) => {
    event.currentTarget.releasePointerCapture(event.pointerId);

    const metrics = getMetrics();
    const shouldRotate = !didDragRef.current;
    activePieceRef.current = null;
    didDragRef.current = false;

    setPieces((currentPieces) =>
      currentPieces.map((piece) => {
        if (piece.id !== pieceId) return piece;

        const rotatedPiece = shouldRotate ? { ...piece, rotation: rotate(piece.rotation) } : piece;

        return applySnap(rotatedPiece, metrics);
      })
    );
  };

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
