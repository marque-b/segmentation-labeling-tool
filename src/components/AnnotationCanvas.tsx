import { useEffect, useRef } from "react";
import { Canvas } from "fabric";
import { ImageData } from "./EditorPage";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import { usePolygonTool } from "@/hooks/usePolygonTool";
import { useBrushTool } from "@/hooks/useBrushTool";
import { useEraserTool } from "@/hooks/useEraserTool";
// import { useRenderMask } from "@/hooks/useRenderMask";

interface AnnotationCanvasProps {
  imageData: ImageData;
}

export default function AnnotationCanvas({ imageData }: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const { activeTool } = useAnnotationStore();
  const setCanvas = useAnnotationStore((state) => state.setCanvas);

  useEffect(() => {
    if (!canvasRef.current || !imageData) return;

    const canvas = new Canvas(canvasRef.current, {
      width: imageData.width,
      height: imageData.height,
      selection: false,
      backgroundColor: "transparent",
    });

    fabricRef.current = canvas;
    setCanvas(canvas);

    const lockAllObjects = () => {
      canvas.getObjects().forEach((obj) => {
        obj.set({
          selectable: false,
          evented: false,
          lockMovementX: true,
          lockMovementY: true,
          hasControls: false,
          hoverCursor: "default",
        });
      });
      canvas.renderAll();
    };
    lockAllObjects();
    canvas.on("object:added", () => lockAllObjects());

    return () => {
      canvas.dispose();
    };
  }, [imageData]);

  usePolygonTool(fabricRef.current, activeTool === "polygon");
  useBrushTool(fabricRef.current, activeTool === "brush");
  useEraserTool(fabricRef.current, activeTool === "eraser");
  // useRenderMask(fabricRef.current);

  return <canvas ref={canvasRef} className="canvas" />;
}
