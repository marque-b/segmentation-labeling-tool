import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DialogSaveAnnotationsProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
}

export default function DialogSaveAnnotations({
  open,
  onClose,
  onSave,
  onDiscard,
}: DialogSaveAnnotationsProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Annotations?</DialogTitle>
        </DialogHeader>
        <p>
          You have unsaved annotations. Do you want to save them before exiting?
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDiscard}>
            Discard
          </Button>
          <Button variant="default" onClick={onSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
