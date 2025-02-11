import { Info, infoSchema } from "@/schemas/infoSchema";
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
import { FileJson } from "lucide-react";
import { useState } from "react";

interface DialogAddInfoProps {
  initialized: boolean;
}

function DialogAddInfo({ initialized }: DialogAddInfoProps) {
  const { addDataset } = useCOCOStore();
  const [open, setOpen] = useState(false);

  const form = useForm<Info>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      description: "",
      url: "",
      version: "",
      year: new Date().getFullYear(),
      contributor: "",
      date_created: new Date().toISOString(),
    },
  });

  const onSubmit = (data: Info) => {
    addDataset(data);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        asChild
        className={` ${
          !initialized && "flex flex-col h-[180px] w-[180px] rounded-full"
        }`}
      >
        <Button variant="outline">
          <FileJson className={`${!initialized && "!w-8 !h-8"}`} />
          Initialize Dataset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Initialize Dataset</DialogTitle>
          <DialogDescription>
            Fill in the dataset details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Version</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contributor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contributor</FormLabel>
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

export default DialogAddInfo;
