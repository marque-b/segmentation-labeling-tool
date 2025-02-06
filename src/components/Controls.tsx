import { useCOCOStore } from "@/store/useCOCOStore";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";

function Controls() {
  const store = useCOCOStore();

  return (
    <div className="container">
      <nav className="flex justify-end items-center min-h-14">
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
