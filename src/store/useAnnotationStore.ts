import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

type Tool = "brush" | "polygon" | "eraser" | "none";

interface AnnotationClass {
  id: string;
  name: string;
  supercategory: string;
  color: string;
}

interface AnnotationState {
  classes: AnnotationClass[];
  addClass: (name: string, supercategory: string, color: string) => void;
  selectedClassId: string | null;
  removeClass: (id: string) => void;
  selectClass: (id: string) => void;
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}

export const useAnnotationStore = create<AnnotationState>((set) => ({
  classes: [],
  selectedClassId: null,

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

  activeTool: "none",
  setActiveTool: (tool) => set({ activeTool: tool }),
}));
