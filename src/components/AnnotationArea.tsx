import { useEffect, useRef, useState } from "react";
import AnnotationCanvas from "./AnnotationCanvas";
import { ImageData } from "./EditorPage";

interface Touch {
  identifier: number;
  clientX: number;
  clientY: number;
}

interface TouchInfo {
  touches: Touch[];
  startDistance?: number;
  startScale?: number;
}

interface AnnotationAreaProps {
  imageData: ImageData;
}

export default function AnnotationArea({ imageData }: AnnotationAreaProps) {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const isPanning = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const touchInfo = useRef<TouchInfo>({ touches: [] });
  const [transform, setTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });

  const transformRef = useRef(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

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
    const container = areaRef.current;

    const getRelativePosition = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const { x: cursorX, y: cursorY } = getRelativePosition(
        event.clientX,
        event.clientY
      );
      const delta = -event.deltaY;
      const zoomIntensity = 0.001;
      const currentTransform = transformRef.current;
      const scaleFactor = Math.exp(delta * zoomIntensity);
      const newScale = Math.min(
        Math.max(currentTransform.scale * scaleFactor, 0.1),
        20
      );

      const contentX =
        (cursorX - currentTransform.translateX) / currentTransform.scale;
      const contentY =
        (cursorY - currentTransform.translateY) / currentTransform.scale;
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
        container.style.cursor = "grabbing";
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
      container.style.cursor = "grab";
    };

    const getDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getMidpoint = (touch1: Touch, touch2: Touch) => ({
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    });

    const handleTouchStart = (event: TouchEvent) => {
      event.preventDefault();
      touchInfo.current.touches = Array.from(event.touches).map((t) => ({
        identifier: t.identifier,
        clientX: t.clientX,
        clientY: t.clientY,
      }));
      if (event.touches.length === 2) {
        const [touch1, touch2] = Array.from(event.touches);
        touchInfo.current.startDistance = getDistance(touch1, touch2);
        touchInfo.current.startScale = transformRef.current.scale;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      if (event.touches.length === 2) {
        const [touch1, touch2] = Array.from(event.touches);
        const currentDistance = getDistance(touch1, touch2);
        const midpoint = getMidpoint(touch1, touch2);
        const { x: midX, y: midY } = getRelativePosition(
          midpoint.x,
          midpoint.y
        );

        if (touchInfo.current.startDistance && touchInfo.current.startScale) {
          const newScale = Math.min(
            Math.max(
              (currentDistance / touchInfo.current.startDistance) *
                touchInfo.current.startScale,
              0.1
            ),
            20
          );
          const currentTransform = transformRef.current;
          const contentX =
            (midX - currentTransform.translateX) / currentTransform.scale;
          const contentY =
            (midY - currentTransform.translateY) / currentTransform.scale;
          setTransform({
            scale: newScale,
            translateX: midX - contentX * newScale,
            translateY: midY - contentY * newScale,
          });
        }

        const prevTouch1 = touchInfo.current.touches[0];
        const prevTouch2 = touchInfo.current.touches[1];
        const prevMidpoint = getMidpoint(prevTouch1, prevTouch2);
        const deltaX = midpoint.x - prevMidpoint.x;
        const deltaY = midpoint.y - prevMidpoint.y;
        setTransform((prev) => ({
          ...prev,
          translateX: prev.translateX + deltaX,
          translateY: prev.translateY + deltaY,
        }));

        touchInfo.current.touches = Array.from(event.touches).map((t) => ({
          identifier: t.identifier,
          clientX: t.clientX,
          clientY: t.clientY,
        }));
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      event.preventDefault();
      if (event.touches.length < 2) {
        touchInfo.current.startDistance = undefined;
        touchInfo.current.startScale = undefined;
      }
      touchInfo.current.touches = Array.from(event.touches).map((t) => ({
        identifier: t.identifier,
        clientX: t.clientX,
        clientY: t.clientY,
      }));
    };

    container.style.cursor = "grab";

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: false });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleMouseUp);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={areaRef}
      className="relative w-full h-full overflow-hidden bg-gray-900 select-none touch-none"
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
