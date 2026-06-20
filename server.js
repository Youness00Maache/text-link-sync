const express = require('express');
const path = require('path');

const app = express();
const publicDir = path.join(__dirname, 'public');

function securityHeaders(req, res, next) {
  const supabaseApi = 'https://pfqzsabuvnyqbbcyqkdq.supabase.co';
  const supabaseStorage = 'https://pfqzsabuvnyqbbcyqkdq.storage.supabase.co';
  const supabaseRealtime = 'wss://pfqzsabuvnyqbbcyqkdq.supabase.co';
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
    "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com data:",
    `connect-src 'self' ${supabaseApi} ${supabaseStorage} ${supabaseRealtime}`,
    `img-src 'self' data: blob: ${supabaseApi} ${supabaseStorage}`,
    `media-src 'self' blob: ${supabaseApi} ${supabaseStorage}`,
    `frame-src 'self' blob: ${supabaseApi} ${supabaseStorage}`,
    "worker-src 'self' blob:",
    "upgrade-insecure-requests"
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
}

app.disable('x-powered-by');
app.use(securityHeaders);

app.all(['/generate-token', '/text/:token', '/upload', '/send-to-phone'], (req, res) => {
  res.status(410).json({ error: 'Legacy local transfer endpoints are disabled. Use Supabase QR sessions.' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/receive', (req, res) => {
  res.sendFile(path.join(publicDir, 'receive.html'));
});

app.get('/how-it-works', (req, res) => {
  res.sendFile(path.join(publicDir, 'how-it-works.html'));
});

app.get('/features', (req, res) => {
  res.sendFile(path.join(publicDir, 'features.html'));
});

app.get(['/privacy', '/privacy.html'], (req, res) => {
  res.sendFile(path.join(publicDir, 'privacy.html'));
});

app.use(express.static(publicDir, {
  fallthrough: false,
  index: 'index.html',
  setHeaders(res) {
    res.setHeader('Cache-Control', 'no-store');
  }
}));

const PORT = 3002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`TextLinker site is running at http://0.0.0.0:${PORT}`);
});
