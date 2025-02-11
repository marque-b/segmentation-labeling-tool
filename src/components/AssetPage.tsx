import { useNavigate, useParams } from "react-router-dom";
import { useCOCOStore } from "@/store/useCOCOStore";
import {
  CircleUser,
  CalendarDays,
  CircleDotDashed,
  Link2,
  Braces,
} from "lucide-react";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import DialogAddImage from "./DialogAddImage";
import ImageCard from "./ImageCard";
import { Button } from "./ui/button";
import { useEffect } from "react";

export default function AssetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dataset = useCOCOStore((state) =>
    state.datasets.find((d) => d.id === id)
  );
  const { setClasses } = useAnnotationStore();

  const {
    imageFiles,
    removeImageFromDataset,
    updateImageLicense,
    exportDatasetToJson,
  } = useCOCOStore();

  useEffect(() => {
    if (dataset) {
      setClasses(
        dataset.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          supercategory: cat.supercategory,
          color: cat.color ?? "#000000",
        }))
      );
    }
  }, [dataset, setClasses]);

  if (!dataset) return <div className="container">Dataset not found</div>;

  return (
    <div className="container mt-12">
      <h1 className="text-2xl font-bold">{dataset.info.description}</h1>
      <div className="text-secondary-foreground space-y-1 mt-4 mb-8">
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
        <div className="mt-6 flex flex-row gap-6 justify-center md:justify-start">
          <DialogAddImage datasetId={dataset.id} />

          <Button
            variant="outline"
            onClick={() => exportDatasetToJson(dataset.id)}
          >
            <Braces />
            Export JSON
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-4">Images</h2>
        {dataset.images.length === 0 ? (
          <p>No images added yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {dataset.images.map((image, key) => {
              const storedFile = imageFiles.find(
                (file) => file.file.name === image.file_name
              );
              return (
                <ImageCard
                  key={key}
                  fileName={image.file_name}
                  datasetId={dataset.id}
                  previewUrl={storedFile?.previewUrl}
                  licenseId={image.license || 8}
                  onChangeLicense={(newLicenseId: number) =>
                    updateImageLicense(
                      dataset.id,
                      image.file_name,
                      newLicenseId
                    )
                  }
                  onEdit={() => {
                    useAnnotationStore
                      .getState()
                      .setSelectedImageId(image.id as number);
                    navigate(`/editor/${dataset.id}/${image.file_name}`);
                  }}
                  onDelete={() =>
                    removeImageFromDataset(dataset.id, image.file_name)
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
