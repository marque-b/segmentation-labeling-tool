import { useNavigate } from "react-router-dom";
import { useCOCOStore, Dataset } from "../store/useCOCOStore";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AssetCardProps {
  dataset: Dataset;
}

export default function AssetCard({ dataset }: AssetCardProps) {
  const navigate = useNavigate();
  const { removeDataset } = useCOCOStore();

  const handleOpen = () => {
    navigate(`/dataset/${dataset.id}`);
  };

  const handleDelete = () => {
    removeDataset(dataset.id);
  };

  return (
    <Card className="w-80 border border-border p-4 shadow-md hover:shadow-lg transition">
      <CardHeader>
        <CardTitle>{dataset.info.description}</CardTitle>
        <CardDescription>{dataset.info.contributor}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Year: {dataset.info.year}
        </p>
        <p className="text-sm text-muted-foreground">
          Version: {dataset.info.version}
        </p>
        <p className="text-sm text-muted-foreground">
          URL:{" "}
          <a href={dataset.info.url} target="_blank" className="text-blue-500">
            {dataset.info.url}
          </a>
        </p>
        <div className="flex justify-between pt-6">
          <Button className="w-full mr-2" onClick={handleOpen}>
            Open
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
