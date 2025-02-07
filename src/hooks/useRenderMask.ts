import { useEffect } from "react";
import { Canvas, FabricImage } from "fabric";
import { decodeRLE, useAnnotationStore } from "@/store/useAnnotationStore";

export function useRenderMask(canvas: Canvas | null) {
  const { masks } = useAnnotationStore();

  useEffect(() => {
    if (!canvas || masks.length === 0) return;

    const ctx = document.createElement("canvas").getContext("2d")!;
    const { width, height } = canvas;
    ctx.canvas.width = width;
    ctx.canvas.height = height;

    const mergedMask = new Uint8Array(width * height);

    masks.forEach((mask) => {
      const decodedMask = decodeRLE(mask.rle, mask.width, mask.height);
      for (let i = 0; i < mergedMask.length; i++) {
        mergedMask[i] = mergedMask[i] | decodedMask[i];
      }
    });

    const imageData = ctx.createImageData(width, height);
    for (let i = 0; i < mergedMask.length; i++) {
      const idx = i * 4;
      if (mergedMask[i] === 1) {
        imageData.data[idx] = 255;
        imageData.data[idx + 1] = 0;
        imageData.data[idx + 2] = 0;
        imageData.data[idx + 3] = 100;
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
  }, [canvas, masks]);
}
