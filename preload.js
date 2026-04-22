/**
 * BKN CAT - Preload script
 * Berjalan di context halaman web, tapi punya akses Node terbatas
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose API minimal ke halaman web
contextBridge.exposeInMainWorld('bknCAT', {
  version: '1.0.0',
  isSecureBrowser: true,
});

// Blok DevTools via keyboard di level halaman
window.addEventListener('keydown', (e) => {
  // Blok F12
  if (e.key === 'F12') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  // Blok Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+U
  if (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  if (e.ctrlKey && e.key.toLowerCase() === 'u') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}, true);

// Blok klik kanan
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  return false;
}, true);

// Blok drag & drop file
window.addEventListener('dragover', (e) => e.preventDefault(), true);
window.addEventListener('drop', (e) => e.preventDefault(), true);
