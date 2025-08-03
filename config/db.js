const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB terhubung');
  } catch (err) {
    console.error('❌ Gagal konek MongoDB:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
