/**
 * BKN CAT - Secure Browser
 * Electron main process
 * SMA Unggul Binakasih Nusantara
 */

const { app, BrowserWindow, globalShortcut, session, dialog, shell } = require('electron');
const path = require('path');

// ── Konfigurasi ────────────────────────────────────────────────────────────────
const TARGET_URL  = 'https://cat-enterprise.binakasihnusantara.sch.id';
const APP_NAME    = 'BKN CAT';
const APP_VERSION = '1.0.0';

// Daftar domain yang diizinkan (whitelist)
const ALLOWED_DOMAINS = [
  'cat-enterprise.binakasihnusantara.sch.id',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

let mainWindow = null;
let isExamMode = false; // true saat siswa sedang mengerjakan ujian

// ── Single instance lock ───────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ── App ready ─────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  registerShortcuts();
  setupSessionFilter();
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// ── Buat window utama ─────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          800,
    fullscreen:      true,
    kiosk:           true,          // Kiosk mode — tidak bisa di-minimize/close via OS
    frame:           false,         // Tidak ada title bar
    alwaysOnTop:     true,
    resizable:       false,
    movable:         false,
    minimizable:     false,
    maximizable:     false,
    closable:        false,         // Tombol X dinonaktifkan
    skipTaskbar:     true,          // Tidak muncul di taskbar
    autoHideMenuBar: true,
    title:           APP_NAME,
    icon:            path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload:              path.join(__dirname, 'preload.js'),
      nodeIntegration:      false,
      contextIsolation:     true,
      webSecurity:          true,
      allowRunningInsecureContent: false,
      devTools:             false,   // DevTools dinonaktifkan
    },
  });

  // Muat halaman loading dulu, lalu redirect ke target
  mainWindow.loadFile(path.join(__dirname, 'assets', 'loading.html'));

  mainWindow.webContents.once('did-finish-load', () => {
    // Delay sedikit agar loading screen terlihat
    setTimeout(() => {
      mainWindow.loadURL(TARGET_URL);
    }, 1500);
  });

  // Blok navigasi ke domain lain
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedUrl(url)) {
      event.preventDefault();
      console.log('Blocked navigation to:', url);
    }
  });

  // Blok popup / window baru
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedUrl(url)) {
      mainWindow.loadURL(url);
    }
    return { action: 'deny' };
  });

  // Deteksi halaman ujian (take) — aktifkan exam mode
  mainWindow.webContents.on('did-navigate', (event, url) => {
    isExamMode = url.includes('/exam/take/') || url.includes('/exam/start/');
    console.log('Navigated to:', url, '| Exam mode:', isExamMode);
  });

  // Cegah close via keyboard saat ujian
  mainWindow.on('close', (event) => {
    if (isExamMode) {
      event.preventDefault();
      showExitBlockedDialog();
    }
  });

  // Pastikan selalu fullscreen
  mainWindow.on('leave-full-screen', () => {
    mainWindow.setFullScreen(true);
    mainWindow.setKiosk(true);
  });

  mainWindow.on('minimize', () => {
    mainWindow.restore();
    mainWindow.setFullScreen(true);
  });

  mainWindow.on('blur', () => {
    // Paksa fokus kembali saat window kehilangan fokus
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.focus();
        mainWindow.setAlwaysOnTop(true);
      }
    }, 100);
  });
}

// ── Blok semua shortcut OS ────────────────────────────────────────────────────
function registerShortcuts() {
  const blockedShortcuts = [
    // Windows system shortcuts
    'Alt+F4',
    'Alt+Tab',
    'Alt+Shift+Tab',
    'Super+D',          // Win+D (show desktop)
    'Super+E',          // Win+E (explorer)
    'Super+L',          // Win+L (lock screen)
    'Super+R',          // Win+R (run)
    'Super+Tab',        // Win+Tab (task view)
    'Super+M',          // Win+M (minimize all)
    'Super',            // Win key
    'Ctrl+Escape',      // Start menu
    'Ctrl+Alt+Delete',  // Task manager (sebagian)
    'Ctrl+Shift+Escape',// Task manager langsung
    'Ctrl+Alt+Tab',
    // Browser shortcuts
    'F11',
    'F12',
    'Ctrl+W',
    'Ctrl+T',
    'Ctrl+N',
    'Ctrl+Shift+N',
    'Ctrl+Tab',
    'Ctrl+Shift+Tab',
    'Ctrl+R',
    'Ctrl+Shift+R',
    'Ctrl+F5',
    'Ctrl+L',
    'Ctrl+D',
    'Ctrl+H',
    'Ctrl+J',
    'Ctrl+K',
    'Ctrl+Shift+I',
    'Ctrl+Shift+J',
    'Ctrl+Shift+C',
    'Ctrl+U',
    // Screenshot
    'PrintScreen',
    'Alt+PrintScreen',
    'Super+Shift+S',    // Snipping tool
    'Super+PrintScreen',
  ];

  blockedShortcuts.forEach(shortcut => {
    try {
      globalShortcut.register(shortcut, () => {
        // Shortcut dicegat — tidak melakukan apa-apa
        console.log('Blocked shortcut:', shortcut);
      });
    } catch (e) {
      // Beberapa shortcut mungkin tidak bisa diregister di semua OS
    }
  });
}

// ── Filter request — blok domain tidak diizinkan ──────────────────────────────
function setupSessionFilter() {
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url;

    // Izinkan semua resource dari domain yang diizinkan
    if (isAllowedUrl(url)) {
      callback({ cancel: false });
      return;
    }

    // Izinkan file lokal (loading screen)
    if (url.startsWith('file://')) {
      callback({ cancel: false });
      return;
    }

    // Blok yang lain
    console.log('Blocked request:', url);
    callback({ cancel: true });
  });
}

// ── Cek apakah URL diizinkan ──────────────────────────────────────────────────
function isAllowedUrl(url) {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

// ── Dialog blok keluar saat ujian ─────────────────────────────────────────────
function showExitBlockedDialog() {
  dialog.showMessageBox(mainWindow, {
    type:    'warning',
    title:   'Tidak Bisa Keluar',
    message: 'Anda sedang mengerjakan ujian.',
    detail:  'Tidak bisa menutup aplikasi saat ujian berlangsung.\nSelesaikan atau kumpulkan ujian terlebih dahulu.',
    buttons: ['OK'],
    defaultId: 0,
  });
}
