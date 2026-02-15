import type { ElectronAPI } from "../../main/preload";

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Safe accessor that returns undefined when not in Electron (e.g. during SSG build)
export function getElectronAPI(): ElectronAPI | undefined {
  if (typeof window !== "undefined" && window.electronAPI) {
    return window.electronAPI;
  }
  return undefined;
}
