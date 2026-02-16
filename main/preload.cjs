const { contextBridge, ipcRenderer } = require("electron");

const electronAPI = {
  session: {
    create: (input) => ipcRenderer.invoke("session:create", input),
    get: (id) => ipcRenderer.invoke("session:get", id),
    list: (filters) => ipcRenderer.invoke("session:list", filters),
    update: (input) => ipcRenderer.invoke("session:update", input),
    delete: (id) => ipcRenderer.invoke("session:delete", id),
  },

  timer: {
    start: (sessionId) => ipcRenderer.invoke("timer:start", sessionId),
    pause: () => ipcRenderer.invoke("timer:pause"),
    resume: () => ipcRenderer.invoke("timer:resume"),
    stop: () => ipcRenderer.invoke("timer:stop"),
    skip: () => ipcRenderer.invoke("timer:skip"),
    onTick: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on("timer:tick", handler);
      return () => ipcRenderer.removeListener("timer:tick", handler);
    },
    onStateChanged: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on("timer:state-changed", handler);
      return () => ipcRenderer.removeListener("timer:state-changed", handler);
    },
  },

  profile: {
    create: (input) => ipcRenderer.invoke("profile:create", input),
    get: (id) => ipcRenderer.invoke("profile:get", id),
    list: () => ipcRenderer.invoke("profile:list"),
    update: (input) => ipcRenderer.invoke("profile:update", input),
    delete: (id) => ipcRenderer.invoke("profile:delete", id),
  },

  task: {
    create: (input) => ipcRenderer.invoke("task:create", input),
    get: (id) => ipcRenderer.invoke("task:get", id),
    list: (filters) => ipcRenderer.invoke("task:list", filters),
    update: (input) => ipcRenderer.invoke("task:update", input),
    delete: (id) => ipcRenderer.invoke("task:delete", id),
  },

  subtask: {
    create: (input) => ipcRenderer.invoke("subtask:create", input),
    update: (input) => ipcRenderer.invoke("subtask:update", input),
    delete: (id) => ipcRenderer.invoke("subtask:delete", id),
    reorder: (taskId, subtaskIds) => ipcRenderer.invoke("subtask:reorder", taskId, subtaskIds),
  },

  blocker: {
    start: (domains, apps) => ipcRenderer.invoke("blocker:start", domains, apps),
    stop: () => ipcRenderer.invoke("blocker:stop"),
    status: () => ipcRenderer.invoke("blocker:status"),
    addRule: (input) => ipcRenderer.invoke("blocker:add-rule", input),
    removeRule: (id) => ipcRenderer.invoke("blocker:remove-rule", id),
    listRules: (profileId) => ipcRenderer.invoke("blocker:list-rules", profileId),
  },

  analytics: {
    daily: (startDate, endDate) => ipcRenderer.invoke("analytics:daily", startDate, endDate),
    weekly: (weeksBack) => ipcRenderer.invoke("analytics:weekly", weeksBack),
    streak: () => ipcRenderer.invoke("analytics:streak"),
    summary: () => ipcRenderer.invoke("analytics:summary"),
  },

  audio: {
    import: (filePath) => ipcRenderer.invoke("audio:import", filePath),
    listCustom: () => ipcRenderer.invoke("audio:list-custom"),
    deleteCustom: (id) => ipcRenderer.invoke("audio:delete-custom", id),
  },

  app: {
    getPath: (name) => ipcRenderer.invoke("app:get-path", name),
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
