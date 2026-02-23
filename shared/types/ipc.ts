// IPC Channel definitions
export const IPC_CHANNELS = {
  // Session channels
  SESSION_CREATE: "session:create",
  SESSION_GET: "session:get",
  SESSION_LIST: "session:list",
  SESSION_UPDATE: "session:update",
  SESSION_UPDATE_TASKS: "session:update-tasks",
  SESSION_DELETE: "session:delete",

  // Timer channels
  TIMER_START: "timer:start",
  TIMER_PAUSE: "timer:pause",
  TIMER_RESUME: "timer:resume",
  TIMER_STOP: "timer:stop",
  TIMER_SKIP: "timer:skip",
  TIMER_TICK: "timer:tick",
  TIMER_STATE_CHANGED: "timer:state-changed",

  // Profile channels
  PROFILE_CREATE: "profile:create",
  PROFILE_GET: "profile:get",
  PROFILE_LIST: "profile:list",
  PROFILE_UPDATE: "profile:update",
  PROFILE_DELETE: "profile:delete",

  // Blocker channels
  BLOCKER_START: "blocker:start",
  BLOCKER_STOP: "blocker:stop",
  BLOCKER_STATUS: "blocker:status",
  BLOCKER_ADD_RULE: "blocker:add-rule",
  BLOCKER_REMOVE_RULE: "blocker:remove-rule",
  BLOCKER_LIST_RULES: "blocker:list-rules",

  // Analytics channels
  ANALYTICS_DAILY: "analytics:daily",
  ANALYTICS_WEEKLY: "analytics:weekly",
  ANALYTICS_STREAK: "analytics:streak",
  ANALYTICS_SUMMARY: "analytics:summary",

  // Task channels
  TASK_CREATE: "task:create",
  TASK_GET: "task:get",
  TASK_LIST: "task:list",
  TASK_UPDATE: "task:update",
  TASK_DELETE: "task:delete",

  // Subtask channels
  SUBTASK_CREATE: "subtask:create",
  SUBTASK_UPDATE: "subtask:update",
  SUBTASK_DELETE: "subtask:delete",
  SUBTASK_REORDER: "subtask:reorder",

  // Audio channels
  AUDIO_IMPORT: "audio:import",
  AUDIO_LIST_CUSTOM: "audio:list-custom",
  AUDIO_DELETE_CUSTOM: "audio:delete-custom",
  AUDIO_SCAN_SOUNDS: "audio:scan-sounds",

  // App channels
  APP_GET_PATH: "app:get-path",
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
