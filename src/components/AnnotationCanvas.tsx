import { useEffect, useRef, useState } from "react";
import { Canvas } from "fabric";
import { ImageData } from "./EditorPage";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import { usePolygonTool } from "@/hooks/usePolygonTool";
import { useBrushTool } from "@/hooks/useBrushTool";
// import { useEraserTool } from "@/hooks/useEraserTool";
// import { useRenderMask } from "@/hooks/useRenderMask";
import DialogSaveAnnotations from "./DialogSaveAnnotations";
import { useCOCOStore } from "@/store/useCOCOStore";
import { useBlocker, useNavigate } from "react-router-dom";
import { useSaveAnnotations } from "@/hooks/useSaveAnnotations";

interface AnnotationCanvasProps {
  imageData: ImageData;
}

export default function AnnotationCanvas({ imageData }: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const { datasets } = useCOCOStore();
  const {
    selectedImageId,
    annotations,
    setCanvas,
    activeTool,
    setAnnotations,
    setSelectedImageId,
    setActiveTool,
    setClasses,
    setHistory,
    classes,
  } = useAnnotationStore();

  const navigate = useNavigate();
  const blocker = useBlocker(() => annotations.length > 0);
  const { saveAnnotations } = useSaveAnnotations();

  const [showDialog, setShowDialog] = useState(false);
  const [nextLocation, setNextLocation] = useState<string | null>(null);

  const clearStage = () => {
    setAnnotations([]);
    setSelectedImageId(null);
    setActiveTool("none");
    setClasses([]);
    setHistory([]);

    if (fabricRef.current) {
      fabricRef.current.dispose();
      fabricRef.current = null;
    }
  };

  const handleSaveAnnotations = () => {
    saveAnnotations();

    clearStage();

    setShowDialog(false);

    if (blocker.state === "blocked" && blocker.proceed) {
      blocker.proceed();
    } else if (nextLocation) {
      navigate(nextLocation || "/");
    }
  };

  const handleDiscardAnnotations = () => {
    clearStage();
    setShowDialog(false);

    if (blocker.state === "blocked" && blocker.proceed) {
      blocker.proceed();
    } else {
      navigate(nextLocation || "/");
    }
  };

  const hasUnsavedChanges = () => {
    if (!selectedImageId) return false;

    const dataset = datasets.find((d) =>
      d.images.some((img) => img.id === selectedImageId)
    );

    if (!dataset) return false;

    const annotationIdsInState = new Set(annotations.map((ann) => ann.id));
    const annotationIdsInDataset = new Set(
      dataset.annotations
        .filter((ann) => ann.image_id === selectedImageId)
        .map((ann) => ann.id)
    );
    const annotationsChanged = [...annotationIdsInState].some(
      (id) => !annotationIdsInDataset.has(id)
    );

    const categoryIdsInState = new Set(classes.map((cls) => cls.id));
    const categoryIdsInDataset = new Set(
      dataset.categories.map((cls) => cls.id)
    );
    const categoriesChanged = [...categoryIdsInState].some(
      (id) => !categoryIdsInDataset.has(id)
    );

    return annotationsChanged || categoriesChanged;
  };

  useEffect(() => {
    if (blocker.state === "blocked") {
      if (hasUnsavedChanges()) {
        setShowDialog(true);
      } else {
        blocker.proceed();
      }
    }
  }, [blocker.state]);

  useEffect(() => {
    if (blocker.state === "blocked" && blocker.location) {
      setNextLocation(blocker.location.pathname);
    }
  }, [blocker]);

  useEffect(() => {
    if (!canvasRef.current || !imageData) return;

    if (fabricRef.current) {
      fabricRef.current.dispose();
      fabricRef.current = null;
    }

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
      if (annotations.length > 0) {
        setShowDialog(true);
      } else {
        fabricRef.current?.dispose();
        fabricRef.current = null;
      }
    };
  }, [imageData]);

  usePolygonTool(fabricRef.current, activeTool === "polygon");
  useBrushTool(fabricRef.current, activeTool === "brush");
  // useEraserTool(fabricRef.current, activeTool === "eraser");
  // useRenderMask(fabricRef.current);

  return (
    <>
      <canvas ref={canvasRef} className="canvas" />

      <DialogSaveAnnotations
        open={showDialog || blocker.state === "blocked"}
        onClose={() => {
          blocker.state = "unblocked";
          setShowDialog(false);
        }}
        onSave={handleSaveAnnotations}
        onDiscard={handleDiscardAnnotations}
      />
    </>
  );
}
