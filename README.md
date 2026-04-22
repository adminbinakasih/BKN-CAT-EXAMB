# BKN CAT - Secure Browser

Browser khusus ujian untuk CAT Enterprise — SMA Unggul Binakasih Nusantara.

## Fitur Keamanan
- ✅ Kiosk mode fullscreen (tidak bisa di-minimize)
- ✅ Blok Alt+Tab, Win key, Alt+F4
- ✅ Blok F12 / DevTools
- ✅ Blok Ctrl+C, Ctrl+U, Ctrl+Shift+I
- ✅ Blok klik kanan
- ✅ Hanya bisa akses domain CAT Enterprise
- ✅ Blok semua popup / tab baru
- ✅ Tidak bisa close saat ujian berlangsung

## Cara Build

### Prasyarat
- Node.js v18+ (sudah terinstall)
- npm

### Langkah

```bash
cd bkn-cat-browser

# Install dependencies
npm install

# Test jalankan (tanpa build)
npm start

# Build installer .exe
npm run build
```

File installer akan ada di: `bkn-cat-browser/dist/BKN CAT Setup 1.0.0.exe`

## Distribusi ke Siswa

1. Copy file `BKN CAT Setup 1.0.0.exe` ke flashdisk / share via jaringan
2. Siswa install sekali (tidak perlu admin)
3. Buka "BKN CAT" dari desktop shortcut
4. Aplikasi otomatis buka halaman ujian dalam mode terkunci

## Catatan

- Untuk update URL server, edit `TARGET_URL` di `main.js`
- Untuk tambah domain CDN baru, tambahkan ke array `ALLOWED_DOMAINS` di `main.js`
