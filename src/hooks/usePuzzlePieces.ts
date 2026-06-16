import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { EdgeMap, Metrics, PuzzlePiece, PuzzleSize } from "../types";
import { clamp, createEdgeMap, randomBetween, randomRotation } from "../utils/puzzle";

type UsePuzzlePiecesParams = Readonly<{
  getMetrics: () => Metrics;
  imageUrl: string;
  size: PuzzleSize;
  updateBoardFrame: () => void;
}>;

type UsePuzzlePiecesResult = Readonly<{
  applySnap: (piece: PuzzlePiece, metrics: Metrics) => PuzzlePiece;
  edges: EdgeMap;
  isComplete: boolean;
  lockedCount: number;
  pieces: PuzzlePiece[];
  progress: number;
  scatterPieces: () => void;
  setPieces: Dispatch<SetStateAction<PuzzlePiece[]>>;
  zIndexRef: MutableRefObject<number>;
}>;

/**
 * パズルピースの生成、散布、完成判定、スナップ判定をまとめて管理する。
 *
 * 画像またはサイズが変わるとピースとエッジ情報を作り直し、リサイズ時には位置を盤面内へ補正する。
 */
export function usePuzzlePieces({ getMetrics, imageUrl, size, updateBoardFrame }: UsePuzzlePiecesParams): UsePuzzlePiecesResult {
  const zIndexRef = useRef(1);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [edges, setEdges] = useState<EdgeMap>(() => createEdgeMap(3));

  const lockedCount = useMemo(() => pieces.filter((piece) => piece.locked).length, [pieces]);
  const progress = pieces.length ? Math.round((lockedCount / pieces.length) * 100) : 0;
  const isComplete = pieces.length > 0 && lockedCount === pieces.length;

  /**
   * ピースが正解位置の近くにある場合、正解座標へ吸着させる。
   *
   * 回転が 0 度のときだけ固定済みにして、完成判定へ反映する。
   */
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

  /**
   * 既存のピースを盤面上へランダムに再配置し、回転と固定状態をリセットする。
   */
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

  /**
   * 現在の分割数に合わせてエッジ形状とピース一覧を初期化する。
   */
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

  // ピース生成直後は DOM の寸法反映を待ってから散布する。
  useEffect(() => {
    if (!pieces.length || !imageUrl) return;
    const frame = requestAnimationFrame(scatterPieces);
    return () => cancelAnimationFrame(frame);
  }, [imageUrl, pieces.length, scatterPieces]);

  // 画面サイズが変わったときは、固定済みピースを正解位置へ戻し、未固定ピースは表示範囲内に収める。
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
