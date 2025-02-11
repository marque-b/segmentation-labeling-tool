import { useEffect, useState } from "react";
import { useCOCOStore } from "@/store/useCOCOStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FilePlus } from "lucide-react";
import type { Image } from "@/schemas/imageSchema";
import { imageSchema } from "@/schemas/imageSchema";

interface DialogAddImageProps {
  datasetId: string;
}

export default function DialogAddImage({ datasetId }: DialogAddImageProps) {
  const { addImageToDataset, addImageFile } = useCOCOStore();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<Image>({
    resolver: zodResolver(imageSchema),
    defaultValues: {
      license: 1,
      file_name: "",
      coco_url: "",
      height: 0,
      width: 0,
      date_captured: new Date().toISOString(),
      flickr_url: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        license: 1,
        file_name: "",
        coco_url: "",
        height: 0,
        width: 0,
        date_captured: "",
        flickr_url: "",
      });
      setImagePreview(null);
    }
  }, [open, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));

      form.setValue("file_name", file.name);
      form.setValue("date_captured", new Date(file.lastModified).toISOString());

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = () => {
          form.setValue("width", img.width);
          form.setValue("height", img.height);
          setImagePreview(img.src);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: Image) => {
    if (selectedFile) {
      const renamedFile = new File([selectedFile], data.file_name, {
        type: selectedFile.type,
      });
      addImageFile(datasetId, renamedFile);
    }

    const fixedData = {
      ...data,
      coco_url: data.coco_url || "",
      flickr_url: data.flickr_url || "",
      height: data.height,
      width: data.width,
      license: data.license || 1,
      file_name: data.file_name || `image_${Date.now()}.jpg`,
      date_captured: data.date_captured || new Date().toISOString(),
    };
    addImageToDataset(datasetId, fixedData);
    form.reset();
    setImagePreview(null);
    setSelectedFile(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FilePlus />
          Add Image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-screen overflow-y-auto py-16 md:p-6">
        <DialogHeader>
          <DialogTitle>Add Image</DialogTitle>
          <DialogDescription>
            Upload an image and fill in the details below.
          </DialogDescription>
        </DialogHeader>

        {imagePreview && (
          <div className="flex justify-center my-2">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-32 h-32 rounded-lg object-cover"
            />
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Upload Image</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </FormControl>
            </FormItem>

            <FormField
              control={form.control}
              name="file_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date_captured"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Captured</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Width</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      disabled
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      disabled
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coco_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>COCO URL</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="flickr_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flickr URL</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Save
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
