const Member = require('../models/Member');

const getPromotionDemotionCandidates = async () => {
  try {
    const allMembers = await Member.find({});

    const calonNaikElder = [];
    const wajibNaikElder = [];

    const calonTurun = [];
    const wajibTurun = [];

    const calonKick = [];
    const wajibKick = [];

    for (const m of allMembers) {
      const role = (m.role || '').toLowerCase();
      const point = m.pointMemberWars ?? 0;

      if (role === 'member') {
        if (point === 2) calonNaikElder.push(`${m.name} (${m.tag})`);
        else if (point >= 3) wajibNaikElder.push(`${m.name} (${m.tag})`);

        if (point === -2) calonKick.push(`${m.name} (${m.tag})`);
        else if (point <= -3) wajibKick.push(`${m.name} (${m.tag})`);
      }

      if (role === 'elder') {
        if (point === -2) calonTurun.push(`${m.name} (${m.tag})`);
        else if (point <= -3) wajibTurun.push(`${m.name} (${m.tag})`);
      }
    }

    return {
      calonNaikElder,
      wajibNaikElder,
      calonTurun,
      wajibTurun,
      calonKick,
      wajibKick,
    };
  } catch (err) {
    console.error('❌ Gagal ambil data kandidat promosi/demote:', err.message);
    return {
      calonNaikElder: [],
      wajibNaikElder: [],
      calonTurun: [],
      wajibTurun: [],
      calonKick: [],
      wajibKick: [],
    };
  }
};

module.exports = { getPromotionDemotionCandidates };
