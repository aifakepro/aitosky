import { create } from 'zustand';
import { UniqueIdentifier } from '@dnd-kit/core';

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  columnId: string;
};

export type Column = {
  id: string;
  title: string;
  order: number;
  tasks: Task[];
};

export type State = {
  tasks: Task[];
  columns: Column[];
  currentBoardId: string | null;
  draggedTask: string | null;
  isLoading: boolean;
};

export type Actions = {
  fetchBoardData: () => Promise<void>;
  addTask: (
    columnId: string,
    title: string,
    description?: string
  ) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  setTasks: (updatedTasks: Task[]) => void;
  moveTask: (
    taskId: string,
    newColumnId: string,
    newOrder: number
  ) => Promise<void>;
  addCol: (title: string) => Promise<void>;
  removeCol: (id: UniqueIdentifier) => Promise<void>;
  updateCol: (id: UniqueIdentifier, newName: string) => Promise<void>;
  setCols: (cols: Column[]) => void;
  dragTask: (id: string | null) => void;
};

export const useTaskStore = create<State & Actions>((set, get) => ({
  tasks: [],
  columns: [],
  currentBoardId: null,
  draggedTask: null,
  isLoading: false,

  fetchBoardData: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/kanban');
      if (!response.ok) throw new Error('Failed to fetch board');
      const boards = await response.json();

      if (boards && boards.length > 0) {
        const board = boards[0];
        set({
          currentBoardId: board.id,
          columns: board.columns || [],
          tasks: board.columns.flatMap((col: Column) => col.tasks) || []
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addTask: async (columnId: string, title: string, description?: string) => {
    try {
      // СЧИТАЕМ ТОЛЬКО ЗАДАЧИ В КОНКРЕТНОЙ КОЛОНКЕ
      const tasksInColumn = get().tasks.filter((t) => t.columnId === columnId);
      const order = tasksInColumn.length;

      const response = await fetch('/api/kanban/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, columnId, order })
      });

      if (response.ok) await get().fetchBoardData();
    } catch (error) {
      console.error(error);
    }
  },

  moveTask: async (taskId: string, newColumnId: string, newOrder: number) => {
    try {
      const response = await fetch('/api/kanban/task', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, newColumnId, newOrder })
      });
      if (response.ok) await get().fetchBoardData();
    } catch (error) {
      console.error('Ошибка перемещения:', error);
    }
  },

  addCol: async (title: string) => {
    const { currentBoardId, columns } = get();
    if (!currentBoardId) return;
    try {
      const response = await fetch('/api/kanban/column', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          boardId: currentBoardId,
          order: columns.length
        })
      });
      if (response.ok) await get().fetchBoardData();
    } catch (error) {
      console.error('Ошибка колонки:', error);
    }
  },

  setCols: (newCols: Column[]) => {
    set({ columns: newCols });
    newCols.forEach(async (col, index) => {
      await fetch('/api/kanban/column', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: col.id, order: index })
      });
    });
  },

  removeTask: async (id: string) => {
    await fetch(`/api/kanban/task?taskId=${id}`, { method: 'DELETE' });
    await get().fetchBoardData();
  },

  removeCol: async (id: UniqueIdentifier) => {
    await fetch(`/api/kanban/column?columnId=${id}`, { method: 'DELETE' });
    await get().fetchBoardData();
  },

  updateCol: async (id: UniqueIdentifier, newName: string) => {
    await fetch(`/api/kanban/column`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnId: id, title: newName })
    });
    await get().fetchBoardData();
  },

  dragTask: (id: string | null) => set({ draggedTask: id }),
  setTasks: (newTasks: Task[]) => set({ tasks: newTasks })
}));
