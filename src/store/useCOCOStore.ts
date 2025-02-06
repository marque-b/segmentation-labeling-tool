import { create } from "zustand";
import { devtools } from "zustand/middleware";

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

interface COCOState {
  info: Info | null;
  licenses: License[];
  images: Image[];
  annotations: Annotation[];
  categories: Category[];
  setInfo: (info: Info) => void;
  addLicense: (license: License) => void;
  addImage: (image: Image) => void;
  addAnnotation: (annotation: Annotation) => void;
  addCategory: (category: Category) => void;
  reset: () => void;
  exportCOCO: () => {
    info: Info;
    licenses: License[];
    images: Image[];
    annotations: Annotation[];
    categories: Category[];
  } | null;
}

export const useCOCOStore = create<COCOState>()(
  devtools(
    (set, get) => ({
      info: null,
      licenses: [],
      images: [],
      annotations: [],
      categories: [],
      setInfo: (info) => set({ info }),
      addLicense: (license) =>
        set((state) => ({ licenses: [...state.licenses, license] })),
      addImage: (image) =>
        set((state) => ({ images: [...state.images, image] })),
      addAnnotation: (annotation) =>
        set((state) => ({ annotations: [...state.annotations, annotation] })),
      addCategory: (category) =>
        set((state) => ({ categories: [...state.categories, category] })),
      reset: () =>
        set({
          info: null,
          licenses: [],
          images: [],
          annotations: [],
          categories: [],
        }),
      exportCOCO: () => {
        const { info, licenses, images, annotations, categories } = get();
        return info
          ? { info, licenses, images, annotations, categories }
          : null;
      },
    }),
    { name: "COCOStore" }
  )
);
