
"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
}: ConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] sm:max-w-[425px] bg-black/95 border border-white/10 backdrop-blur-sm text-white rounded-xl">
        <div className="space-y-3 sm:space-y-4">
          <div className="text-base sm:text-lg font-semibold text-white">{title}</div>
          <div className="text-xs sm:text-sm text-white/60">{description}</div>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-3 justify-end pt-4 sm:pt-6">
          <Button variant="tertiary" onClick={onClose} className="text-xs sm:text-base">
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm} className="text-xs sm:text-base">
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
