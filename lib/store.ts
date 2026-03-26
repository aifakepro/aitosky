import { create } from 'zustand';
import { UniqueIdentifier } from '@dnd-kit/core';

// --- Типы, соответствующие твоей схеме Prisma ---
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
  draggedTask: string | null;
  isLoading: boolean;
};

export type Actions = {
  // Загрузка данных
  fetchBoardData: () => Promise<void>;

  // Задачи
  addTask: (
    columnId: string,
    title: string,
    description?: string
  ) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  setTasks: (updatedTasks: Task[]) => void; // Для локальных перемещений dnd-kit
  moveTask: (
    taskId: string,
    newColumnId: string,
    newOrder: number
  ) => Promise<void>;

  // Колонки
  addCol: (boardId: string, title: string) => Promise<void>;
  removeCol: (id: UniqueIdentifier) => Promise<void>;
  updateCol: (id: UniqueIdentifier, newName: string) => Promise<void>;
  setCols: (cols: Column[]) => void;

  dragTask: (id: string | null) => void;
};

export const useTaskStore = create<State & Actions>((set, get) => ({
  tasks: [],
  columns: [],
  draggedTask: null,
  isLoading: false,

  // 1. Загрузка данных из API
  fetchBoardData: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/kanban'); // Твой GET роутер
      const boards = await response.json();

      // Предположим, мы работаем с первой доской (Board)
      if (boards && boards.length > 0) {
        const board = boards[0];
        set({
          columns: board.columns || [],
          // Плоский список всех задач для удобства поиска
          tasks: board.columns.flatMap((col: Column) => col.tasks) || []
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки доски:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // 2. Добавление задачи
  addTask: async (columnId: string, title: string, description?: string) => {
    try {
      const response = await fetch('/api/kanban/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          columnId,
          order: get().tasks.length
        })
      });
      if (response.ok) {
        await get().fetchBoardData(); // Перезагружаем данные
      }
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
    }
  },

  // 3. Перемещение задачи (вызывается в конце Drag & Drop)
  moveTask: async (taskId: string, newColumnId: string, newOrder: number) => {
    try {
      const response = await fetch('/api/kanban/task', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, newColumnId, newOrder })
      });
      if (response.ok) {
        await get().fetchBoardData();
      }
    } catch (error) {
      console.error('Ошибка перемещения задачи:', error);
    }
  },

  // 4. Удаление задачи
  removeTask: async (id: string) => {
    try {
      await fetch(`/api/kanban/task/${id}`, { method: 'DELETE' });
      await get().fetchBoardData();
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
    }
  },

  // 5. Колонки
  addCol: async (boardId: string, title: string) => {
    try {
      await fetch('/api/kanban/column', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, boardId, order: get().columns.length })
      });
      await get().fetchBoardData();
    } catch (error) {
      console.error('Ошибка создания колонки:', error);
    }
  },

  removeCol: async (id: UniqueIdentifier) => {
    try {
      await fetch(`/api/kanban/column/${id}`, { method: 'DELETE' });
      await get().fetchBoardData();
    } catch (error) {
      console.error('Ошибка удаления колонки:', error);
    }
  },

  updateCol: async (id: UniqueIdentifier, newName: string) => {
    try {
      await fetch(`/api/kanban/column/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newName })
      });
      await get().fetchBoardData();
    } catch (error) {
      console.error('Ошибка обновления колонки:', error);
    }
  },

  // Локальные методы для UI (синхронные)
  dragTask: (id: string | null) => set({ draggedTask: id }),
  setTasks: (newTasks: Task[]) => set({ tasks: newTasks }),
  setCols: (newCols: Column[]) => set({ columns: newCols })
}));
