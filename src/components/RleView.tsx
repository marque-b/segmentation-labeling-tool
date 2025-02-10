import React, { useEffect, useRef } from "react";
import { Canvas, FabricImage } from "fabric";
import { useCOCOStore } from "@/store/useCOCOStore";

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

const RleView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const dataset = useCOCOStore((state) => state.datasets[0]);

  const decodeRLE = (
    counts: number[],
    width: number,
    height: number
  ): Uint8Array => {
    const mask = new Uint8Array(width * height);
    let pixelIdx = 0;
    let value = 0;

    for (const count of counts) {
      for (let j = 0; j < count; j++) {
        mask[pixelIdx] = value;
        pixelIdx++;
      }
      value = value === 0 ? 1 : 0;
    }

    return mask;
  };

  const hexToRgb = (hex: string): RGBColor => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 255, g: 0, b: 0 };
  };

  useEffect(() => {
    const initCanvas = async () => {
      if (!canvasRef.current || !dataset || !dataset.images[0]) {
        console.warn("Missing required data");
        return;
      }

      const { width, height } = dataset.images[0];

      fabricRef.current = new Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: "#ffffff",
        selection: false,
      });

      const canvas = fabricRef.current;

      for (const ann of dataset.annotations) {
        if (
          ann.segmentation &&
          typeof ann.segmentation === "object" &&
          "counts" in ann.segmentation &&
          "size" in ann.segmentation
        ) {
          const { counts, size } = ann.segmentation;
          const [maskHeight, maskWidth] = size;

          const category = dataset.categories.find(
            (cat) => cat.id === ann.classId
          );
          const categoryColor = category?.color || "#ff0000";

          const binaryMask = decodeRLE(counts, maskWidth, maskHeight);

          const offCanvas = document.createElement("canvas");
          offCanvas.width = maskWidth;
          offCanvas.height = maskHeight;
          const ctx = offCanvas.getContext("2d");

          if (!ctx) continue;

          const imageData = ctx.createImageData(maskWidth, maskHeight);
          const { r, g, b } = hexToRgb(categoryColor);

          for (let i = 0; i < binaryMask.length; i++) {
            const offset = i * 4;
            if (binaryMask[i] === 1) {
              imageData.data[offset] = r;
              imageData.data[offset + 1] = g;
              imageData.data[offset + 2] = b;
              imageData.data[offset + 3] = 128;
            } else {
              imageData.data[offset + 3] = 0;
            }
          }

          ctx.putImageData(imageData, 0, 0);

          try {
            const fabricImage = await FabricImage.fromURL(
              offCanvas.toDataURL(),
              {
                selectable: false,
                evented: false,
              }
            );

            canvas.add(fabricImage);
            canvas.renderAll();
          } catch (error) {
            console.error("Error creating fabric image:", error);
          }
        }
      }
    };

    initCanvas();

    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
      }
    };
  }, [dataset]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default RleView;
