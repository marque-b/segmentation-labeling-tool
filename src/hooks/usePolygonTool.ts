import { useEffect, useRef } from "react";
import {
  Canvas,
  Polygon,
  Circle,
  TPointerEvent,
  TPointerEventInfo,
} from "fabric";
import { useAnnotationStore } from "@/store/useAnnotationStore";

export function usePolygonTool(canvas: Canvas | null, active: boolean) {
  const tempPointsRef = useRef<Array<{ x: number; y: number; circle: Circle }>>(
    []
  );
  const tempPolygonRef = useRef<Polygon | null>(null);
  const { selectedClassId, classes, saveHistory, savePolygon } =
    useAnnotationStore();
  const activeClass = classes.find((cls) => cls.id === selectedClassId);
  const polygonColor = activeClass ? activeClass.color : "#00ff00";

  const updateTempPolygon = () => {
    if (!canvas) return;
    if (tempPolygonRef.current) {
      canvas.remove(tempPolygonRef.current);
      tempPolygonRef.current = null;
    }
    const points = tempPointsRef.current.map((p) => ({ x: p.x, y: p.y }));
    if (points.length === 0) return;
    const polygon = new Polygon(points, {
      fill: `${polygonColor}50`,
      stroke: polygonColor,
      strokeWidth: 2,
      selectable: false,
      hasControls: false,
      data: { temporary: true },
    } as any);
    tempPolygonRef.current = polygon;
    canvas.add(polygon);
    saveHistory();
    canvas.renderAll();
  };

  const isCloseToFirstPoint = (points: Array<{ x: number; y: number }>) => {
    if (points.length < 3) return false;
    const first = points[0];
    const last = points[points.length - 1];
    const distance = Math.sqrt(
      (first.x - last.x) ** 2 + (first.y - last.y) ** 2
    );
    return distance < 10;
  };

  const finalizePolygon = () => {
    if (!canvas) return;
    const points = tempPointsRef.current.map((p) => ({ x: p.x, y: p.y }));
    tempPointsRef.current.forEach((p) => canvas.remove(p.circle));
    tempPointsRef.current = [];
    if (tempPolygonRef.current) {
      canvas.remove(tempPolygonRef.current);
      tempPolygonRef.current = null;
    }
    if (points.length === 0) return;
    savePolygon(points);

    const finalPolygon = new Polygon(points, {
      fill: `${polygonColor}80`,
      stroke: polygonColor,
      strokeWidth: 2,
      selectable: false,
      hasControls: false,
      data: { classId: selectedClassId, type: "polygon" },
    } as any);
    canvas.add(finalPolygon);
    canvas.renderAll();
  };

  useEffect(() => {
    if (!canvas || !active) return;

    const handleCanvasClick = (event: TPointerEventInfo<TPointerEvent>) => {
      if (!canvas) return;
      const pointer = canvas.getScenePoint(event.e);
      const newPoint = { x: pointer.x, y: pointer.y };

      let pointObject;

      if (tempPointsRef.current.length === 0) {
        const firstCircle = new Circle({
          left: newPoint.x,
          top: newPoint.y,
          radius: 5,
          fill: "#fff",
          stroke: polygonColor,
          originX: "center",
          originY: "center",
          selectable: true,
          hasControls: false,
          data: { firstPoint: true },
        } as any);
        pointObject = firstCircle;
      } else {
        const circle = new Circle({
          left: newPoint.x,
          top: newPoint.y,
          radius: 5,
          fill: polygonColor,
          originX: "center",
          originY: "center",
          selectable: true,
          hasControls: false,
          data: { temporaryPoint: true },
        } as any);
        pointObject = circle;
      }

      canvas.add(pointObject);

      pointObject.on("modified", () => {
        const idx = tempPointsRef.current.findIndex(
          (p) => p.circle === pointObject
        );
        if (idx !== -1) {
          tempPointsRef.current[idx].x = pointObject.left!;
          tempPointsRef.current[idx].y = pointObject.top!;
          updateTempPolygon();
        }
      });

      tempPointsRef.current.push({
        x: newPoint.x,
        y: newPoint.y,
        circle: pointObject,
      });
      updateTempPolygon();

      const pts = tempPointsRef.current.map((p) => ({ x: p.x, y: p.y }));
      if (pts.length > 2 && isCloseToFirstPoint(pts)) {
        finalizePolygon();
      }
    };

    canvas.on("mouse:down", handleCanvasClick);
    return () => {
      canvas.off("mouse:down", handleCanvasClick);
    };
  }, [canvas, active, selectedClassId, classes]);

  useEffect(() => {
    if (!active && canvas) {
      tempPointsRef.current.forEach((p) => canvas.remove(p.circle));
      tempPointsRef.current = [];
      if (tempPolygonRef.current) {
        canvas.remove(tempPolygonRef.current);
        tempPolygonRef.current = null;
      }
      canvas.renderAll();
    }
  }, [active, canvas]);
}
