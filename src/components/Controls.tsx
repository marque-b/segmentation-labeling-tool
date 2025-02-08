import { useCOCOStore } from "@/store/useCOCOStore";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { House, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAnnotationStore } from "@/store/useAnnotationStore";

function Controls() {
  const cocoStore = useCOCOStore();
  const annotationStore = useAnnotationStore();
  const navigate = useNavigate();

  return (
    <div className="container">
      <nav className="flex justify-end items-center min-h-14 gap-2">
        <Button variant="outline" onClick={() => navigate("/test-rle")}>
          Test
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <Button variant="outline" onClick={() => navigate("/")}>
          <House />
        </Button>
        <ThemeToggle />
        <Button
          variant="outline"
          onClick={() => console.log("Zustand State:", cocoStore)}
        >
          Log State
        </Button>
        <Button
          variant="outline"
          onClick={() => console.log("Annotation Store:", annotationStore)}
        >
          Log Annotations
        </Button>
      </nav>
    </div>
  );
}

export default Controls;
