import { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage } from "fabric";
import { ImageData } from "./EditorPage";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import { usePolygonTool } from "@/hooks/usePolygonTool";
import { useBrushTool } from "@/hooks/useBrushTool";
// import { useEraserTool } from "@/hooks/useEraserTool";
import DialogSaveAnnotations from "./DialogSaveAnnotations";
import { Segmentation, useCOCOStore } from "@/store/useCOCOStore";
import { useBlocker, useNavigate } from "react-router-dom";
import { useSaveAnnotations } from "@/hooks/useSaveAnnotations";
import { useFixedAnnotations } from "@/hooks/useFixedAnnotations";
import { createMaskCanvas } from "@/utils/maskUtils";

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
    setHistory,
    classes,
    selectedClassId,
    selectClass,
    isCrowded,
    setIsCrowded,
  } = useAnnotationStore();

  const navigate = useNavigate();
  const blocker = useBlocker(() => annotations.length > 0);
  const { saveAnnotations } = useSaveAnnotations();

  const [pendingTool, setPendingTool] = useState<
    "polygon" | "brush" | "eraser" | "none" | null
  >(null);
  const [pendingClass, setPendingClass] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [nextLocation, setNextLocation] = useState<string | null>(null);
  const [pendingCrowded, setPendingCrowded] = useState<0 | 1 | null>(null);

  const prevToolRef = useRef(activeTool);
  const prevClassRef = useRef(selectedClassId);
  const prevCrowdedRef = useRef(isCrowded);

  const clearStage = () => {
    setAnnotations([]);
    setActiveTool("none");
    setHistory([]);

    if (fabricRef.current) {
      fabricRef.current.clear();
      fabricRef.current.dispose();
      fabricRef.current = null;
    }
  };

  const clearHistoryAndAnnotations = () => {
    setAnnotations([]);
    setHistory([]);
  };

  const handleSaveAnnotations = () => {
    saveAnnotations();
    if (nextLocation) {
      clearStage();
    } else {
      clearHistoryAndAnnotations();
    }
    setShowDialog(false);

    if (pendingTool !== null) {
      setActiveTool(pendingTool);
      prevToolRef.current = pendingTool;
      setPendingTool(null);
    }
    if (pendingClass !== null) {
      selectClass(pendingClass);
      prevClassRef.current = pendingClass;
      setPendingClass(null);
    }
    if (pendingCrowded !== null) {
      setIsCrowded(pendingCrowded);
      prevCrowdedRef.current = pendingCrowded;
      setPendingCrowded(null);
    }

    if (blocker.state === "blocked" && blocker.proceed) {
      blocker.proceed();
    } else if (nextLocation) {
      navigate(nextLocation || "/");
    }
  };

  const handleDiscardAnnotations = () => {
    clearStage();
    setShowDialog(false);

    if (pendingTool !== null) {
      setActiveTool(pendingTool);
      prevToolRef.current = pendingTool;
      setPendingTool(null);
    }
    if (pendingClass !== null) {
      selectClass(pendingClass);
      prevClassRef.current = pendingClass;
      setPendingClass(null);
    }

    if (pendingCrowded !== null) {
      setIsCrowded(pendingCrowded);
      prevCrowdedRef.current = pendingCrowded;
      setPendingCrowded(null);
    }

    if (blocker.state === "blocked" && blocker.proceed) {
      blocker.proceed();
    } else {
      navigate(nextLocation || "/");
    }
  };

  const hasUnsavedChanges = () => {
    if (!selectedImageId) return false;
    if (annotations.length === 0) return false;

    const dataset = datasets.find((d) =>
      d.images.some((img) => img.id === selectedImageId)
    );

    if (!dataset) return false;

    const annotationIdsInState = new Set(annotations.map((ann) => ann.id));
    const annotationIdsInDataset = new Set(
      dataset.annotations
        .filter((ann) => ann.imageId === selectedImageId)
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

  function isRLE(
    seg: Segmentation | null | undefined
  ): seg is { counts: number[]; size: [number, number] } {
    return (
      seg !== null &&
      seg !== undefined &&
      typeof seg === "object" &&
      "counts" in seg &&
      "size" in seg
    );
  }

  useEffect(() => {
    setActiveTool("none");
    prevToolRef.current = "none";
  }, [selectedImageId]);

  useEffect(() => {
    if (activeTool === "eraser" || activeTool === "brush") {
      prevToolRef.current = activeTool;
      return;
    }
    if (activeTool !== prevToolRef.current) {
      if (
        annotations.length > 0 &&
        prevToolRef.current !== "none" &&
        hasUnsavedChanges()
      ) {
        setPendingTool(activeTool);
        setActiveTool(prevToolRef.current);
        setShowDialog(true);
      } else {
        prevToolRef.current = activeTool;
      }
    }
  }, [activeTool]);
  useEffect(() => {
    if (selectedClassId !== prevClassRef.current) {
      if (prevClassRef.current !== null && hasUnsavedChanges()) {
        setPendingClass(selectedClassId);
        selectClass(prevClassRef.current);
        setShowDialog(true);
      } else {
        prevClassRef.current = selectedClassId;
      }
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (isCrowded !== prevCrowdedRef.current) {
      if (prevCrowdedRef.current !== null && hasUnsavedChanges()) {
        setPendingCrowded(isCrowded);
        setIsCrowded(prevCrowdedRef.current);
        setShowDialog(true);
      } else {
        prevCrowdedRef.current = isCrowded;
      }
    }
  }, [isCrowded]);

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

    return () => {
      if (annotations.length > 0) {
        setShowDialog(true);
      } else {
        fabricRef.current?.dispose();
        fabricRef.current = null;
      }
    };
  }, [imageData]);

  useEffect(() => {
    if (!fabricRef.current || !datasets || !selectedImageId) return;
    const canvas = fabricRef.current;
    const dataset = datasets.find((d) =>
      d.images.some((img) => img.id === selectedImageId)
    );
    if (!dataset) return;
    dataset.annotations
      .filter(
        (ann) => ann.imageId === selectedImageId && isRLE(ann.segmentation)
      )
      .forEach((ann) => {
        const segmentation = ann.segmentation as {
          counts: number[];
          size: [number, number];
        };
        const category = dataset.categories.find(
          (cat) => cat.id === ann.classId
        );
        const color = category?.color || "#000000";
        const maskCanvas = createMaskCanvas(segmentation, color);
        const maskImage = new FabricImage(maskCanvas, {
          left: 0,
          top: 0,
          selectable: false,
          evented: false,
        });
        canvas.add(maskImage);
      });
    canvas.renderAll();
  }, [datasets, selectedImageId]);

  useEffect(() => {
    return () => {
      setSelectedImageId(null);
    };
  }, []);

  useFixedAnnotations(fabricRef.current, selectedImageId);
  usePolygonTool(fabricRef.current, activeTool === "polygon");
  useBrushTool(fabricRef.current, activeTool === "brush");
  // useEraserTool(fabricRef.current, activeTool === "eraser");

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
