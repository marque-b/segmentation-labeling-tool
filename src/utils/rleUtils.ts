import { Segmentation } from "@/store/useCOCOStore";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import { Canvas } from "fabric";
import { hexToRgb } from "./maskUtils";

export function encodeRLE(binaryMask: Uint8Array): number[] {
  if (binaryMask.length === 0) return [];
  const rle: number[] = [];
  let count = 1;
  let current = binaryMask[0];
  for (let i = 1; i < binaryMask.length; i++) {
    if (binaryMask[i] === current) {
      count++;
    } else {
      rle.push(count);
      count = 1;
      current = binaryMask[i];
    }
  }
  rle.push(count);
  return rle;
}

export function decodeRLE(
  rle: number[],
  width: number,
  height: number
): Uint8Array {
  const binaryMask = new Uint8Array(width * height);
  let index = 0;
  for (let i = 0; i < rle.length; i++) {
    const value = i % 2 === 0 ? 0 : 1;
    const count = rle[i];
    for (let j = 0; j < count; j++) {
      binaryMask[index++] = value;
    }
  }
  return binaryMask;
}

export function mergeRLE(
  rle1: number[],
  rle2: number[],
  width: number,
  height: number
): number[] {
  const mask1 = decodeRLE(rle1, width, height);
  const mask2 = decodeRLE(rle2, width, height);
  const mergedMask = new Uint8Array(width * height);
  for (let i = 0; i < mergedMask.length; i++) {
    mergedMask[i] = mask1[i] || mask2[i] ? 1 : 0;
  }
  return encodeRLE(mergedMask);
}

export function intersectRLE(
  rle1: number[],
  rle2: number[],
  width: number,
  height: number
): number[] {
  const mask1 = decodeRLE(rle1, width, height);
  const mask2 = decodeRLE(rle2, width, height);
  const intersection = new Uint8Array(mask1.length);

  for (let i = 0; i < mask1.length; i++) {
    intersection[i] = mask1[i] & mask2[i];
  }

  return encodeRLE(intersection);
}

export function subtractRLEForErase(
  originalRLE: number[],
  eraseRLE: number[],
  width: number,
  height: number
): number[] {
  const mask = decodeRLE(originalRLE, width, height);
  const eraseMask = decodeRLE(eraseRLE, width, height);

  for (let i = 0; i < mask.length; i++) {
    if (eraseMask[i] === 1) {
      mask[i] = 0;
    }
  }

  return encodeRLE(mask);
}

export function isRLE(
  seg: Segmentation | null | undefined
): seg is { counts: number[]; size: [number, number] } {
  return (
    seg !== null &&
    seg !== undefined &&
    typeof seg === "object" &&
    "counts" in seg &&
    "size" in seg
  );
}

export async function generateRLE(canvas: Canvas): Promise<number[]> {
  const fixedObjects = canvas
    .getObjects()
    .filter((obj: any) => obj.fixedAnnotation === true);
  fixedObjects.forEach((obj: any) => {
    obj.visible = false;
  });
  canvas.renderAll();

  const htmlCanvas = canvas.toCanvasElement();
  const ctx = htmlCanvas.getContext("2d")!;
  const width = canvas.width!;
  const height = canvas.height!;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const binaryMask = new Uint8Array(width * height);

  const activeClass = useAnnotationStore
    .getState()
    .classes.find(
      (cls) => cls.id === useAnnotationStore.getState().selectedClassId
    );
  if (!activeClass) return [];

  const targetColor = hexToRgb(activeClass.color);
  if (!targetColor) return [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const isMatchingColor =
        Math.abs(pixels[index] - targetColor.r) < 5 &&
        Math.abs(pixels[index + 1] - targetColor.g) < 5 &&
        Math.abs(pixels[index + 2] - targetColor.b) < 5 &&
        pixels[index + 3] > 0;
      binaryMask[y * width + x] = isMatchingColor ? 1 : 0;
    }
  }

  fixedObjects.forEach((obj: any) => {
    obj.visible = true;
  });
  canvas.renderAll();

  return encodeRLE(binaryMask);
}
