"use client";

import { useState } from "react";
import {
  Circle,
  Clock,
  CheckCircle2,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SubtaskList } from "./subtask-list";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority } from "@/stores/task.store";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (id: string, done: boolean) => void;
  onDeleteSubtask: (id: string) => void;
  onCreateSubtask: (taskId: string, name: string) => void;
}

const statusIcons = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
};

const statusColors = {
  todo: "text-muted-foreground",
  in_progress: "text-amber-500",
  done: "text-primary",
};

const priorityConfig: Record<TaskPriority, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { label: "Low", variant: "outline" },
  medium: { label: "Medium", variant: "secondary" },
  high: { label: "High", variant: "default" },
  urgent: { label: "Urgent", variant: "destructive" },
};

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onToggleSubtask,
  onDeleteSubtask,
  onCreateSubtask,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const StatusIcon = statusIcons[task.status];
  const priority = priorityConfig[task.priority];
  const doneCount = task.subtasks.filter((s) => s.done).length;
  const totalCount = task.subtasks.length;

  return (
    <Card
      className={cn(
        "card-hover-lift transition-all duration-200 cursor-pointer",
        expanded && "ring-1 ring-primary/20"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <StatusIcon
              className={cn("h-5 w-5 mt-0.5 shrink-0", statusColors[task.status])}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={cn(
                    "font-medium text-sm truncate",
                    task.status === "done" && "line-through text-muted-foreground"
                  )}
                >
                  {task.name}
                </h3>
                <Badge variant={priority.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                  {priority.label}
                </Badge>
              </div>

              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                  {task.description}
                </p>
              )}

              {totalCount > 0 && (
                <p className="text-xs text-muted-foreground/70">
                  {doneCount}/{totalCount} subtasks
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          </div>
        </div>

        {expanded && (
          <div
            className="animate-fade-in-up mt-4 pt-3 border-t border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {task.description && (
              <p className="text-sm text-foreground/80 mb-3 whitespace-pre-wrap">
                {task.description}
              </p>
            )}

            <SubtaskList
              subtasks={task.subtasks}
              onToggle={onToggleSubtask}
              onDelete={onDeleteSubtask}
              onCreate={(name) => onCreateSubtask(task.id, name)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
