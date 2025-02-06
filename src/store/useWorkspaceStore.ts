import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Estrutura de uma Imagem no formato COCO
interface COCOImage {
  id: number;
  file_name: string;
  width: number;
  height: number;
}

// Estrutura de uma Anotação no formato COCO
interface COCOAnnotation {
  id: number;
  image_id: number;
  segmentation: number[][]; // Lista de pontos (para polígono)
  category_id: number;
}

// Estrutura de uma Categoria no formato COCO
interface COCOCategory {
  id: number;
  name: string;
}

// Estrutura do Dataset no formato COCO
interface COCODataset {
  id: string;
  name: string;
  images: COCOImage[];
  annotations: COCOAnnotation[];
  categories: COCOCategory[];
}

// Estado Global do Workspace
interface WorkspaceState {
  datasets: COCODataset[];
  activeDataset: string | null;
  activeImage: number | null;
  addDataset: (name: string) => void;
  addImage: (datasetId: string, image: COCOImage) => void;
  addAnnotation: (datasetId: string, annotation: COCOAnnotation) => void;
  setActiveDataset: (datasetId: string) => void;
  setActiveImage: (imageId: number) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  devtools((set) => ({
    datasets: [],
    activeDataset: null,
    activeImage: null,

    addDataset: (name) => {
      const id = crypto.randomUUID();
      set(
        (state) => ({
          datasets: [
            ...state.datasets,
            { id, name, images: [], annotations: [], categories: [] },
          ],
          activeDataset: id,
        }),
        false,
        "addDataset" // Nome da ação para o DevTools
      );
    },

    addImage: (datasetId, image) => {
      set(
        (state) => ({
          datasets: state.datasets.map((dataset) =>
            dataset.id === datasetId
              ? { ...dataset, images: [...dataset.images, image] }
              : dataset
          ),
        }),
        false,
        "addImage"
      );
    },

    addAnnotation: (datasetId, annotation) => {
      set(
        (state) => ({
          datasets: state.datasets.map((dataset) =>
            dataset.id === datasetId
              ? {
                  ...dataset,
                  annotations: [...dataset.annotations, annotation],
                }
              : dataset
          ),
        }),
        false,
        "addAnnotation"
      );
    },

    setActiveDataset: (datasetId) =>
      set({ activeDataset: datasetId }, false, "setActiveDataset"),
    setActiveImage: (imageId) =>
      set({ activeImage: imageId }, false, "setActiveImage"),
  }))
);
