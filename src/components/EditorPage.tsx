import { useParams } from "react-router-dom";
import { useCOCOStore } from "@/store/useCOCOStore";

export default function EditorPage() {
  const { datasetId, fileName } = useParams();
  const imageFile = useCOCOStore((state) =>
    state.imageFiles.find(
      (file) => file.datasetId === datasetId && file.file.name === fileName
    )
  );

  if (!imageFile) return <div className="container">Image not found</div>;

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-4">Editor - {fileName}</h1>
      <img
        src={imageFile.previewUrl}
        alt={fileName}
        className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
      />
    </div>
  );
}
