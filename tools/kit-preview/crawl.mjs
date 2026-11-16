// Crawl: visit every header page of the production build, click every (non-destructive) button once, report errors.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const root = path.resolve(new URL('../../dist', import.meta.url).pathname);
const require = createRequire(process.env.SHOT_DIR + '/');
const chromium = (await import(require.resolve('@sparticuz/chromium'))).default; const puppeteer = (await import(require.resolve('puppeteer-core'))).default;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'index.html'); r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port;
const b = await puppeteer.launch({ executablePath: await chromium.executablePath(), args: [...chromium.args, '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], headless: 'shell' });
const p = await b.newPage(); await p.setViewport({ width: 1500, height: 950 });
let errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SKIP = /reset|clear|delete|sign|log ?out|remove|new career|start new|wipe|quit|exit/i;
const pages = (process.env.PAGES || 'Home,Career,Play Now,Tournaments,Fixtures,World Cup,Practice,Kits,Live Matches,Teams,Players,Auction,Stats').split(',');
const report = [];
await p.goto(`http://localhost:${port}/`); await sleep(2500);
for (const name of pages) {
  const nav = () => p.evaluate((t) => { const el = [...document.querySelectorAll('nav button, header button, button')].find((e) => (e.textContent || '').trim().toLowerCase() === t.toLowerCase()); if (el) { el.click(); return true; } return false; }, name);
  const ok = await nav(); await sleep(1500);
  if (!ok) { report.push({ page: name, found: false }); continue; }
  errs = [];
  const labels = await p.evaluate(() => [...document.querySelectorAll('main button, #root button')].filter((e) => !e.closest('header') && !e.closest('nav') && !e.disabled && e.offsetParent).map((e) => (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 40)));
  let clicked = 0, crashed = 0;
  for (let i = 0; i < Math.min(labels.length, 30); i++) {
    const lab = labels[i]; if (SKIP.test(lab)) continue;
    const before = errs.length;
    await p.evaluate((idx) => { const els = [...document.querySelectorAll('main button, #root button')].filter((e) => !e.closest('header') && !e.closest('nav') && !e.disabled && e.offsetParent); const el = els[idx]; if (el) el.click(); }, i);
    await sleep(350); clicked++;
    if (errs.length > before) { crashed++; await nav(); await sleep(1000); }
  }
  report.push({ page: name, found: true, buttons: labels.length, clicked, crashes: crashed, errors: errs.slice(0, 2) });
}
console.log(JSON.stringify(report, null, 1)); await b.close(); srv.close();
