export function createMaskCanvas(
  segmentation: { counts: number[]; size: [number, number] },
  color: string
): HTMLCanvasElement {
  const { counts, size } = segmentation;
  const [height, width] = size;
  const total = width * height;
  const mask = new Uint8Array(total);
  let index = 0;
  for (let i = 0; i < counts.length; i++) {
    const value = i % 2 === 0 ? 0 : 1;
    for (let j = 0; j < counts[i]; j++) {
      if (index < total) {
        mask[index++] = value;
      }
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not obtain 2D context from canvas.");
  const imageData = ctx.createImageData(width, height);
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === 1) {
      imageData.data[i * 4] = r;
      imageData.data[i * 4 + 1] = g;
      imageData.data[i * 4 + 2] = b;
      imageData.data[i * 4 + 3] = 128;
    } else {
      imageData.data[i * 4 + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
