import { useState, useEffect } from "react";
import { Canvas, Polygon, TPointerEvent, TPointerEventInfo } from "fabric";
import { useAnnotationStore } from "@/store/useAnnotationStore";

export function usePolygonTool(canvas: Canvas | null, active: boolean) {
  const [, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);
  const { selectedClassId, classes, saveHistory } = useAnnotationStore();

  const activeClass = classes.find((cls) => cls.id === selectedClassId);
  const polygonColor = activeClass ? activeClass.color : "#00ff00";

  useEffect(() => {
    if (!canvas || !active) return;

    const handleCanvasClick = (event: TPointerEventInfo<TPointerEvent>) => {
      if (!canvas) return;

      const pointer = canvas.getScenePoint(event.e);
      const newPoint = { x: pointer.x, y: pointer.y };

      setPolygonPoints((prevPoints) => {
        const updatedPoints = [...prevPoints, newPoint];
        saveHistory();

        if (updatedPoints.length > 2 && isCloseToFirstPoint(updatedPoints)) {
          finalizePolygon(updatedPoints);
          return [];
        } else {
          drawPolygon(updatedPoints);
          return updatedPoints;
        }
      });
    };

    canvas.on("mouse:down", handleCanvasClick);
    return () => {
      canvas.off("mouse:down", handleCanvasClick);
    };
  }, [canvas, active, saveHistory, classes, selectedClassId]);

  useEffect(() => {
    if (!active && canvas) {
      setPolygonPoints([]);
      canvas.getObjects().forEach((obj) => {
        if ((obj as any).data?.temporary) {
          canvas.remove(obj);
        }
      });
      canvas.renderAll();
    }
  }, [active, canvas]);

  const drawPolygon = (points: { x: number; y: number }[]) => {
    if (!canvas) return;

    canvas.getObjects().forEach((obj) => {
      if ((obj as any).data?.temporary) {
        canvas.remove(obj);
      }
    });

    const polygon = new Polygon(points, {
      fill: `${polygonColor}50`,
      stroke: polygonColor,
      strokeWidth: 2,
      selectable: false,
      hasControls: false,
      isDragActive: false,
      data: { temporary: true },
    } as any);

    canvas.add(polygon);
    canvas.renderAll();
  };

  const finalizePolygon = (points: { x: number; y: number }[]) => {
    if (!canvas) return;

    canvas.getObjects().forEach((obj) => {
      if ((obj as any).data?.temporary) {
        canvas.remove(obj);
      }
    });

    const finalPolygon = new Polygon(points, {
      fill: `${polygonColor}80`,
      stroke: polygonColor,
      strokeWidth: 2,
      selectable: true,
      hasControls: true,
      isDragActive: false,
      data: {
        classId: selectedClassId,
        type: "polygon",
      },
    } as any);

    canvas.add(finalPolygon);
    canvas.renderAll();

    saveHistory();
  };

  const isCloseToFirstPoint = (points: { x: number; y: number }[]): boolean => {
    if (points.length < 3) return false;
    const first = points[0];
    const last = points[points.length - 1];
    const distance = Math.sqrt(
      (first.x - last.x) ** 2 + (first.y - last.y) ** 2
    );
    return distance < 10;
  };
}
