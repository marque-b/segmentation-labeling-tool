import { useEffect, useRef } from "react";
import { Canvas, FabricImage } from "fabric";
import { ImageData } from "./EditorPage";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import { usePolygonTool } from "@/hooks/usePolygonTool";
import { useBrushTool } from "@/hooks/useBrushTool";
import { useEraserTool } from "@/hooks/useEraserTool";

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
    });

    fabricRef.current = canvas;
    setCanvas(canvas);

    FabricImage.fromURL(imageData.url)
      .then((img) => {
        img.set({
          selectable: false,
          left: 0,
          top: 0,
          hasControls: false,
          lockMovementX: true,
          lockMovementY: true,
          hoverCursor: "default",
          hasBorders: false,
          hasRotatingPoint: false,
        });
        canvas.add(img);
        canvas.sendObjectToBack(img);
        canvas.renderAll();
      })
      .catch((error) => {
        console.error("Error loading background image:", error);
      });

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

  return <canvas ref={canvasRef} />;
}
