type PuzzleStatusProps = {
  lockedCount: number;
  pieceCount: number;
  progress: number;
};

export function PuzzleStatus({ lockedCount, pieceCount, progress }: PuzzleStatusProps) {
  return (
    <section className="status-row" aria-live="polite">
      <div>
        <span className="status-label">完成率</span>
        <strong>{progress}%</strong>
      </div>
      <div>
        <span className="status-label">ピース</span>
        <strong>
          {lockedCount} / {pieceCount}
        </strong>
      </div>
    </section>
  );
}
