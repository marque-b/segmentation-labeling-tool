import { useParams } from "react-router-dom";
import { useCOCOStore } from "@/store/useCOCOStore";
import { CircleUser, CalendarDays, CircleDotDashed, Link2 } from "lucide-react";
import DialogAddImage from "./DialogAddImage";

export default function AssetPage() {
  const { id } = useParams();
  const dataset = useCOCOStore((state) =>
    state.datasets.find((d) => d.id === id)
  );

  if (!dataset) return <div className="container">Dataset not found</div>;

  return (
    <div className="container">
      <h1 className="text-2xl font-bold">{dataset.info.description}</h1>
      <div className="text-secondary-foreground space-y-1 mt-4">
        <div className="flex items-center space-x-2">
          <CircleUser size="15" />
          <span>{dataset.info.contributor}</span>
        </div>
        <div className="flex items-center space-x-2">
          <CalendarDays size="15" />
          <span>{dataset.info.year}</span>
        </div>
        <div className="flex items-center space-x-2">
          <CircleDotDashed size="15" />
          <span>{dataset.info.version}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Link2 size="15" />
          <a href={dataset.info.url}>{dataset.info.url}</a>
        </div>
        <div className="mt-6">
          <DialogAddImage datasetId={dataset.id} />
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-semibold">Images</h2>
        {dataset.images.length === 0 ? (
          <p>No images added yet.</p>
        ) : (
          <ul className="list-disc ml-6">
            {dataset.images.map((image, key) => (
              <li key={key}>{image.file_name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
