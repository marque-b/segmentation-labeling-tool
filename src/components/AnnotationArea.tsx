import { useEffect, useRef, useState } from "react";
import AnnotationCanvas from "./AnnotationCanvas";
import { ImageData } from "./EditorPage";

interface AnnotationAreaProps {
  imageData: ImageData;
}

export default function AnnotationArea({ imageData }: AnnotationAreaProps) {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const isPanning = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const [transform, setTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });

  useEffect(() => {
    const container = areaRef.current;
    if (!container) return;

    const scaleX = container.clientWidth / imageData.width;
    const scaleY = container.clientHeight / imageData.height;
    const initialScale = Math.min(scaleX, scaleY) * 0.9;

    setTransform({
      scale: initialScale,
      translateX: (container.clientWidth - imageData.width * initialScale) / 2,
      translateY:
        (container.clientHeight - imageData.height * initialScale) / 2,
    });
  }, [imageData]);

  useEffect(() => {
    if (!areaRef.current) return;

    const getRelativePosition = (clientX: number, clientY: number) => {
      const rect = areaRef.current!.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const { x: cursorX, y: cursorY } = getRelativePosition(
        event.clientX,
        event.clientY
      );
      const delta = -event.deltaY;
      const zoomIntensity = 0.001;
      const scaleFactor = Math.exp(delta * zoomIntensity);
      const newScale = Math.min(
        Math.max(transform.scale * scaleFactor, 0.1),
        20
      );

      const contentX = (cursorX - transform.translateX) / transform.scale;
      const contentY = (cursorY - transform.translateY) / transform.scale;

      const newTranslateX = cursorX - contentX * newScale;
      const newTranslateY = cursorY - contentY * newScale;

      setTransform({
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      });
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        isPanning.current = true;
        const pos = getRelativePosition(event.clientX, event.clientY);
        lastPosition.current = pos;

        if (areaRef.current) {
          areaRef.current.style.cursor = "grabbing";
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isPanning.current) return;

      const pos = getRelativePosition(event.clientX, event.clientY);
      const deltaX = pos.x - lastPosition.current.x;
      const deltaY = pos.y - lastPosition.current.y;

      setTransform((prev) => ({
        ...prev,
        translateX: prev.translateX + deltaX,
        translateY: prev.translateY + deltaY,
      }));

      lastPosition.current = pos;
    };

    const handleMouseUp = () => {
      isPanning.current = false;
      if (areaRef.current) {
        areaRef.current.style.cursor = "grab";
      }
    };

    const container = areaRef.current;

    container.style.cursor = "grab";

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleMouseUp);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [transform.scale, transform.translateX, transform.translateY]);

  return (
    <div
      ref={areaRef}
      className="relative w-full h-full overflow-hidden bg-gray-900 select-none"
    >
      <div
        ref={contentRef}
        style={{
          transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        <AnnotationCanvas imageData={imageData} />
      </div>
    </div>
  );
}
