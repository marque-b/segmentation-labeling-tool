import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { useAnnotationStore } from "./useAnnotationStore";

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
  id?: number;
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

export type Segmentation =
  | number[][]
  | { counts: number[]; size: [number, number] };

export interface Annotation {
  id: number;
  classId: number;
  imageId: number;
  segmentation?: Segmentation | null;
  area: number;
  iscrowd: 0 | 1;
  bbox: [number, number, number, number];
}

interface Category {
  supercategory: string;
  id: number;
  name: string;
  color: string;
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
  updateImageLicense: (
    datasetId: string,
    fileName: string,
    licenseId: number
  ) => void;
  exportDatasetToJson: (datasetId: string) => void;
  updateDatasetAnnotations: (
    datasetId: string,
    imageId: number,
    newAnnotations: Annotation[]
  ) => void;
  updateDatasetCategories: (datasetId: string, categories: Category[]) => void;
}

export const useCOCOStore = create<COCOState>()((set, get) => ({
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

  exportDataset: (id) => {
    const dataset = get().datasets.find((dataset) => dataset.id === id);
    if (!dataset) return undefined;

    const { annotations } = useAnnotationStore.getState();

    return {
      ...dataset,
      annotations: annotations.filter((ann) =>
        dataset.images.some((img) => img.id === ann.imageId)
      ),
    };
  },

  updateImageLicense: (
    datasetId: string,
    fileName: string,
    newLicenseId: number
  ) =>
    set((state) => ({
      datasets: state.datasets.map((dataset) =>
        dataset.id === datasetId
          ? {
              ...dataset,
              images: dataset.images.map((img) =>
                img.file_name === fileName
                  ? { ...img, license: newLicenseId }
                  : img
              ),
            }
          : dataset
      ),
    })),

  updateDatasetAnnotations: (
    datasetId: string,
    imageId: number,
    newAnnotations: Annotation[]
  ) =>
    set((state) => ({
      datasets: state.datasets.map((dataset) =>
        dataset.id === datasetId
          ? {
              ...dataset,
              annotations: [
                ...dataset.annotations.filter((ann) => ann.imageId !== imageId),
                ...newAnnotations.filter((ann) => ann.segmentation !== null),
              ],
            }
          : dataset
      ),
    })),

  updateDatasetCategories: (datasetId: string, newCategories: Category[]) =>
    set((state) => ({
      datasets: state.datasets.map((dataset) => {
        if (dataset.id !== datasetId) return dataset;
        const mergedCategories = [
          ...dataset.categories,
          ...newCategories.filter(
            (newCat) =>
              !dataset.categories.some((savedCat) => savedCat.id === newCat.id)
          ),
        ];
        return {
          ...dataset,
          categories: mergedCategories,
        };
      }),
    })),

  exportDatasetToJson: (datasetId: string) => {
    const dataset = get().exportDataset(datasetId);
    if (!dataset) {
      console.error("Dataset not found.");
      return;
    }

    const jsonData = JSON.stringify(dataset, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${dataset.info.description || "dataset"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  },
}));
