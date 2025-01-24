'use client';

import { Button } from "@/components/ui/button";
import CloseIcon from "@/components/icons/close-icon";

export function DeleteChatButton({ chatId }: { chatId: string }) {
  async function handleDelete() {
    await fetch(`/api/chats/${chatId}`, {
      method: 'DELETE'
    });
    window.location.reload();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-2 right-2 h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDelete();
      }}
    >
      <CloseIcon className="h-4 w-4" />
    </Button>
  );
}