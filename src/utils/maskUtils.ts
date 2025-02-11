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

export function cropMaskCanvas(
  sourceCanvas: HTMLCanvasElement,
  bbox: [number, number, number, number]
): HTMLCanvasElement {
  const [x, y, width, height] = bbox;
  const cropped = document.createElement("canvas");
  cropped.width = width;
  cropped.height = height;
  const ctx = cropped.getContext("2d");
  if (ctx) {
    ctx.drawImage(sourceCanvas, x, y, width, height, 0, 0, width, height);
  }
  return cropped;
}

export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export function calculateMaskBBox(
  binaryMask: Uint8Array,
  width: number,
  height: number
): [number, number, number, number] {
  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (binaryMask[y * width + x] === 1) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (minX === width || minY === height) return [0, 0, 0, 0];
  return [minX, minY, maxX - minX, maxY - minY];
}

export function calculateArea(points: { x: number; y: number }[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

export function calculateBoundingBox(
  points: { x: number; y: number }[]
): [number, number, number, number] {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return [minX, minY, maxX - minX, maxY - minY];
}
