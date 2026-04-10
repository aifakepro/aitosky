'use client';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Task, Column, useTaskStore } from '@/lib/store'; // Путь к твоему стору
import { hasDraggableData } from '@/lib/utils';
import {
  Announcements,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { BoardColumn, BoardContainer } from './board-column';
import NewSectionDialog from './new-section-dialog';
import { TaskCard } from './task-card';

export function KanbanBoard() {
  const {
    tasks,
    columns,
    fetchBoardData,
    setTasks,
    setCols,
    moveTask,
    isLoading
  } = useTaskStore();

  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const pickedUpTaskColumnId = useRef<UniqueIdentifier | null>(null);
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  useEffect(() => {
    setIsMounted(true);
    fetchBoardData(); // Загружаем данные из БД при монтировании
  }, [fetchBoardData]);

  if (!isMounted || isLoading) return null;

  function getDraggingTaskData(
    taskId: UniqueIdentifier,
    columnId: UniqueIdentifier
  ) {
    const tasksInColumn = tasks.filter((task) => task.columnId === columnId);
    const taskPosition = tasksInColumn.findIndex((task) => task.id === taskId);
    const column = columns.find((col) => col.id === columnId);
    return {
      tasksInColumn,
      taskPosition,
      column
    };
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      if (!hasDraggableData(active)) return;
      if (active.data.current?.type === 'Column') {
        const startColumnIdx = columnsId.findIndex((id) => id === active.id);
        const startColumn = columns[startColumnIdx];
        return `Picked up Column ${startColumn?.title} at position: ${
          startColumnIdx + 1
        } of ${columnsId.length}`;
      } else if (active.data.current?.type === 'Task') {
        pickedUpTaskColumnId.current = active.data.current.task.columnId;
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
          active.id,
          pickedUpTaskColumnId.current!
        );
        return `Picked up Task ${active.data.current.task.title} at position: ${
          taskPosition + 1
        } of ${tasksInColumn.length} in column ${column?.title}`;
      }
    },
    onDragOver({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) return;

      if (
        active.data.current?.type === 'Column' &&
        over.data.current?.type === 'Column'
      ) {
        const overColumnIdx = columnsId.findIndex((id) => id === over.id);
        return `Column ${active.data.current.column.title} was moved over ${
          over.data.current.column.title
        } at position ${overColumnIdx + 1} of ${columnsId.length}`;
      } else if (
        active.data.current?.type === 'Task' &&
        over.data.current?.type === 'Task'
      ) {
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
          over.id,
          over.data.current.task.columnId
        );
        if (over.data.current.task.columnId !== pickedUpTaskColumnId.current) {
          return `Task ${
            active.data.current.task.title
          } was moved over column ${column?.title} in position ${
            taskPosition + 1
          } of ${tasksInColumn.length}`;
        }
        return `Task was moved over position ${taskPosition + 1} of ${
          tasksInColumn.length
        } in column ${column?.title}`;
      }
    },
    onDragEnd({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) {
        pickedUpTaskColumnId.current = null;
        return;
      }

      const activeData = active.data.current;
      const overData = over.data.current;

      if (activeData?.type === 'Column' && overData?.type === 'Column') {
        const overColumnPosition = columnsId.findIndex((id) => id === over.id);
        pickedUpTaskColumnId.current = null;
        return `Column ${activeData.column.title} was dropped into position ${
          overColumnPosition + 1
        } of ${columnsId.length}`;
      }

      if (activeData?.type === 'Task' && overData?.type === 'Task') {
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
          over.id,
          overData.task.columnId
        );

        const isNewColumn =
          overData.task.columnId !== pickedUpTaskColumnId.current;
        pickedUpTaskColumnId.current = null;

        if (isNewColumn) {
          return `Task was dropped into column ${column?.title} in position ${
            taskPosition + 1
          } of ${tasksInColumn.length}`;
        }

        return `Task was dropped into position ${taskPosition + 1} of ${
          tasksInColumn.length
        } in column ${column?.title}`;
      }

      pickedUpTaskColumnId.current = null;
    },

    onDragCancel({ active }) {
      pickedUpTaskColumnId.current = null;
      if (hasDraggableData(active) && active.data.current?.type === 'Task') {
        return `Dragging cancelled. Task returned to its original position.`;
      }
    }
  };

  return (
    <DndContext
      accessibility={{ announcements }}
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      <BoardContainer>
        <SortableContext items={columnsId}>
          {columns?.map((col, index) => (
            <Fragment key={col.id}>
              <BoardColumn
                column={col}
                tasks={tasks.filter((task) => task.columnId === col.id)}
              />
              {index === columns?.length - 1 && (
                <div className="w-[300px]">
                  <NewSectionDialog />
                </div>
              )}
            </Fragment>
          ))}
          {!columns.length && <NewSectionDialog />}
        </SortableContext>
      </BoardContainer>

      {typeof document !== 'undefined' &&
        createPortal(
          <DragOverlay>
            {activeColumn && (
              <BoardColumn
                isOverlay
                column={activeColumn}
                tasks={tasks.filter(
                  (task) => task.columnId === activeColumn.id
                )}
              />
            )}
            {activeTask && <TaskCard task={activeTask} isOverlay />}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );

  function onDragStart(event: DragStartEvent) {
    if (!hasDraggableData(event.active)) return;
    const data = event.active.data.current;
    if (data?.type === 'Column') {
      setActiveColumn(data.column);
      return;
    }

    if (data?.type === 'Task') {
      setActiveTask(data.task);
      return;
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (!hasDraggableData(active)) return;
    const activeData = active.data.current;

    // ПЕРЕМЕЩЕНИЕ КОЛОНОК
    if (activeData?.type === 'Column') {
      if (activeId !== overId) {
        const activeColumnIndex = columns.findIndex(
          (col) => col.id === activeId
        );
        const overColumnIndex = columns.findIndex((col) => col.id === overId);
        setCols(arrayMove(columns, activeColumnIndex, overColumnIndex));
      }
      return;
    }

    // ПЕРЕМЕЩЕНИЕ ЗАДАЧ (СОХРАНЕНИЕ ПОРЯДКА)
    if (activeData?.type === 'Task') {
      const task = tasks.find((t) => t.id === activeId);
      if (task) {
        // Вычисляем индекс задачи среди задач ЕЁ НОВОЙ колонки
        const tasksInNewCol = useTaskStore
          .getState()
          .tasks.filter((t) => t.columnId === task.columnId);
        const newOrder = tasksInNewCol.findIndex((t) => t.id === activeId);

        await moveTask(activeId, task.columnId, newOrder);
      }
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;
    if (!hasDraggableData(active) || !hasDraggableData(over)) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    const isActiveATask = activeData?.type === 'Task';
    const isOverATask = overData?.type === 'Task';

    if (!isActiveATask) return;

    // Перетаскиваем задачу над другой задачей
    if (isActiveATask && isOverATask) {
      const activeIndex = tasks.findIndex((t) => t.id === activeId);
      const overIndex = tasks.findIndex((t) => t.id === overId);
      const activeTask = tasks[activeIndex];
      const overTask = tasks[overIndex];

      if (activeTask && overTask && activeTask.columnId !== overTask.columnId) {
        activeTask.columnId = overTask.columnId;
        setTasks(arrayMove(tasks, activeIndex, overIndex - 1));
      } else {
        setTasks(arrayMove(tasks, activeIndex, overIndex));
      }
    }

    // Перетаскиваем задачу над пустой колонкой
    const isOverAColumn = overData?.type === 'Column';
    if (isActiveATask && isOverAColumn) {
      const activeIndex = tasks.findIndex((t) => t.id === activeId);
      const activeTask = tasks[activeIndex];
      if (activeTask) {
        activeTask.columnId = overId as string;
        setTasks(arrayMove(tasks, activeIndex, activeIndex));
      }
    }
  }
}
