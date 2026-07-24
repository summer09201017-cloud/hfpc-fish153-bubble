// 網滿大魚・一五三(約 21:6,11-12)——「彈珠配對(泡泡龍反向化)+ tsum 皮」首發:
//   骨架=hfpc-paul-game src/minigames/arkmatch/game.js(系列類型⑭,牧者已核可清單「網滿大魚 153 條」);
//   皮=tsum 圓魚臉(眼/腮紅/微笑+尾鰭);與 hfpc-fishnet-tsum(連鏈)同故事不同機制(一題兩型,系列慣例)。
// ⚠ 文案為 AI 依和合本草擬(引文均經 cuv MCP 逐字查證:約 21:6、21:11、21:12),牧者已核可題材。
//
// 玩法:天將亮,魚群聚在船邊!瞄準+發射,把魚送到同類旁邊——湊滿 3 條=一起游進網裡
//   (不是戳破消失!);全部進網,拉上岸——魚雖這樣多,網卻沒有破!
// ★ 神學守法(泡泡龍反向化):①配對成功=同類聚集、一起進網——「歸聚」不是「消除」;
//   ②離了群的(懸空)=主也數算,一條也不失落;③永不會輸:無射數限制、堆太低=主親自收進網;
//   ④豐收不在本事,在主的話(約 21:6);結尾=「來吃早飯」(約 21:12),主認得你、養活你。
// 年齡三檔:幼(3 種魚・3 排)/童(4 種・4 排)/青(5 種・魚越聚越多)。
(function () {
  'use strict'

  const AGES = {
    // grow=每幾發從頂端游來新一排(0=不長);guide=瞄準虛線長度(青檔更短,要自己抓角度)
    young: { label: '🐣 幼', desc: '3 種魚・3 排', kinds: 3, rows: 3, cols: 8, grow: 0, guide: 150 },
    kid: { label: '🙂 童', desc: '4 種魚・4 排', kinds: 4, rows: 4, cols: 9, grow: 11, maxGrow: 8, guide: 130 },
    teen: { label: '🔥 青', desc: '5 種・魚越聚越多', kinds: 5, rows: 5, cols: 10, grow: 8, maxGrow: 12, guide: 70 },
  }

  const KINDS = ['bluefish', 'goldfish', 'redfish', 'grayfish', 'greenfish']
  const VW = 960
  const VH = 540
  const D = 52
  const ROWSTEP = D * 0.87
  const MAXROW = 8 // 堆到這排=主親自收進網(溫柔收回,不是輸)

  // 關卡制(bubble 版:無衝刺——與「夠用就攔住」加壓批次語意衝突;難度=起始排+波次上限隨關數升)
  const LS = 'fish153-bubble'
  const isSprint = () => false
  const maxLevel = (age) => { try { return Math.max(1, parseInt(localStorage.getItem(`${LS}-lvl-${age}`)) || 1) } catch { return 1 } }
  const bumpLevel = (age, lv) => { try { localStorage.setItem(`${LS}-lvl-${age}`, String(Math.max(maxLevel(age), lv))) } catch {} }
  const loadStars = (age) => { try { return JSON.parse(localStorage.getItem(`${LS}-stars-${age}`) || '{}') || {} } catch { return {} } }
  const saveStars = (age, st) => { try { localStorage.setItem(`${LS}-stars-${age}`, JSON.stringify(st)) } catch {} }

  const T = {
    title: '🐟 網滿大魚・一五三',
    ref: '約翰福音 21:6,11',
    intro1: '「耶穌說：你們把網撒在船的右邊，就必得著。他們便撒下網去，竟拉不上來了，因為魚甚多。」(約 21:6)',
    how: '天將亮,魚群聚在船邊!移動滑鼠(或手指)瞄準、放開發射,把魚送到同類旁邊——湊滿 3 條,牠們就一起游進網裡。全部進網,拉上岸——魚雖這樣多,網卻沒有破!',
    pick: '把網撒在船的右邊。選一場豐收:',
    hud: (n, net) => `🐟 場上還有 ${n} 條 ・ 網裡 ${net} 條`,
    gather: '一起進網裡!',
    float: '離了群的,主也數算…',
    more: '又有魚群游過來了…',
    low: '主親自把下層的魚收進網…',
    growStop: '網已經滿了——魚不再游進來(約 21:11)',
    closeLine: '魚雖這樣多，網卻沒有破。(約 21:11)',
    winTitle: '🎉 網滿了,拉上岸!',
    winVerse: '那網滿了大魚，共一百五十三條；魚雖這樣多，網卻沒有破。',
    winRef: '約翰福音 21:11',
    teachVerse: '耶穌說：你們來吃早飯。門徒中沒有一個敢問他：你是誰？因為知道是主。',
    teachRef: '約翰福音 21:12',
    teach: '整夜打不著魚,主一句話,網就滿了——豐收不在我們的本事,在主的話。而且數得清清楚楚:一百五十三條,一條也不少;網也沒有破,一條也不失落。上了岸,主已經生好炭火,說:來吃早飯。祂認得你,也養活你。',
    mapTitle: '🗺 關卡地圖',
    mapHint: '點亮過的關可重玩拿星星・越後面魚群越多',
    review: '經文均經和合本逐句核對・牧者已審核',
  }

  const VOICES = { intro: 'voice/intro.mp3', bless: 'voice/bless.mp3', win: 'voice/win.mp3' }
  const NET = { x: 870, y: 460 }

  class Game {
    constructor(canvas) {
      this.cv = canvas
      this.ctx = canvas.getContext('2d')
      this.state = 'intro' // intro → play → close → win
      this.stopped = false
      this._raf = 0
      this._t = 0
      this._btns = []
      this._winBtns = []
      this._onKeyDown = (e) => this._key(e)
      this.level = 1
      this.stars = {}
      this.lastStars = 1
      this._mapBtns = []
      this.shocks = [] // 💥 大串消除衝擊波光環
      this.sparks = [] // 💥 煙火
      this._onDown = (e) => this._down(e)
      this._onMove = (e) => this._movePt(e)
      this._onUp = (e) => this._up(e)
      this._onResize = () => this._resize()
      this.grid = new Map() // "r,c" → kind
      this.cur = null
      this.next = null
      this.flying = null
      this.flyers = []
      this.aim = -Math.PI / 2
      this.arkCount = 0
      this.closeT = 0
      this.toasts = []
      this.confetti = []
      this.startT = 0
      this._audio = null
      this._voiceEl = null
      this.canFS = !!document.documentElement.requestFullscreen
      this.reduced = matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches
    }

    boot() {
      addEventListener('keydown', this._onKeyDown)
      this.cv.addEventListener('pointerdown', this._onDown)
      addEventListener('pointermove', this._onMove)
      addEventListener('pointerup', this._onUp)
      addEventListener('resize', this._onResize)
      document.addEventListener('fullscreenchange', this._onResize)
      this._resize()
      let last = performance.now()
      const loop = (now) => {
        if (this.stopped) return
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        this._t += dt
        this._update(dt)
        this._draw()
        this._raf = requestAnimationFrame(loop)
      }
      this._raf = requestAnimationFrame(loop)
    }

    destroy() {
      this.stopped = true
      cancelAnimationFrame(this._raf)
      removeEventListener('keydown', this._onKeyDown)
      this.cv.removeEventListener('pointerdown', this._onDown)
      removeEventListener('pointermove', this._onMove)
      removeEventListener('pointerup', this._onUp)
      removeEventListener('resize', this._onResize)
      document.removeEventListener('fullscreenchange', this._onResize)
      try { this._voiceEl && this._voiceEl.pause() } catch {}
      try { this._audio && this._audio.close() } catch {}
    }

    _voice(key) {
      try {
        if (this._voiceEl) this._voiceEl.pause()
        this._voiceEl = new Audio(VOICES[key])
        this._voiceEl.volume = 1
        this._voiceEl.play().catch(() => {})
      } catch {}
    }

    _ping(suffix, t) {
      try { if (typeof window.__ping === 'function') window.__ping('fish153-bubble' + suffix, t) } catch {}
    }

    _start(age, forceLv) {
      this.age = age
      this.cfg = AGES[age]
      this.level = forceLv || maxLevel(age)
      this.stars = loadStars(age)
      this.lvRows = Math.min(6, this.cfg.rows + Math.floor((this.level - 1) / 2))
      this.lvMaxGrow = (this.cfg.maxGrow || 0) ? this.cfg.maxGrow + Math.min(8, (this.level - 1) * 2) : 0
      this.grid = new Map()
      const kinds = KINDS.slice(0, this.cfg.kinds)
      for (let r = 0; r < this.lvRows; r++)
        for (let c = 0; c < this.cfg.cols - (r % 2); c++)
          this.grid.set(`${r},${c}`, kinds[Math.floor(Math.random() * kinds.length)])
      this.arkCount = 0
      this.flyers = []
      this.flying = null
      this.shots = 0
      this.toasts = []
      this.confetti = []
      this.cur = this._pick()
      this.next = this._pick()
      this.aim = -Math.PI / 2
      this.growCount = 0; this.growStopped = false; this.startGT = this._t
      this.shocks = []; this.sparks = []
      this.state = 'play'
      this.startT = performance.now()
      this._voice('intro')
      this._ping('-start')
    }

    _pick() {
      const present = [...new Set(this.grid.values())]
      if (!present.length) return KINDS[0]
      return present[Math.floor(Math.random() * present.length)]
    }

    _ox() { return (VW - this.cfg.cols * D) / 2 + D / 2 }
    _cellXY(r, c) { return { x: this._ox() + c * D + (r % 2) * (D / 2), y: 70 + r * ROWSTEP } }
    _neighbors(r, c) {
      return r % 2 === 0
        ? [[r, c - 1], [r, c + 1], [r - 1, c - 1], [r - 1, c], [r + 1, c - 1], [r + 1, c]]
        : [[r, c - 1], [r, c + 1], [r - 1, c], [r - 1, c + 1], [r + 1, c], [r + 1, c + 1]]
    }

    _shoot() {
      if (this.flying || this.state !== 'play') return
      const sp = 620
      this.flying = { x: VW / 2, y: VH - 70, vx: Math.cos(this.aim) * sp, vy: Math.sin(this.aim) * sp, kind: this.cur }
      this.cur = this.next
      this.next = this._pick()
      this.shots = (this.shots || 0) + 1
      if (this.cfg.grow && this.shots % this.cfg.grow === 0) this._growRow()
      this._tone(440, 0.07, 0, 'sine', 0.08)
    }

    _growRow() {
      if (this.state !== 'play' || this.grid.size === 0) return
      // 「夠用就攔住」(07-23 平衡修):加壓批次有限/場上將清/超時=不再長排——弱手也一定打得完
      if ((this.growCount || 0) >= ((this.lvMaxGrow || this.cfg.maxGrow) || 99) || this.grid.size <= 8 || (this._t - (this.startGT || 0)) > 180) {
        if (!this.growStopped) { this.growStopped = true; this.toasts.push({ text: T.growStop, t: this._t }) }
        return
      }
      this.growCount = (this.growCount || 0) + 1
      const shifted = new Map()
      for (const [key, kind] of this.grid) {
        const [r, c] = key.split(',').map(Number)
        shifted.set(`${r + 1},${c}`, kind)
      }
      this.grid = shifted
      const kinds = [...new Set(this.grid.values())]
      for (let c = 0; c < this.cfg.cols; c++) this.grid.set(`0,${c}`, kinds[Math.floor(Math.random() * kinds.length)])
      this.toasts.push({ text: T.more, t: this._t })
      const tooLow = [...this.grid.keys()].filter((k) => Number(k.split(',')[0]) >= MAXROW)
      if (tooLow.length) {
        for (const key of [...this.grid.keys()].filter((k) => Number(k.split(',')[0]) >= MAXROW - 1)) {
          const [fr, fc] = key.split(',').map(Number); this._toNet(fr, fc)
        }
        this.toasts.push({ text: T.low, t: this._t })
      }
    }

    _snap(b) {
      let r = Math.max(0, Math.round((b.y - 70) / ROWSTEP))
      let c = Math.max(0, Math.min(this.cfg.cols - 1 - (r % 2), Math.round((b.x - this._ox() - (r % 2) * (D / 2)) / D)))
      if (this.grid.has(`${r},${c}`)) {
        let best = null, bestD = 1e9
        const seen = new Set([`${r},${c}`])
        const queue = [[r, c]]
        while (queue.length) {
          const [qr, qc] = queue.shift()
          for (const [nr, nc] of this._neighbors(qr, qc)) {
            const key = `${nr},${nc}`
            if (nr < 0 || nc < 0 || nc > this.cfg.cols - 1 - (nr % 2) || seen.has(key)) continue
            seen.add(key)
            if (!this.grid.has(key)) {
              const p = this._cellXY(nr, nc)
              const d = Math.hypot(p.x - b.x, p.y - b.y)
              if (d < bestD) { bestD = d; best = [nr, nc] }
            } else if (seen.size < 60) queue.push([nr, nc])
          }
        }
        if (best) { r = best[0]; c = best[1] }
      }
      this.grid.set(`${r},${c}`, b.kind)
      this._tone(220, 0.06, 0, 'sine', 0.07)
      this._settle(r, c)
    }

    _settle(r, c) {
      const kind = this.grid.get(`${r},${c}`)
      const group = []
      const seen = new Set()
      const bfs = [[r, c]]
      while (bfs.length) {
        const [qr, qc] = bfs.shift()
        const key = `${qr},${qc}`
        if (seen.has(key) || this.grid.get(key) !== kind) continue
        seen.add(key)
        group.push([qr, qc])
        for (const [nr, nc] of this._neighbors(qr, qc)) if (!seen.has(`${nr},${nc}`)) bfs.push([nr, nc])
      }
      if (group.length >= 3) {
        for (const [gr, gc] of group) this._toNet(gr, gc)
        // 💥 大串消除(≥4)=擴散衝擊波光環+煙火(07-24,連鏈家族同款精神)
        if (group.length >= 4) {
          let cx = 0, cy = 0
          for (const [gr2, gc2] of group) { const p2 = this._cellXY(gr2, gc2); cx += p2.x; cy += p2.y }
          cx /= group.length; cy /= group.length
          this.shocks.push({ x: cx, y: cy, t: 0 })
          const FW = ['#ffd54a', '#ff8a5a', '#8ae08a', '#7ab8ff', '#e08ae0']
          const N = Math.min(40, group.length * 8)
          for (let i = 0; i < N; i++) {
            const a = Math.random() * Math.PI * 2, v = 90 + Math.random() * 220
            this.sparks.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, t: 0, color: FW[i % 5] })
          }
        }
        this.toasts.push({ text: T.gather, t: this._t })
        this._tone(523, 0.12, 0, 'triangle', 0.11); this._tone(659, 0.18, 0.1, 'triangle', 0.11)
        // 離了群的(沒連到頂排)=主也數算
        const anchored = new Set()
        const q = []
        for (const key of this.grid.keys()) if (key.startsWith('0,')) { q.push(key); anchored.add(key) }
        while (q.length) {
          const [qr, qc] = q.shift().split(',').map(Number)
          for (const [nr, nc] of this._neighbors(qr, qc)) {
            const key = `${nr},${nc}`
            if (this.grid.has(key) && !anchored.has(key)) { anchored.add(key); q.push(key) }
          }
        }
        const floating = [...this.grid.keys()].filter((k) => !anchored.has(k))
        if (floating.length) {
          for (const key of floating) { const [fr, fc] = key.split(',').map(Number); this._toNet(fr, fc) }
          this.toasts.push({ text: T.float, t: this._t })
        }
      }
      const tooLow = [...this.grid.keys()].filter((k) => Number(k.split(',')[0]) >= MAXROW)
      if (tooLow.length) {
        for (const key of [...this.grid.keys()].filter((k) => Number(k.split(',')[0]) >= MAXROW - 1)) {
          const [fr, fc] = key.split(',').map(Number); this._toNet(fr, fc)
        }
        this.toasts.push({ text: T.low, t: this._t })
      }
      if (this.grid.size === 0) {
        this.state = 'close'
        this.closeT = 3.2
        this._voice('bless') // 「你們來吃早飯。」(約 21:12)
        this._tone(392, 0.2, 0, 'triangle', 0.1); this._tone(523, 0.3, 0.18, 'triangle', 0.1)
      } else {
        const present = new Set(this.grid.values())
        if (!present.has(this.cur)) this.cur = this._pick()
        if (!present.has(this.next)) this.next = this._pick()
      }
    }

    _toNet(r, c) {
      const kind = this.grid.get(`${r},${c}`)
      if (!kind) return
      this.grid.delete(`${r},${c}`)
      const p = this._cellXY(r, c)
      this.flyers.push({ sx: p.x, sy: p.y, x: p.x, y: p.y, kind, t: 0 })
    }

    _update(dt) {
      if (this.state === 'close') {
        this.closeT -= dt
        if (this.closeT <= 0) this._win()
      }
      if (this.flying) {
        const b = this.flying
        b.x += b.vx * dt
        b.y += b.vy * dt
        const wallL = this._ox() - D / 2, wallR = this._ox() + (this.cfg.cols - 0.5) * D + D / 2
        if (b.x < wallL + D / 2) { b.x = wallL + D / 2; b.vx = Math.abs(b.vx) }
        if (b.x > wallR - D / 2) { b.x = wallR - D / 2; b.vx = -Math.abs(b.vx) }
        let hit = b.y <= 70
        if (!hit) for (const key of this.grid.keys()) {
          const [r, c] = key.split(',').map(Number)
          const p = this._cellXY(r, c)
          if (Math.hypot(p.x - b.x, p.y - b.y) < D * 0.86) { hit = true; break }
        }
        if (hit) { const bb = this.flying; this.flying = null; this._snap(bb) }
        else if (b.y > VH + 40) this.flying = null
      }
      for (const f of this.flyers) f.t += dt * 1.4
      for (const sfx of this.shocks) sfx.t += dt * 1.8
      this.shocks = this.shocks.filter((sfx) => sfx.t < 1)
      for (const sp of this.sparks) { sp.t += dt; sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vy += 260 * dt }
      this.sparks = this.sparks.filter((sp) => sp.t < 0.9)
      for (const f of this.flyers) {
        const k = Math.min(1, f.t)
        const ease = k * k * (3 - 2 * k)
        f.x = f.sx + (NET.x - f.sx) * ease
        f.y = f.sy + (NET.y - f.sy) * ease - Math.sin(k * Math.PI) * 60
      }
      const done = this.flyers.filter((f) => f.t >= 1).length
      if (done) { this.arkCount += done; this.flyers = this.flyers.filter((f) => f.t < 1) }
      for (const c of this.confetti) { c.y += c.vy * dt; c.x += c.vx * dt; c.rot += c.vr * dt }
      this.confetti = this.confetti.filter((c) => c.y < VH + 20)
      this.toasts = this.toasts.filter((t) => this._t - t.t < 2)
    }

    _win() {
      this.state = 'win'
      const secsSt = Math.max(1, (performance.now() - this.startT) / 1000)
      const per = secsSt / Math.max(1, this.arkCount)
      this.lastStars = per <= 2.2 ? 3 : per <= 3.5 ? 2 : 1
      if ((this.stars[this.level] | 0) < this.lastStars) {
        this.stars[this.level] = this.lastStars
        saveStars(this.age, this.stars)
      }
      bumpLevel(this.age, this.level + 1)
      this._tone(523, 0.15); this._tone(659, 0.15, 0.14); this._tone(784, 0.3, 0.28)
      this._voice('win')
      this._ping('-done', Math.max(1, Math.round((performance.now() - this.startT) / 1000)))
      if (!this.reduced) {
        const COLORS = ['#e8524a', '#f0a030', '#f5d90a', '#58b368', '#4a90d9', '#9068be']
        for (let i = 0; i < 70; i++) {
          this.confetti.push({
            x: Math.random() * VW, y: -20 - Math.random() * 160,
            vx: (Math.random() - 0.5) * 60, vy: 90 + Math.random() * 120,
            rot: Math.random() * 7, vr: (Math.random() - 0.5) * 8,
            w: 7 + Math.random() * 6, h: 5 + Math.random() * 4,
            color: COLORS[i % COLORS.length],
          })
        }
      }
    }

    _key(e) {
      if (this.state === 'intro') {
        if (e.key === '1') { this.age = 'young'; this.state = 'map'; return }
        if (e.key === '2' || e.key === 'Enter') { this.age = 'kid'; this.state = 'map'; return }
        if (e.key === '3') { this.age = 'teen'; this.state = 'map'; return }
        return
      }
      if (this.state === 'map' && e.key === 'Enter') return this._start(this.age, maxLevel(this.age))
      if (this.state !== 'play') return
      if (e.key === 'ArrowLeft' || e.key === 'a') this.aim = Math.max(-Math.PI + 0.3, this.aim - 0.09)
      else if (e.key === 'ArrowRight' || e.key === 'd') this.aim = Math.min(-0.3, this.aim + 0.09)
      else if (e.key === ' ' || e.key === 'ArrowUp') this._shoot()
    }

    _pt(e) {
      const r = this.cv.getBoundingClientRect()
      const px = ((e.clientX - r.left) / r.width) * this.W
      const py = ((e.clientY - r.top) / r.height) * this.H
      const { s, ox, oy } = this._view()
      return { x: (px - ox) / s, y: (py - oy) / s }
    }
    _aimTo(x, y) {
      const a = Math.atan2(y - (VH - 70), x - VW / 2)
      this.aim = Math.max(-Math.PI + 0.3, Math.min(-0.3, a))
    }
    _down(e) {
      const { x, y } = this._pt(e)
      if (this.canFS && x >= VW - 46 && x <= VW - 10 && y >= 8 && y <= 44) {
        try {
          if (document.fullscreenElement) document.exitFullscreen()
          else document.documentElement.requestFullscreen()
        } catch {}
        return
      }
      if (this.state === 'intro') {
        for (const b of this._btns) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { this.age = b.key; this.state = 'map'; return }
        return
      }
      if (this.state === 'map') {
        for (const b of this._mapBtns) {
          if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
            if (b.lv === 0) { this.state = 'intro'; return }
            return this._start(this.age, b.lv)
          }
        }
        return
      }
      if (this.state === 'win') {
        const r0 = this.cv.getBoundingClientRect()
        const rx = ((e.clientX - r0.left) / r0.width) * this.W
        const ry = ((e.clientY - r0.top) / r0.height) * this.H
        for (const b of this._winBtns || []) {
          if (rx >= b.x && rx <= b.x + b.w && ry >= b.y && ry <= b.y + b.h) {
            if (b.action === 'next') return this._start(this.age, this.level + 1)
            if (b.action === 'replay') return this._start(this.age, this.level)
            if (b.action === 'lobby') { try { location.href = 'https://hfpc-bible-games.summer09201017.workers.dev/' } catch {} return }
            this.state = 'map'; this.confetti = [] // 🗺 關卡地圖
            return
          }
        }
        return
      }
      if (this.state === 'play') { this._aimTo(x, y); this._press = true }
    }
    _movePt(e) {
      if (this.state !== 'play') return
      const { x, y } = this._pt(e)
      this._aimTo(x, y)
    }
    _up() {
      if (this._press && this.state === 'play') this._shoot()
      this._press = false
    }

    _tone(freq, dur, delay = 0, type = 'triangle', vol = 0.14) {
      try {
        if (!this._audio) this._audio = new (window.AudioContext || window.webkitAudioContext)()
        const ctx = this._audio
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.type = type; o.frequency.value = freq
        g.gain.setValueAtTime(0.0001, ctx.currentTime + delay)
        g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + delay + 0.015)
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur)
        o.connect(g).connect(ctx.destination)
        o.start(ctx.currentTime + delay); o.stop(ctx.currentTime + delay + dur + 0.03)
      } catch {}
    }

    _resize() {
      const s = Math.min(devicePixelRatio || 1, 2)
      this.cv.width = Math.round(innerWidth * s)
      this.cv.height = Math.round(innerHeight * s)
      this.cv.style.width = innerWidth + 'px'
      this.cv.style.height = innerHeight + 'px'
      this.W = this.cv.width; this.H = this.cv.height
    }

    _view() {
      const s = Math.min(this.W / VW, this.H / VH)
      return { s, ox: (this.W - VW * s) / 2, oy: (this.H - VH * s) / 2 }
    }

    // ☀️ 柔光暈太陽(07-24 使用者點名:白天 candy 全配;十童女夜景除外)
    _sun() {
      const { ctx } = this
      const x = 78, y = 72
      const halo = ctx.createRadialGradient(x, y, 6, x, y, 84)
      halo.addColorStop(0, 'rgba(255,238,160,0.5)')
      halo.addColorStop(0.55, 'rgba(255,232,150,0.16)')
      halo.addColorStop(1, 'rgba(255,230,140,0)')
      ctx.fillStyle = halo
      ctx.beginPath(); ctx.arc(x, y, 84, 0, 7); ctx.fill()
      const core = ctx.createRadialGradient(x - 5, y - 5, 3, x, y, 26)
      core.addColorStop(0, '#fffbe8'); core.addColorStop(1, '#ffd75e')
      ctx.fillStyle = core
      ctx.beginPath(); ctx.arc(x, y, 26, 0, 7); ctx.fill()
    }

    _draw() {
      const { ctx, W, H } = this
      if (!W) return
      // 天將亮的提比哩亞海(約 21:4)
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#f0c8a0'); sky.addColorStop(0.35, '#c8b8c8'); sky.addColorStop(0.6, '#7aa4c4'); sky.addColorStop(1, '#4a7a9c')
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
      const { s, ox, oy } = this._view()
      ctx.save()
      ctx.setTransform(s, 0, 0, s, ox, oy)
      this._sun()
      // 海面微波
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2
      for (let i = 0; i < 5; i++) {
        const wy = VH * 0.55 + i * 30
        ctx.beginPath()
        for (let x = 0; x <= VW; x += 24) {
          const y = wy + Math.sin(x * 0.03 + this._t * 1.2 + i) * 4
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      if (this.state === 'intro') { this._drawIntro(); this._fsBtn(); ctx.restore(); return }
      if (this.state === 'map') { this._drawMap(); this._fsBtn(); ctx.restore(); return }
      // 船+網(右側)
      this._net(this.state === 'close' || this.state === 'win')
      // 網格魚群
      for (const [key, kind] of this.grid) {
        const [r, c] = key.split(',').map(Number)
        const p = this._cellXY(r, c)
        this._fish(p.x, p.y, D / 2 - 2, kind)
      }
      if (this.flying) this._fish(this.flying.x, this.flying.y, D / 2 - 2, this.flying.kind)
      for (const f of this.flyers) this._fish(f.x, f.y, (D / 2 - 2) * (1 - f.t * 0.3), f.kind)
      // 💥 衝擊波光環(雙圈擴散)+煙火
      for (const sfx of this.shocks) {
        const k = sfx.t
        ctx.globalAlpha = (1 - k) * 0.9
        ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = 6 * (1 - k) + 2
        ctx.beginPath(); ctx.arc(sfx.x, sfx.y, 24 + k * 260, 0, 7); ctx.stroke()
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3
        ctx.beginPath(); ctx.arc(sfx.x, sfx.y, 12 + k * 180, 0, 7); ctx.stroke()
        ctx.globalAlpha = 1
      }
      for (const sp of this.sparks) {
        ctx.globalAlpha = Math.max(0, 1 - sp.t / 0.9)
        ctx.fillStyle = sp.color
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 3.2, 0, 7); ctx.fill()
        ctx.globalAlpha = 1
      }
      // 發射台(彼得)
      if (this.state === 'play') {
        const sx = VW / 2, sy = VH - 70
        ctx.strokeStyle = 'rgba(40,70,100,0.5)'; ctx.lineWidth = 3; ctx.setLineDash([8, 10])
        ctx.beginPath(); ctx.moveTo(sx, sy)
        ctx.lineTo(sx + Math.cos(this.aim) * this.cfg.guide, sy + Math.sin(this.aim) * this.cfg.guide); ctx.stroke()
        ctx.setLineDash([])
        // 彼得(簡筆漁夫)
        ctx.fillStyle = '#5a6a8a'
        ctx.fillRect(sx - 30 - 9, sy - 8, 18, 34)
        ctx.fillStyle = '#c9a06a'
        ctx.beginPath(); ctx.arc(sx - 30, sy - 18, 10, 0, 7); ctx.fill()
        ctx.fillStyle = '#6a4a2a'
        ctx.beginPath(); ctx.moveTo(sx - 36, sy - 14); ctx.quadraticCurveTo(sx - 30, sy - 6, sx - 24, sy - 14); ctx.fill() // 鬍子
        this._fish(sx, sy, D / 2 - 2, this.cur)
        ctx.fillStyle = '#2c3c50'
        ctx.font = '13px "Noto Sans TC","Microsoft JhengHei",sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('下一條', sx + 74, sy + 4)
        this._fish(sx + 74, sy - 22, D / 3, this.next)
      }
      if (this.state === 'close' || this.state === 'win') {
        ctx.fillStyle = '#2c3c50'
        ctx.font = 'bold 21px "Noto Sans TC","Microsoft JhengHei",sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(T.closeLine, VW / 2, VH * 0.6)
      }
      for (const t of this.toasts) {
        const k = (this._t - t.t) / 2
        ctx.globalAlpha = 1 - k
        ctx.fillStyle = '#1c3048'; ctx.strokeStyle = 'rgba(245,250,255,0.9)'; ctx.lineWidth = 4
        ctx.font = 'bold 20px "Noto Sans TC","Microsoft JhengHei",sans-serif'
        ctx.textAlign = 'center'
        ctx.strokeText(t.text, VW / 2, VH * 0.55 - k * 20)
        ctx.fillText(t.text, VW / 2, VH * 0.55 - k * 20)
        ctx.globalAlpha = 1
      }
      ctx.fillStyle = 'rgba(28,48,72,0.62)'
      rA(ctx, VW * 0.22, 8, VW * 0.56, 30, 12); ctx.fill()
      ctx.fillStyle = '#eaf2f8'
      ctx.font = 'bold 15px "Noto Sans TC","Microsoft JhengHei",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`第 ${this.level} 關 ${T.hud(this.grid.size, this.arkCount)} ・ ←→瞄準 空白鍵發射`, VW / 2, 29)
      this._fsBtn()
      for (const c of this.confetti) {
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot)
        ctx.fillStyle = c.color; ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h)
        ctx.restore()
      }
      ctx.restore()
      if (this.state === 'win') this._drawWinCard()
    }

    _fsBtn() {
      if (!this.canFS) return
      const { ctx } = this
      ctx.fillStyle = 'rgba(28,48,72,0.5)'
      rA(ctx, VW - 44, 10, 32, 32, 8); ctx.fill()
      ctx.strokeStyle = '#eaf2f8'; ctx.lineWidth = 2.5
      const x = VW - 44, y = 10
      for (const [mx, my, lx, ly] of [[8, 13, 8, 8], [13, 8, 8, 8], [24, 8, 24, 8], [24, 8, 24, 13], [8, 19, 8, 24], [8, 24, 13, 24], [19, 24, 24, 24], [24, 24, 24, 19]]) {
        ctx.beginPath(); ctx.moveTo(x + mx, y + my); ctx.lineTo(x + lx, y + ly); ctx.stroke()
      }
    }

    // 船+網(closed=網拉上岸+炭火早飯,約21:9)
    _net(closed) {
      const { ctx } = this
      const x = NET.x, y = NET.y
      // 小船
      ctx.fillStyle = '#8a6a42'
      ctx.beginPath(); ctx.moveTo(x - 66, y - 12); ctx.lineTo(x + 66, y - 12); ctx.lineTo(x + 46, y + 22); ctx.lineTo(x - 46, y + 22); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#6a4a26'
      ctx.fillRect(x - 4, y - 52, 8, 40) // 桅杆
      // 網(半圓網袋掛船右側)
      ctx.strokeStyle = closed ? '#e8d8a8' : '#d8cca8'; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.arc(x, y - 6, 42, 0, Math.PI); ctx.stroke()
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath(); ctx.moveTo(x + i * 12, y - 6); ctx.lineTo(x + i * 9, y + 26); ctx.stroke()
      }
      ctx.beginPath(); ctx.moveTo(x - 36, y + 10); ctx.quadraticCurveTo(x, y + 34, x + 36, y + 10); ctx.stroke()
      if (closed) {
        // 晨光+岸上炭火(約 21:9 來吃早飯)
        const glow = ctx.createRadialGradient(x, y - 10, 6, x, y - 10, 100)
        glow.addColorStop(0, 'rgba(255,235,170,0.5)'); glow.addColorStop(1, 'rgba(255,235,170,0)')
        ctx.fillStyle = glow
        ctx.beginPath(); ctx.arc(x, y - 10, 100, 0, 7); ctx.fill()
        ctx.fillStyle = '#f0a030'
        ctx.beginPath(); ctx.moveTo(x - 90, y + 18); ctx.quadraticCurveTo(x - 84, y - 2, x - 78, y + 18); ctx.quadraticCurveTo(x - 84, y + 10, x - 90, y + 18); ctx.fill()
        ctx.fillStyle = '#6a4a26'
        ctx.fillRect(x - 98, y + 18, 28, 4)
      }
      ctx.fillStyle = '#2c3c50'
      ctx.font = '13px "Noto Sans TC","Microsoft JhengHei",sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('網', x, y + 50)
    }

    // tsum 圓魚(五款:色+特徵雙重分辨;都有眼/腮紅/微笑)
    _fish(x, y, r, kind) {
      const { ctx } = this
      const C = {
        bluefish: ['#78a8d8', '#5888b8'],
        goldfish: ['#e8c060', '#c49c3c'],
        redfish: ['#e8846a', '#c46448'],
        grayfish: ['#a8b4bc', '#88949c'],
        greenfish: ['#8abc7a', '#6a9c5a'],
      }[kind] || ['#78a8d8', '#5888b8']
      ctx.save()
      ctx.translate(x, y)
      // 尾鰭
      ctx.fillStyle = C[1]
      ctx.beginPath(); ctx.moveTo(-r * 0.7, 0); ctx.lineTo(-r * 1.25, -r * 0.5); ctx.lineTo(-r * 1.25, r * 0.5); ctx.closePath(); ctx.fill()
      // 身體(★ 07-24 立體化:徑向漸層+頂光弧)
      const grd = ctx.createRadialGradient(-r * 0.3, -r * 0.34, r * 0.08, 0, 0, r * 0.95)
      grd.addColorStop(0, tint(C[0], 0.45))
      grd.addColorStop(0.55, C[0])
      grd.addColorStop(1, shadeHex(C[0], 0.22))
      ctx.fillStyle = grd
      ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, 7); ctx.fill()
      ctx.strokeStyle = C[1]; ctx.lineWidth = Math.max(1.4, r * 0.06)
      ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, 7); ctx.stroke()
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.lineWidth = Math.max(1.4, r * 0.08); ctx.lineCap = 'round'
      ctx.beginPath(); ctx.arc(0, 0, r * 0.66, Math.PI * 1.12, Math.PI * 1.48); ctx.stroke()
      ctx.lineCap = 'butt'
      // 特徵:各款不同
      if (kind === 'bluefish') { // 背鰭
        ctx.fillStyle = C[1]
        ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.8); ctx.lineTo(r * 0.1, -r * 1.15); ctx.lineTo(r * 0.35, -r * 0.72); ctx.closePath(); ctx.fill()
      } else if (kind === 'goldfish') { // 金鱗三點
        ctx.fillStyle = C[1]
        for (const [ux, uy] of [[-0.25, -0.3], [0.05, -0.42], [0.3, -0.25]]) {
          ctx.beginPath(); ctx.arc(ux * r, uy * r, r * 0.09, 0, 7); ctx.fill()
        }
      } else if (kind === 'redfish') { // 直條紋
        ctx.strokeStyle = C[1]; ctx.lineWidth = Math.max(1.6, r * 0.08)
        for (const a of [-0.3, 0.05, 0.4]) {
          ctx.beginPath(); ctx.moveTo(a * r, -r * 0.72); ctx.lineTo(a * r - r * 0.12, r * 0.4); ctx.stroke()
        }
      } else if (kind === 'grayfish') { // 鯰魚鬚
        ctx.strokeStyle = '#68747c'; ctx.lineWidth = Math.max(1.3, r * 0.06); ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(r * 0.55, r * 0.15); ctx.quadraticCurveTo(r * 0.95, r * 0.1, r * 1.05, r * 0.35); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(r * 0.5, r * 0.28); ctx.quadraticCurveTo(r * 0.85, r * 0.35, r * 0.9, r * 0.6); ctx.stroke()
        ctx.lineCap = 'butt'
      } else { // greenfish 圓斑
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        for (const [ux, uy] of [[-0.3, 0.15], [0.05, 0.3], [0.35, 0.1]]) {
          ctx.beginPath(); ctx.arc(ux * r, uy * r, r * 0.11, 0, 7); ctx.fill()
        }
      }
      // 臉(tsum 標配:眼/腮紅/微笑)
      const er = r * 0.15 // 07-24 v3 大眼睛
      const blink = ((performance.now() / 1000 + x * 7.13 + y * 3.71) % 4.6) < 0.12 // 眨眼(依位置錯開)
      if (blink) {
        ctx.strokeStyle = '#22303c'; ctx.lineWidth = Math.max(1.6, r * 0.07); ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(r * 0.06, -r * 0.16); ctx.lineTo(r * 0.3, -r * 0.16); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(r * 0.42, -r * 0.16); ctx.lineTo(r * 0.66, -r * 0.16); ctx.stroke()
        ctx.lineCap = 'butt'
      } else {
        ctx.fillStyle = '#fff'
        ctx.beginPath(); ctx.arc(r * 0.16, -r * 0.18, er * 1.45, 0, 7); ctx.fill()
        ctx.beginPath(); ctx.arc(r * 0.52, -r * 0.18, er * 1.45, 0, 7); ctx.fill()
        ctx.fillStyle = '#22303c'
        ctx.beginPath(); ctx.arc(r * 0.18, -r * 0.16, er, 0, 7); ctx.fill()
        ctx.beginPath(); ctx.arc(r * 0.54, -r * 0.16, er, 0, 7); ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.beginPath(); ctx.arc(r * 0.13, -r * 0.22, er * 0.42, 0, 7); ctx.fill()
        ctx.beginPath(); ctx.arc(r * 0.49, -r * 0.22, er * 0.42, 0, 7); ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.beginPath(); ctx.arc(r * 0.23, -r * 0.1, er * 0.2, 0, 7); ctx.fill()
        ctx.beginPath(); ctx.arc(r * 0.59, -r * 0.1, er * 0.2, 0, 7); ctx.fill()
      }
      ctx.fillStyle = 'rgba(240,120,120,0.4)'
      ctx.beginPath(); ctx.arc(r * 0.02, r * 0.12, er * 1.1, 0, 7); ctx.fill()
      ctx.beginPath(); ctx.arc(r * 0.68, r * 0.12, er * 1.1, 0, 7); ctx.fill()
      ctx.strokeStyle = '#3c4c5c'; ctx.lineWidth = Math.max(1.6, r * 0.065); ctx.lineCap = 'round' // v3 加深微笑
      ctx.beginPath(); ctx.arc(r * 0.36, r * 0.06, r * 0.2, 0.18 * Math.PI, 0.82 * Math.PI); ctx.stroke()
      ctx.lineCap = 'butt'
      ctx.restore()
    }

    _drawIntro() {
      const { ctx } = this
      cardA(ctx, VW * 0.1, VH * 0.05, VW * 0.8, VH * 0.9)
      ctx.textAlign = 'center'
      ctx.fillStyle = '#1c3a50'
      ctx.font = 'bold 34px "Noto Sans TC","Microsoft JhengHei",sans-serif'
      ctx.fillText(T.title, VW / 2, VH * 0.16)
      ctx.fillStyle = '#4a6a82'
      ctx.font = '16px "Noto Sans TC","Microsoft JhengHei",sans-serif'
      ctx.fillText(T.ref + ' ・ 網卻沒有破', VW / 2, VH * 0.23)
      ctx.fillStyle = '#243442'
      wrapA(ctx, T.intro1, VW / 2, VH * 0.3, VW * 0.68, 23)
      wrapA(ctx, T.how, VW / 2, VH * 0.46, VW * 0.68, 22)
      this._fish(VW * 0.36, VH * 0.62, 22, 'goldfish')
      this._fish(VW * 0.5, VH * 0.62, 22, 'redfish')
      this._fish(VW * 0.64, VH * 0.62, 22, 'bluefish')
      ctx.fillStyle = '#4a6a82'
      ctx.font = '16px "Noto Sans TC","Microsoft JhengHei",sans-serif'
      ctx.fillText(T.pick, VW / 2, VH * 0.7)
      this._btns = []
      const bw = VW * 0.2, bh = VH * 0.12, gap = VW * 0.04
      const x0 = VW / 2 - bw * 1.5 - gap
      Object.entries(AGES).forEach(([key, a], i) => {
        const x = x0 + i * (bw + gap), y = VH * 0.74
        ctx.fillStyle = '#8ab8d8'
        rA(ctx, x, y, bw, bh, 14); ctx.fill()
        ctx.fillStyle = '#0e2436'
        ctx.font = 'bold 20px "Noto Sans TC","Microsoft JhengHei",sans-serif'
        ctx.fillText(a.label, x + bw / 2, y + bh * 0.42)
        ctx.font = '13px "Noto Sans TC","Microsoft JhengHei",sans-serif'
        ctx.fillText(a.desc, x + bw / 2, y + bh * 0.78)
        this._btns.push({ x, y, w: bw, h: bh, key })
      })
      ctx.fillStyle = '#7a92a6'
      ctx.font = '11px "Noto Sans TC","Microsoft JhengHei",sans-serif'
      ctx.fillText(T.review, VW / 2, VH * 0.94)
    }

    // 🗺 關卡地圖(蛇行 12 節點+星星+🔒;點過的關可重玩拿星)
    _drawMap() {
      const { ctx } = this
      const a = AGES[this.age] || AGES.kid
      const maxLv = maxLevel(this.age)
      this.stars = loadStars(this.age)
      ctx.fillStyle = 'rgba(246,251,254,0.96)'
      ctx.strokeStyle = '#7a9cb8'; ctx.lineWidth = 3
      rA(ctx, VW * 0.06, VH * 0.04, VW * 0.88, VH * 0.92, 18); ctx.fill(); ctx.stroke()
      ctx.textAlign = 'center'
      ctx.fillStyle = '#16324a'
      ctx.font = 'bold 26px "Noto Sans TC","Microsoft JhengHei",sans-serif'
      ctx.fillText(T.mapTitle, VW / 2, VH * 0.13)
      ctx.fillStyle = '#4a6a86'
      ctx.font = '15px "Noto Sans TC","Microsoft JhengHei",sans-serif'
      ctx.fillText(`${a.label}・已走到第 ${maxLv} 關 ・ ${T.mapHint}`, VW / 2, VH * 0.2)
      this._mapBtns = []
      const start = Math.max(1, maxLv - 7)
      const COLS = 4
      for (let i = 0; i < 12; i++) {
        const lv = start + i, row = Math.floor(i / COLS)
        let col = i % COLS
        if (row % 2 === 1) col = COLS - 1 - col
        const nx = VW * 0.2 + col * VW * 0.2, ny = VH * 0.33 + row * VH * 0.19
        if (i > 0) {
          const pr = Math.floor((i - 1) / COLS)
          let pc = (i - 1) % COLS
          if (pr % 2 === 1) pc = COLS - 1 - pc
          ctx.strokeStyle = 'rgba(122,156,184,0.35)'; ctx.lineWidth = 8; ctx.lineCap = 'round'
          ctx.beginPath(); ctx.moveTo(VW * 0.2 + pc * VW * 0.2, VH * 0.33 + pr * VH * 0.19); ctx.lineTo(nx, ny); ctx.stroke()
          ctx.lineCap = 'butt'
        }
        const unlocked = lv <= maxLv, cur = lv === maxLv, st = this.stars[lv] | 0
        ctx.fillStyle = !unlocked ? 'rgba(60,90,110,0.16)' : '#4a88b8'
        ctx.beginPath(); ctx.arc(nx, ny, 30, 0, 7); ctx.fill()
        if (cur) {
          ctx.strokeStyle = '#e8a020'; ctx.lineWidth = 4 + 1.5 * Math.sin(this._t * 5)
          ctx.beginPath(); ctx.arc(nx, ny, 36, 0, 7); ctx.stroke()
        }
        ctx.fillStyle = unlocked ? '#fff' : 'rgba(60,90,110,0.55)'
        ctx.font = 'bold 20px "Noto Sans TC","Microsoft JhengHei",sans-serif'
        ctx.fillText(unlocked ? String(lv) : '🔒', nx, ny + 7)
        if (unlocked) {
          ctx.fillStyle = '#e8a020'; ctx.font = '14px sans-serif'
          ctx.fillText(st ? '★★★'.slice(0, st) : (cur ? '▶' : ''), nx, ny + 48)
          this._mapBtns.push({ x: nx - 34, y: ny - 34, w: 68, h: 68, lv })
        }
      }
      const bw = VW * 0.26, bh = VH * 0.09, by = VH * 0.86
      ctx.fillStyle = '#f0d080'; ctx.strokeStyle = '#5a88a8'; ctx.lineWidth = 2
      rA(ctx, VW / 2 - bw - 12, by, bw, bh, 12); ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#3a2c08'
      ctx.font = 'bold 18px "Noto Sans TC","Microsoft JhengHei",sans-serif'
      ctx.fillText(`▶ 繼續:第 ${maxLv} 關`, VW / 2 - bw / 2 - 12, by + bh * 0.64)
      this._mapBtns.push({ x: VW / 2 - bw - 12, y: by, w: bw, h: bh, lv: maxLv })
      ctx.fillStyle = '#8ab8d8'
      rA(ctx, VW / 2 + 12, by, bw, bh, 12); ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#0e2436'
      ctx.fillText('← 換年齡檔', VW / 2 + 12 + bw / 2, by + bh * 0.64)
      this._mapBtns.push({ x: VW / 2 + 12, y: by, w: bw, h: bh, lv: 0 })
    }

    _drawWinCard() {
      const { ctx, W, H } = this
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      const x = W * 0.1, y = H * 0.07, w = W * 0.8, h = H * 0.86
      ctx.fillStyle = '#f2f8fc'
      ctx.strokeStyle = '#7a9cb8'; ctx.lineWidth = 3
      rA(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
      ctx.textAlign = 'center'
      ctx.fillStyle = '#1c3a50'
      ctx.font = `bold ${Math.max(20, H * 0.055)}px "Noto Sans TC","Microsoft JhengHei",sans-serif`
      ctx.fillText(T.winTitle, W / 2, H * 0.16)
      ctx.fillStyle = '#e8a020'
      ctx.font = `${Math.max(18, H * 0.05)}px "Noto Sans TC","Microsoft JhengHei",sans-serif`
      ctx.fillText('★★★'.slice(0, this.lastStars) + '☆☆☆'.slice(0, 3 - this.lastStars), W / 2, H * 0.26)
      ctx.fillStyle = '#4a6a82'
      ctx.font = `${Math.max(12, H * 0.03)}px "Noto Sans TC","Microsoft JhengHei",sans-serif`
      ctx.fillText(`網裡一共 ${this.arkCount} 條——魚雖多,網卻沒有破`, W / 2, H * 0.235)
      ctx.fillStyle = '#243442'
      wrapA(ctx, `「${T.winVerse}」(${T.winRef})`, W / 2, H * 0.32, W * 0.68, H * 0.045)
      ctx.fillStyle = '#3a5a8a'
      wrapA(ctx, `「${T.teachVerse}」(${T.teachRef})`, W / 2, H * 0.47, W * 0.68, H * 0.041)
      ctx.fillStyle = '#243442'
      wrapA(ctx, T.teach, W / 2, H * 0.6, W * 0.68, H * 0.04)
      this._winBtns = []
      const bw = W * 0.185, bh = H * 0.085, by = y + h - bh - H * 0.03, gap = W * 0.012
      const x0 = W / 2 - (bw * 2 + gap * 1.5)
      const defs = [
        { label: '⭐ 下一關(更豐盛)', action: 'next', x: x0 },
        { label: '🗺 關卡地圖', action: 'map', x: x0 + bw + gap },
        { label: '🔁 再玩一次', action: 'replay', x: x0 + (bw + gap) * 2 },
        { label: '← 回大廳', action: 'lobby', x: x0 + (bw + gap) * 3 },
      ]
      for (const d of defs) {
        ctx.fillStyle = '#8ab8d8'
        ctx.strokeStyle = '#5a88a8'; ctx.lineWidth = 2
        rA(ctx, d.x, by, bw, bh, 12); ctx.fill(); ctx.stroke()
        ctx.fillStyle = '#0e2436'
        ctx.font = `bold ${Math.max(12, H * 0.028)}px "Noto Sans TC","Microsoft JhengHei",sans-serif`
        ctx.fillText(d.label, d.x + bw / 2, by + bh * 0.62)
        this._winBtns.push({ x: d.x, y: by, w: bw, h: bh, action: d.action })
      }
      ctx.restore()
    }
  }

  function rA(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }

  function hexRGB(hex) {
    const h = hex.replace('#', '')
    const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
  }
  function tint(hex, k) { try { const [r2, g2, b2] = hexRGB(hex); return `rgb(${Math.round(r2 + (255 - r2) * k)},${Math.round(g2 + (255 - g2) * k)},${Math.round(b2 + (255 - b2) * k)})` } catch { return hex } }
  function shadeHex(hex, k) { try { const [r2, g2, b2] = hexRGB(hex); return `rgb(${Math.round(r2 * (1 - k))},${Math.round(g2 * (1 - k))},${Math.round(b2 * (1 - k))})` } catch { return hex } }
  function cardA(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(246,251,254,0.96)'
    ctx.strokeStyle = '#7a9cb8'; ctx.lineWidth = 3
    rA(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke()
  }
  function wrapA(ctx, text, cx, y, maxW, lineH) {
    ctx.font = `${lineH * 0.72}px "Noto Sans TC","Microsoft JhengHei",sans-serif`
    let line = '', yy = y
    for (const ch of String(text)) {
      if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, cx, yy); line = ch; yy += lineH }
      else line += ch
    }
    if (line) ctx.fillText(line, cx, yy)
  }

  const game = new Game(document.getElementById('cv'))
  game.boot()
  window.__game = game
  window.__bb = {
    start: (age, lv) => game._start(age || 'kid', lv || 1),
    gotoLevel: (lv) => game._start(game.age || 'kid', lv),
    state: () => ({
      state: game.state,
      remain: game.grid.size,
      net: game.arkCount,
      level: game.level,
      stars: game.lastStars,
    }),
  }
})()
