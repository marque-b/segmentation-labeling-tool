import { useEffect, useRef } from "react";
import { Canvas, FabricImage, Polygon } from "fabric";
import { ImageData } from "./EditorPage";

interface AnnotationCanvasProps {
  imageData: ImageData;
}

export default function AnnotationCanvas({ imageData }: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !imageData) return;

    const canvas = new Canvas(canvasRef.current, {
      width: imageData.width,
      height: imageData.height,
      backgroundColor: "transparent",
      selection: true,
    });

    fabricRef.current = canvas;

    FabricImage.fromURL(imageData.url)
      .then((img) => {
        canvas.backgroundImage = img;
        canvas.renderAll();
      })
      .catch((error) => {
        console.error("Error loading background image:", error);
      });

    const polygonPoints = [
      { x: 100, y: 100 },
      { x: 200, y: 80 },
      { x: 250, y: 150 },
      { x: 150, y: 200 },
    ];

    const polygon = new Polygon(polygonPoints, {
      fill: "rgba(0, 255, 0, 0.3)",
      stroke: "green",
      strokeWidth: 2,
      selectable: true,
      hasControls: true,
    });

    canvas.add(polygon);
    canvas.renderAll();

    return () => {
      canvas.dispose();
    };
  }, [imageData]);

  return <canvas ref={canvasRef} />;
}
