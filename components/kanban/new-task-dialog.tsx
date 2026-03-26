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
import { Textarea } from '../ui/textarea';
import { useTaskStore } from '@/lib/store';

// Добавляем пропс columnId, чтобы знать, в какую колонку пойдет задача
interface NewTaskDialogProps {
  columnId: string;
}

export default function NewTaskDialog({ columnId }: NewTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const addTask = useTaskStore((state) => state.addTask);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!title || title.trim() === '') return;

    // Передаем columnId в стор для сохранения в БД
    await addTask(columnId, title, description);

    setOpen(false); // Закрываем диалог после успеха
    form.reset(); // Очищаем поля
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          ＋ Add New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Describe the work that needs to be done.
          </DialogDescription>
        </DialogHeader>
        <form
          id="todo-form"
          className="grid gap-4 py-4"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="title"
              name="title"
              placeholder="Task title..."
              className="col-span-4"
              autoFocus
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Textarea
              id="description"
              name="description"
              placeholder="Detailed description (optional)..."
              className="col-span-4"
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" size="sm" form="todo-form">
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
