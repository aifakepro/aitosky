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
  currentBoardId: string | null; // Храним ID текущей доски
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
  setTasks: (updatedTasks: Task[]) => void;
  moveTask: (
    taskId: string,
    newColumnId: string,
    newOrder: number
  ) => Promise<void>;

  // Колонки
  addCol: (title: string) => Promise<void>; // Упростили: берем boardId из стейта
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

  // 1. Загрузка данных из API (GET /api/kanban)
  fetchBoardData: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/kanban');
      if (!response.ok) throw new Error('Failed to fetch board');

      const boards = await response.json();

      if (boards && boards.length > 0) {
        const board = boards[0];
        set({
          currentBoardId: board.id, // Запоминаем ID доски для создания колонок
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

  // 2. Добавление задачи (POST /api/kanban/task)
  addTask: async (columnId: string, title: string, description?: string) => {
    try {
      const response = await fetch('/api/kanban/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          columnId,
          order: get().tasks.filter((t) => t.columnId === columnId).length
        })
      });
      if (response.ok) {
        await get().fetchBoardData(); // Перезагружаем всё дерево данных
      }
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
    }
  },

  // 3. Перемещение задачи (PATCH /api/kanban/task)
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

  // 4. Удаление задачи (DELETE /api/kanban/task?taskId=...)
  removeTask: async (id: string) => {
    try {
      const response = await fetch(`/api/kanban/task?taskId=${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await get().fetchBoardData();
      }
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
    }
  },

  // 5. Создание колонки (POST /api/kanban/column)
  addCol: async (title: string) => {
    const { currentBoardId } = get();
    if (!currentBoardId) {
      console.error('Нет ID доски для создания колонки');
      return;
    }

    try {
      const response = await fetch('/api/kanban/column', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          boardId: currentBoardId,
          order: get().columns.length
        })
      });
      if (response.ok) {
        await get().fetchBoardData();
      }
    } catch (error) {
      console.error('Ошибка создания колонки:', error);
    }
  },

  // 6. Удаление колонки (DELETE /api/kanban/column?columnId=...)
  removeCol: async (id: UniqueIdentifier) => {
    try {
      const response = await fetch(`/api/kanban/column?columnId=${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await get().fetchBoardData();
      }
    } catch (error) {
      console.error('Ошибка удаления колонки:', error);
    }
  },

  // 7. Обновление названия колонки (PATCH /api/kanban/column)
  updateCol: async (id: UniqueIdentifier, newName: string) => {
    try {
      const response = await fetch(`/api/kanban/column`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: id, title: newName })
      });
      if (response.ok) {
        await get().fetchBoardData();
      }
    } catch (error) {
      console.error('Ошибка обновления колонки:', error);
    }
  },

  // Локальные методы для плавной работы Drag-and-Drop в UI
  dragTask: (id: string | null) => set({ draggedTask: id }),
  setTasks: (newTasks: Task[]) => set({ tasks: newTasks }),
  setCols: (newCols: Column[]) => set({ columns: newCols })
}));
