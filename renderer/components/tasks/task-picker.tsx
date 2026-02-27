"use client";

import { useState, useEffect } from "react";
import { X, Plus, Search, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "./priority-badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "./task-form";
import { useTaskStore, type Task } from "@/stores/task.store";
import { cn } from "@/lib/utils";

interface TaskPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Open the dialog immediately on mount */
  defaultOpen?: boolean;
  /** Called when the dialog open state changes */
  onOpenChange?: (open: boolean) => void;
}

export function TaskPicker({ selectedIds, onChange, defaultOpen, onOpenChange }: TaskPickerProps) {
  const { tasks, fetchTasks, createTask } = useTaskStore();
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    onOpenChange?.(value);
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const selectedTasks = tasks.filter((t) => selectedIds.includes(t.id));
  const filteredTasks = tasks.filter(
    (t) =>
      t.status !== "done" &&
      t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (taskId: string) => {
    if (selectedIds.includes(taskId)) {
      onChange(selectedIds.filter((id) => id !== taskId));
    } else {
      onChange([...selectedIds, taskId]);
    }
  };

  const handleRemove = (taskId: string) => {
    onChange(selectedIds.filter((id) => id !== taskId));
  };

  const handleCreateAndSelect = async (data: {
    name: string;
    description?: string;
    status: "todo" | "in_progress" | "done";
    priority: "low" | "medium" | "high";
  }) => {
    const task = await createTask(data);
    if (task) {
      onChange([...selectedIds, task.id]);
      setShowCreateForm(false);
    }
  };

  // When used as a controlled dialog (defaultOpen), don't render inline UI
  const isControlled = defaultOpen !== undefined;

  return (
    <div className="space-y-2">
      {/* Inline UI: badges + Add button (hidden when controlled) */}
      {!isControlled && (
        <>
          {selectedTasks.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedTasks.map((task) => (
                <Badge
                  key={task.id}
                  variant="secondary"
                  className="gap-1 pr-1 text-xs"
                >
                  {task.name}
                  <button
                    type="button"
                    onClick={() => handleRemove(task.id)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => handleOpenChange(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </Button>
        </>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select Tasks</DialogTitle>
          </DialogHeader>

          {showCreateForm ? (
            <div className="min-w-0 overflow-hidden">
              <TaskForm
                onSubmit={handleCreateAndSelect}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          ) : (
            <div className="space-y-3 min-w-0 overflow-hidden">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <div className="max-h-64 overflow-y-auto overflow-x-hidden space-y-1">
                {filteredTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tasks found
                  </p>
                ) : (
                  filteredTasks.map((task) => {
                    const isSelected = selectedIds.includes(task.id);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        className={cn(
                          "w-full min-w-0 flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => handleToggle(task.id)}
                      >
                        <div
                          className={cn(
                            "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                            isSelected
                              ? "bg-primary border-primary"
                              : "border-border"
                          )}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="truncate">{task.name}</span>
                        <PriorityBadge priority={task.priority} className="ml-auto shrink-0" />
                      </button>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                Create New Task
              </button>

              <div className="flex justify-end pt-1">
                <Button size="sm" onClick={() => handleOpenChange(false)}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
