import { Canvas, FabricImage } from "fabric";

function decodeRLE(rle: number[], initial: number): Uint8Array {
  const total = rle.reduce((sum, count) => sum + count, 0);
  const result = new Uint8Array(total);
  let value = initial;
  let offset = 0;

  for (let i = 0; i < rle.length; i++) {
    const count = rle[i];
    result.fill(value, offset, offset + count);
    offset += count;
    value = value === 0 ? 1 : 0;
  }

  return result;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  const num = parseInt(c, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function renderRLE(
  canvas: Canvas | null,
  rle: number[],
  width: number,
  height: number,
  classColor: string
) {
  if (!canvas || rle.length === 0) return;

  const binaryMask = decodeRLE(rle, 0);
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.canvas.width = width;
  ctx.canvas.height = height;

  const imageData = ctx.createImageData(width, height);
  const { r, g, b } = hexToRgb(classColor);

  for (let i = 0; i < binaryMask.length; i++) {
    const idx = i * 4;
    if (binaryMask[i] === 1) {
      imageData.data[idx] = r;
      imageData.data[idx + 1] = g;
      imageData.data[idx + 2] = b;
      imageData.data[idx + 3] = 255;
    } else {
      imageData.data[idx] = 0;
      imageData.data[idx + 1] = 0;
      imageData.data[idx + 2] = 0;
      imageData.data[idx + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const fabricImage = new FabricImage(ctx.canvas, {
    left: 0,
    top: 0,
    selectable: false,
    evented: false,
    opacity: 0.5,
  });

  canvas.getObjects().forEach((obj) => {
    if (obj instanceof FabricImage) {
      canvas.remove(obj);
    }
  });

  canvas.add(fabricImage);
  canvas.renderAll();
}
