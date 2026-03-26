'use client';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import * as React from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useTaskStore } from '@/lib/store';
import { UniqueIdentifier } from '@dnd-kit/core';
import { Input } from '../ui/input';

export function ColumnActions({
  title,
  id
}: {
  title: string;
  id: UniqueIdentifier;
}) {
  const [open, setIsOpen] = React.useState(false);
  const [name, setName] = React.useState(title);
  const updateCol = useTaskStore((state) => state.updateCol);
  const removeCol = useTaskStore((state) => state.removeCol);
  const [editDisable, setIsEditDisable] = React.useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Функция сохранения (вынесли отдельно, чтобы использовать и в сабмите, и в блюре)
  const handleSave = React.useCallback(async () => {
    if (editDisable) return; // Если уже заблокировано - ничего не делаем

    if (name !== title && name.trim() !== '') {
      await updateCol(id, name);
      toast({
        title: 'Name Updated',
        variant: 'default',
        description: `${title} updated to ${name}`
      });
    } else {
      setName(title); // Возвращаем старое имя, если новое пустое
    }
    setIsEditDisable(true); // Закрываем режим редактирования
  }, [editDisable, id, name, title, updateCol, toast]);

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave} // СОХРАНЕНИЕ ПРИ КЛИКЕ МИМО (для мобилок и ПК)
          className="!mt-0 mr-auto text-base focus-visible:ring-1 disabled:cursor-pointer disabled:border-none disabled:opacity-100"
          disabled={editDisable}
          ref={inputRef}
        />
      </form>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="ml-1">
            <span className="sr-only">Actions</span>
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              setIsEditDisable(false); // Разрешаем редактирование
              setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select(); // Сразу выделяем текст для удобства
              }, 100);
            }}
          >
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => setShowDeleteDialog(true)}
            className="text-red-600"
          >
            Delete Section
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure want to delete column?
            </AlertDialogTitle>
            <AlertDialogDescription>
              NOTE: All tasks related to this category will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                setTimeout(() => (document.body.style.pointerEvents = ''), 100);
                setShowDeleteDialog(false);
                removeCol(id);
                toast({
                  description: 'This column has been deleted.'
                });
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
