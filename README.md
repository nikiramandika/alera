# Alera

## 1. Nama dan Deskripsi Singkat Aplikasi

**Alera** adalah aplikasi pengingat kesehatan terpadu berbasis **React Native** yang membantu pengguna menjaga rutinitas sehat dan kepatuhan minum obat melalui sistem notifikasi pintar.  
Nama **Alera** berasal dari kata Latin *“Alere”* yang berarti menyehatkan, memelihara, dan memberi kehidupan. Makna tersebut menggambarkan tujuan aplikasi ini sebagai asisten kesehatan digital yang membantu pengguna menjalani gaya hidup lebih sehat dan teratur.

---

## 2. Anggota Kelompok

| No | Nama Lengkap | NIM | Peran |
|----|---------------|-----|--------|
| 1 | **Muhammad Niki Ramandika** | 231402097 | Project Manager |
| 2 | **Sopi Aura Nisa** | 231402006 | Anggota |
| 3 | **Mhd. Ridwan Adly Nasution** | 231402021 | Anggota |
| 4 | **Finorosa Tabitha** | 231402033 | Anggota |
| 5 | **Nancy Nadine Natalioniva** | 231402048 | Anggota |
| 6 | **Diva Salsabila** | 231402069 | Anggota |

---

## 3. Rencana Fitur yang Akan Ada di Aplikasi

1. **Jadwal Minum Obat**  
   Pengguna dapat menambahkan nama obat, dosis, waktu minum, serta durasi konsumsi. Dilengkapi dengan notifikasi pengingat otomatis dan opsi penundaan (*snooze*).

2. **Healthy Habit Tracker**  
   Menyediakan daftar kebiasaan sehat seperti minum air, olahraga, tidur cukup, dan meditasi. Pengguna dapat mengatur pengingat masing-masing aktivitas.

3. **Progress & Statistik**  
   Menampilkan grafik perkembangan kepatuhan pengguna terhadap jadwal minum obat dan aktivitas sehat per minggu.

4. **Health Tips & Motivation**  
   Memberikan kutipan motivasi serta tips hidup sehat harian agar pengguna tetap semangat menjaga rutinitasnya.

5. **Cloud Sync (Firebase)**  
   Seluruh data tersimpan aman di cloud menggunakan Firebase dan dapat diakses lintas perangkat.

---

## 4. Deskripsi Project

**Jenis Aplikasi:** Cross-Platform  
**Framework:** [Expo (React Native)](https://expo.dev)  
**SDK Version:** Expo SDK 54  
**Bahasa Pemrograman:** JavaScript / TypeScript  

**Tools Pendukung:**  
- Node.js v18+  
- npm v9+  
- Visual Studio Code  
- Firebase (untuk autentikasi dan sinkronisasi data)

---

## 5. Cara Instalasi dan Menjalankan Project

### Persyaratan Awal
Pastikan Anda telah menginstal:
- Node.js versi 20 atau lebih baru  
- npm  
- Expo CLI  
- Android Studio (untuk emulator Android) atau Xcode (untuk simulator iOS)

### Langkah-langkah

1. **Clone repository**
   ```bash
   git clone https://github.com/nikiramandika/alera.git
2. **Masuk ke direktori project**
   ```bash
   cd alera
3. **Instal dependensi**
   ```bash
   npm install
4. **Jalankan aplikasi**
   ```bash
   npx expo start
5. **Pilih metode pengujian**
   - Tekan **a** untuk menjalankan di Android Emulator  
   - Tekan **i** untuk menjalankan di iOS Simulator (hanya macOS)  
   - Atau pindai **QR Code** di terminal menggunakan aplikasi **Expo Go**