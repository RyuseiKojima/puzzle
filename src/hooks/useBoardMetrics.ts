import { useCallback, useRef } from "react";
import type { RefObject } from "react";
import type { Metrics, PuzzleSize } from "../types";

type ImageSize = Readonly<{
  width: number;
  height: number;
}>;

type UseBoardMetricsResult = Readonly<{
  boardRef: RefObject<HTMLDivElement>;
  boardWrapRef: RefObject<HTMLDivElement>;
  getMetrics: () => Metrics;
  updateBoardFrame: () => void;
}>;

/**
 * 盤面 DOM の参照と、ピース描画・ドラッグ判定に必要な寸法情報を管理する。
 *
 * 画像比率と画面幅に応じて盤面サイズを更新し、各 hook から最新の metrics を取得できるようにする。
 */
export function useBoardMetrics(size: PuzzleSize, imageSize: ImageSize): UseBoardMetricsResult {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const boardWrapRef = useRef<HTMLDivElement | null>(null);

  /**
   * 画像のアスペクト比を保ったまま、利用可能な表示領域に収まる盤面サイズへ調整する。
   */
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

  /**
   * 現在の盤面サイズから、ピースの実寸・タブ幅・移動可能範囲・スナップ距離を算出する。
   */
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
