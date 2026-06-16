import { useState } from "react";
import type { PuzzleSize } from "../types";
import { useBoardMetrics } from "./useBoardMetrics";
import { usePieceDrag } from "./usePieceDrag";
import { usePuzzleImage } from "./usePuzzleImage";
import { usePuzzlePieces } from "./usePuzzlePieces";

export function usePuzzleGame() {
  const [size, setSize] = useState<PuzzleSize>(3);
  const { handleImageChange, imageSize, imageUrl } = usePuzzleImage();
  const { boardRef, boardWrapRef, getMetrics, updateBoardFrame } = useBoardMetrics(size, imageSize);
  const {
    applySnap,
    edges,
    isComplete,
    lockedCount,
    pieces,
    progress,
    scatterPieces,
    setPieces,
    zIndexRef,
  } = usePuzzlePieces({
    getMetrics,
    imageUrl,
    size,
    updateBoardFrame,
  });
  const { handlePointerDown, handlePointerMove, handlePointerUp } = usePieceDrag({
    applySnap,
    boardRef,
    getMetrics,
    pieces,
    setPieces,
    zIndexRef,
  });

  const handleSizeChange = (nextSize: PuzzleSize) => {
    setSize(nextSize);
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
