import { PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type PuzzleSize = 3 | 4 | 5;
type Rotation = 0 | 90 | 180 | 270;

type EdgeMap = {
  top: number[][];
  right: number[][];
  bottom: number[][];
  left: number[][];
};

type Metrics = {
  boardWidth: number;
  boardHeight: number;
  pieceWidth: number;
  pieceHeight: number;
  tabSize: number;
  visualWidth: number;
  visualHeight: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  snapRadius: number;
};

type PuzzlePiece = {
  id: number;
  row: number;
  col: number;
  locked: boolean;
  rotation: Rotation;
  x: number;
  y: number;
};

const puzzleSizes: PuzzleSize[] = [3, 4, 5];
const rotations: Rotation[] = [0, 90, 180, 270];

export default function App() {
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
  const [edges, setEdges] = useState<EdgeMap>(() => createEdgeMap(3));

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

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

        const rotatedPiece = shouldRotate
          ? { ...piece, rotation: rotate(piece.rotation) }
          : piece;

        return applySnap(rotatedPiece, metrics);
      })
    );
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Photo Puzzle</p>
          <h1>写真をパズルにする</h1>
        </div>
        <button className="icon-button" type="button" aria-label="シャッフル" title="シャッフル" onClick={scatterPieces}>
          <span aria-hidden="true">↻</span>
        </button>
      </header>

      <section className="controls" aria-label="パズル設定">
        <label className="upload-button">
          <input type="file" accept="image/*" onChange={handleImageChange} />
          <span aria-hidden="true">＋</span>
          <span>写真を選ぶ</span>
        </label>

        <div className="segmented" role="group" aria-label="難易度">
          {puzzleSizes.map((option) => (
            <button
              className={`segment ${size === option ? "active" : ""}`}
              type="button"
              key={option}
              onClick={() => handleSizeChange(option)}
            >
              {option} x {option}
            </button>
          ))}
        </div>
      </section>

      <section className="status-row" aria-live="polite">
        <div>
          <span className="status-label">完成率</span>
          <strong>{progress}%</strong>
        </div>
        <div>
          <span className="status-label">ピース</span>
          <strong>
            {lockedCount} / {pieces.length}
          </strong>
        </div>
      </section>

      <section className="play-area">
        <div className="board-wrap" ref={boardWrapRef}>
          <div
            className={`board ${imageUrl ? "" : "empty"}`}
            ref={boardRef}
            aria-label="パズル盤面"
            style={{ backgroundSize: `${100 / size}% ${100 / size}%` }}
          >
            {pieces.map((piece) => (
              <PuzzlePieceView
                key={piece.id}
                piece={piece}
                imageUrl={imageUrl}
                metrics={getMetrics()}
                edges={edges}
                size={size}
                isDragging={activePieceRef.current === piece.id}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />
            ))}
          </div>
          <div className="complete-banner" hidden={!isComplete}>
            <strong>完成！</strong>
            <span>別の写真でも遊べます</span>
          </div>
        </div>

        <aside className={`preview-panel ${imageUrl ? "has-image" : ""}`} aria-label="完成イメージ">
          {imageUrl ? <img src={imageUrl} alt="選択した写真のプレビュー" /> : null}
          <p>写真を選ぶと、ここに完成イメージが表示されます。</p>
        </aside>
      </section>
    </main>
  );
}

type PuzzlePieceViewProps = {
  piece: PuzzlePiece;
  imageUrl: string;
  metrics: Metrics;
  edges: EdgeMap;
  size: PuzzleSize;
  isDragging: boolean;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>, pieceId: number) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLButtonElement>, pieceId: number) => void;
};

function PuzzlePieceView({
  piece,
  imageUrl,
  metrics,
  edges,
  size,
  isDragging,
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
      className={`piece ${piece.locked ? "locked" : ""} ${isDragging ? "dragging" : ""}`}
      style={
        {
          "--piece-w": `${metrics.visualWidth}px`,
          "--piece-h": `${metrics.visualHeight}px`,
          "--rotation": `${piece.rotation}deg`,
          transform: `translate3d(${piece.x}px, ${piece.y}px, 0)`,
          zIndex,
        } as React.CSSProperties
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

function createEdgeMap(size: PuzzleSize): EdgeMap {
  const top = Array.from({ length: size }, () => Array(size).fill(0));
  const right = Array.from({ length: size }, () => Array(size).fill(0));
  const bottom = Array.from({ length: size }, () => Array(size).fill(0));
  const left = Array.from({ length: size }, () => Array(size).fill(0));

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (col < size - 1) {
        const sign = Math.random() > 0.5 ? 1 : -1;
        right[row][col] = sign;
        left[row][col + 1] = -sign;
      }

      if (row < size - 1) {
        const sign = Math.random() > 0.5 ? 1 : -1;
        bottom[row][col] = sign;
        top[row + 1][col] = -sign;
      }
    }
  }

  return { top, right, bottom, left };
}

function createPiecePath(piece: PuzzlePiece, metrics: Metrics, edges: EdgeMap) {
  const x = metrics.tabSize;
  const y = metrics.tabSize;
  const w = metrics.pieceWidth;
  const h = metrics.pieceHeight;
  const top = edges.top[piece.row][piece.col];
  const right = edges.right[piece.row][piece.col];
  const bottom = edges.bottom[piece.row][piece.col];
  const left = edges.left[piece.row][piece.col];

  const commands = [`M ${x} ${y}`];
  addHorizontalEdge(commands, x, y, w, top, "top");
  addVerticalEdge(commands, x + w, y, h, right, "right");
  addHorizontalEdge(commands, x + w, y + h, -w, bottom, "bottom");
  addVerticalEdge(commands, x, y + h, -h, left, "left");
  commands.push("Z");

  return commands.join(" ");
}

function addHorizontalEdge(commands: string[], x: number, y: number, width: number, sign: number, side: "top" | "bottom") {
  const direction = Math.sign(width);
  const length = Math.abs(width);
  const outward = side === "top" ? -sign : sign;
  const tab = length * 0.23;
  const neck = length * 0.18;
  const depth = length * 0.18 * outward;
  const p1 = 0.34 * length;
  const p2 = 0.5 * length;
  const p3 = 0.66 * length;
  const sx = (value: number) => x + direction * value;

  if (!sign) {
    commands.push(`L ${x + width} ${y}`);
    return;
  }

  commands.push(`L ${sx(p1 - neck)} ${y}`);
  commands.push(`C ${sx(p1 - tab * 0.25)} ${y} ${sx(p1)} ${y + depth} ${sx(p2 - tab * 0.5)} ${y + depth}`);
  commands.push(`C ${sx(p2 - tab * 0.2)} ${y + depth * 1.3} ${sx(p2 + tab * 0.2)} ${y + depth * 1.3} ${sx(p2 + tab * 0.5)} ${y + depth}`);
  commands.push(`C ${sx(p3)} ${y + depth} ${sx(p3 + tab * 0.25)} ${y} ${sx(p3 + neck)} ${y}`);
  commands.push(`L ${x + width} ${y}`);
}

function addVerticalEdge(commands: string[], x: number, y: number, height: number, sign: number, side: "left" | "right") {
  const direction = Math.sign(height);
  const length = Math.abs(height);
  const outward = side === "left" ? -sign : sign;
  const tab = length * 0.23;
  const neck = length * 0.18;
  const depth = length * 0.18 * outward;
  const p1 = 0.34 * length;
  const p2 = 0.5 * length;
  const p3 = 0.66 * length;
  const sy = (value: number) => y + direction * value;

  if (!sign) {
    commands.push(`L ${x} ${y + height}`);
    return;
  }

  commands.push(`L ${x} ${sy(p1 - neck)}`);
  commands.push(`C ${x} ${sy(p1 - tab * 0.25)} ${x + depth} ${sy(p1)} ${x + depth} ${sy(p2 - tab * 0.5)}`);
  commands.push(`C ${x + depth * 1.3} ${sy(p2 - tab * 0.2)} ${x + depth * 1.3} ${sy(p2 + tab * 0.2)} ${x + depth} ${sy(p2 + tab * 0.5)}`);
  commands.push(`C ${x + depth} ${sy(p3)} ${x} ${sy(p3 + tab * 0.25)} ${x} ${sy(p3 + neck)}`);
  commands.push(`L ${x} ${y + height}`);
}

function getImageDimensions(src: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth || 1, height: image.naturalHeight || 1 });
    image.onerror = () => resolve({ width: 1, height: 1 });
    image.src = src;
  });
}

function randomRotation(): Rotation {
  return rotations[Math.floor(Math.random() * rotations.length)];
}

function rotate(rotation: Rotation): Rotation {
  return (((rotation + 90) % 360) as Rotation);
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
