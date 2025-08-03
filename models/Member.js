const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    tag: String,
    name: String,
    role: String,
    expLevel: Number,
    trophies: Number,
    donations: Number,
    donationsReceived: Number,
    totalStarsWar: {
      type: Number,
      default: 0,
      description:
        'Total stars the member has earned since joining the clan tracker',
    },
    warLeaguesJoin: {
      type: Number,
      default: 0,
      description: 'Total ikut Warleagues',
    },
    totalStarsWarLeagues: {
      type: Number,
      default: 0,
      description: 'Total stars the member has earned in Clan War League',
    },
    pointMemberWars: {
      type: Number,
      default: 0,
      description:
        'Kalo pinalti seperti ga nyerang,ga sesuai no urut,throwing(ini harus dicek diingame sih) itu -1. Tapi kalo nyerang B6,clan game ikutan,event clan ikutan +1',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Member', memberSchema);
