import { create } from "zustand";
import { Canvas } from "fabric";
import { Annotation } from "./useCOCOStore";

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
    })),

  setBrushSize: (size) => set({ brushSize: size }),

  setActiveTool: (tool) => set({ activeTool: tool }),

  setIsCrowded: (value) => set({ isCrowded: value }),

  setAnnotations: (annotations: Annotation[]) => set({ annotations }),

  setHistory: (history) => set({ history, currentHistoryIndex: -1 }),

  setClasses: (classes) =>
    set({ classes, classIdCounter: 1, selectedClassId: null }),

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

    const newAnnotation: Annotation = {
      id: annotationIdCounter,
      classId: selectedClassId,
      imageId,
      segmentation: { counts: rle, size: [height, width] as [number, number] },
      area: width * height,
      iscrowd: isCrowded,
      bbox: [0, 0, width, height],
    };

    set({
      annotations: [...annotations, newAnnotation],
      annotationIdCounter: annotationIdCounter + 1,
    });
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
    mergedMask[i] = mask1[i] | mask2[i];
  }

  return encodeRLE(mergedMask);
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
