export type Rect = { x: number; y: number; width: number; height: number };

export async function cropImage(
  dataUrl: string,
  rect: Rect,
  viewportWidth: number
): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  // The screenshot has more pixels than the page has CSS pixels on high-DPI screens
  const scale = img.width / viewportWidth;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(rect.width * scale);
  canvas.height = Math.round(rect.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(
    img,
    rect.x * scale,
    rect.y * scale,
    rect.width * scale,
    rect.height * scale,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL("image/jpeg", 0.9);
}