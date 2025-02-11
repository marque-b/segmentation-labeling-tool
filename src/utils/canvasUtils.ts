import { useCOCOStore } from "@/store/useCOCOStore";
import { Canvas } from "fabric";

export function hideFixedAnnotations(canvas: Canvas) {
  const hidden: any[] = [];
  canvas.forEachObject((obj) => {
    const hasFixed = (obj as any).fixedAnnotation === true;
    if (hasFixed) {
      obj.visible = false;
      hidden.push(obj);
    }
  });
  canvas.renderAll();
  return hidden;
}

export function restoreHiddenAnnotations(objs: any[], canvas: Canvas) {
  objs.forEach((obj) => {
    obj.visible = true;
  });
  canvas.renderAll();
}

export function deleteObject(_eventData: unknown, transform: any): boolean {
  const target = transform.target;
  if (target && target.canvas) {
    const annotationId = target.annotationId;
    const datasetId = target.datasetId;
    const imageId = target.imageId;
    const { updateDatasetAnnotations, datasets } = useCOCOStore.getState();
    const dataset = datasets.find((d: any) => d.id === datasetId);
    if (dataset) {
      const newAnnotations = dataset.annotations.filter(
        (ann: any) => ann.id !== annotationId
      );
      updateDatasetAnnotations(datasetId, imageId, newAnnotations);
    }
    target.canvas.remove(target);
  }
  return true;
}
