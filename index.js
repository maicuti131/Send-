const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Log lưu trong RAM
let localLogs = [];

// Middleware basic auth cho /admin-ninja
function basicAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Ninja"');
    return res.status(401).send('Authentication required 🥷');
  }
  const b64auth = auth.split(' ')[1];
  const [user, pass] = Buffer.from(b64auth, 'base64').toString().split(':');

  const USERNAME = 'admin';
  const PASSWORD = 'cuti123';

  if (user === USERNAME && pass === PASSWORD) {
    return next();
  } else {
    res.set('WWW-Authenticate', 'Basic realm="Admin Ninja"');
    return res.status(401).send('Authentication failed 🥲');
  }
}

// Giao diện trang admin đơn giản
const adminHTML = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Admin Ninja Logs</title></head>
<body>
<h1>📜 Log truy cập web ninja</h1>
<button onclick="deleteLogs()">🧹 Xoá tất cả log</button>
<pre id="logArea" style="white-space: pre-wrap; max-height: 600px; overflow-y: scroll; background:#eee; padding:10px;"></pre>

<script>
  async function fetchLogs() {
    const res = await fetch('/admin-ninja/logs');
    const data = await res.json();
    document.getElementById('logArea').textContent = JSON.stringify(data, null, 2);
  }
  async function deleteLogs() {
    if (!confirm('Bạn có chắc muốn xoá tất cả log không?')) return;
    const res = await fetch('/admin-ninja/delete', { method: 'POST' });
    if(res.ok){
      alert('Đã xoá log!');
      fetchLogs();
    } else {
      alert('Xoá thất bại :(');
    }
  }
  fetchLogs();
</script>
</body>
</html>
`;

app.use(express.json());

// Trang admin chính (xác thực)
app.get('/admin-ninja', basicAuth, (req, res) => {
  res.send(adminHTML);
});

// API trả log (xác thực)
app.get('/admin-ninja/logs', basicAuth, (req, res) => {
  res.json(localLogs);
});

// API xoá log (xác thực)
app.post('/admin-ninja/delete', basicAuth, (req, res) => {
  localLogs = [];
  res.sendStatus(200);
});

// Route chính ghi log và gửi webhook
app.get('*', async (req, res) => {
  const rawIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ip = rawIP.split(',')[0].trim();

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

  localLogs.push(logData);

  try {
    await axios.post('https://webhook.site/abcdef12-3456-7890-abcd-ef1234567890', logData);
  } catch (err) {
    console.error('Gửi webhook lỗi:', err.message);
  }

  res.status(403).sendFile(path.join(__dirname, '403.html'));
});

app.listen(PORT, () => {
  console.log(`🟢 Web ninja đang chạy ở cổng ${PORT}`);
});
