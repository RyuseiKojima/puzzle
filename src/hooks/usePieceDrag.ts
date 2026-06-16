import { useRef } from "react";
import type { Dispatch, MutableRefObject, PointerEvent, RefObject, SetStateAction } from "react";
import type { Metrics, PuzzlePiece } from "../types";
import { clamp, rotate } from "../utils/puzzle";

type UsePieceDragParams = Readonly<{
  applySnap: (piece: PuzzlePiece, metrics: Metrics) => PuzzlePiece;
  boardRef: RefObject<HTMLDivElement>;
  getMetrics: () => Metrics;
  pieces: PuzzlePiece[];
  setPieces: Dispatch<SetStateAction<PuzzlePiece[]>>;
  zIndexRef: MutableRefObject<number>;
}>;

type UsePieceDragResult = Readonly<{
  handlePointerDown: (event: PointerEvent<HTMLButtonElement>, pieceId: number) => void;
  handlePointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  handlePointerUp: (event: PointerEvent<HTMLButtonElement>, pieceId: number) => void;
}>;

/**
 * ピースの pointer 操作を管理する。
 *
 * ドラッグ中は盤面内に収まるよう位置を更新し、クリックに近い操作ではピースを回転させる。
 */
export function usePieceDrag({ applySnap, boardRef, getMetrics, pieces, setPieces, zIndexRef }: UsePieceDragParams): UsePieceDragResult {
  const activePieceRef = useRef<number | null>(null);
  const pointerOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);

  /**
   * 操作対象のピースを記録し、pointer 位置とピース左上の差分を保持する。
   */
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

  /**
   * pointer の移動量に合わせて、アクティブなピースの座標を更新する。
   */
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

  /**
   * 操作終了時にクリックなら回転、ドラッグなら現在位置を確定し、必要に応じて正解位置へ吸着する。
   */
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
