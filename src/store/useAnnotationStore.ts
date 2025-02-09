import { create } from "zustand";
import { Canvas } from "fabric";
import { Annotation, useCOCOStore } from "./useCOCOStore";

export type Tool = "polygon" | "brush" | "eraser" | "none";
export type PositionMode = "precision" | "direct";

export interface AnnotationClass {
  id: number;
  name: string;
  supercategory: string;
  color: string;
}

interface HistoryState {
  objects: string;
  timestamp: number;
}
interface AnnotationState {
  classes: AnnotationClass[];
  selectedClassId: number | null;
  activeTool: Tool;
  brushSize: number;
  history: HistoryState[];
  currentHistoryIndex: number;
  canvas: Canvas | null;
  annotations: Annotation[];
  selectedImageId: number | null;
  classIdCounter: number;
  annotationIdCounter: number;
  isCrowded: 0 | 1;
  setSelectedImageId: (id: number | null) => void;
  addClass: (name: string, supercategory: string, color: string) => void;
  removeClass: (id: number) => void;
  selectClass: (id: number | null) => void;
  setBrushSize: (size: number) => void;
  setActiveTool: (tool: Tool) => void;
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  setCanvas: (canvas: Canvas) => void;
  saveMask: (
    rle: number[],
    width: number,
    height: number,
    imageId: number
  ) => void;
  savePolygon: (points: { x: number; y: number }[]) => void;
  setIsCrowded: (value: 0 | 1) => void;
  setAnnotations: (annotations: Annotation[]) => void;
  setHistory: (history: HistoryState[]) => void;
  setClasses: (classes: AnnotationClass[]) => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  classes: [],
  selectedClassId: null,
  classIdCounter: 1,
  selectedImageId: null,
  activeTool: "none",
  brushSize: 20,
  history: [],
  currentHistoryIndex: -1,
  canvas: null,
  annotations: [],
  annotationIdCounter: 1,
  isCrowded: 0,

  addClass: (name, supercategory, color) =>
    set((state) => {
      const newClass = {
        id: state.classIdCounter,
        name,
        supercategory,
        color,
      };
      return {
        classes: [...state.classes, newClass],
        selectedClassId: newClass.id,
        classIdCounter: state.classIdCounter + 1,
      };
    }),

  removeClass: (id: number) =>
    set((state) => ({
      classes: state.classes.filter((c) => c.id !== id),
      selectedClassId:
        state.selectedClassId === id ? null : state.selectedClassId,
    })),

  selectClass: (id: number | null) =>
    set((state) => ({
      selectedClassId: state.selectedClassId === id ? null : id,
      activeTool: state.selectedClassId === id ? "none" : state.activeTool,
    })),

  setBrushSize: (size) => set({ brushSize: size }),

  setActiveTool: (tool) => set({ activeTool: tool }),

  setIsCrowded: (value) => set({ isCrowded: value }),

  setAnnotations: (annotations: Annotation[]) => set({ annotations }),

  setHistory: (history) => set({ history, currentHistoryIndex: -1 }),

  setClasses: (classes) =>
    set((state) => {
      const maxId =
        classes.length > 0 ? Math.max(...classes.map((cls) => cls.id)) : 0;
      return {
        classes,
        selectedClassId: state.selectedClassId,
        classIdCounter: Math.max(state.classIdCounter, maxId + 1),
      };
    }),

  saveHistory: () => {
    const { canvas } = get();
    if (!canvas) return;
    const newState: HistoryState = {
      objects: JSON.stringify(
        (canvas as any).toJSON(["backgroundImage", "src"])
      ),
      timestamp: Date.now(),
    };
    set((state) => {
      const newHistory = state.history.slice(0, state.currentHistoryIndex + 1);
      return {
        history: [...newHistory, newState],
        currentHistoryIndex: newHistory.length,
      };
    });
  },

  undo: () => {
    const { canvas, currentHistoryIndex, history } = get();
    if (!canvas || currentHistoryIndex <= 0) return;
    const previousState = history[currentHistoryIndex - 1];
    canvas.loadFromJSON(previousState.objects, () => {
      canvas.getObjects().forEach((obj) => {
        if (obj.type === "image") {
          obj.set({
            selectable: false,
            evented: false,
            hasControls: false,
            lockMovementX: true,
            lockMovementY: true,
            hoverCursor: "default",
          });
        }
      });
      setTimeout(() => {
        canvas.renderAll();
      }, 10);
      set({ currentHistoryIndex: currentHistoryIndex - 1 });
    });
  },

  redo: () => {
    const { canvas, currentHistoryIndex, history } = get();
    if (!canvas || currentHistoryIndex >= history.length - 1) return;
    const nextState = history[currentHistoryIndex + 1];
    canvas.loadFromJSON(nextState.objects, () => {
      canvas.getObjects().forEach((obj) => {
        if (obj.type === "image") {
          obj.set({
            selectable: false,
            evented: false,
            hasControls: false,
            lockMovementX: true,
            lockMovementY: true,
            hoverCursor: "default",
          });
        }
      });
      setTimeout(() => {
        canvas.renderAll();
      }, 10);
      set({ currentHistoryIndex: currentHistoryIndex + 1 });
    });
  },

  setCanvas: (canvas) => set({ canvas }),

  setSelectedImageId: (id: number | null) => set({ selectedImageId: id }),

  saveMask: (rle: number[], width: number, height: number, imageId: number) => {
    const { selectedClassId, annotationIdCounter, annotations, isCrowded } =
      get();
    if (!selectedClassId) return;

    // Obtém o dataset atual do COCOStore para verificar as anotações já salvas
    const { datasets } = useCOCOStore.getState();
    const dataset = datasets.find((d) =>
      d.images.some((img) => img.id === imageId)
    );

    // Procura uma anotação existente no stage para merge, mas somente se NÃO estiver salva
    const existingIndex = annotations.findIndex((ann) => {
      if (
        ann.classId === selectedClassId &&
        ann.imageId === imageId &&
        ann.segmentation &&
        typeof ann.segmentation === "object" &&
        !Array.isArray(ann.segmentation)
      ) {
        // Se o dataset existir e essa anotação já estiver salva no dataset, não mescla
        if (
          dataset &&
          dataset.annotations.some((savedAnn) => savedAnn.id === ann.id)
        ) {
          return false;
        }
        return true;
      }
      return false;
    });

    if (existingIndex !== -1) {
      // Merge somente com anotações que estão apenas no stage (temporárias)
      const existingAnnotation = annotations[existingIndex];
      const existingSeg = existingAnnotation.segmentation as {
        counts: number[];
        size: [number, number];
      };

      const mergedRLE = mergeRLE(existingSeg.counts, rle, width, height);
      const mergedMask = decodeRLE(mergedRLE, width, height);
      const newArea = mergedMask.reduce((sum, val) => sum + val, 0);
      const newBbox = calculateMaskBBox(mergedMask, width, height);

      const updatedAnnotation: Annotation = {
        ...existingAnnotation,
        segmentation: { counts: mergedRLE, size: [height, width] },
        area: newArea,
        bbox: newBbox,
      };

      const newAnnotations = [...annotations];
      newAnnotations[existingIndex] = updatedAnnotation;
      set({ annotations: newAnnotations });
    } else {
      const mask = decodeRLE(rle, width, height);
      const area = mask.reduce((sum, val) => sum + val, 0);
      const bbox = calculateMaskBBox(mask, width, height);

      const newAnnotation: Annotation = {
        id: annotationIdCounter,
        classId: selectedClassId,
        imageId,
        segmentation: { counts: rle, size: [height, width] },
        area,
        iscrowd: isCrowded,
        bbox,
      };

      set({
        annotations: [...annotations, newAnnotation],
        annotationIdCounter: annotationIdCounter + 1,
      });
    }
  },

  savePolygon: (points) => {
    const {
      selectedClassId,
      selectedImageId,
      annotationIdCounter,
      annotations,
      isCrowded,
    } = get();
    if (!selectedClassId || !selectedImageId) return;

    const newAnnotation: Annotation = {
      id: annotationIdCounter,
      classId: selectedClassId,
      imageId: selectedImageId,
      segmentation: [points.flatMap(({ x, y }) => [x, y])],
      area: calculateArea(points),
      iscrowd: isCrowded,
      bbox: calculateBoundingBox(points),
    };

    set({
      annotations: [...annotations, newAnnotation],
      annotationIdCounter: annotationIdCounter + 1,
    });
  },
}));

export function decodeRLE(
  rle: number[],
  width: number,
  height: number
): Uint8Array {
  const binaryMask = new Uint8Array(width * height);
  let index = 0;
  for (let i = 0; i < rle.length; i++) {
    const value = i % 2 === 0 ? 0 : 1;
    const count = rle[i];
    for (let j = 0; j < count; j++) {
      binaryMask[index++] = value;
    }
  }
  return binaryMask;
}
export function encodeRLE(binaryMask: Uint8Array): number[] {
  const rle: number[] = [];
  let count = 0;
  let current = binaryMask[0];

  for (let i = 0; i < binaryMask.length; i++) {
    if (binaryMask[i] === current) {
      count++;
    } else {
      rle.push(count);
      count = 1;
      current = binaryMask[i];
    }
  }

  rle.push(count);
  return rle;
}

function mergeRLE(
  rle1: number[],
  rle2: number[],
  width: number,
  height: number
): number[] {
  const mask1 = decodeRLE(rle1, width, height);
  const mask2 = decodeRLE(rle2, width, height);
  const mergedMask = new Uint8Array(width * height);
  for (let i = 0; i < mergedMask.length; i++) {
    mergedMask[i] = mask1[i] || mask2[i] ? 1 : 0;
  }
  return encodeRLE(mergedMask);
}

function calculateMaskBBox(
  binaryMask: Uint8Array,
  width: number,
  height: number
): [number, number, number, number] {
  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (binaryMask[y * width + x] === 1) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (minX === width || minY === height) return [0, 0, 0, 0];
  return [minX, minY, maxX - minX, maxY - minY];
}

function calculateArea(points: { x: number; y: number }[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

function calculateBoundingBox(
  points: { x: number; y: number }[]
): [number, number, number, number] {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return [minX, minY, maxX - minX, maxY - minY];
}
