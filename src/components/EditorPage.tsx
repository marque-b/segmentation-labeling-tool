import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCOCOStore } from "@/store/useCOCOStore";
import AnnotationControls from "./AnnotationControls";
import AnnotationArea from "./AnnotationArea";

export interface ImageData {
  url: string;
  width: number;
  height: number;
}

export default function EditorPage() {
  const { datasetId, fileName } = useParams();
  const imageFile = useCOCOStore((state) =>
    state.imageFiles.find(
      (file) => file.datasetId === datasetId && file.file.name === fileName
    )
  );

  const [imageData, setImageData] = useState<ImageData | null>(null);

  useEffect(() => {
    if (!imageFile) return;

    const img = new Image();
    img.src = imageFile.previewUrl;
    img.onload = () => {
      setImageData({
        url: imageFile.previewUrl,
        width: img.width,
        height: img.height,
      });
    };
  }, [imageFile]);

  if (!imageFile) return <div className="container">Image not found</div>;

  return (
    <div className="relative h-full">
      <AnnotationControls />
      {imageData ? (
        <AnnotationArea imageData={imageData} />
      ) : (
        <div className="text-white text-center">Loading image...</div>
      )}
    </div>
  );
}
