import { useEffect, useState } from "react";
import { useCOCOStore } from "@/store/useCOCOStore";
import { licenses } from "@/assets/licenses";
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface DialogChangeLicenseProps {
  datasetId: string;
  fileName: string;
  currentLicenseId: number;
  onChangeLicense: (newLicenseId: number) => void;
}

export default function DialogChangeLicense({
  datasetId,
  fileName,
  currentLicenseId,
  onChangeLicense,
}: DialogChangeLicenseProps) {
  const { updateImageLicense } = useCOCOStore();
  const [open, setOpen] = useState(false);

  const form = useForm<{ license: number }>({
    defaultValues: {
      license: currentLicenseId,
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ license: currentLicenseId });
    }
  }, [open, currentLicenseId, form]);

  const onSubmit = (data: { license: number }) => {
    console.log("Submitting new license:", data.license);
    updateImageLicense(datasetId, fileName, data.license);
    onChangeLicense(data.license);
    setTimeout(() => setOpen(false), 100);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Change License</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Image License</DialogTitle>
          <DialogDescription>
            Select a new license for this image.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="license"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <SelectTrigger>
                        {licenses.find((lic) => lic.id === field.value)?.name ||
                          "Select a license"}
                      </SelectTrigger>
                      <SelectContent>
                        {licenses.map((license) => (
                          <SelectItem
                            key={license.id}
                            value={license.id.toString()}
                          >
                            {license.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full mt-4">
              Save
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
