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
  // Нам нужен ID доски, к которой привязываем колонку
  const boards = useTaskStore((state) => state.columns); // В твоем сторе данные лежат в columns (из первой доски)

  // ВАЖНО: В реальном приложении мы должны знать ID доски.
  // Пока возьмем заглушку или ID из первой загруженной колонки,
  // но лучше, если в сторе будет храниться текущий boardId.
  // Для теста предположим, что у нас есть доступ к колонкам, значит доска загружена.

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get('title') as string;

    if (!title || title.trim() === '') return;

    // Вызываем addCol из стора.
    // Поскольку в твоей Prisma схеме Column требует boardId,
    // передаем ID доски. Если досок пока нет, в роутере создастся дефолтная.
    // Для этого примера передадим фиксированный ID или логику "первой доски"
    const currentBoardId = 'default-board-id'; // Это значение должен возвращать твой GET /api/kanban

    await addCol(currentBoardId, title);

    setOpen(false); // Закрываем диалог
    form.reset(); // Сбрасываем форму
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
