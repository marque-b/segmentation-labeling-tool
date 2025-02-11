import {
  Brush,
  Waypoints,
  Undo2,
  Redo2,
  Save,
  Diameter,
  Eraser,
  Square,
  ArrowLeftToLine,
  ArrowRightToLine,
  LucideIcon,
  CircleX,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tool, useAnnotationStore } from "@/store/useAnnotationStore";
import DialogAddClass from "./DialogAddClass";
import { Slider } from "./ui/slider";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { toast } from "sonner";
import { useSaveAnnotations } from "@/hooks/useSaveAnnotations";
import { useCOCOStore } from "@/store/useCOCOStore";

interface ToolItem {
  id: Tool;
  icon: LucideIcon;
  label: string;
}

const DeleteClass = ({
  classId,
  className,
  supercategory,
}: {
  classId: number;
  className: string;
  supercategory: string;
}) => {
  const { removeClass, selectedClassId, selectClass } = useAnnotationStore();

  const handleDelete = () => {
    removeClass(classId);
    if (selectedClassId === classId) {
      selectClass(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="absolute left-[-40px] bg-transparent hover:bg-transparent hover:scale-110">
          <CircleX
            size={15}
            color="red"
            className="bg-[#081026] rounded-full"
          />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Class</DialogTitle>
        </DialogHeader>
        <p>
          Remove the class <b>{className}</b> in the <b>{supercategory}</b> from
          the workspace?
        </p>
        <DialogFooter>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function AnnotationControls() {
  const [collapsed, setCollapsed] = useState(true);
  const [showDiameterSlider, setShowDiameterSlider] = useState(false);
  const {
    classes,
    selectedClassId,
    selectClass,
    activeTool,
    setActiveTool,
    brushSize,
    setBrushSize,
    undo,
    redo,
    selectedImageId,
    setClasses,
  } = useAnnotationStore();
  const { isCrowded, setIsCrowded } = useAnnotationStore();
  const { saveAnnotations } = useSaveAnnotations();
  const { datasets } = useCOCOStore();

  const tools: ToolItem[] = [
    { id: "polygon", icon: Waypoints, label: "Polygon" },
    { id: "brush", icon: Brush, label: "Brush" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
  ];

  const classNames = Object.fromEntries(
    classes.map((cls) => [cls.id, cls.name])
  );

  const toolNames: { [key in Tool]: string } = {
    polygon: "Polygon",
    brush: "Brush",
    eraser: "Eraser",
    none: "None",
  };

  const crowdStatus = {
    0: "Not Crowded",
    1: "Crowded",
  };

  useEffect(() => {
    if (!selectedImageId) return;

    const dataset = datasets.find((d) =>
      d.images.some((img) => img.id === selectedImageId)
    );

    if (!dataset) return;

    setClasses(dataset.categories);
  }, [selectedImageId, datasets, setClasses]);

  return (
    <div
      className={`absolute top-2/5 transform -translate-y-1/2 z-30 
        bg-card p-2 rounded-lg shadow-md transition-all
        ${collapsed ? "w-[50px]" : "w-[90px]"}`}
    >
      <div
        className={`flex flex-col ${
          !collapsed ? "items-end" : "items-center"
        } mb-2 space-y-2`}
      >
        <Button variant="ghost" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ArrowRightToLine /> : <ArrowLeftToLine />}
        </Button>
        <Button onClick={() => saveAnnotations()} variant="ghost">
          <Save size={16} />
        </Button>
      </div>

      <div
        className={`flex flex-col ${
          !collapsed ? "items-end" : "items-center"
        } mb-2 space-y-2`}
      >
        {classes.map((cls, key) => (
          <div className="relative" key={cls.id + key}>
            {!collapsed && (
              <DeleteClass
                classId={cls.id}
                className={cls.name}
                supercategory={cls.supercategory}
              />
            )}
            <Button
              variant="ghost"
              className={`flex justify-start items-center transition-colors duration-200
              ${selectedClassId === cls.id ? "bg-opacity-40 bg-gray-500" : ""}
            `}
              onClick={() => {
                const isDeselecting = selectedClassId === cls.id;
                selectClass(cls.id);
                toast(
                  isDeselecting
                    ? "No category selected"
                    : `Category: ${classNames[cls.id]}`
                );
              }}
              onTouchStart={() => selectClass(cls.id)}
            >
              <Square size={16} color={cls.color} />
            </Button>
          </div>
        ))}
        <DialogAddClass />
      </div>

      <div className="border-t my-2 w-full border-gray-600" />

      <div
        className={`flex flex-col ${
          !collapsed ? "items-end" : "items-center"
        } mb-2 space-y-2`}
      >
        <Button
          variant="ghost"
          className={`flex justify-start items-center transition-colors duration-200 
           ${isCrowded === 0 ? "bg-opacity-40 bg-gray-500" : ""}`}
          onClick={() => {
            setIsCrowded(0);
            toast(`Annotation Type: ${crowdStatus[0]}`);
          }}
        >
          <User size={18} />
        </Button>
        <Button
          variant="ghost"
          className={`flex justify-start items-center transition-colors duration-200 
           ${isCrowded === 1 ? "bg-opacity-40 bg-gray-500" : ""}`}
          onClick={() => {
            setIsCrowded(1);
            toast(`Annotation Type: ${crowdStatus[1]}`);
          }}
        >
          <Users size={18} />
        </Button>
      </div>

      <div className="border-t my-2 w-full border-gray-600" />

      <div
        className={`flex flex-col ${
          !collapsed ? "items-end" : "items-center"
        } mb-2 space-y-2`}
      >
        {tools.map((tool) => (
          <Button
            key={tool.id}
            disabled={classes.length === 0}
            variant="ghost"
            className={`
              ${activeTool === tool.id ? "bg-gray-500" : ""}`}
            onClick={() => {
              const newTool = activeTool === tool.id ? "none" : tool.id;
              setActiveTool(newTool);
              if (newTool !== "none") {
                toast(`Tool: ${toolNames[newTool]}`);
              }
            }}
          >
            <tool.icon size={18} />
          </Button>
        ))}

        <div className="relative">
          <Button
            variant="ghost"
            onClick={() => {
              setShowDiameterSlider(!showDiameterSlider);
              setActiveTool("none");
            }}
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

      <div className="border-t my-2 w-full border-gray-600" />

      <div
        className={`flex flex-col ${
          !collapsed ? "items-end" : "items-center"
        } mb-2 space-y-2`}
      >
        <Button variant="ghost" onClick={() => undo()}>
          <Undo2 size={16} />
        </Button>
        <Button variant="ghost" onClick={() => redo()}>
          <Redo2 size={16} />
        </Button>
      </div>
    </div>
  );
}
