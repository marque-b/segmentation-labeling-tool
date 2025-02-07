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
  saveMask: (rle: number[]) => void;
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
  saveMask: (rle) => {
    const { selectedClassId, masks } = get();
    if (!selectedClassId) return;

    const existingMaskIndex = masks.findIndex(
      (mask) => mask.classId === selectedClassId
    );

    if (existingMaskIndex !== -1) {
      const updatedRLE = mergeRLE(masks[existingMaskIndex].rle, rle);
      const updatedMasks = [...masks];
      updatedMasks[existingMaskIndex] = {
        ...masks[existingMaskIndex],
        rle: updatedRLE,
      };
      set({ masks: updatedMasks });
    } else {
      set({
        masks: [...masks, { id: uuidv4(), classId: selectedClassId, rle }],
      });
    }
  },
}));

function mergeRLE(existingRLE: number[], newRLE: number[]): number[] {
  if (existingRLE.length === 0) return newRLE;
  if (newRLE.length === 0) return existingRLE;

  const merged = [];
  let i = 0,
    j = 0;
  let lastValue = 0;

  while (i < existingRLE.length || j < newRLE.length) {
    const existingValue = i < existingRLE.length ? existingRLE[i] : 0;
    const newValue = j < newRLE.length ? newRLE[j] : 0;

    if (lastValue % 2 === 0) {
      merged.push(existingValue + newValue);
    } else {
      merged.push(Math.max(existingValue, newValue));
    }

    i++;
    j++;
    lastValue++;
  }

  return merged;
}
