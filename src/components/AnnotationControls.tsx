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
  SquarePlus,
  Square,
  ArrowLeftToLine,
  ArrowRightToLine,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import DialogAddClass from "./DialogAddClass";

export default function AnnotationControls() {
  const [collapsed, setCollapsed] = useState(false);
  const { classes, selectClass, selectedClassId } = useAnnotationStore();

  return (
    <div
      className={`absolute top-1/2 transform -translate-y-1/2 z-30 
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
      </div>

      <div className="flex flex-col items-center space-y-2">
        {classes.map((cls) => (
          <Button
            key={cls.id}
            variant="ghost"
            className={`flex justify-start items-center transition-colors duration-200
              ${
                selectedClassId === cls.id
                  ? "bg-opacity-40 bg-gray-500"
                  : "hover:bg-gray-700"
              }
            `}
            onClick={() => selectClass(cls.id)}
            onTouchStart={() => selectClass(cls.id)}
          >
            <Square size={16} color={cls.color} />
          </Button>
        ))}
        <DialogAddClass />
      </div>
    </div>
  );
}
