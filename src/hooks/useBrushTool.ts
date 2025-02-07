import { useEffect } from "react";
import { Canvas } from "fabric";
import { useAnnotationStore } from "@/store/useAnnotationStore";

export function useBrushTool(canvas: Canvas | null, active: boolean) {
  const { brushSize, selectedClassId, classes, saveHistory } =
    useAnnotationStore();

  const activeClass = classes.find((cls) => cls.id === selectedClassId);
  const brushColor = activeClass ? activeClass.color : "#000000";

  useEffect(() => {
    if (!canvas) return;

    if (active) {
      canvas.isDrawingMode = true;
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = brushSize;
        canvas.freeDrawingBrush.color = brushColor;
      }
    } else {
      canvas.isDrawingMode = false;
    }
  }, [canvas, active, brushSize, brushColor]);

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
