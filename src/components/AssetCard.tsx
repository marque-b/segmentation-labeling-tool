import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dataset } from "../store/useCOCOStore";

interface AssetCardProps {
  dataset: Dataset;
}

export default function AssetCard({ dataset }: AssetCardProps) {
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
        <div className="flex justify-between">
          <Button className="w-full mr-2">Open</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </CardContent>
    </Card>
  );
}
