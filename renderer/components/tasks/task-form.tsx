"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus, TaskPriority } from "@/stores/task.store";

const priorityOptions: { value: TaskPriority; label: string; color: string; activeColor: string }[] = [
  { value: "low", label: "Low", color: "border-emerald-300 text-emerald-600 hover:bg-emerald-50", activeColor: "bg-emerald-100 border-emerald-400 text-emerald-700 ring-1 ring-emerald-300" },
  { value: "medium", label: "Medium", color: "border-amber-300 text-amber-600 hover:bg-amber-50", activeColor: "bg-amber-100 border-amber-400 text-amber-700 ring-1 ring-amber-300" },
  { value: "high", label: "High", color: "border-rose-300 text-rose-600 hover:bg-rose-50", activeColor: "bg-rose-100 border-rose-400 text-rose-700 ring-1 ring-rose-300" },
];

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: {
    name: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
  }) => void;
  onCancel: () => void;
}

export function TaskForm({ task, onSubmit, onCancel }: TaskFormProps) {
  const [name, setName] = useState(task?.name || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState<TaskStatus>(task?.status || "todo");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || "medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      status,
      priority,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Name *
        </Label>
        <Input
          id="task-name"
          placeholder="Task name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-10"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Description
        </Label>
        <Textarea
          id="task-desc"
          placeholder="Optional description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Status
        </Label>
        <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Priority
        </Label>
        <div className="flex gap-2">
          {priorityOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPriority(opt.value)}
              className={cn(
                "flex-1 py-2 rounded-lg border text-sm font-medium transition-all duration-150",
                priority === opt.value ? opt.activeColor : opt.color
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim()}>
          {task ? "Update" : "Create"} Task
        </Button>
      </div>
    </form>
  );
}
