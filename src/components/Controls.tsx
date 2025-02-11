import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { House, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Controls() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <nav className="flex justify-end items-center min-h-14 gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <Button variant="outline" onClick={() => navigate("/")}>
          <House />
        </Button>
        <ThemeToggle />
      </nav>
    </div>
  );
}

export default Controls;
