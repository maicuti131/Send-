const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
let localLogs = [];

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

  if (user === USERNAME && pass === PASSWORD) return next();
  res.set('WWW-Authenticate', 'Basic realm="Admin Ninja"');
  return res.status(401).send('Authentication failed 🥲');
}

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

app.get('/admin-ninja', basicAuth, (req, res) => res.send(adminHTML));
app.get('/admin-ninja/logs', basicAuth, (req, res) => res.json(localLogs));
app.post('/admin-ninja/delete', basicAuth, (req, res) => {
  localLogs = [];
  res.sendStatus(200);
});

// 🪤 Trap bot nếu nó tò mò vô mấy đường cấm
app.get('/trap.gif', (req, res) => {
  const ua = req.headers['user-agent'] || '';
  console.log('[BOT IMG TRAP]', ua);
  res.status(204).end(); // Không trả gì, chỉ log
});

app.get('/secret-ninja', (req, res) => {
  const ua = req.headers['user-agent'] || '';
  console.log('[BOT ROBOT TRAP]', ua);
  res.send('Nice try, bot 🤖');
});

// 🧠 Smart trap + log thật
app.get('*', async (req, res) => {
  const rawIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ip = rawIP.split(',')[0].trim();
  const userAgent = req.headers['user-agent'] || '';
  const referrer = req.headers['referer'] || 'Direct';

  const isBot = /bot|crawl|spider|slurp|wget|curl|axios|Go-http-client/i.test(userAgent);
  if (isBot) {
    console.log('❌ Bot truy cập, bỏ qua log:', userAgent);
    return res.status(204).end(); // Không log bot
  }

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
  } catch {
    logData.location = { ip, error: true, reason: 'Không xác định được vị trí từ IP' };
  }

  localLogs.push(logData);

  try {
    await axios.post('https://webhook.site/a15a4110-fd76-42c4-ab89-8580cd9ef6c2', logData);
  } catch (err) {
    console.error('Gửi webhook lỗi:', err.message);
  }

  const html403Path = path.join(__dirname, '403.html');
  res.status(403);
  try {
    res.sendFile(html403Path);
  } catch {
    res.send('<h1>403 Forbidden</h1><p>Bạn không có quyền truy cập 🥷</p>');
  }
});

app.listen(PORT, () => {
  console.log(`🟢 Web ninja đang chạy ở cổng ${PORT}`);
});
