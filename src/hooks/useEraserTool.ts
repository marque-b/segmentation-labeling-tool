import { useEffect } from "react";
import { Canvas, PencilBrush } from "fabric";
import { useAnnotationStore } from "@/store/useAnnotationStore";

class EraserBrush extends PencilBrush {
  _finalizeAndAddPath() {
    const ctx = this.canvas.contextTop;
    const originalComposite = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "destination-out";
    const path = super._finalizeAndAddPath();
    ctx.globalCompositeOperation = originalComposite;
    return path;
  }
}

export function useEraserTool(canvas: Canvas | null, active: boolean) {
  const { brushSize, saveHistory } = useAnnotationStore();

  useEffect(() => {
    if (!canvas) return;
    if (active) {
      canvas.isDrawingMode = true;
      if (!(canvas.freeDrawingBrush instanceof EraserBrush)) {
        canvas.freeDrawingBrush = new EraserBrush(canvas);
      }
      canvas.freeDrawingBrush.width = brushSize;
    } else {
      canvas.isDrawingMode = false;
    }
  }, [canvas, active, brushSize]);

  useEffect(() => {
    if (!canvas || !active) return;
    const handlePathCreated = () => {
      saveHistory();
    };
    canvas.on("path:created", handlePathCreated);
    return () => {
      canvas.off("path:created", handlePathCreated);
    };
  }, [canvas, active, saveHistory]);
}
