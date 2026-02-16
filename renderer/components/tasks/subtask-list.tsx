"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Subtask } from "@/stores/task.store";

interface SubtaskListProps {
  subtasks: Subtask[];
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
  onCreate: (name: string) => void;
}

export function SubtaskList({ subtasks, onToggle, onDelete, onCreate }: SubtaskListProps) {
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onCreate(name);
    setNewName("");
  };

  return (
    <div className="space-y-1">
      {subtasks.map((subtask) => (
        <div
          key={subtask.id}
          className="group flex items-center gap-2 py-1 px-1 rounded hover:bg-muted/50 transition-colors"
        >
          <input
            type="checkbox"
            checked={subtask.done}
            onChange={() => onToggle(subtask.id, !subtask.done)}
            className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
          />
          <span
            className={cn(
              "flex-1 text-sm",
              subtask.done && "line-through text-muted-foreground/60"
            )}
          >
            {subtask.name}
          </span>
          <button
            onClick={() => onDelete(subtask.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}

      {/* Inline add input */}
      <div className="flex items-center gap-2 pt-1">
        <Plus className="h-3.5 w-3.5 text-muted-foreground/50" />
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="Add subtask..."
          className="h-7 text-sm border-none shadow-none bg-transparent px-0 focus-visible:ring-0"
        />
      </div>
    </div>
  );
}
