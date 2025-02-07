import { useEffect } from "react";
import { Canvas, FabricImage } from "fabric";
import { decodeRLE, useAnnotationStore } from "@/store/useAnnotationStore";

function getClassColor(classId: string): { r: number; g: number; b: number } {
  const { classes } = useAnnotationStore.getState();
  const cls = classes.find((c) => c.id === classId);
  if (!cls) return { r: 0, g: 0, b: 0 };
  const hex = cls.color.replace("#", "");
  const num = parseInt(hex, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function useRenderMask(canvas: Canvas | null) {
  const { masks, selectedImageId } = useAnnotationStore();

  useEffect(() => {
    if (!canvas || masks.length === 0) return;

    canvas.getObjects().forEach((obj) => {
      if (obj instanceof FabricImage) {
        canvas.remove(obj);
      }
    });

    masks
      .filter((mask) => mask.imageId === selectedImageId)
      .forEach((mask) => {
        const ctx = document.createElement("canvas").getContext("2d")!;
        ctx.canvas.width = mask.width;
        ctx.canvas.height = mask.height;

        const decodedMask = decodeRLE(mask.rle, mask.width, mask.height);
        const { r, g, b } = getClassColor(mask.classId);

        const imageData = ctx.createImageData(mask.width, mask.height);
        for (let i = 0; i < decodedMask.length; i++) {
          const idx = i * 4;
          if (decodedMask[i] === 1) {
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
          name: `mask-${mask.classId}`,
        });

        canvas.add(fabricImage);
      });

    canvas.renderAll();
  }, [canvas, masks]);
}
