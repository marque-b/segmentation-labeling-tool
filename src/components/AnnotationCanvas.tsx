import { useEffect, useRef, useState } from "react";
import { Canvas } from "fabric";
import { ImageData } from "./EditorPage";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import { usePolygonTool } from "@/hooks/usePolygonTool";
import { useBrushTool } from "@/hooks/useBrushTool";
import { useEraserTool } from "@/hooks/useEraserTool";
// import { useRenderMask } from "@/hooks/useRenderMask";
import DialogSaveAnnotations from "./DialogSaveAnnotations";
import { Annotation, useCOCOStore } from "@/store/useCOCOStore";
import { useBlocker, useNavigate } from "react-router-dom";

interface AnnotationCanvasProps {
  imageData: ImageData;
}

export default function AnnotationCanvas({ imageData }: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const { datasets, updateDatasetCategories } = useCOCOStore();
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

  const updateDatasetAnnotations = useCOCOStore(
    (state) => state.updateDatasetAnnotations
  );

  const navigate = useNavigate();
  const blocker = useBlocker(() => annotations.length > 0);

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
    if (!selectedImageId || annotations.length === 0) return;

    const dataset = datasets.find((d) =>
      d.images.some((img) => img.id === selectedImageId)
    );

    if (!dataset) {
      console.error("Dataset not found for selected image");
      return;
    }

    const formattedAnnotations: Annotation[] = annotations.map((ann) => ({
      id: ann.id,
      image_id: selectedImageId!,
      category_id: ann.classId,
      segmentation: ann.segmentation || [],
      area: ann.area,
      iscrowd: ann.iscrowd,
      bbox: ann.bbox,
    }));

    const formattedCategories = classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      supercategory: cls.supercategory,
    }));

    if (formattedAnnotations.length > 0) {
      updateDatasetAnnotations(
        dataset.id,
        selectedImageId!,
        formattedAnnotations
      );
    } else {
      console.warn("No valid annotation");
    }

    if (formattedCategories.length > 0) {
      updateDatasetCategories(dataset.id, formattedCategories);
    } else {
      console.warn("No categories to save");
    }

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
  useEraserTool(fabricRef.current, activeTool === "eraser");
  // useRenderMask(fabricRef.current);

  return (
    <>
      <canvas ref={canvasRef} className="canvas" />

      <DialogSaveAnnotations
        open={showDialog || blocker.state === "blocked"}
        onClose={() => {
          setShowDialog(false);
        }}
        onSave={handleSaveAnnotations}
        onDiscard={handleDiscardAnnotations}
      />
    </>
  );
}
