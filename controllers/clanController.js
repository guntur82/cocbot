const Member = require('../models/Member');
const axios = require('axios');
// test
const updateClanMembers = async () => {
  try {
    const response = await axios.get(
      `https://api.clashofclans.com/v1/clans/${process.env.CLAN_TAG}/members`,
      {
        headers: {
          Authorization: `Bearer ${process.env.COC_API_TOKEN}`,
        },
      }
    );

    const newMembers = response.data.items;
    const oldMembers = await Member.find({});
    const oldMap = new Map(oldMembers.map((m) => [m.tag, m]));
    const oldTags = oldMembers.map((m) => m.tag);
    const newTags = newMembers.map((m) => m.tag);

    const leftMembers = oldMembers.filter((m) => !newTags.includes(m.tag));
    const joinedMembers = newMembers.filter((m) => !oldTags.includes(m.tag));

    // Tambahkan atau update data member
    for (const member of newMembers) {
      const old = oldMap.get(member.tag);

      if (!old) {
        // Member baru, insert
        await Member.create({
          tag: member.tag,
          name: member.name,
          role: member.role,
          expLevel: member.expLevel,
          trophies: member.trophies,
          donations: member.donations,
          donationsReceived: member.donationsReceived,
          pointMemberWars: 0, // Default point awal
        });
      } else {
        const roleDulu = old.role;
        const roleSekarang = member.role;

        const naikRole =
          roleDulu === 'member' &&
          ['admin', 'coLeader', 'leader'].includes(roleSekarang);

        await Member.updateOne(
          { tag: member.tag },
          {
            name: member.name,
            role: roleSekarang,
            expLevel: member.expLevel,
            trophies: member.trophies,
            donations: member.donations,
            donationsReceived: member.donationsReceived,
            ...(naikRole ? { pointMemberWars: 0 } : {}), // reset point jika naik role
          }
        );
      }
    }

    // Hapus member yang keluar
    for (const member of leftMembers) {
      await Member.deleteOne({ tag: member.tag });
    }

    return {
      joined: joinedMembers.map((m) => ({ name: m.name, tag: m.tag })),
      left: leftMembers.map((m) => ({ name: m.name, tag: m.tag })),
    };
  } catch (error) {
    console.error('❌ Error updating members:', error.message);
    throw error;
  }
};

const evaluateFinishedWar = async () => {
  try {
    const response = await axios.get(
      `https://api.clashofclans.com/v1/clans/${process.env.CLAN_TAG}/currentwar`,
      {
        headers: {
          Authorization: `Bearer ${process.env.COC_API_TOKEN}`,
        },
      }
    );

    const warData = response.data;

    if (warData.state !== 'warEnded') {
      console.log('⚠️ War belum selesai. Tidak ada evaluasi.');
      return {
        success: false,
        message: 'War belum selesai. Evaluasi dibatalkan.',
      };
    }

    const warEndTime = warData.endTime;
    if (!warEndTime) {
      console.log('❌ endTime tidak ditemukan dalam warData');
      return {
        success: false,
        message: 'endTime tidak tersedia. Tidak bisa evaluasi.',
      };
    }

    const formattedEndTime = warEndTime.replace(
      /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.000Z$/,
      '$1-$2-$3T$4:$5:$6.000Z'
    );

    const now = new Date();
    const todayDate = new Date(now.getTime() + 7 * 60 * 60 * 1000) // UTC+7
      .toISOString()
      .split('T')[0];
    const warEndDate = new Date(formattedEndTime).toISOString().split('T')[0];

    if (warEndDate !== todayDate) {
      console.log(`⚠️ War selesai bukan hari ini (${warEndDate})`);
      return {
        success: false,
        message: `Evaluasi hanya dilakukan untuk war yang selesai hari ini. (${warEndDate})`,
      };
    }

    const updatedMembers = [];
    for (const member of warData.clan.members) {
      const tag = member.tag;
      const attacks = member.attacks || [];
      const totalStars = attacks.reduce((sum, atk) => sum + atk.stars, 0);

      const dbMember = await Member.findOne({ tag });
      if (!dbMember) continue;

      const role = (dbMember.role || '').toLowerCase(); // ambil dari database
      let change = 0;

      if (attacks.length === 0) {
        change = -1; // semua role bisa dikurangi
      } else if (attacks.length === 2) {
        if (role === 'member') {
          if (dbMember.pointMemberWars < 0) {
            change = 1; // member bisa naik walau bukan 6 stars, jika point minus
          } else if (totalStars === 6) {
            change = 1; // member naik kalau 6 bintang
          }
        } else if (
          ['admin', 'coleader', 'leader'].includes(role) &&
          dbMember.pointMemberWars < 0
        ) {
          change = 1; // admin/coleader/leader bisa naik hanya untuk menutupi minus
        }
      }

      if (change !== 0) {
        const oldPoint = dbMember.pointMemberWars ?? 0;
        let newPoint = oldPoint + change;

        // Batasi max point = 0 untuk non-member
        if (
          ['admin', 'coleader', 'leader'].includes(role.toLowerCase()) &&
          newPoint > 0
        ) {
          newPoint = 0;
        }

        dbMember.pointMemberWars = newPoint;
        dbMember.totalStarsWar = (dbMember.totalStarsWar || 0) + totalStars;

        await dbMember.save();

        updatedMembers.push({
          name: dbMember.name,
          tag: dbMember.tag,
          role: dbMember.role,
          from: oldPoint,
          to: newPoint,
          starsGained: totalStars,
          reason:
            change === 1
              ? oldPoint < 0
                ? '2x attack (recover point)'
                : '2x attack & 6 stars'
              : 'no attack',
        });

        console.log(
          `🛠️ ${dbMember.name} (${tag}) pointMemberWars: ${oldPoint} → ${newPoint}`
        );
      }
    }

    console.log('✅ Evaluasi war selesai.');

    return {
      success: true,
      message: 'Evaluasi war selesai.',
      updated: updatedMembers,
    };
  } catch (err) {
    console.error('❌ Error saat evaluasi war:', err.message);
    return {
      success: false,
      message: 'Terjadi kesalahan saat evaluasi.',
      error: err.message,
    };
  }
};

const getMembersByPoints = async () => {
  try {
    const calonNaikJadiElder = await Member.find({
      role: 'member',
      pointMemberWars: { $gte: 3 },
    });

    const calonTurunJadiMember = await Member.find({
      role: 'elder',
      pointMemberWars: { $lte: -3 },
    });

    const calonDikick = await Member.find({
      role: 'member',
      pointMemberWars: { $lte: -3 },
    });

    return {
      success: true,
      calonNaikJadiElder: calonNaikJadiElder.map((m) => ({
        name: m.name,
        tag: m.tag,
        role: m.role,
        point: m.pointMemberWars,
      })),
      calonTurunJadiMember: calonTurunJadiMember.map((m) => ({
        name: m.name,
        tag: m.tag,
        role: m.role,
        point: m.pointMemberWars,
      })),
      calonDikick: calonDikick.map((m) => ({
        name: m.name,
        tag: m.tag,
        role: m.role,
        point: m.pointMemberWars,
      })),
    };
  } catch (err) {
    console.error('❌ Error getting member points:', err.message);
    return {
      success: false,
      message: 'Gagal mendapatkan data member.',
      error: err.message,
    };
  }
};

const deleteAllMembers = async () => {
  try {
    const result = await Member.deleteMany({});
    console.log(
      `🧹 Semua data member dihapus (${result.deletedCount} dokumen).`
    );
    return {
      success: true,
      deletedCount: result.deletedCount,
      message: 'Semua data member berhasil dihapus.',
    };
  } catch (err) {
    console.error('❌ Gagal menghapus data member:', err.message);
    return {
      success: false,
      message: 'Gagal menghapus data member.',
      error: err.message,
    };
  }
};

module.exports = {
  updateClanMembers,
  evaluateFinishedWar,
  getMembersByPoints,
  deleteAllMembers,
};
