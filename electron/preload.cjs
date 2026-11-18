const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // Dual Disk C & D Storage Sync
  saveLocalBackup: ({ backupText, revenueText }) =>
    ipcRenderer.invoke('app:save-local-backup', { backupText, revenueText }),

  readLocalBackup: () =>
    ipcRenderer.invoke('app:read-local-backup'),

  // Direct Thermal Printing
  directPrint: (options) =>
    ipcRenderer.invoke('app:direct-print', options),

  // Window Controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
});

