import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const dataFile = resolve(root, 'data/projects.json');
const assets = { '/': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'], '/style.css': ['style.css', 'text/css; charset=utf-8'] };
export function validProjects(value) {
  return Array.isArray(value) && value.every(p => typeof p.id === 'string' && typeof p.title === 'string' && typeof p.why === 'string' && Array.isArray(p.steps) && p.steps.every(s => typeof s.id === 'string' && typeof s.text === 'string' && typeof s.done === 'boolean'));
}
export const server = http.createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path === '/api/projects' && req.method === 'GET') {
      let data; try { data = await readFile(dataFile, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; data = '[]'; }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(data); return;
    }
    if (path === '/api/projects' && req.method === 'PUT') {
      let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 1_000_000) { res.writeHead(413).end(); return; } }
      let data; try { data = JSON.parse(body); } catch { res.writeHead(400).end(); return; }
      if (!validProjects(data)) { res.writeHead(400).end(); return; }
      await mkdir(resolve(root, 'data'), { recursive: true }); await writeFile(dataFile, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 });
      res.writeHead(204).end(); return;
    }
    const asset = assets[path]; if (req.method === 'GET' && asset) { const content = await readFile(resolve(root, 'public', asset[0])); res.writeHead(200, { 'Content-Type': asset[1] }); res.end(content); return; }
    res.writeHead(404).end();
  } catch (error) { console.error(error); res.writeHead(500).end('Server error'); }
});
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) server.listen(4178, '127.0.0.1', () => console.log('知行 · http://localhost:4178'));
