// End-to-end: serves the production build (dist/) and drives the real app UI in headless Chromium.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const root = path.resolve(new URL('../../dist', import.meta.url).pathname);
const require = createRequire(process.env.SHOT_DIR + '/');
const chromium = (await import(require.resolve('@sparticuz/chromium'))).default; const puppeteer = (await import(require.resolve('puppeteer-core'))).default;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'index.html'); r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port; const out = process.env.OUT || '/home/claude/shot';
const b = await puppeteer.launch({ executablePath: await chromium.executablePath(), args: [...chromium.args, '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], headless: 'shell' });
const p = await b.newPage(); await p.setViewport({ width: 1500, height: 950 });
const errors = []; p.on('pageerror', (e) => errors.push('PAGEERROR ' + String(e).slice(0, 300))); p.on('console', (m) => { if (m.type() === 'error') errors.push('console.error ' + m.text().slice(0, 200)); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = async (text, scope = 'button') => p.evaluate((t, sc) => { const el = [...document.querySelectorAll(sc)].find((e) => (e.textContent || '').trim().toLowerCase().includes(t.toLowerCase())); if (el) { el.click(); return true; } return false; }, text, scope);
const text = async () => p.evaluate(() => document.body.innerText);
const shot = (n) => p.screenshot({ path: `${out}/app_${n}.png` });
if (process.env.PROBE) await p.evaluateOnNewDocument(() => { window.__arenaProbe = { rec: [], energy: [] }; });
const waitEnabled = async (text) => { for (let i = 0; i < 80; i++) { const ok = await p.evaluate((t) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim().toLowerCase() === t.toLowerCase()); return !!el && !el.disabled; }, text); if (ok) return true; await sleep(500); } return false; };
const steps = JSON.parse(process.env.STEPS || '[]'); const log = [];
await p.goto(`http://localhost:${port}/`); await sleep(2500);
for (const s of steps) {
  if (s.click) { const ok = await click(s.click); log.push(`click "${s.click}" -> ${ok}`); }
  if (s.wait) await sleep(s.wait);
  if (s.shot) await shot(s.shot);
  if (s.shots) { for (const lab of s.shots) { const ready = await waitEnabled(lab); const ok = ready && await click(lab); log.push(`shot "${lab}" -> ${ok}`); await sleep(400); } await waitEnabled(s.shots[s.shots.length - 1]); }
  if (s.ensureNet) { const t = await text(); const m = t.match(/(\d+)\s*Balls/i); log.push(`practice ball counter text -> ${m ? m[0] : 'n/a'}`); }
  if (s.count) { const n = await p.evaluate((t) => [...document.querySelectorAll('button')].filter((e) => (e.textContent || '').includes(t)).length, s.count); log.push(`count "${s.count}" -> ${n}`); }
  if (s.expect) { const t = await text(); log.push(`expect "${s.expect}" -> ${t.toLowerCase().includes(s.expect.toLowerCase())}`); }
}
let probe = null;
if (process.env.PROBE) probe = await p.evaluate(() => {
  const rec = window.__arenaProbe.rec, en = window.__arenaProbe.energy;
  const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const contact = rec.filter((r) => r.attract > 0.95 && r.bat);
  const corr = contact.map((r) => d3(r.raw, r.bat));
  let sd = 0, sr = 0;
  for (let i = 1; i < rec.length; i++) { if (rec[i].t - rec[i - 1].t > 200) continue; sd = Math.max(sd, d3(rec[i].drawn, rec[i - 1].drawn)); sr = Math.max(sr, d3(rec[i].raw, rec[i - 1].raw)); }
  const near = rec.filter((r) => r.bat).map((r) => d3(r.raw, r.bat));
  return { frames: rec.length, contactFrames: contact.length, correctionMax: Math.max(0, ...corr), correctionMean: corr.length ? corr.reduce((a, b) => a + b, 0) / corr.length : 0, closestRawApproach: near.length ? Math.min(...near) : null, maxStepDrawn: sd, maxStepRaw: sr, energyMax: en.length ? Math.max(...en) : null, energyMin: en.length ? Math.min(...en) : null, energyFrames: en.length };
});
console.log(JSON.stringify({ log, probe, errors: errors.filter((e) => !e.includes('ERR_NAME_NOT_RESOLVED')).slice(0, 8) }, null, 1));
await b.close(); srv.close();
