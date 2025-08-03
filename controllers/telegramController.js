const axios = require('axios');

const sendMessage = async (message) => {
  try {
    await axios.post(
      `https://api.telegram.org/bot${process.env.TOKEN_TELEGRAM}/sendMessage`,
      {
        chat_id: process.env.GROUP_ID,
        text: message,
        parse_mode: 'HTML',
      }
    );
    console.log('✅ Pesan terkirim ke Telegram!');
  } catch (error) {
    if (error.response) {
      console.error('❌ Gagal kirim pesan:', error.response.data);
    } else {
      console.error('❌ Error tanpa response:', error.message);
    }
  }
};

module.exports = { sendMessage };
