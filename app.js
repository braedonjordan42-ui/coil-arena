(() => {
'use strict';
// Works both from a web server and when index.html is opened directly as a file.
// Accepts window.firebaseConfig = {...} or a pasted  const firebaseConfig = {...}
// eslint-disable-next-line no-undef
const FB_CONFIG = window.firebaseConfig || (typeof firebaseConfig !== 'undefined' ? firebaseConfig : {});
const { initNet, isConfigured } = window.coilNet || { initNet: async () => null, isConfigured: () => false };
const RUNNING_FROM_FILE = location.protocol === 'file:';

/* =========================================================
   helpers
   ========================================================= */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[(Math.random() * arr.length) | 0];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toLocaleDateString('en-CA');
const yesterday = () => new Date(Date.now() - 864e5).toLocaleDateString('en-CA');
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* =========================================================
   content
   ========================================================= */
const SKINS = [
  { id: 'aurora', name: 'Aurora', colors: ['#38e1ff', '#9b7bff'], cost: 0, rarity: 'starter' },
  { id: 'bubblegum', name: 'Bubblegum', colors: ['#ff5fa2', '#ffb3d9'], cost: 120, rarity: 'common' },
  { id: 'lemonade', name: 'Lemonade', colors: ['#ffd23f', '#ff9f43'], cost: 200, rarity: 'common' },
  { id: 'limelight', name: 'Limelight', colors: ['#b6ff5c', '#38e1ff'], cost: 300, rarity: 'rare' },
  { id: 'galaxy', name: 'Galaxy', colors: ['#9b7bff', '#ff5fa2', '#38e1ff'], cost: 450, rarity: 'rare' },
  { id: 'lava', name: 'Lava lamp', colors: ['#ff5a4e', '#ffd23f'], cost: 600, rarity: 'epic' },
  { id: 'mint', name: 'Mint chip', colors: ['#5cffc8', '#f4f1ff', '#5cffc8', '#2a2350'], cost: 750, rarity: 'epic' },
  { id: 'rainbow', name: 'Rainbow road', colors: ['#ff5fa2', '#ff9f43', '#ffd23f', '#b6ff5c', '#38e1ff', '#9b7bff'], cost: 1000, rarity: 'legendary' },
];
const EFFECTS = [
  { id: 'spark', name: 'Spark', icon: '✦', color: '#38e1ff', colors: ['#38e1ff', '#ffffff'], n: 18, cost: 0, rarity: 'starter' },
  { id: 'bloom', name: 'Bloom', icon: '✿', color: '#ff5fa2', colors: ['#ff5fa2', '#ffb3d9', '#b6ff5c'], n: 24, cost: 180, rarity: 'common' },
  { id: 'comet', name: 'Comet', icon: '☄', color: '#ffd23f', colors: ['#ffd23f', '#ff9f43', '#ffffff'], n: 16, speed: 2, cost: 320, rarity: 'rare' },
  { id: 'confetti', name: 'Confetti', icon: '✺', color: '#b6ff5c', colors: ['#ff5fa2', '#ffd23f', '#b6ff5c', '#38e1ff', '#9b7bff'], n: 34, cost: 500, rarity: 'epic' },
  { id: 'supernova', name: 'Supernova', icon: '✹', color: '#9b7bff', colors: ['#9b7bff', '#38e1ff', '#ffffff', '#ff5fa2'], n: 48, speed: 1.6, cost: 800, rarity: 'legendary' },
];
/* ---------- ranks: 6 tiers x 3 divisions, earned by level ---------- */
const TIERS = [
  { id: 'bronze', name: 'Bronze', color: '#f0a56b', dark: '#8a4b1c' },
  { id: 'silver', name: 'Silver', color: '#dfe4f7', dark: '#6f7896' },
  { id: 'gold', name: 'Gold', color: '#ffd23f', dark: '#b37a00' },
  { id: 'platinum', name: 'Platinum', color: '#5cffc8', dark: '#1a8a70' },
  { id: 'diamond', name: 'Diamond', color: '#38e1ff', dark: '#2a4fd7' },
  { id: 'champion', name: 'Champion', color: '#ff5fa2', dark: '#7b4bff' },
];
const RANK_LEVELS = [2, 3, 5, 7, 9, 11, 13, 15, 18, 21, 24, 27, 30, 34, 38, 42, 46, 50];
const RANK_SKINS = [
  { id: 'bronze', name: 'Bronze', colors: ['#f0a56b', '#ffd2ad'] },
  { id: 'bronze-elite', name: 'Bronze Elite', colors: ['#c8773c', '#ffe1c2', '#f0a56b', '#7a3f16'], elite: true },
  { id: 'silver', name: 'Silver', colors: ['#dfe4f7', '#a3acc9'] },
  { id: 'silver-elite', name: 'Silver Elite', colors: ['#ffffff', '#b9c2e0', '#8790b3', '#e6ebff'], elite: true },
  { id: 'gold', name: 'Gold', colors: ['#ffd23f', '#ffeb99'] },
  { id: 'gold-elite', name: 'Gold Elite', colors: ['#ffd23f', '#fff4c2', '#e8a800', '#ffb84d'], elite: true },
  { id: 'platinum', name: 'Platinum', colors: ['#5cffc8', '#c8fff0'] },
  { id: 'platinum-elite', name: 'Platinum Elite', colors: ['#5cffc8', '#ffffff', '#38e1ff', '#1fbf95'], elite: true },
  { id: 'diamond', name: 'Diamond', colors: ['#38e1ff', '#c2f6ff'] },
  { id: 'diamond-elite', name: 'Diamond Elite', colors: ['#38e1ff', '#ffffff', '#9b7bff', '#2a8cff'], elite: true },
  { id: 'champion', name: 'Champion', colors: ['#ff5fa2', '#ffd23f'], crown: true },
  { id: 'champion-elite', name: 'Legend', colors: ['#ff5fa2', '#ffd23f', '#ffffff', '#9b7bff', '#38e1ff'], elite: true, crown: true },
];
const RANK_EFFECTS = [
  { id: 'bronze-fx', name: 'Copper sparks', icon: '✧', color: '#f0a56b', colors: ['#f0a56b', '#ffd2ad', '#ffffff'], n: 24 },
  { id: 'silver-fx', name: 'Frostbite', icon: '❄', color: '#dfe4f7', colors: ['#dfe4f7', '#ffffff', '#38e1ff'], n: 28, ring: true },
  { id: 'gold-fx', name: 'Gold rush', icon: '✪', color: '#ffd23f', colors: ['#ffd23f', '#ffeb99', '#ffffff'], n: 34, ring: true },
  { id: 'platinum-fx', name: 'Aurora wave', icon: '❋', color: '#5cffc8', colors: ['#5cffc8', '#38e1ff', '#ffffff'], n: 38, ring: true },
  { id: 'diamond-fx', name: 'Shatter', icon: '◆', color: '#38e1ff', colors: ['#38e1ff', '#ffffff', '#9b7bff'], n: 44, speed: 1.8, ring: true },
  { id: 'champion-fx', name: 'Crown burst', icon: '♛', color: '#ff5fa2', colors: ['#ff5fa2', '#ffd23f', '#ffffff', '#9b7bff'], n: 60, speed: 1.9, ring: true },
];
const RANKS = [];
TIERS.forEach((tier, t) => {
  for (let d = 1; d <= 3; d++) {
    const i = t * 3 + d - 1;
    const reward = d === 1 ? { type: 'skin', id: tier.id } : d === 2 ? { type: 'effect', id: `${tier.id}-fx` } : { type: 'skin', id: `${tier.id}-elite` };
    RANKS.push({ i, tier, div: d, level: RANK_LEVELS[i], name: `${tier.name} ${d}`, reward });
  }
});
for (const r of RANKS) {
  const list = r.reward.type === 'skin' ? RANK_SKINS : RANK_EFFECTS;
  Object.assign(list.find(x => x.id === r.reward.id), { cost: 0, rarity: 'rank', rank: r.i });
}
function rankIndexFor(level) { let r = -1; for (const k of RANKS) if (level >= k.level) r = k.i; return r; }
function rankName(i) { return i >= 0 && RANKS[i] ? RANKS[i].name : 'Unranked'; }
function grantRankRewards(s) {
  const ri = rankIndexFor(s.level);
  for (let i = 0; i <= ri; i++) {
    const rw = RANKS[i].reward;
    const list = rw.type === 'skin' ? s.ownedSkins : s.ownedEffects;
    if (!list.includes(rw.id)) list.push(rw.id);
  }
}

const FOOD_COLORS = ['#ff5fa2', '#38e1ff', '#b6ff5c', '#ffd23f', '#9b7bff', '#ff9f43', '#5cffc8'];
const BOT_NAMES = ['Noodle', 'Pickle', 'Mochi', 'Sprout', 'Wiggles', 'Zippy', 'Biscuit', 'Nibbles', 'Doodle', 'Taco', 'Pretzel', 'Waffles', 'Bean', 'Jellybean', 'Squiggle', 'Boba', 'Kiwi', 'Pixel', 'Gizmo', 'Twix', 'Sir Slithers', 'Lil Snek', 'Dumpling', 'Coco'];
const DEATH_TITLES = ['Oof, bonked!', 'So close!', 'Coiled!', 'Whoops!', 'Snek down!'];
SKINS.push(...RANK_SKINS);
EFFECTS.push(...RANK_EFFECTS);
const skinById = id => SKINS.find(s => s.id === id) || SKINS[0];
const effectById = id => EFFECTS.find(e => e.id === id) || EFFECTS[0];

/* =========================================================
   save data (local + optional cloud)
   ========================================================= */
const SAVE_KEY = 'coilSave';
const freshSave = () => ({
  coins: 0, xp: 0, level: 1, best: 0, kills: 0, runs: 0, name: '',
  skin: 'aurora', effect: 'spark', ownedSkins: ['aurora'], ownedEffects: ['spark'],
  daily: '', streak: 0, history: [], submittedBest: 0,
  settings: { sound: true, sensitivity: 1, shake: true }, updated: 0,
});
function normalize(raw) {
  raw = raw && typeof raw === 'object' ? raw : {};
  const s = { ...freshSave(), ...raw };
  s.settings = { ...freshSave().settings, ...(raw.settings || {}) };
  s.ownedSkins = [...new Set(['aurora', ...(Array.isArray(s.ownedSkins) ? s.ownedSkins : Object.values(s.ownedSkins || {}))])].filter(id => SKINS.some(k => k.id === id));
  s.ownedEffects = [...new Set(['spark', ...(Array.isArray(s.ownedEffects) ? s.ownedEffects : Object.values(s.ownedEffects || {}))])].filter(id => EFFECTS.some(k => k.id === id));
  for (const k of ['coins', 'xp', 'level']) s[k] = Math.max(k === 'level' ? 1 : 0, Math.floor(Number(s[k]) || 0));
  grantRankRewards(s);
  if (!s.ownedSkins.includes(s.skin)) s.skin = 'aurora';
  if (!s.ownedEffects.includes(s.effect)) s.effect = 'spark';
  for (const k of ['coins', 'xp', 'level', 'best', 'kills', 'runs', 'streak', 'submittedBest']) s[k] = Math.max(k === 'level' ? 1 : 0, Math.floor(Number(s[k]) || 0));
  s.history = (Array.isArray(s.history) ? s.history : Object.values(s.history || {})).filter(h => h && typeof h.score === 'number').slice(0, 5);
  s.name = String(s.name || '').slice(0, 16);
  s.settings.sensitivity = clamp(Number(s.settings.sensitivity) || 1, 0.6, 1.6);
  return s;
}
function loadSave() {
  try { return normalize(JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch { return normalize({}); }
}
let save = loadSave();
function writeLocal() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {} }
function persist() {
  save.updated = Date.now();
  writeLocal();
  renderProfile();
  scheduleCloudSave();
}

/* =========================================================
   sound (tiny synth, no files needed)
   ========================================================= */
const sfx = {
  ctx: null, master: null, lastEat: 0,
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  },
  tone(freq, dur, opts = {}) {
    if (!save.settings.sound) return;
    try { this._tone(freq, dur, opts); } catch (e) { /* audio not available — play silently */ }
  },
  _tone(freq, dur, { type = 'sine', vol = 0.1, slide = 0, delay = 0 } = {}) {
    const c = this.ensure(); if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.03);
  },
  eat(combo) {
    const now = performance.now();
    if (now - this.lastEat < 55) return;
    this.lastEat = now;
    this.tone(480 + Math.min(combo, 14) * 40, 0.08, { vol: 0.06, slide: 180 });
  },
  big() { this.tone(660, 0.12, { vol: 0.08, slide: 300, type: 'triangle' }); this.tone(990, 0.14, { vol: 0.06, delay: 0.06, type: 'triangle' }); },
  boost() { this.tone(180, 0.28, { type: 'sawtooth', vol: 0.025, slide: 260 }); },
  ko() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.15, { type: 'triangle', vol: 0.08, delay: i * 0.06 })); },
  die() { this.tone(320, 0.55, { type: 'sawtooth', vol: 0.05, slide: -240 }); this.tone(160, 0.5, { vol: 0.1, slide: -90, delay: 0.05 }); },
  level() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.16, { type: 'square', vol: 0.035, delay: i * 0.07 })); },
  click() { this.tone(760, 0.05, { vol: 0.045, type: 'triangle' }); },
  coin() { this.tone(988, 0.08, { vol: 0.05, type: 'square' }); this.tone(1319, 0.16, { vol: 0.05, type: 'square', delay: 0.07 }); },
};

/* =========================================================
   world
   ========================================================= */
const ARENA_R = 1700;
const SP = 6;                 // spacing between body points
const BASE_SPEED = 165;
const BOOST_SPEED = 310;
const START_MASS = 10;
const MAX_POINTS = 720;
const FOOD_TARGET = 560;
const BOTS = { solo: 12, online: 6 };
const ROOM = 'arena-1';
const radiusFor = m => 10 + Math.min(16, Math.sqrt(m) * 0.75);
const pointsFor = m => Math.min(MAX_POINTS, Math.floor(18 + m * 1.15));

const G = {
  state: 'menu',           // menu | playing | paused | dying | dead
  mode: 'solo',
  snakes: [],
  player: null,
  foods: [],
  particles: [],
  rings: [],
  texts: [],
  remote: {},
  cam: { x: 0, y: 0, zoom: 1, shake: 0 },
  time: 0, runTime: 0, runKos: 0, bestRank: 99, combo: 0, lastEatAt: 0,
  dyingT: 0, deathInfo: null, menuFollow: null, menuSwitch: 0,
  globalRows: null, onlineCount: 0,
  desired: 0,
};
let nextId = 1;
let collidables = [];

function makeSnake({ x, y, name, skin, isBot = false, mass = START_MASS, angle = rand(0, TAU) }) {
  const s = {
    id: nextId++, name, skin, isBot, mass, angle, target: angle, x, y, pts: [],
    r: radiusFor(mass), boosting: false, energy: 100, dead: false, blink: rand(2, 6),
    dropT: 0, think: 0, skill: rand(0.35, 1), aggro: 0, wantBoost: false, bb: { x0: x, x1: x, y0: y, y1: y },
  };
  for (let i = 0; i < pointsFor(mass); i++) s.pts.push({ x: x - Math.cos(angle) * i * SP, y: y - Math.sin(angle) * i * SP });
  return s;
}
const skinColors = s => skinById(s.skin).colors;

function randomPointInArena(margin = 40) {
  const a = rand(0, TAU), d = Math.sqrt(Math.random()) * (ARENA_R - margin);
  return { x: Math.cos(a) * d, y: Math.sin(a) * d };
}
function safeSpot(minDist = 350, avoid = null) {
  for (let k = 0; k < 50; k++) {
    const p = randomPointInArena(280);
    let ok = true;
    for (const s of collidables.length ? collidables : G.snakes) {
      if (s.dead) continue;
      for (let i = 0; i < s.pts.length; i += 5) {
        const q = s.pts[i];
        if ((q.x - p.x) ** 2 + (q.y - p.y) ** 2 < minDist * minDist) { ok = false; break; }
      }
      if (!ok) break;
    }
    if (ok && avoid && (avoid.x - p.x) ** 2 + (avoid.y - p.y) ** 2 < 600 * 600) ok = false;
    if (ok) return p;
  }
  return randomPointInArena(400);
}

function spawnFood(x, y, value = 1, opts = {}) {
  if (G.foods.length > 1500) return;
  if (x === undefined) ({ x, y } = randomPointInArena(30));
  const big = opts.big ?? (value === 1 && Math.random() < 0.035);
  if (big) value = 5;
  G.foods.push({
    x, y, value, big,
    r: opts.r || (big ? 9 : value > 1 ? 5 + value : rand(3.6, 5.4)),
    color: opts.color || pick(FOOD_COLORS),
    ph: rand(0, TAU), life: opts.life || 0, max: opts.life || 0,
    vx: opts.vx || 0, vy: opts.vy || 0,
  });
}

function spawnBot(awayFrom = null) {
  const p = safeSpot(300, awayFrom);
  const boss = Math.random() < 0.12;
  const used = new Set(G.snakes.map(s => s.name));
  const name = pick(BOT_NAMES.filter(n => !used.has(n))) || pick(BOT_NAMES);
  const b = makeSnake({ x: p.x, y: p.y, name, skin: pick(SKINS.filter(k => !k.rank && k.rank !== 0)).id, isBot: true, mass: boss ? rand(80, 160) | 0 : rand(10, 45) | 0 });
  if (boss) b.skill = rand(0.75, 1);
  b.rk = boss ? (rand(6, 15) | 0) : (rand(-1, 9) | 0);
  G.snakes.push(b);
  return b;
}

function fillWorld() {
  while (G.foods.length < FOOD_TARGET) spawnFood();
  const want = BOTS[G.mode];
  let bots = G.snakes.filter(s => s.isBot);
  while (bots.length > want) { const b = bots.pop(); G.snakes.splice(G.snakes.indexOf(b), 1); }
  for (let i = bots.length; i < want; i++) spawnBot(G.player);
}

/* =========================================================
   snake behaviour
   ========================================================= */
function steer(s, desired, dt) {
  const sens = s === G.player ? save.settings.sensitivity : 1;
  const turn = 4.1 * sens * (1 - Math.min(0.4, s.mass / 2500)) * dt;
  s.angle += clamp(angDiff(s.angle, desired), -turn, turn);
  if (s.angle > Math.PI) s.angle -= TAU; else if (s.angle < -Math.PI) s.angle += TAU;
}

function updateBoost(s, want, dt) {
  if (want && s.energy > 1) {
    if (!s.boosting && s === G.player) sfx.boost();
    s.boosting = true;
    s.energy = Math.max(0, s.energy - 40 * dt);
    s.dropT += dt;
    if (s.dropT > 0.3 && s.mass > START_MASS + 2) {
      s.dropT = 0;
      s.mass -= 1;
      const t = s.pts[s.pts.length - 1];
      spawnFood(t.x + rand(-4, 4), t.y + rand(-4, 4), 1, { color: skinColors(s)[0], r: 4.4, life: 14, big: false });
    }
  } else {
    s.boosting = false;
    s.energy = Math.min(100, s.energy + (want ? 6 : 19) * dt);
  }
}

function moveSnake(s, dt) {
  const speed = s.boosting ? BOOST_SPEED : BASE_SPEED;
  s.x += Math.cos(s.angle) * speed * dt;
  s.y += Math.sin(s.angle) * speed * dt;
  const pts = s.pts;
  pts[0].x = s.x; pts[0].y = s.y;
  let x0 = s.x, x1 = s.x, y0 = s.y, y1 = s.y;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > SP) { const k = SP / d; b.x = a.x + dx * k; b.y = a.y + dy * k; }
    if (b.x < x0) x0 = b.x; else if (b.x > x1) x1 = b.x;
    if (b.y < y0) y0 = b.y; else if (b.y > y1) y1 = b.y;
  }
  s.bb.x0 = x0; s.bb.x1 = x1; s.bb.y0 = y0; s.bb.y1 = y1;
  const want = pointsFor(s.mass);
  while (pts.length < want) { const l = pts[pts.length - 1]; pts.push({ x: l.x, y: l.y }); }
  if (pts.length > want) pts.length = want;
  s.r = lerp(s.r, radiusFor(s.mass), Math.min(1, dt * 3));
  s.blink -= dt; if (s.blink < -0.14) s.blink = rand(2, 6);
}

function checkCollision(s) {
  if (s.x * s.x + s.y * s.y > (ARENA_R - s.r * 0.5) ** 2) return { wall: true };
  for (const o of collidables) {
    if (o === s || o.dead) continue;
    const pad = o.r + s.r;
    if (s.x < o.bb.x0 - pad || s.x > o.bb.x1 + pad || s.y < o.bb.y0 - pad || s.y > o.bb.y1 + pad) continue;
    const rr = o.r * 0.85 + s.r * 0.6;
    const rr2 = rr * rr;
    const pts = o.pts;
    for (let i = 1; i < pts.length; i += 2) {
      const dx = pts[i].x - s.x, dy = pts[i].y - s.y;
      if (dx * dx + dy * dy < rr2) return { by: o };
    }
  }
  return null;
}

function killSnake(s, cause) {
  if (s.dead) return;
  s.dead = true;
  s.boosting = false;
  const cols = skinColors(s);
  const count = clamp(Math.round(s.mass * 0.4), 6, 160);
  const value = Math.max(1, Math.round((s.mass * 0.8) / count));
  for (let k = 0; k < count; k++) {
    const p = s.pts[Math.floor((k / count) * s.pts.length)];
    spawnFood(p.x + rand(-10, 10), p.y + rand(-10, 10), value, { color: cols[k % cols.length], life: rand(18, 26), big: false });
  }
  burst(s.x, s.y, s === G.player || cause.by === G.player ? effectById(save.effect) : { colors: cols, n: 14 });
  if (s === G.player) { playerDied(cause); return; }
  s.respawnAt = G.time + rand(2.5, 5);
  if (cause.by === G.player && G.state === 'playing') awardKO(s.name, s.x, s.y);
}

/* ---------- bots ---------- */
function rayDanger(b, ang, look) {
  let worst = 0;
  const c = Math.cos(ang), sn = Math.sin(ang);
  for (let k = 1; k <= 3; k++) {
    const dist = (look * k) / 3;
    const px = b.x + c * dist, py = b.y + sn * dist;
    const w = 1.2 - k * 0.2;
    if (px * px + py * py > (ARENA_R - b.r * 2) ** 2) { worst = Math.max(worst, w); continue; }
    for (const o of collidables) {
      if (o === b || o.dead) continue;
      const pad = o.r + b.r + 8;
      if (px < o.bb.x0 - pad || px > o.bb.x1 + pad || py < o.bb.y0 - pad || py > o.bb.y1 + pad) continue;
      const pts = o.pts, pad2 = pad * pad;
      for (let i = 0; i < pts.length; i += 3) {
        const dx = pts[i].x - px, dy = pts[i].y - py;
        if (dx * dx + dy * dy < pad2) { worst = Math.max(worst, w); break; }
      }
    }
    if (worst >= w) break;
  }
  return worst;
}
const AVOID_OFFSETS = [0, -0.45, 0.45, -0.9, 0.9, -1.4, 1.4, -2, 2, Math.PI];
function botThink(b, dt) {
  b.think -= dt;
  if (b.think <= 0) {
    b.think = rand(0.1, 0.26) * (1.5 - b.skill);
    let goal = null, best = 0;
    for (const f of G.foods) {
      const dx = f.x - b.x, dy = f.y - b.y;
      if (dx > 550 || dx < -550 || dy > 550 || dy < -550) continue;
      const ahead = Math.cos(angDiff(b.angle, Math.atan2(dy, dx))) * 0.5 + 1;
      const sc = (f.value * ahead) / (Math.sqrt(dx * dx + dy * dy) + 40);
      if (sc > best) { best = sc; goal = f; }
    }
    let desired = goal ? Math.atan2(goal.y - b.y, goal.x - b.x) : b.angle + rand(-0.7, 0.7);
    const prey = G.state === 'playing' && G.player && !G.player.dead ? G.player : null;
    b.aggro = Math.max(0, b.aggro - 0.2);
    if (prey && G.runTime > 8 && b.skill > 0.65 && b.mass > prey.mass * 0.7) {
      const dx = prey.x - b.x, dy = prey.y - b.y, d = Math.hypot(dx, dy);
      if (d < 340 && Math.random() < 0.55 * b.skill) {
        const lead = 70 + d * 0.35;
        desired = Math.atan2(prey.y + Math.sin(prey.angle) * lead - b.y, prey.x + Math.cos(prey.angle) * lead - b.x);
        b.aggro = 1;
      }
    }
    if (Math.hypot(b.x, b.y) > ARENA_R - 280) desired = Math.atan2(-b.y, -b.x) + rand(-0.5, 0.5);

    const smart = Math.random() < 0.55 + b.skill * 0.45;
    b.target = desired;
    if (smart) {
      const look = 70 + b.r * 3 + (b.boosting ? 70 : 0);
      if (rayDanger(b, desired, look) > 0.1 || rayDanger(b, b.angle, look * 0.7) > 0.1) {
        let bestA = desired, bestCost = Infinity;
        for (const off of AVOID_OFFSETS) {
          const a = b.angle + off;
          const cost = rayDanger(b, a, look) * 10 + Math.abs(angDiff(a, desired)) * 0.3 + Math.abs(off) * 0.12;
          if (cost < bestCost) { bestCost = cost; bestA = a; }
        }
        b.target = bestA;
      }
    }
    b.wantBoost = (b.aggro > 0 && b.energy > 25) || (best > 0.05 && Math.random() < 0.015 * b.skill);
  }
  steer(b, b.target, dt);
  updateBoost(b, b.wantBoost && b.energy > 8, dt);
}

/* ---------- player ---------- */
const input = { mx: 0, my: 0, hasPointer: false, keys: new Set(), boostKey: false, boostMouse: false, boostTouch: false, lastKey: 0, lastPointer: 0 };
function playerDesired(p) {
  let kx = 0, ky = 0;
  const k = input.keys;
  if (k.has('ArrowLeft') || k.has('KeyA')) kx -= 1;
  if (k.has('ArrowRight') || k.has('KeyD')) kx += 1;
  if (k.has('ArrowUp') || k.has('KeyW')) ky -= 1;
  if (k.has('ArrowDown') || k.has('KeyS')) ky += 1;
  if ((kx || ky) && input.lastKey >= input.lastPointer) return Math.atan2(ky, kx);
  if (input.hasPointer) {
    const sx = (p.x - G.cam.x) * G.cam.zoom + view.w / 2;
    const sy = (p.y - G.cam.y) * G.cam.zoom + view.h / 2;
    const dx = input.mx - sx, dy = input.my - sy;
    if (dx * dx + dy * dy < 100) return p.angle;
    return Math.atan2(dy, dx);
  }
  return p.angle;
}

/* ---------- food ---------- */
function eatFood(s, dt) {
  const reach = s.r + 36, reach2 = reach * reach, eatR = s.r + 5;
  const foods = G.foods;
  for (let i = foods.length - 1; i >= 0; i--) {
    const f = foods[i];
    const dx = f.x - s.x, dy = f.y - s.y;
    if (dx > reach || dx < -reach || dy > reach || dy < -reach) continue;
    const d2 = dx * dx + dy * dy;
    if (d2 > reach2) continue;
    const d = Math.sqrt(d2);
    if (d < eatR + f.r * 0.5) {
      foods[i] = foods[foods.length - 1];
      foods.pop();
      s.mass += f.value;
      if (s === G.player) onPlayerEat(f);
    } else {
      const pull = Math.min(d, (260 + s.r * 4) * dt);
      f.x -= (dx / d) * pull; f.y -= (dy / d) * pull;
    }
  }
}
function onPlayerEat(f) {
  G.combo = G.time - G.lastEatAt < 0.7 ? G.combo + 1 : 0;
  G.lastEatAt = G.time;
  if (f.big) { sfx.big(); floatText(f.x, f.y, `+${f.value}`, f.color); }
  else sfx.eat(G.combo);
}

/* ---------- effects ---------- */
function burst(x, y, fx) {
  if (fx.ring) { G.rings.push({ x, y, life: 0.7, color: fx.colors[0], max: 120 * (fx.speed || 1) }); G.rings.push({ x, y, life: 0.9, color: fx.colors[1] || '#fff', max: 70 * (fx.speed || 1) }); }
  const n = fx.n || 16, sp = fx.speed || 1;
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), v = rand(60, 220) * sp;
    G.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.5, 1.1), max: 1.1, color: fx.colors[i % fx.colors.length], size: rand(2.5, 5.5) });
  }
}
function floatText(x, y, text, color = '#fff') { G.texts.push({ x, y, text, color, life: 1.1 }); }
function shake(n) { if (save.settings.shake) G.cam.shake = Math.max(G.cam.shake, n); }

/* =========================================================
   run flow
   ========================================================= */
function startRun() {
  try { startRunInner(); } catch (e) { console.error(e); window.__coilError && window.__coilError(e); }
}
function startRunInner() {
  if (G.state === 'playing') return;
  if (G.state === 'paused') { resume(); return; }
  sfx.click();
  if (G.mode === 'online' && !net) { toast('Online needs Firebase set up — playing solo'); setMode('solo'); }
  if (G.player) { const i = G.snakes.indexOf(G.player); if (i >= 0) G.snakes.splice(i, 1); }
  fillWorld();
  collidables = G.snakes.filter(s => !s.dead).concat(Object.values(G.remote));
  const p = safeSpot(420);
  G.player = makeSnake({ x: p.x, y: p.y, name: save.name || 'Rookie', skin: save.skin, angle: Math.atan2(-p.y, -p.x) });
  G.player.isPlayer = true;
  G.desired = G.player.angle;
  G.snakes.push(G.player);
  Object.assign(G, { state: 'playing', runTime: 0, runKos: 0, bestRank: 99, combo: 0, deathInfo: null });
  input.boostKey = input.boostMouse = input.boostTouch = false;
  if (G.mode === 'online' && net) {
    net.joinRoom(ROOM, { onPlayers: onRemotePlayers, onKill: v => awardKO(v.n || 'a player', G.player.x, G.player.y, true) });
  }
  hide('#startOverlay'); hide('#deathCard'); hide('#pauseOverlay');
  $('#pauseBtn').classList.toggle('hidden', G.mode !== 'solo');
  if (innerWidth < 820) $('#frame').scrollIntoView({ block: 'end', behavior: 'smooth' });
  toast(G.mode === 'online' ? 'You\'re live — good luck!' : 'Go get \'em!');
  syncFrameState();
}
function pause() {
  if (G.state !== 'playing') return;
  if (G.mode !== 'solo') { toast('Online runs can\'t be paused'); return; }
  G.state = 'paused';
  $('#soundToggle').checked = save.settings.sound;
  $('#sensitivity').value = save.settings.sensitivity;
  $('#shakeToggle').checked = save.settings.shake;
  show('#pauseOverlay'); hide('#pauseBtn');
  syncFrameState();
}
function resume() {
  if (G.state !== 'paused') return;
  G.state = 'playing';
  hide('#pauseOverlay');
  $('#pauseBtn').classList.toggle('hidden', G.mode !== 'solo');
  syncFrameState();
}
function toMenu() {
  if (G.player && G.state !== 'playing') { const i = G.snakes.indexOf(G.player); if (i >= 0) G.snakes.splice(i, 1); G.player = null; }
  G.state = 'menu';
  hide('#deathCard'); hide('#pauseOverlay'); show('#startOverlay'); hide('#pauseBtn');
  syncFrameState();
}

function playerDied(cause) {
  const p = G.player;
  G.state = 'dying';
  G.dyingT = cause.quit ? 0.15 : 1.2;
  if (!cause.quit) { shake(22); sfx.die(); navigator.vibrate?.(140); }
  const by = cause.by;
  if (net && G.mode === 'online') {
    if (by && by.isRemote) net.reportKill(by.uid, save.name || 'Rookie');
    net.leaveRoom();
    G.remote = {};
  }
  const score = Math.floor(p.mass);
  const newBest = score > save.best;
  const coins = Math.max(5, Math.floor(score / 6) + Math.floor(G.runTime / 15));
  const xp = Math.floor(score * 0.35 + G.runTime / 4 + G.runKos * 20) + 5;
  save.best = Math.max(save.best, score);
  save.runs++;
  save.coins += coins;
  save.history = [...save.history, { score, date: today() }].sort((a, b) => b.score - a.score).slice(0, 5);
  addXp(xp);
  persist();
  if (net && save.best > save.submittedBest) {
    net.submitScore(save.name || 'Rookie', save.best, save.skin, rankIndexFor(save.level)).then(() => { save.submittedBest = save.best; writeLocal(); }).catch(() => {});
  }
  G.deathInfo = {
    title: cause.quit ? 'Run ended' : newBest && score > 20 ? 'New record!' : pick(DEATH_TITLES),
    by: cause.quit ? 'You wrapped things up early.' : cause.wall ? 'You bonked into the arena wall.' : by ? `You ran into ${by.name}${by.isBot && G.mode === 'online' ? ' (bot)' : ''}.` : 'You got coiled.',
    score, newBest: newBest && score > 0, kos: G.runKos, time: G.runTime, rank: G.bestRank, coins, xp,
  };
}
function showDeath() {
  const d = G.deathInfo;
  G.state = 'dead';
  $('#deathTitle').textContent = d.title;
  $('#deathBy').textContent = d.by;
  $('#newBest').classList.toggle('hidden', !d.newBest);
  $('#finalScore').textContent = d.score.toLocaleString();
  $('#finalKos').textContent = d.kos;
  const t = Math.floor(d.time);
  $('#finalTime').textContent = t >= 60 ? `${Math.floor(t / 60)}m ${t % 60}s` : `${t}s`;
  $('#finalRank').textContent = d.rank < 99 ? `#${d.rank}` : '—';
  $('#runReward').textContent = d.coins;
  $('#runXp').textContent = d.xp;
  show('#deathCard'); hide('#pauseBtn');
  syncFrameState();
  setTimeout(() => $('#againBtn').focus({ preventScroll: true }), 50);
}
function awardKO(name, x, y, remote = false) {
  G.runKos++;
  save.kills++;
  save.coins += 15;
  persist();
  sfx.ko();
  shake(8);
  floatText(x, y - 30, 'KO! +15', '#ffd23f');
  if (remote) burst(G.player.x, G.player.y, effectById(save.effect));
  toast(`You took out ${name}! +15 coins`);
}
function xpNeed(level = save.level) { return 100 + (level - 1) * 60; }
function addXp(n) {
  save.xp += n;
  let leveled = false;
  const before = rankIndexFor(save.level);
  while (save.xp >= xpNeed()) { save.xp -= xpNeed(); save.level++; save.coins += 40; leveled = true; }
  const after = rankIndexFor(save.level);
  if (after > before) {
    grantRankRewards(save);
    const gained = RANKS.slice(before + 1, after + 1);
    setTimeout(() => showRankUp(gained), 1700);
  } else if (leveled) { setTimeout(() => { sfx.level(); toast(`Level ${save.level}! +40 coins`); }, 900); }
}

/* =========================================================
   multiplayer glue
   ========================================================= */
let net = null;
let publishAt = 0;
function onRemotePlayers(players) {
  const seen = new Set();
  for (const [uid, v] of Object.entries(players)) {
    if (!v || !v.b) continue;
    const flat = Array.isArray(v.b) ? v.b : Object.values(v.b);
    const target = expand(flat, v.k || 3);
    if (target.length < 2) continue;
    let r = G.remote[uid];
    if (!r) r = G.remote[uid] = { id: 'r' + uid, uid, isRemote: true, pts: target.map(p => ({ ...p })), x: target[0].x, y: target[0].y, dead: false, blink: rand(2, 6), bb: { x0: 0, x1: 0, y0: 0, y1: 0 }, r: radiusFor(v.s || 10) };
    r.name = String(v.n || 'Player').slice(0, 16);
    r.skin = v.c;
    r.mass = Math.max(0, Number(v.s) || 0);
    r.angle = Number(v.a) || 0;
    r.boosting = !!v.bo;
    r.rk = Number.isInteger(v.rk) ? clamp(v.rk, -1, RANKS.length - 1) : -1;
    r.targetPts = target;
    seen.add(uid);
  }
  for (const uid of Object.keys(G.remote)) if (!seen.has(uid)) delete G.remote[uid];
}
function expand(flat, k) {
  const pts = [];
  for (let i = 0; i + 1 < flat.length; i += 2) pts.push({ x: +flat[i] || 0, y: +flat[i + 1] || 0 });
  if (k <= 1 || pts.length < 2) return pts;
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    for (let j = 0; j < k; j++) out.push({ x: a.x + ((b.x - a.x) * j) / k, y: a.y + ((b.y - a.y) * j) / k });
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function updateRemote(dt) {
  const t = 1 - Math.exp(-dt * 12);
  for (const r of Object.values(G.remote)) {
    const tp = r.targetPts;
    if (!tp) continue;
    if (r.pts.length !== tp.length) {
      r.pts.length = Math.min(r.pts.length, tp.length);
      for (let i = r.pts.length; i < tp.length; i++) r.pts.push({ ...tp[i] });
    }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < tp.length; i++) {
      const p = r.pts[i];
      p.x += (tp[i].x - p.x) * t; p.y += (tp[i].y - p.y) * t;
      if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
    }
    r.x = r.pts[0].x; r.y = r.pts[0].y;
    r.bb = { x0, x1, y0, y1 };
    r.r = lerp(r.r, radiusFor(r.mass), t);
    r.blink -= dt; if (r.blink < -0.14) r.blink = rand(2, 6);
  }
}
function publishPlayer() {
  const p = G.player;
  const n = p.pts.length;
  const k = Math.max(3, Math.ceil(n / 110));
  const b = [];
  for (let i = 0; i < n; i += k) b.push(Math.round(p.pts[i].x), Math.round(p.pts[i].y));
  const l = p.pts[n - 1];
  if ((n - 1) % k) b.push(Math.round(l.x), Math.round(l.y));
  net.publish({ n: save.name || 'Rookie', s: Math.floor(p.mass), c: save.skin, a: Math.round(p.angle * 100) / 100, bo: p.boosting ? 1 : 0, rk: rankIndexFor(save.level), k, b });
}

/* =========================================================
   update loop
   ========================================================= */
function update(dt) {
  G.time += dt;
  collidables.length = 0;
  for (const s of G.snakes) if (!s.dead) collidables.push(s);
  for (const r of Object.values(G.remote)) collidables.push(r);

  const p = G.player;
  const playing = G.state === 'playing' && p && !p.dead;
  if (playing) {
    G.runTime += dt;
    G.desired = playerDesired(p);
    steer(p, G.desired, dt);
    updateBoost(p, input.boostKey || input.boostMouse || input.boostTouch, dt);
  }
  for (const s of G.snakes) if (s.isBot && !s.dead) botThink(s, dt);
  for (const s of G.snakes) if (!s.dead) moveSnake(s, dt);
  updateRemote(dt);

  for (const s of G.snakes.slice()) {
    if (s.dead) continue;
    if (s === p && G.state !== 'playing') continue;
    const hit = checkCollision(s);
    if (hit) killSnake(s, hit);
  }
  for (const s of G.snakes) if (!s.dead) eatFood(s, dt);

  // food upkeep
  const foods = G.foods;
  for (let i = foods.length - 1; i >= 0; i--) {
    const f = foods[i];
    if (f.max) {
      f.life -= dt;
      if (f.life <= 0) { foods[i] = foods[foods.length - 1]; foods.pop(); continue; }
    }
    if (f.vx || f.vy) { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.94; f.vy *= 0.94; }
  }
  for (let i = 0; i < 6 && foods.length < FOOD_TARGET; i++) spawnFood();

  // bot respawns
  for (let i = G.snakes.length - 1; i >= 0; i--) {
    const s = G.snakes[i];
    if (s.isBot && s.dead && G.time > s.respawnAt) { G.snakes.splice(i, 1); spawnBot(G.player && !G.player.dead ? G.player : null); }
  }

  for (const q of G.particles) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.95; q.vy *= 0.95; }
  G.particles = G.particles.filter(q => q.life > 0);
  for (const g of G.rings) g.life -= dt;
  G.rings = G.rings.filter(g => g.life > 0);
  for (const t of G.texts) { t.life -= dt; t.y -= 40 * dt; }
  G.texts = G.texts.filter(t => t.life > 0);

  if (playing && G.mode === 'online' && net && performance.now() - publishAt > 110) { publishAt = performance.now(); publishPlayer(); }
  if (G.state === 'dying') { G.dyingT -= dt; if (G.dyingT <= 0) showDeath(); }
  updateCamera(dt);
}

function updateCamera(dt) {
  let target = null;
  if (G.player && (G.state === 'playing' || G.state === 'paused' || G.state === 'dying')) target = G.player;
  else {
    if (!G.menuFollow || G.menuFollow.dead || G.time > G.menuSwitch || !G.snakes.includes(G.menuFollow)) {
      const alive = G.snakes.filter(s => s.isBot && !s.dead);
      G.menuFollow = alive.sort((a, b) => b.mass - a.mass)[(Math.random() * Math.min(3, alive.length)) | 0] || null;
      G.menuSwitch = G.time + 12;
    }
    target = G.menuFollow;
  }
  if (target) {
    const k = 1 - Math.exp(-dt * (G.state === 'playing' ? 7 : 2.5));
    G.cam.x += (target.x - G.cam.x) * k;
    G.cam.y += (target.y - G.cam.y) * k;
  }
  const base = Math.max(0.6, Math.sqrt(view.w * view.h) / 820);
  const r = target ? target.r : 12;
  const zt = base * clamp(1.22 - (r - 10) * 0.024, 0.74, 1.22) * (target === G.player ? 1 : 0.9);
  G.cam.zoom += (zt - G.cam.zoom) * (1 - Math.exp(-dt * 2.5));
  G.cam.shake = Math.max(0, G.cam.shake - dt * 45);
}

/* =========================================================
   rendering
   ========================================================= */
const canvas = $('#game');
const ctx = canvas.getContext('2d');
const mini = $('#minimap');
const mctx = mini.getContext('2d');
const view = { w: 800, h: 600, dpr: 1, x0: 0, x1: 0, y0: 0, y1: 0 };
const glowCache = new Map();
function glowSprite(color) {
  let c = glowCache.get(color);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.13, rgba(color, 1));
  gr.addColorStop(0.3, rgba(color, 0.8));
  gr.addColorStop(0.5, rgba(color, 0.2));
  gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  glowCache.set(color, c);
  return c;
}
const floorTile = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 90;
  const g = c.getContext('2d');
  g.strokeStyle = 'rgba(155,123,255,0.07)';
  g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(0, 0.75); g.lineTo(90, 0.75); g.moveTo(0.75, 0); g.lineTo(0.75, 90); g.stroke();
  g.fillStyle = 'rgba(56,225,255,0.14)';
  g.beginPath(); g.arc(45, 45, 2, 0, TAU); g.fill();
  return c;
})();
let floorPattern = null;
let floorGrad = null;

function resize() {
  const r = canvas.getBoundingClientRect();
  const coarse = matchMedia('(pointer: coarse)').matches;
  view.dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.75 : 2);
  view.w = Math.max(1, r.width); view.h = Math.max(1, r.height);
  canvas.width = Math.floor(view.w * view.dpr);
  canvas.height = Math.floor(view.h * view.dpr);
}

function render() {
  const { w, h, dpr } = view;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#07061a';
  ctx.fillRect(0, 0, w, h);
  const z = G.cam.zoom;
  const sx = G.cam.shake ? rand(-1, 1) * G.cam.shake * 0.5 : 0;
  const sy = G.cam.shake ? rand(-1, 1) * G.cam.shake * 0.5 : 0;
  ctx.save();
  ctx.translate(w / 2 + sx, h / 2 + sy);
  ctx.scale(z, z);
  ctx.translate(-G.cam.x, -G.cam.y);
  const hw = w / 2 / z + 80, hh = h / 2 / z + 80;
  view.x0 = G.cam.x - hw; view.x1 = G.cam.x + hw; view.y0 = G.cam.y - hh; view.y1 = G.cam.y + hh;

  // arena floor
  if (!floorPattern) floorPattern = ctx.createPattern(floorTile, 'repeat');
  if (!floorGrad) {
    floorGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, ARENA_R);
    floorGrad.addColorStop(0, '#1b1650');
    floorGrad.addColorStop(0.7, '#141040');
    floorGrad.addColorStop(1, '#0f0c30');
  }
  ctx.beginPath(); ctx.arc(0, 0, ARENA_R, 0, TAU);
  ctx.fillStyle = floorGrad; ctx.fill();
  ctx.fillStyle = floorPattern; ctx.fill();

  // glowing border (brighter when the player is close)
  let near = 0;
  if (G.player && !G.player.dead) near = clamp(1 - (ARENA_R - Math.hypot(G.player.x, G.player.y)) / 260, 0, 1);
  const pulse = near ? 0.5 + Math.sin(G.time * 10) * 0.5 * near : 0;
  ctx.lineWidth = 34; ctx.strokeStyle = `rgba(255,95,162,${0.07 + pulse * 0.12})`; ctx.stroke();
  ctx.lineWidth = 12; ctx.strokeStyle = `rgba(255,95,162,${0.16 + pulse * 0.2})`; ctx.stroke();
  ctx.lineWidth = 4; ctx.strokeStyle = '#ff5fa2'; ctx.stroke();

  // food
  ctx.globalCompositeOperation = 'lighter';
  for (const f of G.foods) {
    if (f.x < view.x0 || f.x > view.x1 || f.y < view.y0 || f.y > view.y1) continue;
    const r = f.r * (1 + Math.sin(G.time * (f.big ? 6 : 3) + f.ph) * (f.big ? 0.22 : 0.14));
    ctx.globalAlpha = f.max ? Math.min(1, f.life / 3) : 1;
    const s = r * 6.5;
    ctx.drawImage(glowSprite(f.color), f.x - s / 2, f.y - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  // snakes (player drawn last so it's always on top)
  for (const r of Object.values(G.remote)) drawSnake(r, false);
  for (const s of G.snakes) if (!s.dead && s !== G.player) drawSnake(s, false);
  if (G.player && !G.player.dead) drawSnake(G.player, true);

  // particles
  ctx.globalCompositeOperation = 'lighter';
  for (const q of G.particles) {
    ctx.globalAlpha = clamp(q.life / q.max, 0, 1);
    const s = q.size * 5;
    ctx.drawImage(glowSprite(q.color), q.x - s / 2, q.y - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  for (const g of G.rings) {
    const t = 1 - g.life / 0.9;
    ctx.globalAlpha = clamp(g.life * 1.4, 0, 1);
    ctx.strokeStyle = g.color; ctx.lineWidth = 6 * (1 - t) + 1;
    ctx.beginPath(); ctx.arc(g.x, g.y, 10 + g.max * t, 0, TAU); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  // floating text
  ctx.textAlign = 'center';
  ctx.font = '700 22px Fredoka, sans-serif';
  for (const t of G.texts) {
    ctx.globalAlpha = clamp(t.life, 0, 1);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawSnake(s, isMe) {
  const pts = s.pts, n = pts.length;
  if (n < 2) return;
  const pad = 60;
  if (s.bb && (s.bb.x1 < view.x0 - pad || s.bb.x0 > view.x1 + pad || s.bb.y1 < view.y0 - pad || s.bb.y0 > view.y1 + pad)) return;
  const cols = skinColors(s);
  const r = s.r;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // glow + outline along the body
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 2; i < n; i += 2) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.lineTo(pts[n - 1].x, pts[n - 1].y);
  ctx.strokeStyle = rgba(cols[0], s.boosting ? 0.34 : 0.14);
  ctx.lineWidth = r * 2 + (s.boosting ? 30 : 18);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(6,4,20,0.6)';
  ctx.lineWidth = r * 1.7 + 4;
  ctx.stroke();

  // segments, tail -> head
  const step = Math.max(1, Math.round((r * 0.55) / SP));
  const band = step * 3;
  for (let i = n - 1 - ((n - 1) % step); i >= step; i -= step) {
    const p = pts[i];
    const t = i / n;
    const rr = t > 0.65 ? r * (1 - ((t - 0.65) / 0.35) * 0.5) : r;
    ctx.fillStyle = cols[Math.floor(i / band) % cols.length];
    ctx.beginPath();
    ctx.arc(p.x, p.y, rr, 0, TAU);
    ctx.fill();
  }
  // soft shine along the back
  ctx.beginPath();
  const o = r * 0.32;
  ctx.moveTo(pts[0].x - o, pts[0].y - o);
  for (let i = 3; i < n * 0.7; i += 3) ctx.lineTo(pts[i].x - o, pts[i].y - o);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = r * 0.5;
  ctx.stroke();

  // elite skins twinkle
  if (skinById(s.skin).elite) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 8; i < n; i += 22) {
      const tw = Math.sin(G.time * 5 + i * 0.7);
      if (tw < 0.2) continue;
      ctx.globalAlpha = tw;
      const sz = r * 1.6 * tw;
      ctx.drawImage(glowSprite('#ffffff'), pts[i].x - sz / 2 - r * 0.25, pts[i].y - sz / 2 - r * 0.25, sz, sz);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // head
  const hx = s.x, hy = s.y, a = s.angle;
  const fx = Math.cos(a), fy = Math.sin(a), px = -fy, py = fx;
  ctx.fillStyle = cols[0];
  ctx.beginPath(); ctx.arc(hx, hy, r * 1.08, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.arc(hx - r * 0.3, hy - r * 0.35, r * 0.45, 0, TAU); ctx.fill();

  // eyes
  const look = isMe ? G.desired : (s.target ?? a);
  const lx = Math.cos(look), ly = Math.sin(look);
  const er = r * 0.42;
  const blinking = s.blink < 0;
  for (const side of [-1, 1]) {
    const ex = hx + fx * r * 0.38 + px * side * r * 0.5;
    const ey = hy + fy * r * 0.38 + py * side * r * 0.5;
    if (blinking) {
      ctx.strokeStyle = '#1a1644'; ctx.lineWidth = r * 0.16;
      ctx.beginPath(); ctx.moveTo(ex - px * er * 0.8, ey - py * er * 0.8); ctx.lineTo(ex + px * er * 0.8, ey + py * er * 0.8); ctx.stroke();
      continue;
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ex, ey, er, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1644';
    ctx.beginPath(); ctx.arc(ex + lx * er * 0.38, ey + ly * er * 0.38, er * 0.55, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ex + lx * er * 0.38 - er * 0.18, ey + ly * er * 0.38 - er * 0.2, er * 0.18, 0, TAU); ctx.fill();
  }
  // rosy cheeks for extra cuteness
  ctx.fillStyle = 'rgba(255,95,162,0.35)';
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.arc(hx - fx * r * 0.15 + px * side * r * 0.82, hy - fy * r * 0.15 + py * side * r * 0.82, r * 0.2, 0, TAU); ctx.fill();
  }

  // name tag
  if (skinById(s.skin).crown) drawCrown(hx, hy - r * 1.05, r);
  const label = isMe ? (save.name || 'You') : s.name;
  const rk = isMe ? rankIndexFor(save.level) : (s.rk ?? -1);
  ctx.font = '700 13px Nunito, sans-serif';
  ctx.textAlign = 'center';
  const bw = rk >= 0 ? 20 : 0;
  const tw = ctx.measureText(label).width + 16 + bw;
  const ty = hy - r - (skinById(s.skin).crown ? 36 : 26);
  ctx.fillStyle = isMe ? 'rgba(56,225,255,0.22)' : 'rgba(10,8,30,0.55)';
  pill(hx - tw / 2, ty, tw, 19, 9.5);
  ctx.fill();
  if (rk >= 0) drawRankChip(hx - tw / 2 + 11, ty + 9.5, RANKS[rk]);
  ctx.fillStyle = isMe ? '#bff4ff' : '#e9e6ff';
  ctx.fillText(label, hx + bw / 2, ty + 14);
}
function drawRankChip(x, y, R) {
  ctx.beginPath();
  ctx.moveTo(x, y - 8); ctx.lineTo(x + 7, y - 5); ctx.lineTo(x + 7, y + 2); ctx.lineTo(x, y + 8); ctx.lineTo(x - 7, y + 2); ctx.lineTo(x - 7, y - 5); ctx.closePath();
  ctx.fillStyle = R.tier.color; ctx.fill();
  ctx.fillStyle = '#1a1644';
  ctx.font = '800 9px Nunito, sans-serif';
  ctx.fillText(R.tier.name[0] + R.div, x, y + 3);
  ctx.font = '700 13px Nunito, sans-serif';
}
function drawCrown(x, y, r) {
  const w = r * 1.2, h = r * 0.75;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2, y - h); ctx.lineTo(x - w / 4, y - h * 0.45); ctx.lineTo(x, y - h * 1.1);
  ctx.lineTo(x + w / 4, y - h * 0.45); ctx.lineTo(x + w / 2, y - h); ctx.lineTo(x + w / 2, y); ctx.closePath();
  ctx.fillStyle = '#ffd23f'; ctx.fill();
  ctx.strokeStyle = 'rgba(120,70,0,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#ff5fa2';
  ctx.beginPath(); ctx.arc(x, y - h * 0.35, r * 0.12, 0, TAU); ctx.fill();
}
function pill(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + r, y + h); ctx.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5); ctx.closePath();
}

let miniFrame = 0;
function renderMinimap() {
  if (miniFrame++ % 5) return;
  const S = mini.width, c = S / 2, k = (S / 2 - 6) / ARENA_R;
  mctx.clearRect(0, 0, S, S);
  mctx.fillStyle = 'rgba(13,11,36,0.72)';
  mctx.beginPath(); mctx.arc(c, c, S / 2 - 2, 0, TAU); mctx.fill();
  mctx.strokeStyle = 'rgba(255,95,162,0.7)'; mctx.lineWidth = 3; mctx.stroke();
  const dot = (x, y, r, col) => { mctx.fillStyle = col; mctx.beginPath(); mctx.arc(c + x * k, c + y * k, r, 0, TAU); mctx.fill(); };
  for (const s of G.snakes) if (!s.dead && s !== G.player) dot(s.x, s.y, 3 + Math.min(5, s.mass / 60), skinColors(s)[0]);
  for (const r of Object.values(G.remote)) dot(r.x, r.y, 5, '#ff5fa2');
  if (G.player && !G.player.dead) { dot(G.player.x, G.player.y, 9, 'rgba(255,255,255,0.25)'); dot(G.player.x, G.player.y, 5.5, '#fff'); }
}

/* =========================================================
   HUD + panels
   ========================================================= */
let hudAt = 0, boardAt = 0;
function hud(now) {
  const p = G.player;
  $('#boostMeter').style.width = `${p ? p.energy : 100}%`;
  if (now - hudAt < 100) return;
  hudAt = now;
  const everyone = collidables.filter(s => !s.dead);
  $('#aliveCount').textContent = Math.max(1, everyone.length);
  if (p && !p.dead) {
    const score = Math.floor(p.mass);
    $('#score').textContent = score.toLocaleString();
    const rank = 1 + everyone.filter(s => s !== p && s.mass > p.mass).length;
    $('#rank').textContent = rank;
    if (G.state === 'playing' && G.runTime > 1) G.bestRank = Math.min(G.bestRank, rank);
  }
  $('#boostBtn').classList.toggle('on', !!(p && p.boosting));
  if (now - boardAt > 500) { boardAt = now; if (boardTab === 'arena') renderBoard(); }
}

let boardTab = 'arena';
function renderBoard() {
  const el = $('#leaderboard'), note = $('#boardNote');
  if (boardTab === 'arena') {
    const rows = collidables.filter(s => !s.dead).map(s => ({
      name: s === G.player ? save.name || 'Rookie' : s.name, score: Math.floor(s.mass), color: skinColors(s)[0],
      me: s === G.player, tag: s.isRemote ? '' : s.isBot && G.mode === 'online' ? 'bot' : '',
      rk: s === G.player ? rankIndexFor(save.level) : (s.rk ?? -1),
    })).sort((a, b) => b.score - a.score);
    const top = rows.slice(0, 8);
    const meIdx = rows.findIndex(r => r.me);
    if (meIdx >= 8) top[7] = { ...rows[meIdx], rank: meIdx + 1 };
    el.innerHTML = top.map((r, i) => row(r.rank || i + 1, r.name, r.score, r.color, r.me, r.tag, r.rk)).join('');
    note.textContent = G.mode === 'online' ? (Object.keys(G.remote).length ? `${Object.keys(G.remote).length} real player${Object.keys(G.remote).length > 1 ? 's' : ''} in your arena` : 'No one else here yet — share your link!') : '';
  } else {
    if (G.globalRows) {
      el.innerHTML = G.globalRows.length
        ? G.globalRows.map((r, i) => row(i + 1, r.name, r.score, skinById(r.skin).colors[0], net && r.uid === net.uid, '', Number.isInteger(r.rk) ? r.rk : -1)).join('')
        : '<li class="empty">No scores yet — be the first!</li>';
      note.textContent = 'Worldwide best scores.';
    } else {
      el.innerHTML = save.history.length
        ? save.history.map((h, i) => row(i + 1, h.date, h.score, skinById(save.skin).colors[0], false)).join('')
        : '<li class="empty">Play a run to set a record</li>';
      note.textContent = net ? 'Loading worldwide scores…' : 'Your best runs on this device. Turn on Firebase for a worldwide board.';
    }
  }
}
function row(rank, name, score, color, me, tag = '', rk = null) {
  return `<li class="${me ? 'me' : ''}"><span class="rk">${rank}</span><span class="dot" style="background:${color};--c:${color}"></span>${rk !== null && rk >= 0 ? badgeHTML(rk) : ''}<span class="nm">${esc(name)}${me ? ' <small>(you)</small>' : ''}${tag ? ` <small>${tag}</small>` : ''}</span><span class="sc">${Number(score).toLocaleString()}</span></li>`;
}

function renderProfile() {
  $('#playerName').textContent = save.name || 'Rookie';
  $('#wallet').textContent = save.coins.toLocaleString();
  $('#level').textContent = save.level;
  $('#levelText').textContent = save.level;
  $('#xpText').textContent = `${save.xp} / ${xpNeed()} XP`;
  $('#xpFill').style.width = `${Math.min(100, (save.xp / xpNeed()) * 100)}%`;
  $('#bestScore').textContent = save.best.toLocaleString();
  $('#hudBest').textContent = save.best.toLocaleString();
  $('#totalKills').textContent = save.kills.toLocaleString();
  $('#totalRuns').textContent = save.runs.toLocaleString();
  $('#soundBtn').classList.toggle('muted', !save.settings.sound);
  $('#shopPreview').innerHTML = SKINS.slice(1, 5).map(s => `<span style="background:${skinCss(s)}"></span>`).join('');
  const ri = rankIndexFor(save.level), next = RANKS[ri + 1];
  $('#rankRow').innerHTML = `${badgeHTML(ri, 'mid')}<span class="rank-txt"><b>${rankName(ri)}</b><small>${next ? `Next: ${next.name} at level ${next.level}` : 'Top rank reached!'}</small></span>`;
  $('.avatar-wrap').style.setProperty('--tier', ri >= 0 ? RANKS[ri].tier.color : '#9b7bff');
  drawAvatar();
  renderDaily();
  if (G.player && !G.player.dead) { G.player.skin = save.skin; G.player.name = save.name || 'Rookie'; }
}
function drawAvatar() {
  const c = $('#avatar'), g = c.getContext('2d'), S = c.width;
  g.clearRect(0, 0, S, S);
  const bg = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  bg.addColorStop(0, '#231d5c'); bg.addColorStop(1, '#120f33');
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  const cols = skinById(save.skin).colors;
  const pts = [];
  for (let t = 0; t <= 1; t += 0.012) {
    const a = t * TAU * 1.45 + 2.2, rr = S * (0.34 - t * 0.2);
    pts.push({ x: S / 2 + Math.cos(a) * rr, y: S / 2 + Math.sin(a) * rr * 0.92 });
  }
  const R = S * 0.085;
  pts.forEach((p, i) => {
    g.fillStyle = cols[Math.floor(i / 6) % cols.length];
    g.beginPath(); g.arc(p.x, p.y, R * (0.55 + 0.45 * (i / pts.length)), 0, TAU); g.fill();
  });
  const h = pts[pts.length - 1], prev = pts[pts.length - 4];
  const a = Math.atan2(h.y - prev.y, h.x - prev.x);
  g.fillStyle = cols[0];
  g.beginPath(); g.arc(h.x, h.y, R * 1.25, 0, TAU); g.fill();
  for (const side of [-1, 1]) {
    const ex = h.x + Math.cos(a) * R * 0.4 - Math.sin(a) * side * R * 0.55;
    const ey = h.y + Math.sin(a) * R * 0.4 + Math.cos(a) * side * R * 0.55;
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, R * 0.45, 0, TAU); g.fill();
    g.fillStyle = '#1a1644'; g.beginPath(); g.arc(ex + Math.cos(a) * R * 0.15, ey + Math.sin(a) * R * 0.15, R * 0.24, 0, TAU); g.fill();
  }
}
function skinCss(s) {
  if (s.colors.length < 2) return s.colors[0];
  const w = 14;
  return `repeating-linear-gradient(90deg, ${s.colors.map((c, i) => `${c} ${i * w}px ${(i + 1) * w}px`).join(', ')})`;
}
function renderDaily() {
  const claimed = save.daily === today();
  const next = save.daily === yesterday() ? save.streak + 1 : 1;
  const reward = 50 + Math.min(next - 1, 5) * 10;
  $('#dailyBtn').disabled = claimed;
  $('#dailyBtn').textContent = claimed ? 'Done' : 'Claim';
  $('#dailyText').textContent = claimed ? `Day ${save.streak} streak · back tomorrow` : next > 1 ? `Day ${next} streak · ${reward} coins` : `Claim ${reward} free coins`;
}
function claimDaily() {
  if (save.daily === today()) return;
  save.streak = save.daily === yesterday() ? save.streak + 1 : 1;
  const reward = 50 + Math.min(save.streak - 1, 5) * 10;
  save.daily = today();
  save.coins += reward;
  persist();
  sfx.coin();
  toast(`Daily drop! +${reward} coins`);
}

/* ---------- ranks UI ---------- */
function badgeHTML(ri, cls = '') {
  if (ri < 0 || !RANKS[ri]) return `<span class="rbadge none ${cls}" title="Unranked">–</span>`;
  const R = RANKS[ri];
  return `<span class="rbadge ${cls}" style="--t:${R.tier.color};--d:${R.tier.dark}" title="${R.name}">${R.tier.name[0]}${R.div}</span>`;
}
function rewardItem(rw) { return rw.type === 'skin' ? skinById(rw.id) : effectById(rw.id); }
function rewardPreview(rw) {
  const it = rewardItem(rw);
  return rw.type === 'skin'
    ? `<span class="snake-pv sm" style="background:${skinCss(it)};--glow:${it.colors[0]}88"></span>`
    : `<span class="fx-pv sm" style="color:${it.color}">${it.icon}</span>`;
}
let rankQueue = [];
function showRankUp(ranks) {
  rankQueue.push(...ranks);
  if (!$('#rankModal').classList.contains('hidden')) return;
  nextRankUp();
}
function nextRankUp() {
  const R = rankQueue.shift();
  if (!R) { hide('#rankModal'); return; }
  const it = rewardItem(R.reward);
  $('#rankBadge').innerHTML = badgeHTML(R.i, 'huge');
  $('#rankTitle').textContent = R.name;
  $('#rankReward').innerHTML = `${rewardPreview(R.reward)}<span><small>${R.reward.type === 'skin' ? 'New skin' : 'New KO effect'} unlocked</small><b>${esc(it.name)}</b></span>`;
  $('#rankEquip').dataset.type = R.reward.type;
  $('#rankEquip').dataset.id = R.reward.id;
  $('#rankModal').style.setProperty('--t', R.tier.color);
  show('#rankModal');
  sfx.level();
  burstConfetti(R.tier.color);
}
function burstConfetti(color) {
  const box = $('#rankConfetti');
  box.innerHTML = Array.from({ length: 28 }, (_, i) => `<i style="--x:${rand(-160, 160) | 0}px;--y:${rand(-190, -60) | 0}px;--r:${rand(-300, 300) | 0}deg;--c:${pick([color, '#fff', '#ffd23f', '#ff5fa2', '#38e1ff'])};animation-delay:${(i % 6) * 0.03}s"></i>`).join('');
}
function renderLadder() {
  const ri = rankIndexFor(save.level);
  return `<div class="ladder">${TIERS.map((tier, t) => `
    <section class="tier" style="--t:${tier.color};--d:${tier.dark}">
      <h4>${tier.name}</h4>
      ${[0, 1, 2].map(d => {
        const R = RANKS[t * 3 + d], got = R.i <= ri, it = rewardItem(R.reward);
        const owned = R.reward.type === 'skin' ? save.skin === it.id : save.effect === it.id;
        const btn = !got ? `<span class="lock">Level ${R.level}</span>`
          : owned ? '<button class="item-btn" disabled>Equipped</button>'
          : `<button class="item-btn eq" data-id="${it.id}" data-type="${R.reward.type}">Equip</button>`;
        return `<div class="rung ${got ? 'got' : ''} ${R.i === ri ? 'current' : ''}">${badgeHTML(R.i)}<div class="rung-info"><b>${R.name}</b><small>${R.reward.type === 'skin' ? 'Skin' : 'KO effect'} · ${esc(it.name)}</small></div><div class="rung-pv">${rewardPreview(R.reward)}</div>${btn}</div>`;
      }).join('')}
    </section>`).join('')}</div>`;
}

/* ---------- shop ---------- */
let shopTab = 'skins';
function openShop() { renderShop(); show('#shopModal'); sfx.click(); if (G.state === 'playing' && G.mode === 'solo') pause(); }
function renderShop() {
  $('#shopWallet').textContent = save.coins.toLocaleString();
  $('#shopItems').classList.toggle('ladder-mode', shopTab === 'ranks');
  if (shopTab === 'ranks') {
    const ri = rankIndexFor(save.level), next = RANKS[ri + 1];
    $('#shopItems').innerHTML = `<p class="ladder-intro">You're <b>${rankName(ri)}</b> (level ${save.level}). ${next ? `Reach level ${next.level} for <b>${next.name}</b>.` : 'You made it to the top!'} Every rank unlocks an exclusive reward.</p>` + renderLadder();
    $$('#shopItems .item-btn[data-id]').forEach(b => { b.onclick = () => buyOrEquip(b.dataset.id, b.dataset.type); });
    return;
  }
  const list = shopTab === 'skins' ? SKINS : EFFECTS;
  const owned = shopTab === 'skins' ? save.ownedSkins : save.ownedEffects;
  const equipped = shopTab === 'skins' ? save.skin : save.effect;
  $('#shopWallet').textContent = save.coins.toLocaleString();
  $('#shopItems').innerHTML = list.map(it => {
    const own = owned.includes(it.id), eq = equipped === it.id;
    const pv = shopTab === 'skins'
      ? `<span class="snake-pv" style="background:${skinCss(it)};--glow:${it.colors[0]}88"></span>`
      : `<span class="fx-pv" style="color:${it.color}">${it.icon}</span>`;
    const R = it.rarity === 'rank' ? RANKS[it.rank] : null;
    const btn = eq ? '<button class="item-btn" disabled>Equipped</button>'
      : own ? `<button class="item-btn eq" data-id="${it.id}">Equip</button>`
      : R ? `<button class="item-btn locked" data-id="${it.id}">Reach ${R.name}</button>`
      : `<button class="item-btn buy ${save.coins < it.cost ? 'cant' : ''}" data-id="${it.id}"><span class="coin"></span>${it.cost}</button>`;
    return `<article class="item ${eq ? 'equipped' : ''}"><div class="item-pv">${pv}</div><div class="item-name">${esc(it.name)}</div><div class="item-rarity r-${it.rarity}" ${R ? `style="color:${R.tier.color}"` : ''}>${R ? `${R.name} reward` : it.rarity}</div>${btn}</article>`;
  }).join('');
  $$('#shopItems .item-btn[data-id]').forEach(b => { b.onclick = () => buyOrEquip(b.dataset.id); });
}
function buyOrEquip(id, type) {
  const skins = type ? type === 'skin' : shopTab === 'skins';
  const item = (skins ? SKINS : EFFECTS).find(x => x.id === id);
  const owned = skins ? save.ownedSkins : save.ownedEffects;
  if (!item) return;
  if (!owned.includes(id) && item.rarity === 'rank') { toast(`Reach ${RANKS[item.rank].name} (level ${RANKS[item.rank].level}) to unlock`); return; }
  if (!owned.includes(id)) {
    if (save.coins < item.cost) { toast(`Need ${item.cost - save.coins} more coins`); sfx.tone(200, 0.12, { type: 'square', vol: 0.04 }); return; }
    save.coins -= item.cost;
    owned.push(id);
    sfx.coin();
    toast(`${item.name} unlocked!`);
  } else { sfx.click(); toast(`${item.name} equipped`); }
  if (skins) save.skin = id; else save.effect = id;
  persist();
  renderShop();
}

/* ---------- misc UI ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
const show = s => $(s).classList.remove('hidden');
const hide = s => $(s).classList.add('hidden');
function syncFrameState() { $('#frame').dataset.state = G.state; }

function setMode(mode) {
  if (G.state === 'playing' || G.state === 'paused' || G.state === 'dying') { toast('Finish this run first'); return; }
  if (mode === 'online' && !net) {
    toast(isConfigured(FB_CONFIG) ? 'Still connecting to the server…' : 'Online play needs Firebase — see SETUP guide');
    return;
  }
  G.mode = mode;
  $$('.mode').forEach(b => { const on = b.dataset.mode === mode; b.classList.toggle('active', on); b.setAttribute('aria-checked', on); });
  $('#modeKicker').textContent = mode === 'online' ? 'Online arena' : 'Solo arena';
  $('#arenaStatus').textContent = mode === 'online' ? 'Online arena · live' : 'Solo arena';
  $('#liveDot').classList.toggle('online', mode === 'online');
  fillWorld();
  renderBoard();
}

function setNetStatus(state) {
  const pill = $('#netPill'), txt = $('#netText');
  pill.classList.remove('on', 'warn');
  if (state === 'online') { pill.classList.add('on'); txt.textContent = G.onlineCount ? `${G.onlineCount} online` : 'Online'; }
  else if (state === 'connecting' || state === 'reconnecting') { pill.classList.add('warn'); txt.textContent = 'Connecting…'; }
  else if (state === 'error') { pill.classList.add('warn'); txt.textContent = 'Offline'; }
  else txt.textContent = 'Offline mode';
}
function renderAccount(user) {
  const dot = $('#acctDot'), text = $('#acctText'), btn = $('#googleBtn');
  if (!net) {
    dot.classList.remove('on');
    text.textContent = 'Progress is saved in this browser.';
    btn.classList.add('hidden');
    return;
  }
  dot.classList.add('on');
  if (user && !user.anonymous) {
    text.textContent = `Signed in${user.name ? ` as ${user.name}` : ''} — progress syncs on every device.`;
    btn.classList.add('hidden');
  } else {
    text.textContent = 'Playing as guest — progress is backed up to the cloud.';
    btn.classList.remove('hidden');
  }
}

/* ---------- cloud save ---------- */
let cloudTimer = null;
function scheduleCloudSave() {
  if (!net) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => {
    const { settings, updated, ...data } = save;
    net.saveProfile(data).catch(e => console.warn('cloud save failed', e));
  }, 1500);
}
async function syncProfile() {
  try {
    const cloud = await net.loadProfile();
    if (cloud) {
      const c = normalize(cloud);
      const base = (c.updated || 0) > (save.updated || 0) ? c : save;
      const merged = {
        ...base,
        best: Math.max(c.best, save.best),
        kills: Math.max(c.kills, save.kills),
        runs: Math.max(c.runs, save.runs),
        submittedBest: Math.max(c.submittedBest, save.submittedBest),
        ownedSkins: [...new Set([...c.ownedSkins, ...save.ownedSkins])],
        ownedEffects: [...new Set([...c.ownedEffects, ...save.ownedEffects])],
        history: [...c.history, ...save.history].sort((a, b) => b.score - a.score).filter((h, i, arr) => arr.findIndex(x => x.score === h.score && x.date === h.date) === i).slice(0, 5),
        name: base.name || save.name || c.name,
        settings: save.settings,
      };
      save = normalize(merged);
      writeLocal();
      renderProfile();
      if (save.name) hide('#nameModal');
    }
    scheduleCloudSave();
    if (save.best > 0) net.submitScore(save.name || 'Rookie', save.best, save.skin, rankIndexFor(save.level)).then(() => { save.submittedBest = save.best; writeLocal(); }).catch(() => {});
  } catch (e) { console.warn('Could not load cloud profile', e); }
}

async function connect() {
  if (RUNNING_FROM_FILE && isConfigured(FB_CONFIG)) {
    setNetStatus('offline');
    $('#onlineSub').textContent = 'Needs the website';
    setTimeout(() => toast('Opened as a file — online play works on your website link'), 1500);
    return;
  }
  try {
    net = await initNet(FB_CONFIG, {
      onStatus: setNetStatus,
      onUser: (user, changed) => { renderAccount(user); if (changed) syncProfile(); },
    });
  } catch (e) {
    console.warn('Firebase unavailable — playing offline.', e);
    setNetStatus('error');
    $('#onlineSub').textContent = 'Server unavailable';
    net = null;
    return;
  }
  if (!net) return;
  $('#onlineSub').textContent = 'Real players, live';
  renderAccount(net.user);
  syncProfile();
  net.watchLeaderboard(rows => { G.globalRows = rows; if (boardTab === 'global') renderBoard(); });
  net.watchOnline(n => { G.onlineCount = n; setNetStatus('online'); $('#onlineCount').textContent = `${n} player${n === 1 ? '' : 's'} online now`; });
}

/* =========================================================
   input + events
   ========================================================= */
function pointerPos(e) {
  const r = canvas.getBoundingClientRect();
  input.mx = e.clientX - r.left;
  input.my = e.clientY - r.top;
  input.hasPointer = true;
  input.lastPointer = performance.now();
}
function modalOpen() { return !$('#rankModal').classList.contains('hidden') || !$('#shopModal').classList.contains('hidden') || !$('#nameModal').classList.contains('hidden'); }

function bindEvents() {
  new ResizeObserver(resize).observe(canvas);
  canvas.addEventListener('pointermove', pointerPos);
  canvas.addEventListener('pointerdown', e => {
    pointerPos(e);
    if (e.pointerType === 'mouse' && e.button === 0 && G.state === 'playing') input.boostMouse = true;
  });
  window.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') input.boostMouse = false; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  const boostBtn = $('#boostBtn');
  boostBtn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); input.boostTouch = true; try { boostBtn.setPointerCapture(e.pointerId); } catch {} });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) boostBtn.addEventListener(ev, () => { input.boostTouch = false; });

  $('#playBtn').onclick = startRun;
  $('#againBtn').onclick = startRun;
  $('#menuBtn').onclick = () => { sfx.click(); toMenu(); };
  $('#pauseBtn').onclick = pause;
  $('#resumeBtn').onclick = resume;
  $('#restartBtn').onclick = () => { G.player.dead = true; G.snakes.splice(G.snakes.indexOf(G.player), 1); G.state = 'menu'; startRun(); };
  $('#quitBtn').onclick = () => { G.state = 'playing'; hide('#pauseOverlay'); killSnake(G.player, { quit: true }); };
  $('#shopBtn').onclick = openShop;
  $('#closeShop').onclick = () => { hide('#shopModal'); sfx.click(); };
  $('#shopModal').addEventListener('click', e => { if (e.target.id === 'shopModal') hide('#shopModal'); });
  $$('.shop-tab').forEach(b => { b.onclick = () => { $$('.shop-tab').forEach(x => x.classList.toggle('active', x === b)); shopTab = b.dataset.tab; renderShop(); sfx.click(); }; });
  $$('.board-tab').forEach(b => { b.onclick = () => { $$('.board-tab').forEach(x => x.classList.toggle('active', x === b)); boardTab = b.dataset.board; renderBoard(); }; });
  $$('.mode').forEach(b => { b.onclick = () => { sfx.click(); setMode(b.dataset.mode); }; });
  $('#dailyBtn').onclick = claimDaily;
  $('#rankRow').onclick = () => { shopTab = 'ranks'; $$('.shop-tab').forEach(x => x.classList.toggle('active', x.dataset.tab === 'ranks')); openShop(); };
  $('#rankClose').onclick = () => { sfx.click(); nextRankUp(); };
  $('#rankEquip').onclick = () => { const b = $('#rankEquip'); buyOrEquip(b.dataset.id, b.dataset.type); nextRankUp(); };
  $('#nameBtn').onclick = () => { $('#nameInput').value = save.name; show('#nameModal'); setTimeout(() => $('#nameInput').focus(), 30); };
  $('#saveName').onclick = () => {
    const n = $('#nameInput').value.replace(/\s+/g, ' ').trim().slice(0, 16);
    if (!n) { $('#nameInput').focus(); return; }
    save.name = n;
    persist();
    hide('#nameModal');
    sfx.click();
    toast(`Hi, ${n}!`);
    if (net && save.best > 0) net.submitScore(n, save.best, save.skin, rankIndexFor(save.level)).catch(() => {});
  };
  $('#nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#saveName').click(); } });
  $('#nameModal').addEventListener('click', e => { if (e.target.id === 'nameModal' && save.name) hide('#nameModal'); });

  const toggleSound = () => { save.settings.sound = !save.settings.sound; persist(); if (save.settings.sound) sfx.click(); toast(save.settings.sound ? 'Sound on' : 'Sound off'); };
  $('#soundBtn').onclick = toggleSound;
  $('#soundToggle').onchange = e => { save.settings.sound = e.target.checked; persist(); };
  $('#sensitivity').oninput = e => { save.settings.sensitivity = Number(e.target.value); persist(); };
  $('#shakeToggle').onchange = e => { save.settings.shake = e.target.checked; persist(); };

  $('#googleBtn').onclick = async () => {
    if (!net) return;
    try {
      const u = await net.signInGoogle();
      toast(`Signed in${u.name ? ` as ${u.name}` : ''}!`);
      syncProfile();
    } catch (e) {
      const code = e && e.code || '';
      if (code.includes('popup-closed') || code.includes('cancelled-popup')) return;
      if (code.includes('operation-not-allowed')) toast('Turn on Google sign-in in Firebase first');
      else if (code.includes('unauthorized-domain')) toast('Add this site to Firebase authorized domains');
      else if (code.includes('popup-blocked')) toast('Allow pop-ups to sign in');
      else toast('Sign-in didn\'t work — try again');
      console.warn(e);
    }
  };

  $('#resetBtn').onclick = () => {
    if (!confirm('Reset coins, skins and stats on this device?')) return;
    const settings = save.settings;
    save = normalize({ settings });
    persist();
    toast('Save reset');
  };

  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'range') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (G.state === 'playing') input.boostKey = true;
      return;
    }
    if (e.key === 'Escape') {
      if (!$('#rankModal').classList.contains('hidden')) { nextRankUp(); return; }
      if (!$('#shopModal').classList.contains('hidden')) { hide('#shopModal'); return; }
      if (!$('#nameModal').classList.contains('hidden') && save.name) { hide('#nameModal'); return; }
      if (G.state === 'playing') pause(); else if (G.state === 'paused') resume();
      return;
    }
    if (e.key === 'p' || e.key === 'P') { if (G.state === 'playing') pause(); else if (G.state === 'paused') resume(); return; }
    if (e.key === 'Enter' && !modalOpen() && (G.state === 'menu' || G.state === 'dead')) { e.preventDefault(); startRun(); return; }
    if ((e.key === 'm' || e.key === 'M') && !modalOpen()) { toggleSound(); return; }
    if (e.code.startsWith('Arrow') || ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
      if (G.state === 'playing') e.preventDefault();
      input.keys.add(e.code);
      input.lastKey = performance.now();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'Space') input.boostKey = false;
    input.keys.delete(e.code);
  });
  window.addEventListener('blur', () => { input.keys.clear(); input.boostKey = input.boostMouse = input.boostTouch = false; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'playing' && G.mode === 'solo') pause(); });
  window.addEventListener('pagehide', () => { if (net) net.leaveRoom(); });
}

/* =========================================================
   boot
   ========================================================= */
let last = performance.now();
function frame(t) {
  const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
  last = t;
  if (G.state !== 'paused') update(dt);
  render();
  renderMinimap();
  hud(t);
  requestAnimationFrame(frame);
}

function init() {
  resize();
  bindEvents();
  renderProfile();
  fillWorld();
  const first = G.snakes.find(s => s.isBot);
  if (first) { G.cam.x = first.x; G.cam.y = first.y; }
  collidables = G.snakes.slice();
  renderBoard();
  syncFrameState();
  setNetStatus(isConfigured(FB_CONFIG) ? 'connecting' : 'offline');
  if (!save.name) { show('#nameModal'); setTimeout(() => $('#nameInput').focus(), 60); }
  requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
  connect();
}
init();

// exposed for debugging in the browser console
window.coil = { G, get save() { return save; }, ready: true, addXp: n => { addXp(n); persist(); }, RANKS };
})();
