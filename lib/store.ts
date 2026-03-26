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
  setCols: (cols: Column[]) => Promise<void>; // Изменено на Promise
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
      console.error('Ошибка загрузки доски:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addTask: async (columnId: string, title: string, description?: string) => {
    try {
      // Считаем задачи именно в этой колонке для правильного order
      const order = get().tasks.filter((t) => t.columnId === columnId).length;

      const response = await fetch('/api/kanban/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, columnId, order })
      });
      if (response.ok) {
        await get().fetchBoardData();
      }
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
    }
  },

  moveTask: async (taskId: string, newColumnId: string, newOrder: number) => {
    try {
      const response = await fetch('/api/kanban/task', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, newColumnId, newOrder })
      });
      if (response.ok) {
        await get().fetchBoardData(); // Важно: перегружаем, чтобы получить обновленные order всех задач
      }
    } catch (error) {
      console.error('Ошибка перемещения задачи:', error);
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
          order: columns.length // Ставим в конец
        })
      });
      if (response.ok) {
        await get().fetchBoardData();
      }
    } catch (error) {
      console.error('Ошибка создания колонки:', error);
    }
  },

  // ОБНОВЛЕННАЯ ФУНКЦИЯ setCols
  setCols: async (newCols: Column[]) => {
    // 1. Мгновенно обновляем UI
    set({ columns: newCols });

    // 2. Сохраняем новый порядок каждой колонки в базу
    try {
      const promises = newCols.map((col, index) => {
        return fetch('/api/kanban/column', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ columnId: col.id, order: index })
        });
      });
      await Promise.all(promises);
    } catch (error) {
      console.error('Ошибка сохранения порядка колонок:', error);
    }
  },

  removeTask: async (id: string) => {
    try {
      const response = await fetch(`/api/kanban/task?taskId=${id}`, {
        method: 'DELETE'
      });
      if (response.ok) await get().fetchBoardData();
    } catch (error) {
      console.error(error);
    }
  },

  removeCol: async (id: UniqueIdentifier) => {
    try {
      const response = await fetch(`/api/kanban/column?columnId=${id}`, {
        method: 'DELETE'
      });
      if (response.ok) await get().fetchBoardData();
    } catch (error) {
      console.error(error);
    }
  },

  updateCol: async (id: UniqueIdentifier, newName: string) => {
    try {
      const response = await fetch(`/api/kanban/column`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: id, title: newName })
      });
      if (response.ok) await get().fetchBoardData();
    } catch (error) {
      console.error(error);
    }
  },

  dragTask: (id: string | null) => set({ draggedTask: id }),
  setTasks: (newTasks: Task[]) => set({ tasks: newTasks })
}));
