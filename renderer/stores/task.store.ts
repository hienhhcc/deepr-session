import { create } from "zustand";
import { getElectronAPI } from "@/lib/electron-api";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Subtask {
  id: string;
  taskId: string;
  name: string;
  done: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  fetchTasks: (filters?: TaskFilters) => Promise<void>;
  createTask: (input: { name: string; description?: string; status?: TaskStatus; priority?: TaskPriority }) => Promise<Task | null>;
  updateTask: (input: { id: string; name?: string; description?: string; status?: TaskStatus; priority?: TaskPriority }) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<void>;
  createSubtask: (taskId: string, name: string) => Promise<Subtask | null>;
  updateSubtask: (id: string, input: { name?: string; done?: boolean }) => Promise<void>;
  deleteSubtask: (id: string) => Promise<void>;
  reorderSubtasks: (taskId: string, subtaskIds: string[]) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  filters: {},

  setFilters: (filters) => {
    set({ filters });
    get().fetchTasks(filters);
  },

  fetchTasks: async (filters?: TaskFilters) => {
    const api = getElectronAPI();
    if (!api) return;

    set({ loading: true });
    try {
      const tasks = (await api.task.list(filters || get().filters)) as Task[];
      set({ tasks, loading: false });
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      set({ loading: false });
    }
  },

  createTask: async (input) => {
    const api = getElectronAPI();
    if (!api) return null;

    try {
      const task = (await api.task.create(input)) as Task;
      set((state) => ({ tasks: [task, ...state.tasks] }));
      return task;
    } catch (error) {
      console.error("Failed to create task:", error);
      return null;
    }
  },

  updateTask: async (input) => {
    const api = getElectronAPI();
    if (!api) return null;

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === input.id ? { ...t, ...input } : t
      ),
    }));

    try {
      const updated = (await api.task.update(input)) as Task;
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === updated.id ? updated : t)),
      }));
      return updated;
    } catch (error) {
      console.error("Failed to update task:", error);
      get().fetchTasks();
      return null;
    }
  },

  deleteTask: async (id) => {
    const api = getElectronAPI();
    if (!api) return;

    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));

    try {
      await api.task.delete(id);
    } catch (error) {
      console.error("Failed to delete task:", error);
      get().fetchTasks();
    }
  },

  createSubtask: async (taskId, name) => {
    const api = getElectronAPI();
    if (!api) return null;

    try {
      const subtask = (await api.subtask.create({ taskId, name })) as Subtask;
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, subtasks: [...t.subtasks, subtask] } : t
        ),
      }));
      return subtask;
    } catch (error) {
      console.error("Failed to create subtask:", error);
      return null;
    }
  },

  updateSubtask: async (id, input) => {
    const api = getElectronAPI();
    if (!api) return;

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => ({
        ...t,
        subtasks: t.subtasks.map((s) =>
          s.id === id ? { ...s, ...input } : s
        ),
      })),
    }));

    try {
      await api.subtask.update({ id, ...input });
    } catch (error) {
      console.error("Failed to update subtask:", error);
      get().fetchTasks();
    }
  },

  deleteSubtask: async (id) => {
    const api = getElectronAPI();
    if (!api) return;

    // Optimistic delete
    set((state) => ({
      tasks: state.tasks.map((t) => ({
        ...t,
        subtasks: t.subtasks.filter((s) => s.id !== id),
      })),
    }));

    try {
      await api.subtask.delete(id);
    } catch (error) {
      console.error("Failed to delete subtask:", error);
      get().fetchTasks();
    }
  },

  reorderSubtasks: async (taskId, subtaskIds) => {
    const api = getElectronAPI();
    if (!api) return;

    try {
      const subtasks = (await api.subtask.reorder(taskId, subtaskIds)) as Subtask[];
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, subtasks } : t
        ),
      }));
    } catch (error) {
      console.error("Failed to reorder subtasks:", error);
      get().fetchTasks();
    }
  },
}));
