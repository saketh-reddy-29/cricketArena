// usage: node tools/kit-preview/run.mjs <out.png> [query]   (needs puppeteer-core + @sparticuz/chromium installed in $SHOT_DIR)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const root = path.resolve(new URL('../..', import.meta.url).pathname);
const require = createRequire(process.env.SHOT_DIR + '/');
const chromium = (await import(require.resolve('@sparticuz/chromium'))).default; const puppeteer = (await import(require.resolve('puppeteer-core'))).default;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) f = path.join(root, 'public', decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); }).listen(0);
const port = srv.address().port;
const b = await puppeteer.launch({ executablePath: await chromium.executablePath(), args: [...chromium.args, '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], headless: 'shell' });
const p = await b.newPage(); await p.setViewport({ width: parseInt(process.env.VW || '2000'), height: parseInt(process.env.VH || '1100') });
p.on('console', (m) => { const t = m.text(); if (/error|warn/i.test(m.type()) ) console.log('[page]', t.slice(0, 300)); });
await p.goto(`http://localhost:${port}/tools/kit-preview/${process.env.PAGE || 'index'}.html${process.argv[3] || ''}`);
await p.waitForFunction('window.__done === true', { timeout: parseInt(process.env.WAITMS || '120000') });
const err = await p.evaluate('window.__err'); if (err) console.log('ERR', err);
console.log(String(await p.evaluate('window.__log')).slice(0, 400000));
if (process.env.DUMP) console.log('DUMP ' + JSON.stringify(await p.evaluate('({results: window.__results, gate: window.__arenaGateLog, timeout: window.__timeout, probe: window.__probe, rec: window.__arenaProbe ? window.__arenaProbe.rec.slice(-120) : null})')));
if (process.env.PAGE) await p.screenshot({ path: process.argv[2] }); else { const c = await p.$('canvas'); if (c) await c.screenshot({ path: process.argv[2] }); }
await b.close(); srv.close();
