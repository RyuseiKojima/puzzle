import type { EdgeMap, Metrics, PuzzlePiece, PuzzleSize, Rotation } from "../types";

export const puzzleSizes: PuzzleSize[] = [3, 4, 5];

const rotations: Rotation[] = [0, 90, 180, 270];

export function createEdgeMap(size: PuzzleSize): EdgeMap {
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

export function createPiecePath(piece: PuzzlePiece, metrics: Metrics, edges: EdgeMap) {
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

export function randomRotation(): Rotation {
  return rotations[Math.floor(Math.random() * rotations.length)];
}

export function rotate(rotation: Rotation): Rotation {
  return ((rotation + 90) % 360) as Rotation;
}

export function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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
