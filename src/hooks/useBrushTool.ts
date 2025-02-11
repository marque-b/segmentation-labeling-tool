import { useEffect } from "react";
import { Canvas, PencilBrush } from "fabric";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import { generateRLE } from "@/utils/rleUtils";

export function useBrushTool(canvas: Canvas | null, active: boolean) {
  const {
    brushSize,
    selectedClassId,
    classes,
    saveHistory,
    saveBrushMaskToStage,
    selectedImageId,
  } = useAnnotationStore();
  const activeClass = classes.find((cls) => cls.id === selectedClassId);
  const brushColor = activeClass ? activeClass.color : "#000000";

  useEffect(() => {
    if (!canvas) return;
    if (active && selectedClassId !== null) {
      if (!(canvas.freeDrawingBrush instanceof PencilBrush)) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = `${brushColor}70`;
    } else {
      canvas.isDrawingMode = false;
    }
  }, [canvas, active, brushSize, brushColor, selectedClassId]);

  useEffect(() => {
    if (!canvas || !active || selectedImageId === null) return;

    const handlePathCreated = async () => {
      saveHistory();
      const rleMask = await generateRLE(canvas);
      saveBrushMaskToStage(
        rleMask,
        canvas.width!,
        canvas.height!,
        selectedImageId
      );
    };

    canvas.on("path:created", handlePathCreated);
    return () => {
      canvas.off("path:created", handlePathCreated);
    };
  }, [canvas, active, saveHistory, saveBrushMaskToStage, selectedImageId]);

  useEffect(() => {
    if (!canvas) return;
    if (active && selectedClassId !== null) {
      if (!(canvas.freeDrawingBrush instanceof PencilBrush)) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      canvas.isDrawingMode = true;
      canvas.skipTargetFind = false;
      canvas.selection = true;
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = `${brushColor}70`;
    } else {
      canvas.isDrawingMode = false;
    }
  }, [canvas, active, brushSize, brushColor, selectedClassId]);
}
