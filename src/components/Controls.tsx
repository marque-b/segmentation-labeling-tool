import { ThemeToggle } from "./ThemeToggle";

function Controls() {
  return (
    <div className="container">
      <nav className="flex justify-end items-center min-h-14">
        <ThemeToggle />
      </nav>
    </div>
  );
}

export default Controls;
