'use client';
import { Task, Column } from '@/lib/store';
import { useDndContext, type UniqueIdentifier } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cva } from 'class-variance-authority';
import { GripVertical } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { ColumnActions } from './column-action';
import { TaskCard } from './task-card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import NewTaskDialog from './new-task-dialog'; // Импортируем диалог задачи

export interface ColumnDragData {
  type: 'Column';
  column: Column;
}

interface BoardColumnProps {
  column: Column;
  tasks: Task[];
  isOverlay?: boolean;
}

export function BoardColumn({ column, tasks, isOverlay }: BoardColumnProps) {
  const tasksIds = useMemo(() => {
    return tasks.map((task) => task.id);
  }, [tasks]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column
    } satisfies ColumnDragData,
    attributes: {
      roleDescription: `Column: ${column.title}`
    }
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform)
  };

  const variants = cva(
    'h-[75vh] max-h-[75vh] w-[350px] max-w-full bg-secondary flex flex-col flex-shrink-0 snap-center rounded-xl border-none shadow-sm',
    {
      variants: {
        dragging: {
          default: '',
          over: 'ring-2 opacity-30',
          overlay: 'ring-2 ring-primary'
        }
      }
    }
  );

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={variants({
        dragging: isOverlay ? 'overlay' : isDragging ? 'over' : undefined
      })}
    >
      <CardHeader className="space-between flex flex-row items-center border-b p-4 text-left font-medium">
        <Button
          variant={'ghost'}
          {...attributes}
          {...listeners}
          className="relative -ml-2 h-auto cursor-grab p-1 text-primary/50"
        >
          <span className="sr-only">{`Move column: ${column.title}`}</span>
          <GripVertical size={20} />
        </Button>

        <span className="ml-2 mr-auto truncate">{column.title}</span>

        <ColumnActions id={column.id} title={column.title} />
      </CardHeader>

      <CardContent className="flex flex-grow flex-col gap-2 overflow-hidden p-2">
        <ScrollArea className="h-full pr-3">
          <div className="flex flex-col gap-3 py-2">
            <SortableContext items={tasksIds}>
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </SortableContext>
          </div>
        </ScrollArea>

        {/* КНОПКА ДОБАВЛЕНИЯ ЗАДАЧИ ВНИЗУ КОЛОНКИ */}
        <div className="mt-auto pt-2">
          <NewTaskDialog columnId={column.id as string} />
        </div>
      </CardContent>
    </Card>
  );
}

export function BoardContainer({ children }: { children: React.ReactNode }) {
  const dndContext = useDndContext();

  const variations = cva(
    'flex h-full w-full items-start justify-start gap-4 px-4 pb-4',
    {
      variants: {
        dragging: {
          default: '',
          active: 'snap-none'
        }
      }
    }
  );

  return (
    <ScrollArea className="h-full w-full">
      <div
        className={variations({
          dragging: dndContext.active ? 'active' : 'default'
        })}
      >
        <div className="flex flex-row items-start justify-center gap-4">
          {children}
        </div>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
