// 無頭驗證(彈珠配對版):載入 → 三檔各開一次+真發射一發(snap 落格)→ 勝利路徑(逐格歸網)→ 再玩一次。
// 用法:node scripts/verify.mjs <baseURL>(預設 http://localhost:8321)
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import os from 'os';
const CANDIDATES = [
  path.join(os.homedir(), 'Downloads', 'hfpc-git', 'hfpc-paul-game', 'node_modules'),
  path.join(os.homedir(), 'Desktop', 'horsearchery3d', 'node_modules'),
  path.join(os.homedir(), 'Desktop', 'redsea3d', 'node_modules'),
];
const root = CANDIDATES.find((p) => fs.existsSync(path.join(p, 'playwright')));
if (!root) { console.error('找不到 playwright'); process.exit(1); }
const { chromium } = createRequire(root + path.sep)('playwright');

const BASE = process.argv[2] || 'http://localhost:8321';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(BASE, { waitUntil: 'load' });
await page.waitForFunction(() => window.__bb && window.__game, { timeout: 8000 });
console.log('✓ 頁面載入,掛勾就緒');

for (const age of ['young', 'kid', 'teen']) {
  await page.evaluate((a) => window.__bb.start(a), age)
  await page.waitForTimeout(400)
  const st0 = await page.evaluate(() => window.__bb.state())
  if (st0.state !== 'play' || st0.remain === 0) throw new Error(age + ' 未進 play:' + JSON.stringify(st0))
  // 真發射一發(垂直向上),等它 snap 落格
  const before = st0.remain
  await page.evaluate(() => { const g = window.__game; g.aim = -Math.PI / 2; g._shoot() })
  await page.waitForFunction((b) => {
    const s = window.__bb.state()
    return !window.__game.flying && (s.remain !== b || s.net > 0)
  }, before, { timeout: 6000 })
  const st1 = await page.evaluate(() => window.__bb.state())
  console.log(`✓ ${age}:發射落格 OK(場上 ${before}→${st1.remain},網裡 ${st1.net})`)
}

// 勝利路徑:把場上全部歸網 → close → win
await page.evaluate(() => window.__bb.start('young'))
await page.waitForTimeout(300)
await page.evaluate(() => {
  const g = window.__game
  // 只留頂排三格,設成同款 → _settle 自然歸網(group≥3)→ 盤空 → close
  for (const key of [...g.grid.keys()]) {
    if (key !== '0,0' && key !== '0,1' && key !== '0,2') { const [r, c] = key.split(',').map(Number); g._toNet(r, c) }
  }
  g.grid.set('0,0', 'bluefish'); g.grid.set('0,1', 'bluefish'); g.grid.set('0,2', 'bluefish')
  g._settle(0, 1)
})
await page.waitForFunction(() => window.__bb.state().state === 'win', { timeout: 8000 })
console.log('✓ 勝利流程 close→win 走通(含 bless/win 語音路徑)')

// 再玩一次
await page.waitForTimeout(400)
await page.evaluate(() => {
  const g = window.__game
  const b = g._winBtns[0]
  const rect = g.cv.getBoundingClientRect()
  g._down({ clientX: rect.left + ((b.x + b.w / 2) / g.W) * rect.width, clientY: rect.top + ((b.y + b.h / 2) / g.H) * rect.height })
})
await page.waitForFunction(() => window.__bb.state().state === 'play' && window.__bb.state().remain > 0, { timeout: 3000 })
console.log('✓ 再玩一次 → 同難度重新開局')

if (errors.length) { console.error('🔴 頁面錯誤:', errors.slice(0, 5)); process.exit(1) }
console.log('🟢 全部通過,零 pageerror')
await browser.close()
