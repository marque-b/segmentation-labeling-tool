import { Canvas, FabricImage } from "fabric";
import { useAnnotationStore } from "@/store/useAnnotationStore";

function decodeRLE(rle: number[], width: number, height: number): Uint8Array {
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

function getClassColor(classId: string): string {
  const { classes } = useAnnotationStore.getState();
  const cls = classes.find((c) => c.id === classId);
  return cls ? cls.color : "#000000";
}

export function renderAllRLE(
  canvas: Canvas | null,
  masks: { rle: number[]; width: number; height: number; classId: string }[]
) {
  if (!canvas || masks.length === 0) return;

  const width = Math.max(...masks.map((m) => m.width));
  const height = Math.max(...masks.map((m) => m.height));

  const offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  const ctx = offscreenCanvas.getContext("2d")!;

  ctx.clearRect(0, 0, width, height);

  masks.forEach(({ rle, width, height, classId }) => {
    const binaryMask = decodeRLE(rle, width, height);
    const { r, g, b } = hexToRgb(getClassColor(classId));
    const imageData = ctx.createImageData(width, height);

    for (let i = 0; i < binaryMask.length; i++) {
      const idx = i * 4;
      if (binaryMask[i] === 1) {
        imageData.data[idx] = r;
        imageData.data[idx + 1] = g;
        imageData.data[idx + 2] = b;
        imageData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  });

  const fabricImage = new FabricImage(offscreenCanvas, {
    left: 0,
    top: 0,
    selectable: false,
    evented: false,
  });

  console.log(
    "Máscaras armazenadas:",
    masks.map((m) => ({ classId: m.classId }))
  );

  canvas.clear();
  canvas.add(fabricImage);
  canvas.renderAll();
}
