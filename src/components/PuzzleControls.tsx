import type { ChangeEvent } from "react";
import type { PuzzleSize } from "../types";
import { puzzleSizes } from "../utils/puzzle";

type PuzzleControlsProps = {
  size: PuzzleSize;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSizeChange: (size: PuzzleSize) => void;
};

export function PuzzleControls({ size, onImageChange, onSizeChange }: PuzzleControlsProps) {
  return (
    <section className="controls" aria-label="パズル設定">
      <label className="upload-button">
        <input type="file" accept="image/*" onChange={onImageChange} />
        <span aria-hidden="true">＋</span>
        <span>写真を選ぶ</span>
      </label>

      <div className="segmented" role="group" aria-label="難易度">
        {puzzleSizes.map((option) => (
          <button
            className={`segment ${size === option ? "active" : ""}`}
            type="button"
            key={option}
            onClick={() => onSizeChange(option)}
          >
            {option} x {option}
          </button>
        ))}
      </div>
    </section>
  );
}
