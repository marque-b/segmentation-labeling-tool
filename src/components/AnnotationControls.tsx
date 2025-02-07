import {
  Brush,
  Waypoints,
  Undo2,
  Redo2,
  Save,
  Diameter,
  LocateFixed,
  Mouse,
  Eraser,
  Square,
  ArrowLeftToLine,
  ArrowRightToLine,
  LucideIcon,
  Sliders,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PositionMode,
  Tool,
  useAnnotationStore,
} from "@/store/useAnnotationStore";
import DialogAddClass from "./DialogAddClass";
import { Slider } from "./ui/slider";

interface ToolItem {
  id: Tool;
  icon: LucideIcon;
  label: string;
}

interface PositionModeItem {
  id: PositionMode;
  icon: LucideIcon;
  label: string;
}

export default function AnnotationControls() {
  const [collapsed, setCollapsed] = useState(false);
  const [showDiameterSlider, setShowDiameterSlider] = useState(false);
  const {
    classes,
    selectedClassId,
    selectClass,
    activeTool,
    setActiveTool,
    activePositionMode,
    setActivePositionMode,
    brushSize,
    setBrushSize,
  } = useAnnotationStore();

  const tools: ToolItem[] = [
    { id: "polygon", icon: Waypoints, label: "Polygon" },
    { id: "brush", icon: Brush, label: "Brush" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
  ];

  const positionModes: PositionModeItem[] = [
    { id: "precision", icon: LocateFixed, label: "Precision Mode" },
    { id: "direct", icon: Mouse, label: "Direct Mode" },
  ];

  return (
    <div
      className={`absolute top-2/5 transform -translate-y-1/2 z-30 
        bg-gray-800 p-2 rounded-lg shadow-md transition-all
        ${collapsed ? "w-[50px]" : "w-[60px]"}`}
    >
      <div className="flex flex-col items-center mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ArrowRightToLine /> : <ArrowLeftToLine />}
        </Button>
        <Button variant="ghost" size="icon">
          <Save size={18} />
        </Button>
      </div>

      <div className="flex flex-col items-center space-y-2">
        {classes.map((cls) => (
          <Button
            key={cls.id}
            variant="ghost"
            className={`flex justify-start items-center transition-colors duration-200
              ${selectedClassId === cls.id ? "bg-opacity-40 bg-gray-500" : ""}
            `}
            onClick={() => selectClass(cls.id)}
            onTouchStart={() => selectClass(cls.id)}
          >
            <Square size={16} color={cls.color} />
          </Button>
        ))}
        <DialogAddClass />
      </div>

      <div className="border-t my-2 w-full border-gray-600" />

      <div className="flex flex-col items-center space-y-2">
        {positionModes.map((mode) => (
          <Button
            key={mode.id}
            variant="ghost"
            className={`${activePositionMode === mode.id ? "bg-gray-700" : ""}`}
            onClick={() => setActivePositionMode(mode.id)}
            onTouchStart={() => setActivePositionMode(mode.id)}
          >
            <mode.icon size={16} />
          </Button>
        ))}
      </div>

      <div className="border-t my-2 w-full border-gray-600" />

      <div className="flex flex-col items-center space-y-2">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            disabled={true}
            variant="ghost"
            className={`w-full flex justify-center items-center transition-all duration-200
              ${activeTool === tool.id ? "bg-gray-500" : ""}`}
            onClick={() =>
              setActiveTool(activeTool === tool.id ? "none" : tool.id)
            }
            onTouchStart={() =>
              setActiveTool(activeTool === tool.id ? "none" : tool.id)
            }
          >
            <tool.icon size={18} />
          </Button>
        ))}

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDiameterSlider(!showDiameterSlider)}
          >
            <Diameter size={16} />
          </Button>
          {showDiameterSlider && (
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 w-32 px-3 transition-all duration-300 bg-gray-800 rounded-md shadow-md">
              <Slider
                value={[brushSize]}
                onValueChange={(value: number[]) => setBrushSize(value[0])}
                onTouchEnd={() => setShowDiameterSlider(false)}
                onMouseLeave={() => setShowDiameterSlider(false)}
                max={100}
                step={1}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <Button variant="ghost" size="icon">
          <Undo2 size={16} />
        </Button>
        <Button variant="ghost" size="icon">
          <Redo2 size={16} />
        </Button>
      </div>
    </div>
  );
}
