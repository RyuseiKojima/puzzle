import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent } from "react";
import type { Metrics, PuzzlePiece, PuzzleSize } from "../types";
import { getImageDimensions } from "../utils/image";
import { clamp, createEdgeMap, randomBetween, randomRotation, rotate } from "../utils/puzzle";

export function usePuzzleGame() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const boardWrapRef = useRef<HTMLDivElement | null>(null);
  const activePieceRef = useRef<number | null>(null);
  const pointerOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);
  const zIndexRef = useRef(1);

  const [imageUrl, setImageUrl] = useState("");
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [size, setSize] = useState<PuzzleSize>(3);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [edges, setEdges] = useState(() => createEdgeMap(3));

  const lockedCount = useMemo(() => pieces.filter((piece) => piece.locked).length, [pieces]);
  const progress = pieces.length ? Math.round((lockedCount / pieces.length) * 100) : 0;
  const isComplete = pieces.length > 0 && lockedCount === pieces.length;

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const updateBoardFrame = useCallback(() => {
    const boardWrap = boardWrapRef.current;
    const playArea = boardWrap?.parentElement;
    if (!boardWrap || !playArea) return;

    const ratio = imageSize.width / imageSize.height || 1;
    const playAreaStyle = getComputedStyle(playArea);
    const gap = Number.parseFloat(playAreaStyle.columnGap) || 0;
    const isSingleColumn = window.matchMedia("(max-width: 720px)").matches;
    const previewWidth = isSingleColumn ? 0 : 220;
    const availableWidth = playArea.clientWidth - previewWidth - (isSingleColumn ? 0 : gap);
    const maxHeight = Math.min(window.innerHeight * 0.68, 760);
    const fittedWidth = Math.min(availableWidth, maxHeight * ratio);

    boardWrap.style.width = `${Math.max(180, fittedWidth)}px`;
    boardWrap.style.aspectRatio = `${imageSize.width} / ${imageSize.height}`;
  }, [imageSize]);

  const getMetrics = useCallback((): Metrics => {
    const board = boardRef.current;
    const boardWidth = board?.clientWidth ?? 0;
    const boardHeight = board?.clientHeight ?? 0;
    const pieceWidth = boardWidth / size;
    const pieceHeight = boardHeight / size;
    const tabSize = Math.max(8, Math.max(pieceWidth, pieceHeight) * 0.18);

    return {
      boardWidth,
      boardHeight,
      pieceWidth,
      pieceHeight,
      tabSize,
      visualWidth: pieceWidth + tabSize * 2,
      visualHeight: pieceHeight + tabSize * 2,
      minX: -tabSize,
      minY: -tabSize,
      maxX: boardWidth - pieceWidth - tabSize,
      maxY: boardHeight - pieceHeight - tabSize,
      snapRadius: Math.max(18, pieceWidth * 0.28),
    };
  }, [size]);

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

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextUrl = URL.createObjectURL(file);
    const nextSize = await getImageDimensions(nextUrl);

    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageSize(nextSize);
    setImageUrl(nextUrl);
  };

  const handleSizeChange = (nextSize: PuzzleSize) => {
    setSize(nextSize);
  };

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
    event.currentTarget.style.zIndex = String(++zIndexRef.current);
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
    boardRef,
    boardWrapRef,
    edges,
    getMetrics,
    handleImageChange,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleSizeChange,
    imageUrl,
    isComplete,
    lockedCount,
    pieces,
    progress,
    scatterPieces,
    size,
  };
}
