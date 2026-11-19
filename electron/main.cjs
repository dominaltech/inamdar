const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Set application identity
app.setName('Inamdar Restaurant POS');

// Enforce single instance lock for POS terminals
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

let mainWindow = null;

// Target local storage drives for zero-data-loss durability
const LOCAL_DATA_DIRS = ['C:\\InamdarPOS_Data', 'D:\\InamdarPOS_Data'];

/**
 * Initializes persistent data directories on physical drives C: and D:
 * Ensures files exist even if software is uninstalled/reinstalled
 */
function ensureLocalDataDirectories() {
  const initializedDirs = [];

  for (const dir of LOCAL_DATA_DIRS) {
    try {
      const rootDrive = dir.slice(0, 3); // e.g. "C:\" or "D:\"
      // Only attempt write if physical drive exists
      if (fs.existsSync(rootDrive)) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Initialize primary backup data text file if missing
        const backupFile = path.join(dir, 'inamdar_backup_data.txt');
        if (!fs.existsSync(backupFile)) {
          fs.writeFileSync(backupFile, JSON.stringify({
            app: "Inamdar Restaurant POS",
            createdAt: new Date().toISOString(),
            lastSync: new Date().toISOString(),
            tables: {},
            allBills: [],
            customers: [],
            dailyTransactions: []
          }, null, 2), 'utf-8');
        }

        // Initialize revenue history text file if missing
        const revenueFile = path.join(dir, 'inamdar_revenue_history.txt');
        if (!fs.existsSync(revenueFile)) {
          fs.writeFileSync(revenueFile, JSON.stringify({
            app: "Inamdar Restaurant POS",
            createdAt: new Date().toISOString(),
            totalRevenue: 0,
            settledBills: []
          }, null, 2), 'utf-8');
        }

        initializedDirs.push(dir);
        console.log(`[Local Disk Sync] Storage active on: ${dir}`);
      }
    } catch (err) {
      console.warn(`[Local Disk Sync] Notice on drive ${dir}:`, err.message);
    }
  }

  return initializedDirs;
}

/**
 * Synchronously writes backup and revenue data to both C: and D: drives
 */
function saveToLocalDisks(backupText, revenueText) {
  let successCount = 0;

  for (const dir of LOCAL_DATA_DIRS) {
    try {
      const rootDrive = dir.slice(0, 3);
      if (fs.existsSync(rootDrive)) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        if (backupText) {
          const backupFile = path.join(dir, 'inamdar_backup_data.txt');
          fs.writeFileSync(backupFile, backupText, 'utf-8');
        }

        if (revenueText) {
          const revenueFile = path.join(dir, 'inamdar_revenue_history.txt');
          fs.writeFileSync(revenueFile, revenueText, 'utf-8');
        }

        successCount++;
      }
    } catch (err) {
      console.warn(`[Local Disk Sync] Failed to write to ${dir}:`, err.message);
    }
  }

  return { success: successCount > 0, drivesWritten: successCount };
}

/**
 * Recovers the latest saved data from D: or C: drive
 */
function readFromLocalDisks() {
  // Check D: drive first (secondary drive immune to OS re-installs), then C: drive
  const priorityDirs = ['D:\\InamdarPOS_Data', 'C:\\InamdarPOS_Data'];

  for (const dir of priorityDirs) {
    try {
      const backupFile = path.join(dir, 'inamdar_backup_data.txt');
      const revenueFile = path.join(dir, 'inamdar_revenue_history.txt');

      if (fs.existsSync(backupFile)) {
        const backupText = fs.readFileSync(backupFile, 'utf-8');
        let revenueText = '';
        if (fs.existsSync(revenueFile)) {
          revenueText = fs.readFileSync(revenueFile, 'utf-8');
        }

        if (backupText && backupText.trim().length > 10) {
          return {
            found: true,
            sourceDrive: dir,
            backupText,
            revenueText
          };
        }
      }
    } catch (err) {
      console.warn(`[Local Disk Sync] Error reading ${dir}:`, err.message);
    }
  }

  return { found: false };
}

async function createMainWindow() {
  ensureLocalDataDirectories();

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 680,
    title: "Dominal's POS — Inamdar Restaurant & Takeaway, Solapur",
    backgroundColor: '#ece9d8',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Hide system menu bar for classic POS look
  mainWindow.setMenuBarVisibility(false);

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Load app: Dev server URL or production static files
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
      await mainWindow.loadFile(indexPath);
    } else {
      // Fallback dev load if running without build
      await mainWindow.loadURL('http://localhost:5173');
    }
  }
}

// App lifecycle
app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ================= IPC Communication Channels =================

// 1. Direct Dual Disk Sync (writes to C: and D: on every entry)
ipcMain.handle('app:save-local-backup', async (_, { backupText, revenueText }) => {
  return saveToLocalDisks(backupText, revenueText);
});

// 2. Read local backup on startup / recovery
ipcMain.handle('app:read-local-backup', async () => {
  return readFromLocalDisks();
});

// 3. Direct Thermal Printing (Silent, 7.6cm printable width, dynamic height, zero popups)
ipcMain.handle('app:direct-print', async (event, options = {}) => {
  if (!mainWindow) return { success: false, error: 'Window not found' };

  const printWidth = Math.round(options.width || 76000); // 7.6cm width in microns
  const printHeight = Math.round(options.height || 95000); // Dynamic height strictly from DOM measurement

  return new Promise((resolve) => {
    mainWindow.webContents.print({
      silent: options.silent ?? true,
      printBackground: true,
      deviceName: options.deviceName || '',
      pageSize: {
        width: printWidth,
        height: printHeight,
      },
      margins: {
        marginType: 'none',
      }
    }, (success, failureReason) => {
      resolve({ success, failureReason });
    });
  });
});

// 4. Window management
ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});

