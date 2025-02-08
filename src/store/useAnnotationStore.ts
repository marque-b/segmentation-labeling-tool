import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { Canvas } from "fabric";

export type Tool = "polygon" | "brush" | "eraser" | "none";
export type PositionMode = "precision" | "direct";

interface AnnotationClass {
  id: number;
  name: string;
  supercategory: string;
  color: string;
}

interface HistoryState {
  objects: string;
  timestamp: number;
}

interface MaskAnnotation {
  id: string;
  classId: number;
  height: number;
  width: number;
  rle: number[];
  imageId: string;
}

interface PolygonAnnotation {
  id: string;
  classId: number;
  imageId: string;
  points: { x: number; y: number }[];
}

interface AnnotationState {
  classes: AnnotationClass[];
  selectedClassId: number | null;
  activePositionMode: PositionMode;
  activeTool: Tool;
  brushSize: number;
  history: HistoryState[];
  currentHistoryIndex: number;
  canvas: Canvas | null;
  masks: MaskAnnotation[];
  selectedImageId: string;
  polygons: PolygonAnnotation[];
  classIdCounter: number;
  setSelectedImageId: (id: string) => void;
  addClass: (name: string, supercategory: string, color: string) => void;
  removeClass: (id: number) => void;
  selectClass: (id: number | null) => void;
  setActivePositionMode: (mode: PositionMode) => void;
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
    imageId: string
  ) => void;
  savePolygon: (points: { x: number; y: number }[]) => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  classes: [],
  selectedClassId: null,
  classIdCounter: 1,
  activePositionMode: "direct",
  selectedImageId: "",
  activeTool: "none",
  brushSize: 10,
  history: [],
  currentHistoryIndex: -1,
  canvas: null,
  masks: [],
  polygons: [],

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

  setActivePositionMode: (mode) => set({ activePositionMode: mode }),

  setBrushSize: (size) => set({ brushSize: size }),

  setActiveTool: (tool) => set({ activeTool: tool }),

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

  saveMask: (rle: number[], width: number, height: number, imageId: string) => {
    const { selectedClassId, masks } = get();
    if (!selectedClassId) return;

    const existingMaskIndex = masks.findIndex(
      (mask) =>
        mask.classId === selectedClassId &&
        mask.width === width &&
        mask.height === height &&
        mask.imageId === imageId
    );

    if (existingMaskIndex !== -1) {
      const existingMask = masks[existingMaskIndex];
      const updatedRLE = mergeRLE(
        existingMask.rle,
        rle,
        existingMask.width,
        existingMask.height
      );

      const updatedMasks = [...masks];
      updatedMasks[existingMaskIndex] = {
        ...existingMask,
        rle: updatedRLE,
      };

      set({ masks: updatedMasks });
    } else {
      set({
        masks: [
          ...masks,
          {
            id: uuidv4(),
            classId: selectedClassId,
            width,
            height,
            rle,
            imageId,
          },
        ],
      });
    }
  },

  setSelectedImageId: (id: string) => set({ selectedImageId: id }),

  savePolygon: (points) => {
    const { selectedClassId, selectedImageId, polygons } = get();
    if (!selectedClassId || !selectedImageId) return;

    const newPolygon: PolygonAnnotation = {
      id: uuidv4(),
      classId: selectedClassId,
      imageId: selectedImageId,
      points,
    };

    set({ polygons: [...polygons, newPolygon] });
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

export function subtractRLE(
  originalRLE: number[],
  eraseRLE: number[],
  width: number,
  height: number
): number[] {
  const originalMask = decodeRLE(originalRLE, width, height);
  const eraseMask = decodeRLE(eraseRLE, width, height);
  const updatedMask = new Uint8Array(width * height);

  for (let i = 0; i < updatedMask.length; i++) {
    if (eraseMask[i] === 1 && originalMask[i] === 1) {
      updatedMask[i] = 0;
    } else {
      updatedMask[i] = originalMask[i];
    }
  }

  return encodeRLE(updatedMask);
}

export function decodeRLEForErase(
  rle: number[],
  width: number,
  height: number
): Uint8Array {
  const binaryMask = new Uint8Array(width * height);
  let index = 0;

  for (let i = 0; i < rle.length; i++) {
    const value = i % 2 === 0 ? 0 : 1; // Alterna entre 0 e 1
    const count = rle[i];

    for (let j = 0; j < count; j++) {
      if (index >= binaryMask.length) break;
      binaryMask[index++] = value;
    }
  }

  console.log("Máscara decodificada (para borracha):", binaryMask);
  return binaryMask;
}

export function subtractRLEForErase(
  originalRLE: number[],
  eraseRLE: number[],
  width: number,
  height: number
): number[] {
  const originalMask = decodeRLEForErase(originalRLE, width, height);
  const eraseMask = decodeRLEForErase(eraseRLE, width, height);
  const updatedMask = new Uint8Array(width * height);

  for (let i = 0; i < updatedMask.length; i++) {
    updatedMask[i] = eraseMask[i] === 1 ? 0 : originalMask[i];
  }

  console.log("Depois da subtração:", updatedMask);
  return encodeRLE(updatedMask);
}

export function debugSubtractRLE(
  originalRLE: number[],
  eraseRLE: number[],
  width: number,
  height: number
): number[] {
  const originalMask = decodeRLEForErase(originalRLE, width, height);
  const eraseMask = decodeRLEForErase(eraseRLE, width, height);
  const updatedMask = new Uint8Array(width * height);

  console.log("🔍 Antes da subtração (máscara original):", originalMask);
  console.log("🧽 Máscara da borracha:", eraseMask);

  for (let i = 0; i < updatedMask.length; i++) {
    updatedMask[i] = eraseMask[i] === 1 ? 0 : originalMask[i];
  }

  console.log("✅ Depois da subtração:", updatedMask);
  return encodeRLE(updatedMask);
}
