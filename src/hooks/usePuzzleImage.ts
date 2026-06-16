import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { getImageDimensions } from "../utils/image";

export function usePuzzleImage() {
  const [imageUrl, setImageUrl] = useState("");
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

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
