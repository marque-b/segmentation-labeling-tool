import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { Canvas } from "fabric";

export type Tool = "polygon" | "brush" | "eraser" | "none";
export type PositionMode = "precision" | "direct";

interface AnnotationClass {
  id: string;
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
  classId: string;
  height: number;
  width: number;
  rle: number[];
}

interface AnnotationState {
  classes: AnnotationClass[];
  selectedClassId: string | null;
  activePositionMode: PositionMode;
  activeTool: Tool;
  brushSize: number;
  history: HistoryState[];
  currentHistoryIndex: number;
  canvas: Canvas | null;
  masks: MaskAnnotation[];
  addClass: (name: string, supercategory: string, color: string) => void;
  removeClass: (id: string) => void;
  selectClass: (id: string) => void;
  setActivePositionMode: (mode: PositionMode) => void;
  setBrushSize: (size: number) => void;
  setActiveTool: (tool: Tool) => void;
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  setCanvas: (canvas: Canvas) => void;
  saveMask: (rle: number[], width: number, height: number) => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  classes: [],
  selectedClassId: null,
  activePositionMode: "direct",
  activeTool: "none",
  brushSize: 5,
  history: [],
  currentHistoryIndex: -1,
  canvas: null,
  masks: [],
  addClass: (name, supercategory, color) =>
    set((state) => {
      const newClass = { id: uuidv4(), name, supercategory, color };
      return {
        classes: [...state.classes, newClass],
        selectedClassId: newClass.id,
      };
    }),
  removeClass: (id) =>
    set((state) => ({
      classes: state.classes.filter((c) => c.id !== id),
    })),
  selectClass: (id) =>
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
  saveMask: (rle: number[], width: number, height: number) => {
    const { selectedClassId, masks } = get();
    if (!selectedClassId) return;

    const existingMaskIndex = masks.findIndex(
      (mask) =>
        mask.classId === selectedClassId &&
        mask.width === width &&
        mask.height === height
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
          { id: uuidv4(), classId: selectedClassId, width, height, rle },
        ],
      });
    }
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

function encodeRLE(binaryMask: Uint8Array): number[] {
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
