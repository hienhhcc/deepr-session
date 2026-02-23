import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/types/ipc.js";

const electronAPI = {
  session: {
    create: (input: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_CREATE, input),
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_GET, id),
    list: (filters?: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_LIST, filters),
    update: (input: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_UPDATE, input),
    delete: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_DELETE, id),
    updateTasks: (sessionId: string, taskIds: string[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_UPDATE_TASKS, sessionId, taskIds),
  },

  timer: {
    start: (sessionId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.TIMER_START, sessionId),
    pause: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_PAUSE),
    resume: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_RESUME),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_STOP),
    skip: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_SKIP),
    onTick: (callback: (data: unknown) => void) => {
      const handler = (_event: unknown, data: unknown) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.TIMER_TICK, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.TIMER_TICK, handler);
    },
    onStateChanged: (callback: (data: unknown) => void) => {
      const handler = (_event: unknown, data: unknown) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.TIMER_STATE_CHANGED, handler);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.TIMER_STATE_CHANGED, handler);
    },
  },

  profile: {
    create: (input: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.PROFILE_CREATE, input),
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROFILE_GET, id),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.PROFILE_LIST),
    update: (input: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.PROFILE_UPDATE, input),
    delete: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.PROFILE_DELETE, id),
  },

  task: {
    create: (input: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.TASK_CREATE, input),
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TASK_GET, id),
    list: (filters?: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.TASK_LIST, filters),
    update: (input: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.TASK_UPDATE, input),
    delete: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.TASK_DELETE, id),
  },

  subtask: {
    create: (input: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.SUBTASK_CREATE, input),
    update: (input: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.SUBTASK_UPDATE, input),
    delete: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SUBTASK_DELETE, id),
    reorder: (taskId: string, subtaskIds: string[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.SUBTASK_REORDER, taskId, subtaskIds),
  },

  blocker: {
    start: (domains: string[], apps: string[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.BLOCKER_START, domains, apps),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.BLOCKER_STOP),
    status: () => ipcRenderer.invoke(IPC_CHANNELS.BLOCKER_STATUS),
    addRule: (input: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.BLOCKER_ADD_RULE, input),
    removeRule: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.BLOCKER_REMOVE_RULE, id),
    listRules: (profileId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.BLOCKER_LIST_RULES, profileId),
  },

  analytics: {
    daily: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_DAILY, startDate, endDate),
    weekly: (weeksBack: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_WEEKLY, weeksBack),
    streak: () => ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_STREAK),
    summary: () => ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_SUMMARY),
  },

  audio: {
    import: (filePath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.AUDIO_IMPORT, filePath),
    listCustom: () => ipcRenderer.invoke(IPC_CHANNELS.AUDIO_LIST_CUSTOM),
    deleteCustom: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.AUDIO_DELETE_CUSTOM, id),
    scanSounds: () => ipcRenderer.invoke(IPC_CHANNELS.AUDIO_SCAN_SOUNDS),
  },

  app: {
    getPath: (name: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_GET_PATH, name),
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

export type ElectronAPI = typeof electronAPI;
