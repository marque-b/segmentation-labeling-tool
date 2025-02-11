import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { useAnnotationStore } from "./useAnnotationStore";
import { licenses } from "@/assets/licenses";

export interface COCOExport {
  id?: string;
  info: {
    description: string;
    url: string;
    version: string;
    year: number;
    contributor: string;
    date_created: string;
  };
  licenses: { id: number; name: string; url: string }[];
  images: {
    id: number;
    license: number;
    file_name: string;
    coco_url: string;
    height: number;
    width: number;
    date_captured: string;
    flickr_url: string;
  }[];
  annotations: {
    id: number;
    category_id: number;
    image_id: number;
    segmentation:
      | number[][]
      | { counts: number[]; size: [number, number] }
      | null;
    area: number;
    iscrowd: 0 | 1;
    bbox: [number, number, number, number];
  }[];
  categories: {
    id: number;
    name: string;
    supercategory: string;
  }[];
}

interface Info {
  id?: string;
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

export interface Category {
  supercategory: string;
  id: number;
  name: string;
  color?: string;
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
    _imageId: number,
    newAnnotations: Annotation[]
  ) =>
    set((state) => {
      const datasetIndex = state.datasets.findIndex((d) => d.id === datasetId);
      if (datasetIndex === -1) return state;

      const updatedDatasets = state.datasets.map((dataset) => {
        if (dataset.id !== datasetId) return dataset;

        const mergedMap = new Map<number, Annotation>();
        dataset.annotations.forEach((ann) => mergedMap.set(ann.id, ann));
        newAnnotations
          .filter((ann) => ann.segmentation !== null)
          .forEach((ann) => mergedMap.set(ann.id, ann));

        return { ...dataset, annotations: Array.from(mergedMap.values()) };
      });

      const annotationState = useAnnotationStore.getState();

      return {
        datasets: updatedDatasets,
        history: [
          {
            canvasObjects: JSON.stringify(
              (annotationState.canvas as any).toJSON(["backgroundImage", "src"])
            ),
            annotations: JSON.parse(JSON.stringify(newAnnotations)),
            selectedClassId: annotationState.selectedClassId,
            activeTool: annotationState.activeTool,
            brushSize: annotationState.brushSize,
            selectedImageId: annotationState.selectedImageId,
            isCrowded: annotationState.isCrowded,
            allowAnnotationDelete: annotationState.allowAnnotationDelete,
            timestamp: Date.now(),
          },
        ],
        currentHistoryIndex: 0,
      };
    }),

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

  exportDataset: (id: string): any => {
    const dataset = get().datasets.find((dataset) => dataset.id === id);
    if (!dataset) return undefined;
    return;
  },

  exportDatasetToJson: (datasetId: string) => {
    const dataset = get().exportDataset(datasetId);
    if (!dataset) {
      console.error("Dataset not found.");
      return;
    }

    const formattedDataset = formatDatasetForExport(dataset);
    const jsonData = JSON.stringify(formattedDataset, null, 2);
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

const formatDatasetForExport = (dataset: Dataset): COCOExport => {
  const annotations = dataset.annotations.map((ann) => ({
    id: ann.id,
    category_id: ann.classId,
    image_id: ann.imageId,
    segmentation: ann.segmentation
      ? Array.isArray(ann.segmentation)
        ? ann.segmentation
        : { counts: ann.segmentation.counts, size: ann.segmentation.size }
      : null,
    area: ann.area,
    iscrowd: ann.iscrowd,
    bbox: ann.bbox,
  }));

  const licenseIds = new Set(dataset.images.map((img) => img.license));
  const datasetLicenses = licenses.filter((license) =>
    licenseIds.has(license.id)
  );

  const images = dataset.images.map((img, index) => ({
    id: img.id ?? index + 1,
    license: img.license,
    file_name: img.file_name,
    coco_url: img.coco_url,
    height: img.height,
    width: img.width,
    date_captured: img.date_captured,
    flickr_url: img.flickr_url,
  }));

  return {
    id: dataset.id,
    info: dataset.info,
    licenses: datasetLicenses,
    images,
    annotations,
    categories: dataset.categories,
  };
};
