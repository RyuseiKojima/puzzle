import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { getImageDimensions } from "../utils/image";

type PuzzleImageSize = Readonly<{
  width: number;
  height: number;
}>;

type UsePuzzleImageResult = Readonly<{
  handleImageChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  imageSize: PuzzleImageSize;
  imageUrl: string;
}>;

/**
 * ユーザーが選択した画像ファイルをパズル用の object URL として管理する。
 *
 * 画像の実寸もあわせて保持し、盤面のアスペクト比計算に利用できる形で返す。
 */
export function usePuzzleImage(): UsePuzzleImageResult {
  const [imageUrl, setImageUrl] = useState("");
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });

  // 作成した object URL はブラウザメモリを使うため、差し替えや unmount 時に解放する。
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  /**
   * ファイル入力の変更を受け取り、画像 URL と寸法情報を更新する。
   */
  const handleImageChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextUrl = URL.createObjectURL(file);
    const nextSize = await getImageDimensions(nextUrl);

    setImageSize(nextSize);
    setImageUrl(nextUrl);
  }, []);

  return {
    handleImageChange,
    imageSize,
    imageUrl,
  };
}
