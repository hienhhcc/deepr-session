"use client";

import { useEffect, useState } from "react";
import { Plus, Search, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskForm } from "@/components/tasks/task-form";
import {
  useTaskStore,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from "@/stores/task.store";

export default function TasksPage() {
  const {
    tasks,
    loading,
    filters,
    setFilters,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    createSubtask,
    updateSubtask,
    deleteSubtask,
  } = useTaskStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [statusTab, setStatusTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setFilters({
      ...filters,
      search: value || undefined,
    });
  };

  const handleStatusTab = (tab: string) => {
    setStatusTab(tab);
    setFilters({
      ...filters,
      status: tab === "all" ? undefined : (tab as TaskStatus),
    });
  };

  const handlePriorityFilter = (value: string) => {
    setPriorityFilter(value);
    setFilters({
      ...filters,
      priority: value === "all" ? undefined : (value as TaskPriority),
    });
  };

  const handleCreate = async (data: {
    name: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
  }) => {
    await createTask(data);
    setDialogOpen(false);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleUpdate = async (data: {
    name: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
  }) => {
    if (!editingTask) return;
    await updateTask({ id: editingTask.id, ...data });
    setDialogOpen(false);
    setEditingTask(undefined);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingTask(undefined);
    }
    setDialogOpen(open);
  };

  // Status counts
  const allCount = tasks.length;
  const statusCounts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  // When filtering by status tab, we filter locally since the store already has the data
  // But we use the store's filter mechanism so API-side filtering works too
  const filteredTasks = statusTab === "all"
    ? tasks
    : tasks.filter((t) => t.status === statusTab);

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5">
            <ListTodo className="h-6 w-6 text-primary" />
            Tasks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your tasks and track progress
          </p>
        </div>
        <Button
          className="gap-1.5"
          onClick={() => {
            setEditingTask(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={priorityFilter} onValueChange={handlePriorityFilter}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status tabs */}
      <Tabs value={statusTab} onValueChange={handleStatusTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All ({allCount})</TabsTrigger>
          <TabsTrigger value="todo">To Do ({statusCounts.todo})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({statusCounts.in_progress})</TabsTrigger>
          <TabsTrigger value="done">Done ({statusCounts.done})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Task grid */}
      {loading && tasks.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <ListTodo className="h-8 w-8 text-primary/60" />
          </div>
          <h2 className="text-lg font-medium mb-1">No tasks found</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            {statusTab === "all"
              ? "Create your first task to start organizing your work."
              : `No ${statusTab.replace("_", " ")} tasks.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={deleteTask}
              onToggleSubtask={(id, done) => updateSubtask(id, { done })}
              onDeleteSubtask={deleteSubtask}
              onCreateSubtask={createSubtask}
            />
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "New Task"}</DialogTitle>
          </DialogHeader>
          <TaskForm
            task={editingTask}
            onSubmit={editingTask ? handleUpdate : handleCreate}
            onCancel={() => handleDialogClose(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
