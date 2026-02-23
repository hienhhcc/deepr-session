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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SubtaskList } from "./subtask-list";
import { PriorityBadge } from "./priority-badge";
import { cn } from "@/lib/utils";
import type { Task } from "@/stores/task.store";

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
                <PriorityBadge priority={task.priority} className="shrink-0" />
              </div>

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
