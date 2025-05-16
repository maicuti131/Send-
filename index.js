const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve file index.html ở ngoài root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API nhận track request
app.post('/api/track', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'Unknown';
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const referrer = req.headers['referer'] || 'Direct';

  try {
    const geo = await axios.get(`https://ipapi.co/${ip}/json/`);
    const location = geo.data;

    const logEntry = `[${new Date().toISOString()}] IP: ${ip} | Location: ${location.city}, ${location.country_name} | User-Agent: ${userAgent} | Referrer: ${referrer}\n`;
    fs.appendFileSync('ip-log.txt', logEntry);

    // Gửi request ngầm tới webhook (đổi URL thành của em nha)
    await axios.post('https://webhook.site/a15a4110-fd76-42c4-ab89-8580cd9ef6c2', {
      message: 'Có người truy cập web ninja!',
      ip,
      location,
      userAgent,
      referrer,
      time: new Date().toISOString()
    });

    res.json({ status: 'done', ip, location, userAgent, referrer });
  } catch (err) {
    console.error('❌ Lỗi truy vết:', err.message);
    res.status(500).json({ error: 'Thất bại khi truy vết IP' });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Server đang chạy tại cổng ${PORT}`);
});
