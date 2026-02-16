export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

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

export interface Subtask {
  id: string;
  taskId: string;
  name: string;
  done: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CreateTaskInput {
  name: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface UpdateTaskInput {
  id: string;
  name?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface CreateSubtaskInput {
  taskId: string;
  name: string;
}

export interface UpdateSubtaskInput {
  id: string;
  name?: string;
  done?: boolean;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  limit?: number;
  offset?: number;
}
