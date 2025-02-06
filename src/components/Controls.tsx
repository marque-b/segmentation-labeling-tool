import { useCOCOStore } from "@/store/useCOCOStore";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { House } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Controls() {
  const store = useCOCOStore();
  const navigate = useNavigate();

  return (
    <div className="container">
      <nav className="flex justify-end items-center min-h-14 gap-2">
        <Button variant="outline" onClick={() => navigate("/")}>
          <House />
        </Button>
        <ThemeToggle />
        <Button
          variant="outline"
          onClick={() => console.log("Zustand State:", store)}
        >
          Log State
        </Button>
      </nav>
    </div>
  );
}

export default Controls;
