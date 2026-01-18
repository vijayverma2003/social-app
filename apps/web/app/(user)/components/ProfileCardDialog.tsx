"use client";

import ProfileCard from "@/app/(user)/components/ProfileCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ProfileCardDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  userId?: string;
}

export const ProfileCardDialog = ({
  open,
  setOpen,
  userId,
}: ProfileCardDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-[450px] p-0 border-0 bg-transparent"
        showCloseButton={false}
      >
        <ProfileCard variant="card" userId={userId} />
      </DialogContent>
    </Dialog>
  );
};
