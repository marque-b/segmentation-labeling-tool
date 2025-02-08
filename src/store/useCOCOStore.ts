import { create } from "zustand";
import { devtools } from "zustand/middleware";
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
  updateImageLicense: (
    datasetId: string,
    fileName: string,
    licenseId: number
  ) => void;
  exportDatasetToJson: (datasetId: string) => void;
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

      exportDataset: (id) => {
        console.log("Exporting dataset with ID:", id);

        const dataset = get().datasets.find((dataset) => dataset.id === id);
        if (!dataset) {
          console.warn("Dataset not found.");
          return undefined;
        }

        const { masks, polygons } = useAnnotationStore.getState();

        console.log("Dataset Images:", dataset.images);
        console.log("Masks:", masks);
        console.log("Polygons:", polygons);

        const annotationMap = new Map(
          dataset.annotations.map((ann) => [
            `${ann.image_id}-${ann.category_id}`,
            ann,
          ])
        );

        let annotationIdCounter = 1;

        masks.forEach((mask) => {
          console.log("Processing mask:", mask);

          const image = dataset.images.find(
            (img) => img.file_name === mask.imageId
          );

          if (!image) {
            console.warn("⚠️ Image not found for mask:", {
              maskImageId: mask.imageId,
              datasetImages: dataset.images.map((img) => img.file_name),
            });
            return;
          }

          const imageId = dataset.images.indexOf(image) + 1;
          const categoryId = Number(mask.classId);
          const annotationKey = `${imageId}-${categoryId}`;

          console.log(
            `✅ Found matching image: ${image.file_name} -> Image ID: ${imageId}`
          );

          if (annotationMap.has(annotationKey)) {
            const existingAnnotation = annotationMap.get(annotationKey);
            if (existingAnnotation) {
              console.log("Updating existing annotation:", existingAnnotation);
              existingAnnotation.segmentation = [];
              existingAnnotation.bbox = [0, 0, mask.width, mask.height];
              existingAnnotation.area = mask.width * mask.height;
            }
          } else {
            console.log("Creating new annotation for mask.");
            annotationMap.set(annotationKey, {
              id: annotationIdCounter++,
              image_id: imageId,
              category_id: categoryId,
              segmentation: [],
              area: mask.width * mask.height,
              bbox: [0, 0, mask.width, mask.height],
              iscrowd: 0,
            });
          }
        });

        const allAnnotations = Array.from(annotationMap.values());
        console.log("Final annotations:", allAnnotations);

        return {
          ...dataset,
          annotations: allAnnotations,
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
    }),

    { name: "COCOStore" }
  )
);

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
