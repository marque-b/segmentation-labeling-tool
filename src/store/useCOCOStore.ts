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
}

export interface ImageFile {
  id: string;
  datasetId: string;
  file: File;
  previewUrl: string;
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
  imageFiles: ImageFile[];
  addDataset: (info: Info) => void;
  imageIdCounter: number;
  updateDataset: (id: string, updatedInfo: Info) => void;
  removeDataset: (id: string) => void;
  addImageToDataset: (datasetId: string, image: Image) => void;
  addImageFile: (datasetId: string, file: File) => void;
  exportDataset: (id: string) => Dataset | undefined;
  removeImageFromDataset: (datasetId: string, fileName: string) => void;
}

export const useCOCOStore = create<COCOState>()(
  devtools(
    (set, get) => ({
      datasets: [],
      imageFiles: [],
      imageIdCounter: 1,

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

      addImageToDataset: (datasetId, imageData) =>
        set((state) => ({
          datasets: state.datasets.map((dataset) =>
            dataset.id === datasetId
              ? {
                  ...dataset,
                  images: [
                    ...dataset.images,
                    { ...imageData, id: state.imageIdCounter },
                  ],
                }
              : dataset
          ),
          imageIdCounter: state.imageIdCounter + 1,
        })),

      addImageFile: (datasetId: string, file: File) =>
        set((state) => ({
          imageFiles: [
            ...state.imageFiles,
            {
              id: uuidv4(),
              datasetId,
              file,
              previewUrl: URL.createObjectURL(file),
            },
          ],
        })),

      removeImageFromDataset: (datasetId: string, fileName: string) =>
        set((state) => ({
          datasets: state.datasets.map((dataset) =>
            dataset.id === datasetId
              ? {
                  ...dataset,
                  images: dataset.images.filter(
                    (img) => img.file_name !== fileName
                  ),
                }
              : dataset
          ),
          imageFiles: state.imageFiles.filter(
            (file) => file.file.name !== fileName
          ),
        })),

      exportDataset: (id) =>
        get().datasets.find((dataset) => dataset.id === id),
    }),
    { name: "COCOStore" }
  )
);
