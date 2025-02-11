import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const changeTheme = () => {
    if (theme === "dark") setTheme("light");
    if (theme === "light") setTheme("dark");
  };

  return (
    <Button variant="outline" onClick={changeTheme}>
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
