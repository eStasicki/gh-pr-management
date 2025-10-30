import { contextBridge, ipcRenderer } from "electron";

export type UpdateStatus =
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error"
  | "idle";

export type UpdateInfo = {
  version: string;
  releaseDate?: Date;
  releaseNotes?: string;
};

export type UpdateProgress = {
  percent: number;
  transferred: number;
  total: number;
};

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  version: process.env.npm_package_version || "0.0.1",

  // Update methods
  checkForUpdates: async () => {
    return await ipcRenderer.invoke("check-for-updates");
  },
  downloadUpdate: async () => {
    return await ipcRenderer.invoke("download-update");
  },
  installUpdate: () => {
    return ipcRenderer.invoke("install-update");
  },
  getAppVersion: () => {
    return ipcRenderer.invoke("get-app-version");
  },

  // Update event listeners
  onUpdateChecking: (callback: () => void) => {
    ipcRenderer.on("update-checking", () => callback());
    return () => ipcRenderer.removeAllListeners("update-checking");
  },
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
    ipcRenderer.on("update-available", (_event, info) => callback(info));
    return () => ipcRenderer.removeAllListeners("update-available");
  },
  onUpdateNotAvailable: (callback: () => void) => {
    ipcRenderer.on("update-not-available", () => callback());
    return () => ipcRenderer.removeAllListeners("update-not-available");
  },
  onUpdateError: (callback: (error: { message: string }) => void) => {
    ipcRenderer.on("update-error", (_event, error) => callback(error));
    return () => ipcRenderer.removeAllListeners("update-error");
  },
  onUpdateDownloadProgress: (callback: (progress: UpdateProgress) => void) => {
    ipcRenderer.on("update-download-progress", (_event, progress) =>
      callback(progress)
    );
    return () => ipcRenderer.removeAllListeners("update-download-progress");
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on("update-downloaded", () => callback());
    return () => ipcRenderer.removeAllListeners("update-downloaded");
  },
});

