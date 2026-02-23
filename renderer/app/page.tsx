"use client";

import { useState, useEffect } from "react";
import {
  TreePine,
  Target,
  Clock,
  Pause,
  Play,
  SkipForward,
  Square,
  ListTodo,
  Plus,
  Check,
  ChevronDown,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionSetup } from "@/components/timer/session-setup";
import { TimerDisplay } from "@/components/timer/timer-display";
import { AmbientPlayer } from "@/components/audio/ambient-player";
import { TaskPicker } from "@/components/tasks/task-picker";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { useTimer } from "@/hooks/useTimer";
import { useSessionStore } from "@/stores/session.store";
import { useTaskStore, type Task } from "@/stores/task.store";
import { useAudioStore } from "@/stores/audio.store";
import { formatTime, cn } from "@/lib/utils";

export default function FocusPage() {
  const { status, accumulatedFocusTime, currentPomodoro } = useTimer();
  const { activeSession, endSession } = useSessionStore();

  // Show session setup when idle and no active session
  if (!activeSession && status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <SessionSetup />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6">
      <div className="text-center space-y-8 animate-fade-in w-full max-w-lg">
        {/* Timer */}
        <TimerDisplay />

        {/* Session info */}
        {activeSession && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {activeSession.task}
            </h2>
            {activeSession.intention && (
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {activeSession.intention}
              </p>
            )}
            <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <TreePine className="h-3.5 w-3.5 text-primary/60" />
                Pomodoro {currentPomodoro}
              </span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary/60" />
                {formatTime(accumulatedFocusTime)} focused
              </span>
            </div>
          </div>
        )}

        {/* Session tasks */}
        <SessionTaskManager />

        {/* Ambient Sounds */}
        <div className="max-w-md w-full mx-auto">
          <AmbientPlayer />
        </div>

        {/* Controls */}
        {status !== "idle" && (
          <TimerControls onStop={endSession} />
        )}
      </div>
    </div>
  );
}

const PRIORITY_CYCLE: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];

function SessionTaskManager() {
  const { activeSession, updateSessionTasks } = useSessionStore();
  const { tasks, fetchTasks, updateTask, deleteTask, createSubtask, updateSubtask, deleteSubtask } = useTaskStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (activeSession) {
      setSelectedIds((activeSession.tasks ?? []).map((t) => t.id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id]);

  if (!activeSession) return null;

  const sessionTasks = tasks.filter((t) => selectedIds.includes(t.id));

  const handleToggleComplete = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask({ id: taskId, status: task.status === "done" ? "todo" : "done" });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    setSelectedIds((prev) => prev.filter((id) => id !== taskId));
    updateSessionTasks(selectedIds.filter((id) => id !== taskId));
    if (expandedId === taskId) setExpandedId(null);
  };

  const handleRemoveFromSession = (taskId: string) => {
    const newIds = selectedIds.filter((id) => id !== taskId);
    setSelectedIds(newIds);
    updateSessionTasks(newIds);
    if (expandedId === taskId) setExpandedId(null);
  };

  const handleCyclePriority = (task: Task) => {
    const idx = PRIORITY_CYCLE.indexOf(task.priority);
    const next = PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
    updateTask({ id: task.id, priority: next });
  };

  const handlePickerChange = (ids: string[]) => {
    setSelectedIds(ids);
    updateSessionTasks(ids);
  };

  return (
    <div className="max-w-md w-full mx-auto text-left">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListTodo className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tasks
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setShowPicker(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {sessionTasks.length > 0 ? (
        <div className="space-y-3">
          {sessionTasks.map((task) => {
            const isDone = task.status === "done";
            const isExpanded = expandedId === task.id;
            const subtaskCount = task.subtasks?.length ?? 0;
            const doneCount = task.subtasks?.filter((s) => s.done).length ?? 0;

            return (
              <div key={task.id} className={cn("rounded-xl border border-border/60 bg-card/40 transition-all", isExpanded && "bg-muted/20")}>
                {/* Main row */}
                <div className="flex items-center gap-3 px-3 py-2.5 group">
                  {/* Checkbox circle */}
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(task.id)}
                    className="shrink-0 focus:outline-none"
                  >
                    <div
                      className={cn(
                        "h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center transition-all",
                        isDone
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30 hover:border-primary/60"
                      )}
                    >
                      {isDone && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                    </div>
                  </button>

                  {isExpanded ? (
                    /* Inline editable name when expanded */
                    <InlineEdit
                      value={task.name}
                      onSave={(name) => updateTask({ id: task.id, name })}
                      className="flex-1 min-w-0 text-sm"
                    />
                  ) : (
                    /* Static name — click to expand */
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left"
                      onClick={() => setExpandedId(task.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm truncate transition-all",
                            isDone ? "text-muted-foreground/50 line-through" : "text-foreground"
                          )}
                        >
                          {task.name}
                        </span>
                        {subtaskCount > 0 && (
                          <span className="text-[10px] text-muted-foreground/50 shrink-0">
                            {doneCount}/{subtaskCount}
                          </span>
                        )}
                      </div>
                    </button>
                  )}

                  {/* Priority (clickable to cycle when expanded) + expand arrow */}
                  {isExpanded ? (
                    <button
                      type="button"
                      onClick={() => handleCyclePriority(task)}
                      title="Click to change priority"
                      className="shrink-0"
                    >
                      <PriorityBadge priority={task.priority} className="cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-primary/30 transition-all" />
                    </button>
                  ) : (
                    <PriorityBadge priority={task.priority} className="shrink-0" />
                  )}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : task.id)}
                    className="shrink-0 focus:outline-none"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-muted-foreground/40 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </button>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="px-3 pb-4 animate-fade-in">
                    <div className="ml-[30px] space-y-4 border-t border-border/40 pt-3.5">
                      {/* Editable description */}
                      <InlineEdit
                        value={task.description ?? ""}
                        onSave={(desc) => updateTask({ id: task.id, description: desc || undefined })}
                        placeholder="description"
                        className="text-xs text-muted-foreground/70"
                        multiline
                      />

                      {/* Subtasks with editable names */}
                      <EditableSubtaskList
                        subtasks={task.subtasks ?? []}
                        onToggle={(id, done) => updateSubtask(id, { done })}
                        onRename={(id, name) => updateSubtask(id, { name })}
                        onDelete={deleteSubtask}
                        onCreate={(name) => createSubtask(task.id, name)}
                      />

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleRemoveFromSession(task.id)}
                        >
                          <X className="h-3 w-3" />
                          Remove
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/50 text-center py-3">
          No tasks yet
        </p>
      )}

      {/* Task picker dialog */}
      {showPicker && (
        <TaskPicker
          selectedIds={selectedIds}
          onChange={handlePickerChange}
          defaultOpen
          onOpenChange={(open) => { if (!open) setShowPicker(false); }}
        />
      )}
    </div>
  );
}

/** Inline text editor — renders as text, becomes an input on focus/click, saves on blur/Enter. */
function InlineEdit({
  value,
  onSave,
  placeholder,
  className,
  multiline,
}: {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      setDraft(value);
      (e.target as HTMLElement).blur();
    }
  };

  if (multiline) {
    return (
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className={cn(
          "w-full bg-transparent border-none outline-none resize-none focus:ring-0 p-0 leading-relaxed",
          !draft && "italic text-muted-foreground/40",
          className
        )}
      />
    );
  }

  return (
    <input
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={cn(
        "w-full bg-transparent border-none outline-none focus:ring-0 p-0",
        className
      )}
    />
  );
}

/** Subtask list with inline-editable names */
function EditableSubtaskList({
  subtasks,
  onToggle,
  onRename,
  onDelete,
  onCreate,
}: {
  subtasks: import("@/stores/task.store").Subtask[];
  onToggle: (id: string, done: boolean) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onCreate: (name: string) => void;
}) {
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
            className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer shrink-0"
          />
          <InlineEdit
            value={subtask.name}
            onSave={(name) => { if (name) onRename(subtask.id, name); }}
            className={cn(
              "flex-1 text-sm",
              subtask.done && "line-through text-muted-foreground/60"
            )}
          />
          <button
            onClick={() => onDelete(subtask.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}

      {/* Inline add */}
      <div className="flex items-center gap-2 pt-1">
        <Plus className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          placeholder="Add subtask..."
          className="flex-1 text-sm bg-transparent border-none outline-none focus:ring-0 p-0 text-muted-foreground placeholder:text-muted-foreground/40"
        />
      </div>
    </div>
  );
}

function TimerControls({ onStop }: { onStop: () => Promise<void> }) {
  const { status, pause, resume, skip, stop } = useTimer();

  const handleStop = async () => {
    useAudioStore.getState().stop();
    await stop();
    await onStop();
  };

  if (status === "idle") return null;

  return (
    <div className="flex items-center justify-center gap-3 animate-fade-in-up">
      {status === "running" ? (
        <>
          <Button variant="outline" size="lg" onClick={pause} className="gap-2 rounded-xl">
            <Pause className="h-5 w-5" />
            Pause
          </Button>
          <Button variant="outline" size="lg" onClick={skip} className="gap-2 rounded-xl">
            <SkipForward className="h-5 w-5" />
            Skip
          </Button>
          <Button variant="destructive" size="lg" onClick={handleStop} className="gap-2 rounded-xl">
            <Square className="h-5 w-5" />
            Stop
          </Button>
        </>
      ) : (
        <>
          <Button variant="default" size="lg" onClick={resume} className="gap-2 rounded-xl">
            <Play className="h-5 w-5" />
            Resume
          </Button>
          <Button variant="destructive" size="lg" onClick={handleStop} className="gap-2 rounded-xl">
            <Square className="h-5 w-5" />
            Stop
          </Button>
        </>
      )}
    </div>
  );
}
