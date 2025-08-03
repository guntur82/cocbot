require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const {
  updateClanMembers,
  evaluateFinishedWar,
  getMembersByPoints,
  deleteAllMembers,
} = require('./controllers/clanController');
const {
  getPromotionDemotionCandidates,
} = require('./controllers/promotionController');
const { sendMessage } = require('./controllers/telegramController');
const Member = require('./models/Member');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Routes
app.get('/update-member', async (req, res) => {
  try {
    const { joined, left } = await updateClanMembers();

    res.json({
      message: '✅ Clan member data diproses!',
      joined,
      left,
    });
  } catch (error) {
    console.error('❌ Gagal update member:', error.message);
    res.status(500).json({ message: '❌ Gagal update member' });
  }
});

app.get('/evaluate-war', async (req, res) => {
  try {
    const result = await evaluateFinishedWar();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/members/point-check', async (req, res) => {
  const result = await getMembersByPoints();
  res.json(result);
});

app.get('/members/delete-all', async (req, res) => {
  const result = await deleteAllMembers();
  res.json(result);
});

app.get('/', async (req, res) => {
  try {
    // exportData(); //buat backup testing
    const data = await Member.find({});
    res.json(data);
  } catch (error) {
    console.error('❌ Error saat ambil data:', error.message);
    res.status(500).json({ message: 'Gagal mengambil data member' });
  }
});

const exportData = async () => {
  try {
    const members = await Member.find({}).lean(); // lean untuk plain JS object
    const filePath = path.join(__dirname, 'members_export.json');

    fs.writeFileSync(filePath, JSON.stringify(members, null, 2));
    console.log(`✅ Data berhasil diexport ke ${filePath}`);
  } catch (error) {
    console.error('❌ Gagal export data:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

// Start server
app.listen(port, () => {
  console.log(`🚀 Server jalan di http://localhost:${port}`);
});

// =============================================================== SEND TELEGRAM

app.get('/send-report', async (req, res) => {
  try {
    const { joined, left } = await updateClanMembers();
    const warResult = await evaluateFinishedWar();
    const candidates = await getPromotionDemotionCandidates();

    let report = '📢 *Laporan Harian Clan*\n\n';

    if (joined.length > 0) {
      report += `👋 Member Masuk:\n${joined
        .map((m) => `- ${m.name}`)
        .join('\n')}\n\n`;
    }

    if (left.length > 0) {
      report += `🚪 Member Keluar:\n${left
        .map((m) => `- ${m.name}`)
        .join('\n')}\n\n`;
    }

    if (warResult.success && warResult.updated.length > 0) {
      const noAttack = warResult.updated.filter(
        (u) => u.reason === 'no attack'
      );
      if (noAttack.length > 0) {
        report += `😴 Tidak Menyerang:\n${noAttack
          .map((u) => `- ${u.name}`)
          .join('\n')}\n\n`;
      }
    }

    if (candidates.wajibNaikElder.length > 0) {
      report += `⬆️ Naik Elder :\n${candidates.wajibNaikElder
        .map((n) => `- ${n}`)
        .join('\n')}\n\n`;
    }

    if (candidates.calonNaikElder.length > 0) {
      report += `📈 Calon Naik Elder :\n${candidates.calonNaikElder
        .map((n) => `- ${n}`)
        .join('\n')}\n\n`;
    }

    if (candidates.wajibTurun.length > 0) {
      report += `⬇️ Turun ke Member :\n${candidates.wajibTurun
        .map((n) => `- ${n}`)
        .join('\n')}\n\n`;
    }

    if (candidates.calonTurun.length > 0) {
      report += `📉 Calon Turun ke Member :\n${candidates.calonTurun
        .map((n) => `- ${n}`)
        .join('\n')}\n\n`;
    }

    if (candidates.wajibKick.length > 0) {
      report += `❌ Dikick :\n${candidates.wajibKick
        .map((n) => `- ${n}`)
        .join('\n')}\n\n`;
    }

    if (candidates.calonKick.length > 0) {
      report += `🛑 Calon Kick :\n${candidates.calonKick
        .map((n) => `- ${n}`)
        .join('\n')}\n\n`;
    }

    if (report === '📢 *Laporan Harian Clan*\n\n') {
      report += 'Tidak ada perubahan hari ini.';
    }

    await sendMessage(report);

    res.json({ success: true, message: 'Laporan dikirim ke Telegram!' });
  } catch (err) {
    console.error('❌ Gagal kirim laporan:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});
