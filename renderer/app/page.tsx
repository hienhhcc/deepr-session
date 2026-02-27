"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { SessionSetup } from "@/components/timer/session-setup";
import { TimerDisplay } from "@/components/timer/timer-display";
import { AmbientPlayer } from "@/components/audio/ambient-player";
import { TaskPicker } from "@/components/tasks/task-picker";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { useTimer } from "@/hooks/useTimer";
import { useSessionStore } from "@/stores/session.store";
import { useTaskStore, type Task, type TaskPriority } from "@/stores/task.store";
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

  const sessionTasks = selectedIds
    .map((id) => tasks.find((t) => t.id === id))
    .filter((t): t is Task => t != null);

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = () => {
    document.body.classList.add("dragging");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    document.body.classList.remove("dragging");
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = selectedIds.indexOf(active.id as string);
    const newIndex = selectedIds.indexOf(over.id as string);
    const newIds = arrayMove(selectedIds, oldIndex, newIndex);
    setSelectedIds(newIds);
    updateSessionTasks(newIds);
  };

  const handleDragCancel = () => {
    document.body.classList.remove("dragging");
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
          <SortableContext items={selectedIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sessionTasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  isExpanded={expandedId === task.id}
                  onToggleExpand={() => setExpandedId(expandedId === task.id ? null : task.id)}
                  onToggleComplete={() => handleToggleComplete(task.id)}
                  onCyclePriority={() => handleCyclePriority(task)}
                  onRemove={() => handleRemoveFromSession(task.id)}
                  onDelete={() => handleDeleteTask(task.id)}
                  updateTask={updateTask}
                  updateSubtask={updateSubtask}
                  deleteSubtask={deleteSubtask}
                  createSubtask={createSubtask}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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

function SortableTaskCard({
  task,
  isExpanded,
  onToggleExpand,
  onToggleComplete,
  onCyclePriority,
  onRemove,
  onDelete,
  updateTask,
  updateSubtask,
  deleteSubtask,
  createSubtask,
}: {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onCyclePriority: () => void;
  onRemove: () => void;
  onDelete: () => void;
  updateTask: (data: { id: string; name?: string; description?: string; priority?: TaskPriority }) => void;
  updateSubtask: (id: string, data: { done?: boolean; name?: string }) => void;
  deleteSubtask: (id: string) => void;
  createSubtask: (taskId: string, name: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isDone = task.status === "done";
  const subtaskCount = task.subtasks?.length ?? 0;
  const doneCount = task.subtasks?.filter((s) => s.done).length ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-border/60 bg-card/40 transition-all",
        isExpanded && "bg-muted/20",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-2 px-3 py-2.5 group">
        {/* Drag handle */}
        <button
          type="button"
          className="shrink-0 touch-none text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-grab"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Checkbox circle */}
        <button
          type="button"
          onClick={onToggleComplete}
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
          <InlineEdit
            value={task.name}
            onSave={(name) => updateTask({ id: task.id, name })}
            className="flex-1 min-w-0 text-sm"
            multiline
          />
        ) : (
          <button
            type="button"
            className="flex-1 min-w-0 text-left"
            onClick={onToggleExpand}
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

        {isExpanded ? (
          <button
            type="button"
            onClick={onCyclePriority}
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
          onClick={onToggleExpand}
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
          <div className="ml-[42px] space-y-4 border-t border-border/40 pt-3.5">
            <EditableSubtaskList
              subtasks={task.subtasks ?? []}
              onToggle={(id, done) => updateSubtask(id, { done })}
              onRename={(id, name) => updateSubtask(id, { name })}
              onDelete={deleteSubtask}
              onCreate={(name) => createSubtask(task.id, name)}
            />

            <div className="flex items-center gap-1 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={onRemove}
              >
                <X className="h-3 w-3" />
                Remove
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive"
                onClick={onDelete}
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    if (multiline) {
      autoResize();
    }
  }, [draft, multiline, autoResize]);

  if (multiline) {
    return (
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          autoResize();
        }}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        style={{ resize: "none" }}
        className={cn(
          "w-full bg-transparent border-none outline-none focus:ring-0 p-0 leading-relaxed overflow-hidden",
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
          className="group flex items-start gap-2 py-1 px-1 rounded hover:bg-muted/50 transition-colors"
        >
          <input
            type="checkbox"
            checked={subtask.done}
            onChange={() => onToggle(subtask.id, !subtask.done)}
            className="h-3.5 w-3.5 mt-1 rounded border-border accent-primary cursor-pointer shrink-0"
          />
          <InlineEdit
            value={subtask.name}
            onSave={(name) => { if (name) onRename(subtask.id, name); }}
            className={cn(
              "flex-1 min-w-0 text-sm",
              subtask.done && "line-through text-muted-foreground/60"
            )}
            multiline
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
  const wasAudioPlayingRef = useRef(false);

  const handlePause = async () => {
    const audioState = useAudioStore.getState();
    wasAudioPlayingRef.current = audioState.isEnabled && !audioState.isPaused;
    if (wasAudioPlayingRef.current) {
      audioState.pause();
    }
    await pause();
  };

  const handleResume = async () => {
    await resume();
    if (wasAudioPlayingRef.current) {
      useAudioStore.getState().resume();
      wasAudioPlayingRef.current = false;
    }
  };

  const handleStop = async () => {
    wasAudioPlayingRef.current = false;
    useAudioStore.getState().stop();
    await stop();
    await onStop();
  };

  if (status === "idle") return null;

  return (
    <div className="flex items-center justify-center gap-3 animate-fade-in-up">
      {status === "running" ? (
        <>
          <Button variant="outline" size="lg" onClick={handlePause} className="gap-2 rounded-xl">
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
          <Button variant="default" size="lg" onClick={handleResume} className="gap-2 rounded-xl">
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
