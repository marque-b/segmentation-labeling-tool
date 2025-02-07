import { useEffect, useState } from "react";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SquarePlus } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { classSchema } from "@/schemas/classSchema";

export default function DialogAddClass() {
  const { addClass } = useAnnotationStore();
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: "",
      supercategory: "",
      color: "#000000",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = (data: {
    name: string;
    supercategory: string;
    color: string;
  }) => {
    addClass(data.name, data.supercategory, data.color);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <SquarePlus size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
          <DialogDescription>
            Define a class name, supercategory, and color to categorize
            annotations.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter class name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supercategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supercategory</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter supercategory" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Color</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} className="w-10 h-10 p-0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Add Class
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
