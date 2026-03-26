'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTaskStore } from '@/lib/store';

export default function NewSectionDialog() {
  const [open, setOpen] = useState(false);
  const addCol = useTaskStore((state) => state.addCol);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get('title') as string;

    if (!title || title.trim() === '') return;

    // ВАЖНО: Передаем только ОДИН аргумент (title),
    // так как boardId стор возьмет сам из своего state.currentBoardId
    await addCol(title);

    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="lg"
          className="w-full border-2 border-dashed bg-transparent hover:bg-secondary"
        >
          ＋ Add New Section
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
          <DialogDescription>
            What section you want to add today?
          </DialogDescription>
        </DialogHeader>
        <form
          id="section-form"
          className="grid gap-4 py-4"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="title"
              name="title"
              placeholder="Section title (e.g., Done, Review...)"
              className="col-span-4"
              autoFocus
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" size="sm" form="section-form">
            Add Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
