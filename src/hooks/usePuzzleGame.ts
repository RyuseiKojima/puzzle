import { useState } from "react";
import type { ChangeEvent, PointerEvent, RefObject } from "react";
import type { EdgeMap, Metrics, PuzzlePiece, PuzzleSize } from "../types";
import { useBoardMetrics } from "./useBoardMetrics";
import { usePieceDrag } from "./usePieceDrag";
import { usePuzzleImage } from "./usePuzzleImage";
import { usePuzzlePieces } from "./usePuzzlePieces";

type UsePuzzleGameResult = Readonly<{
  boardRef: RefObject<HTMLDivElement>;
  boardWrapRef: RefObject<HTMLDivElement>;
  edges: EdgeMap;
  getMetrics: () => Metrics;
  handleImageChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handlePointerDown: (event: PointerEvent<HTMLButtonElement>, pieceId: number) => void;
  handlePointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  handlePointerUp: (event: PointerEvent<HTMLButtonElement>, pieceId: number) => void;
  handleSizeChange: (nextSize: PuzzleSize) => void;
  imageUrl: string;
  isComplete: boolean;
  lockedCount: number;
  pieces: PuzzlePiece[];
  progress: number;
  scatterPieces: () => void;
  size: PuzzleSize;
}>;

/**
 * パズル画面で必要な状態と操作を組み合わせるファサード hook。
 *
 * UI コンポーネントはこの hook の戻り値を使うことで、画像選択・盤面寸法・ピース操作をまとめて扱える。
 */
export function usePuzzleGame(): UsePuzzleGameResult {
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

  /**
   * 分割数の変更を受け取り、ピース再生成の起点となる size state を更新する。
   */
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
