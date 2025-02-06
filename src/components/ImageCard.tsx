import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { PenTool, Trash2 } from "lucide-react";

interface ImageCardProps {
  fileName: string;
  previewUrl?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ImageCard({
  fileName,
  previewUrl,
  onEdit,
  onDelete,
}: ImageCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative rounded-lg overflow-hidden shadow-md transition-all duration-300 group"
    >
      <Card className="relative">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={fileName}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className="w-full h-40 flex items-center justify-center bg-gray-200 text-gray-500">
            No preview available
          </div>
        )}

        <div className="absolute top-2 right-2 flex space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={onEdit}
            className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-md hover:bg-white text-gray-800"
          >
            <PenTool size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-red-500/80 backdrop-blur-md rounded-full shadow-md hover:bg-red-600 text-white"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-2 shadow-inner">
          <p className="text-white text-sm font-semibold truncate">
            {fileName}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
