import { useEffect, useRef } from "react";
import { Canvas } from "fabric";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import { renderAllRLE } from "@/hooks/useRleRenderer";

export default function RleMonitor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const { masks } = useAnnotationStore();

  useEffect(() => {
    if (!fabricRef.current || masks.length === 0) return;

    renderAllRLE(fabricRef.current, masks);

    fabricRef.current.renderAll();
  }, [masks]);

  return (
    <div>
      <h2>RLE Monitor</h2>
      <canvas ref={canvasRef} />
    </div>
  );
}
