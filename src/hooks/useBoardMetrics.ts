import { useCallback, useRef } from "react";
import type { Metrics, PuzzleSize } from "../types";

type ImageSize = {
  width: number;
  height: number;
};

export function useBoardMetrics(size: PuzzleSize, imageSize: ImageSize) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const boardWrapRef = useRef<HTMLDivElement | null>(null);

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

  return {
    boardRef,
    boardWrapRef,
    getMetrics,
    updateBoardFrame,
  };
}
