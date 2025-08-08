import http from 'http';
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, ts: Date.now() }));
  }
  if (req.url === '/boom') {
    console.error('Test error for Sentry');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: false }));
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('AuraNovaDigital app skeleton');
});
server.listen(PORT, () => console.log('App listening on', PORT));
