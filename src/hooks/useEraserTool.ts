import { useEffect } from "react";
import { Canvas, PencilBrush } from "fabric";
import {
  useAnnotationStore,
  encodeRLE,
  decodeRLE,
  subtractRLEForErase,
} from "@/store/useAnnotationStore";

function eraseFromMasks(eraseRLE: number[], width: number, height: number) {
  const { masks, selectedImageId, saveMask } = useAnnotationStore.getState();
  if (!selectedImageId) return;

  const updatedMasks = masks.map((mask) => {
    if (mask.imageId !== selectedImageId) return mask;

    const newRLE = subtractRLEForErase(mask.rle, eraseRLE, width, height);

    return { ...mask, rle: newRLE };
  });

  updatedMasks.forEach((updatedMask) => {
    saveMask(
      updatedMask.rle,
      updatedMask.width,
      updatedMask.height,
      updatedMask.imageId
    );
  });
}

export function useEraserTool(canvas: Canvas | null, active: boolean) {
  const { brushSize } = useAnnotationStore();

  useEffect(() => {
    if (!canvas) return;

    if (active) {
      canvas.isDrawingMode = true;
      if (!(canvas.freeDrawingBrush instanceof PencilBrush)) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = "#FFFFFF";
    } else {
      canvas.isDrawingMode = false;
    }
  }, [canvas, active, brushSize]);

  useEffect(() => {
    if (!canvas || !active) return;

    const handlePathCreated = async (event: any) => {
      const eraseRLE = await generateEraseRLE(canvas);
      eraseFromMasks(eraseRLE, canvas.width!, canvas.height!);

      canvas.remove(event.path);
      canvas.renderAll();
    };

    canvas.on("path:created", handlePathCreated);
    return () => {
      canvas.off("path:created", handlePathCreated);
    };
  }, [canvas, active]);
}

async function generateEraseRLE(canvas: Canvas): Promise<number[]> {
  const htmlCanvas = document.createElement("canvas");
  htmlCanvas.width = canvas.width!;
  htmlCanvas.height = canvas.height!;

  const fabricCtx = canvas.getContext();
  const imageData = fabricCtx.getImageData(0, 0, canvas.width!, canvas.height!);
  const pixels = imageData.data;

  const binaryMask = new Uint8Array(canvas.width! * canvas.height!);
  for (let i = 0; i < pixels.length; i += 4) {
    const isWhite =
      pixels[i] === 255 && pixels[i + 1] === 255 && pixels[i + 2] === 255;
    binaryMask[i / 4] = isWhite ? 1 : 0;
  }

  return encodeRLE(binaryMask);
}
