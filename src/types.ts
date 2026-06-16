export type PuzzleSize = 3 | 4 | 5;
export type Rotation = 0 | 90 | 180 | 270;

export type EdgeMap = {
  top: number[][];
  right: number[][];
  bottom: number[][];
  left: number[][];
};

export type Metrics = {
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

export type PuzzlePiece = {
  id: number;
  row: number;
  col: number;
  locked: boolean;
  rotation: Rotation;
  x: number;
  y: number;
};
