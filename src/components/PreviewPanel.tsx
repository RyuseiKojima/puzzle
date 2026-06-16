type PreviewPanelProps = {
  imageUrl: string;
};

export function PreviewPanel({ imageUrl }: PreviewPanelProps) {
  return (
    <aside className={`preview-panel ${imageUrl ? "has-image" : ""}`} aria-label="完成イメージ">
      {imageUrl ? <img src={imageUrl} alt="選択した写真のプレビュー" /> : null}
      <p>写真を選ぶと、ここに完成イメージが表示されます。</p>
    </aside>
  );
}
