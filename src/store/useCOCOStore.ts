import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
interface Info {
  description: string;
  url: string;
  version: string;
  year: number;
  contributor: string;
  date_created: string;
}

interface License {
  url: string;
  id: number;
  name: string;
}

interface Image {
  license: number;
  file_name: string;
  coco_url: string;
  height: number;
  width: number;
  date_captured: string;
  flickr_url: string;
  id: number;
}

type Segmentation = number[] | number[][];
interface Annotation {
  segmentation: Segmentation[];
  area: number;
  iscrowd: number;
  image_id: number;
  bbox: number[];
  category_id: number;
  id: number;
}

interface Category {
  supercategory: string;
  id: number;
  name: string;
}

export interface Dataset {
  id: string;
  info: Info;
  licenses: License[];
  images: Image[];
  annotations: Annotation[];
  categories: Category[];
}

interface COCOState {
  datasets: Dataset[];
  addDataset: (info: Info) => void;
  updateDataset: (id: string, updatedInfo: Info) => void;
  removeDataset: (id: string) => void;
  exportDataset: (id: string) => Dataset | undefined;
}

export const useCOCOStore = create<COCOState>()(
  devtools(
    (set, get) => ({
      datasets: [],

      addDataset: (info) => {
        const newDataset: Dataset = {
          id: uuidv4(),
          info,
          licenses: [],
          images: [],
          annotations: [],
          categories: [],
        };
        set((state) => ({ datasets: [...state.datasets, newDataset] }));
      },

      updateDataset: (id, updatedInfo) =>
        set((state) => ({
          datasets: state.datasets.map((dataset) =>
            dataset.id === id ? { ...dataset, info: updatedInfo } : dataset
          ),
        })),

      removeDataset: (id) =>
        set((state) => ({
          datasets: state.datasets.filter((dataset) => dataset.id !== id),
        })),

      exportDataset: (id) =>
        get().datasets.find((dataset) => dataset.id === id),
    }),
    { name: "COCOStore" }
  )
);
