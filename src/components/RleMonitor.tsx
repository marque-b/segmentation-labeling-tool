import { useEffect, useRef } from "react";
import { Canvas } from "fabric";
import { useCOCOStore } from "@/store/useCOCOStore";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import { renderRLE } from "@/hooks/useRleRenderer"; // Agora é uma função normal

export default function RleMonitor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const { datasets } = useCOCOStore();
  const { masks } = useAnnotationStore();

  const width = datasets[0]?.images[0]?.width || 800;
  const height = datasets[0]?.images[0]?.height || 600;

  useEffect(() => {
    if (!canvasRef.current) return;

    fabricRef.current = new Canvas(canvasRef.current, {
      backgroundColor: "#FFFFFF",
    });

    if (fabricRef.current && masks.length > 0) {
      fabricRef.current.clear();
      fabricRef.current.backgroundColor = "#FFFFFF";

      // ✅ Agora chamamos `renderRLE` corretamente, sem erro de hooks
      masks.forEach((mask) => {
        renderRLE(fabricRef.current!, mask.rle, width, height, "#FF0000");
      });

      fabricRef.current.renderAll();
    }

    return () => {
      fabricRef.current?.dispose();
    };
  }, []); // ✅ Executa apenas uma vez na montagem

  return (
    <div>
      <h2>RLE Monitor</h2>
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
}
