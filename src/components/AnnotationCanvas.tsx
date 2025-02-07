import { useEffect, useRef } from "react";
import { Canvas, FabricImage } from "fabric";
import { ImageData } from "./EditorPage";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import { usePolygonTool } from "@/hooks/usePolygonTool";
import { useBrushTool } from "@/hooks/useBrushTool";

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
          evented: false,
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

    canvas.forEachObject((obj) => {
      obj.selectable = false;
      obj.evented = false;
      obj.hasBorders = false;
      obj.hasControls = false;
      obj.lockMovementX = true;
      obj.lockMovementY = true;
    });

    canvas.selection = false;

    canvas.renderAll();

    return () => {
      canvas.dispose();
    };
  }, [imageData]);

  usePolygonTool(fabricRef.current, activeTool === "polygon");
  useBrushTool(fabricRef.current, activeTool === "brush");

  return <canvas ref={canvasRef} />;
}
