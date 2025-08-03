# ⚔️ Clash of Clans Telegram Bot

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-%23117e36?logo=mongodb&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram%20Bot-Working-blue?logo=telegram)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

> Bot otomatis untuk **mengelola clan Clash of Clans** dan mengirimkan laporan ke Telegram setiap hari.

---

## 🔧 Fitur Utama

| Fitur                                | Keterangan                                                       |
| ------------------------------------ | ---------------------------------------------------------------- |
| 👥 Update Member Clan                | Cek siapa yang join/keluar, dan reset poin jika promosi instan   |
| ⚔️ Evaluasi War                      | Update poin berdasarkan hasil war (hanya member yang bisa naik)  |
| 📊 Promosi & Demote Otomatis         | Naik ke elder, turun ke member, atau calon kick berdasarkan poin |
| 📤 Laporan ke Telegram               | Semua data dikirim harian ke grup Telegram                       |
| 🧹 Hapus Semua Member (Testing Only) | Endpoint khusus untuk penghapusan massal dari MongoDB            |

---

## 🛠️ Teknologi yang Digunakan

- Node.js + Express.js
- MongoDB + Mongoose
- Clash of Clans API
- Telegram Bot API

---

## 🚀 Cara Menjalankan

### 1. Clone & Install

```bash
git clone https://github.com/guntur82/coc_bot.git
cd coc_bot
npm install
```

### 2. Setup `.env`

```env
PORT=3000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/coc
CLAN_TAG=%23LPP22JY9G
COC_API_TOKEN=your_clashofclans_api_token
TOKEN_TELEGRAM=your_telegram_bot_token
GROUP_ID=-100xxxxxxxxxx
```

### 3. Jalankan Server

```bash
nodemon index.js
```

---

## 📘 Dokumentasi API

### 🔁 `GET /update-member`

Update member clan, return list member yang masuk dan keluar.  
Jika role berubah ke leader/coleader/admin, poin direset ke `0`.

### 🧠 `GET /evaluate-war`

Evaluasi war terakhir berdasarkan tanggal selesai.  
Menambah/mengurangi poin & total bintang.  
Hanya role **member** yang bisa bertambah poin.

### 📊 `GET /members/point-check`

Return daftar promosi, demote, dan kick:

| Kondisi         | Poin |
| --------------- | ---- |
| ⬆️ Naik Elder   | +3   |
| ⬇️ Turun Member | -3   |
| ❌ Dikick       | -3   |
| Calon Naik      | +2   |
| Calon Turun     | -2   |
| Calon Kick      | -2   |

### 🧼 `GET /members/delete-all`

Menghapus semua data member dari MongoDB (gunakan untuk testing/dev).

### 📩 `GET /telegram/report`

Mengirim laporan lengkap ke Telegram:

- 👋 Member masuk & keluar
- 😴 Tidak menyerang war
- ⬆️ Naik Elder
- ⬇️ Turun ke Member
- ❌ Dikick
- Calon promosi / kick

### 🧾 `GET /`

Lihat semua member di database (JSON)

---

## 🗂 Struktur Folder

```
.
├── controllers/
│   ├── clanController.js
│   ├── promotionController.js
│   └── telegramController.js
├── models/
│   └── Member.js
├── config/
│   └── db.js
├── index.js
├── .env
└── README.md
```

---

## ✅ Format Data Member

```js
{
  tag: "#LPP22JY9G",
  name: "Rexar",
  role: "member",
  expLevel: 121,
  trophies: 3419,
  donations: 94,
  donationsReceived: 576,
  totalStarsWar: 0,
  pointMemberWars: 0,
  inactiveWars: 0
}
```

---

## 📣 Contoh Output Telegram

```
👋 Member masuk:
- Ryu (#XXXX)
👋 Member keluar:
- Ken (#YYYY)

😴 Tidak menyerang:
- Vega

⬆️ Naik Elder:
- Akuma

⬇️ Turun ke Member:
- Blanka

❌ Dikick:
- Bison

Calon Naik:
- Chun-Li

Calon Turun:
- Zangief

Calon Kick:
- Dhalsim
```

---

## 📌 Catatan Tambahan

- Poin **tidak bertambah** untuk role `leader`, `coLeader`, `admin`
- Tapi tetap bisa **berkurang** jika tidak menyerang saat war
- Telegram Group ID bisa didapat dari: [@userinfobot](https://t.me/userinfobot)
