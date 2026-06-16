import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EdgeMap, Metrics, PuzzlePiece, PuzzleSize } from "../types";
import { clamp, createEdgeMap, randomBetween, randomRotation } from "../utils/puzzle";

type UsePuzzlePiecesParams = {
  getMetrics: () => Metrics;
  imageUrl: string;
  size: PuzzleSize;
  updateBoardFrame: () => void;
};

export function usePuzzlePieces({ getMetrics, imageUrl, size, updateBoardFrame }: UsePuzzlePiecesParams) {
  const zIndexRef = useRef(1);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [edges, setEdges] = useState<EdgeMap>(() => createEdgeMap(3));

  const lockedCount = useMemo(() => pieces.filter((piece) => piece.locked).length, [pieces]);
  const progress = pieces.length ? Math.round((lockedCount / pieces.length) * 100) : 0;
  const isComplete = pieces.length > 0 && lockedCount === pieces.length;

  const applySnap = useCallback((piece: PuzzlePiece, metrics: Metrics): PuzzlePiece => {
    const targetX = piece.col * metrics.pieceWidth - metrics.tabSize;
    const targetY = piece.row * metrics.pieceHeight - metrics.tabSize;
    const distance = Math.hypot(piece.x - targetX, piece.y - targetY);

    if (distance > metrics.snapRadius) return piece;

    return {
      ...piece,
      x: targetX,
      y: targetY,
      locked: piece.rotation === 0,
    };
  }, []);

  const scatterPieces = useCallback(() => {
    const metrics = getMetrics();
    zIndexRef.current = 1;

    setPieces((currentPieces) =>
      currentPieces.map((piece) => ({
        ...piece,
        locked: false,
        rotation: randomRotation(),
        x: randomBetween(metrics.minX, metrics.maxX),
        y: randomBetween(metrics.minY, metrics.maxY),
      }))
    );
  }, [getMetrics]);

  const buildPuzzle = useCallback(() => {
    updateBoardFrame();
    const nextEdges = createEdgeMap(size);
    const total = size * size;
    const nextPieces = Array.from({ length: total }, (_, index) => ({
      id: index,
      row: Math.floor(index / size),
      col: index % size,
      locked: false,
      rotation: randomRotation(),
      x: 0,
      y: 0,
    }));

    setEdges(nextEdges);
    setPieces(nextPieces);
  }, [size, updateBoardFrame]);

  useEffect(() => {
    if (!imageUrl) return;
    buildPuzzle();
  }, [buildPuzzle, imageUrl]);

  useEffect(() => {
    if (!pieces.length || !imageUrl) return;
    const frame = requestAnimationFrame(scatterPieces);
    return () => cancelAnimationFrame(frame);
  }, [imageUrl, pieces.length, scatterPieces]);

  useEffect(() => {
    if (!imageUrl) return;

    const onResize = () => {
      updateBoardFrame();
      const metrics = getMetrics();
      setPieces((currentPieces) =>
        currentPieces.map((piece) => {
          if (piece.locked) {
            return {
              ...piece,
              x: piece.col * metrics.pieceWidth - metrics.tabSize,
              y: piece.row * metrics.pieceHeight - metrics.tabSize,
            };
          }

          return {
            ...piece,
            x: clamp(piece.x, metrics.minX, metrics.maxX),
            y: clamp(piece.y, metrics.minY, metrics.maxY),
          };
        })
      );
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [getMetrics, imageUrl, updateBoardFrame]);

  return {
    applySnap,
    edges,
    isComplete,
    lockedCount,
    pieces,
    progress,
    scatterPieces,
    setPieces,
    zIndexRef,
  };
}
