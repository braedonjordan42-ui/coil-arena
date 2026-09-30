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
const SK = window.coilSkins;
const SKINS = SK.SHOP.slice().concat(SK.EXCLUSIVE);
const EFFECTS = [
  { id: 'spark', tag: 'Quick and clean.',  name: 'Spark', icon: '✦', color: '#38e1ff', colors: ['#38e1ff', '#ffffff'], n: 18, cost: 0, rarity: 'starter' },
  { id: 'bloom', tag: 'Flowers for your rivals.',  name: 'Bloom', icon: '✿', color: '#ff5fa2', colors: ['#ff5fa2', '#ffb3d9', '#b6ff5c'], n: 24, cost: 180, rarity: 'common' },
  { id: 'comet', tag: 'Streaks across the arena.',  name: 'Comet', icon: '☄', color: '#ffd23f', colors: ['#ffd23f', '#ff9f43', '#ffffff'], n: 16, speed: 2, cost: 320, rarity: 'rare' },
  { id: 'confetti', tag: 'Party time!',  name: 'Confetti', icon: '✺', color: '#b6ff5c', colors: ['#ff5fa2', '#ffd23f', '#b6ff5c', '#38e1ff', '#9b7bff'], n: 34, cost: 500, rarity: 'epic' },
  { id: 'supernova', tag: 'Blow the whole arena away.',  name: 'Supernova', icon: '✹', color: '#9b7bff', colors: ['#9b7bff', '#38e1ff', '#ffffff', '#ff5fa2'], n: 48, speed: 1.6, cost: 800, rarity: 'legendary' },
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
const RANK_SKINS = SK.RANK;
const RANK_EFFECTS = [
  { id: 'bronze-fx', tag: 'Hot metal sparks.',  name: 'Copper sparks', icon: '✧', color: '#f0a56b', colors: ['#f0a56b', '#ffd2ad', '#ffffff'], n: 24 },
  { id: 'silver-fx', tag: 'Freeze them in place.',  name: 'Frostbite', icon: '❄', color: '#dfe4f7', colors: ['#dfe4f7', '#ffffff', '#38e1ff'], n: 28, ring: true },
  { id: 'gold-fx', tag: 'Make it rain gold.',  name: 'Gold rush', icon: '✪', color: '#ffd23f', colors: ['#ffd23f', '#ffeb99', '#ffffff'], n: 34, ring: true },
  { id: 'platinum-fx', tag: 'A wave of northern lights.',  name: 'Aurora wave', icon: '❋', color: '#5cffc8', colors: ['#5cffc8', '#38e1ff', '#ffffff'], n: 38, ring: true },
  { id: 'diamond-fx', tag: 'Shards everywhere.',  name: 'Shatter', icon: '◆', color: '#38e1ff', colors: ['#38e1ff', '#ffffff', '#9b7bff'], n: 44, speed: 1.8, ring: true },
  { id: 'champion-fx', tag: 'Long live the champ.',  name: 'Crown burst', icon: '♛', color: '#ff5fa2', colors: ['#ff5fa2', '#ffd23f', '#ffffff', '#9b7bff'], n: 60, speed: 1.9, ring: true },
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
  stats: {}, ach: {}, title: '', weekBest: { w: '', s: 0 }, fc: '', weeklyClaims: [],
  settings: { sound: true, sensitivity: 1, shake: true }, updated: 0,
});
const STAT_KEYS = ['orbs', 'bigOrbs', 'time', 'maxSize', 'shrinkWins', 'onlineRuns', 'onlineKos', 'weeklyTop', 'friends'];
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
  const st = raw.stats && typeof raw.stats === 'object' ? raw.stats : {};
  s.stats = {};
  for (const k of STAT_KEYS) s.stats[k] = Math.max(0, Math.floor(Number(st[k]) || 0));
  s.ach = raw.ach && typeof raw.ach === 'object' ? { ...raw.ach } : {};
  s.title = typeof s.title === 'string' ? s.title.slice(0, 24) : '';
  s.weekBest = raw.weekBest && typeof raw.weekBest === 'object' ? { w: String(raw.weekBest.w || ''), s: Math.max(0, Number(raw.weekBest.s) || 0) } : { w: '', s: 0 };
  s.fc = /^[A-Z0-9]{6}$/.test(s.fc || '') ? s.fc : '';
  s.weeklyClaims = (Array.isArray(s.weeklyClaims) ? s.weeklyClaims : Object.values(s.weeklyClaims || {})).map(String).slice(-10);
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
  savePublicSoon();
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
const BOTS = { solo: 12, shrink: 14, online: 4 };
const N_SLOTS = 520;                 // shared food slots in online rooms
const SHRINK = { end: 210, delay: 10, dur: 150 };
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
  trails: [],
  texts: [],
  remote: {},
  cam: { x: 0, y: 0, zoom: 1, shake: 0 },
  time: 0, runTime: 0, runKos: 0, bestRank: 99, combo: 0, lastEatAt: 0,
  dyingT: 0, deathInfo: null, menuFollow: null, menuSwitch: 0,
  globalRows: null, onlineCount: 0,
  arenaR: ARENA_R, room: null, roomSeed: 0, slotGen: null, slotFood: null, drops: new Map(), feed: [], botCheckAt: 0, sweepAt: 0,
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
  const a = rand(0, TAU), d = Math.sqrt(Math.random()) * Math.max(60, G.arenaR - margin);
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

/* ---------- shared world (online rooms) ---------- */
function hashStr(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry(seed) { let x = seed | 0; return () => { x = (x + 0x6D2B79F5) | 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function slotSpec(i, g) {
  const r = mulberry(G.roomSeed ^ Math.imul(i + 1, 2654435761) ^ Math.imul(g + 7, 40503));
  const a = r() * TAU, d = Math.sqrt(r()) * (ARENA_R - 40), big = r() < 0.035;
  return { x: Math.cos(a) * d, y: Math.sin(a) * d, big, value: big ? 5 : 1, color: FOOD_COLORS[(r() * FOOD_COLORS.length) | 0], r: big ? 9 : 3.6 + r() * 1.8 };
}
function placeSlot(i, g) {
  const old = G.slotFood[i];
  if (old) old.gone = true;
  const f = { ...slotSpec(i, g), ph: rand(0, TAU), life: 0, max: 0, vx: 0, vy: 0, slot: i, gen: g };
  G.slotFood[i] = f;
  G.slotGen[i] = g;
  G.foods.push(f);
}
function enterWorld(room) {
  G.room = room;
  G.roomSeed = hashStr(room);
  G.foods = [];
  G.remote = {};
  G.drops = new Map();
  G.slotGen = new Int32Array(N_SLOTS);
  G.slotFood = new Array(N_SLOTS);
  for (let i = 0; i < N_SLOTS; i++) placeSlot(i, 0);
  net.joinRoom(room, {
    onPlayers: onRemotePlayers,
    onKill: v => { awardKO(v.n || 'a player', G.player ? G.player.x : G.cam.x, G.player ? G.player.y : G.cam.y, true); },
    onFood: (slot, gen) => { if (slot >= 0 && slot < N_SLOTS && gen > G.slotGen[slot]) placeSlot(slot, gen); },
    onDrop: onDrop,
    onDropChange: (id, v) => { const e = (v && v.e) || {}; for (const f of G.foods) if (f.drop === id && e[f.k]) f.gone = true; },
    onDropRemoved: id => { for (const f of G.foods) if (f.drop === id) f.gone = true; G.drops.delete(id); },
  });
  net.setWhere(room);
  savePublicSoon();
}
function leaveWorld() {
  if (net) { net.leaveRoom(); net.setWhere(null); }
  G.remote = {};
  G.drops = new Map();
  G.slotGen = G.slotFood = null;
  G.foods = [];
  G.room = null;
  savePublicSoon();
}
function onDrop(id, v) {
  if (!v || G.drops.has(id) || !Array.isArray(v.p)) return;
  const age = net.now() - (v.t || net.now());
  if (age > 40000) { G.drops.set(id, { t: v.t || 0 }); return; }
  G.drops.set(id, { t: v.t || net.now() });
  const cols = skinById(v.c).colors, e = v.e || {};
  const life = Math.max(3, 40 - age / 1000);
  for (let k = 0; k * 2 + 1 < v.p.length; k++) {
    if (e[k]) continue;
    G.foods.push({ x: +v.p[k * 2] || 0, y: +v.p[k * 2 + 1] || 0, value: v.v, big: false, r: 5 + Math.min(v.v, 6), color: cols[k % cols.length], ph: rand(0, TAU), life, max: life, vx: 0, vy: 0, drop: id, k });
  }
  if (v.u !== (net && net.uid) && age < 6000) {
    const who = esc(v.n || 'Someone');
    addFeed(v.by ? `<b>${esc(v.by)}</b> <i>took out</i> <b>${who}</b>` : `<b>${who}</b> <i>${v.w ? 'bonked the wall' : 'got coiled'}</i>`);
  }
}

/* ---------- kill feed ---------- */
function addFeed(html) {
  G.feed.unshift({ html, t: performance.now() });
  if (G.feed.length > 5) G.feed.length = 5;
  renderFeed();
}
function renderFeed() {
  const now = performance.now();
  G.feed = G.feed.filter(f => now - f.t < 6500);
  $('#killFeed').innerHTML = G.feed.map(f => `<li style="opacity:${Math.min(1, (6500 - (now - f.t)) / 900).toFixed(2)}">${f.html}</li>`).join('');
}
function feedName(s) {
  if (!s) return '';
  const me = s === G.player;
  return `<b style="color:${skinColors(s)[0]}">${esc(me ? (save.name || 'You') : s.name)}</b>`;
}

function spawnBot(awayFrom = null) {
  const p = safeSpot(300, awayFrom);
  const boss = Math.random() < 0.12;
  const used = new Set(G.snakes.map(s => s.name));
  const name = pick(BOT_NAMES.filter(n => !used.has(n))) || pick(BOT_NAMES);
  const b = makeSnake({ x: p.x, y: p.y, name, skin: pick(SKINS.filter(k => k.rarity !== 'rank' && k.rarity !== 'exclusive')).id, isBot: true, mass: boss ? rand(80, 160) | 0 : rand(10, 45) | 0 });
  if (boss) b.skill = rand(0.75, 1);
  b.rk = boss ? (rand(6, 15) | 0) : (rand(-1, 9) | 0);
  G.snakes.push(b);
  return b;
}

function fillWorld() {
  if (G.mode !== 'online') while (G.foods.length < FOOD_TARGET) spawnFood();
  const want = G.mode === 'online' ? clamp(BOTS.online - Object.keys(G.remote).length, 0, BOTS.online) : BOTS[G.mode];
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
      if (G.mode !== 'online') {
      const t = s.pts[s.pts.length - 1];
      spawnFood(t.x + rand(-4, 4), t.y + rand(-4, 4), 1, { color: skinColors(s)[0], r: 4.4, life: 14, big: false });
      }
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
  if (s.x * s.x + s.y * s.y > (G.arenaR - s.r * 0.5) ** 2) return { wall: true };
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
  const shared = G.mode === 'online' && net && G.room && s === G.player && !cause.quit;
  const count = clamp(Math.round(s.mass * 0.4), 6, shared ? 80 : 160);
  const value = clamp(Math.round((s.mass * 0.8) / count), 1, 20);
  if (shared) {
    const p = [];
    for (let k = 0; k < count; k++) { const q = s.pts[Math.floor((k / count) * s.pts.length)]; p.push(Math.round(q.x + rand(-10, 10)), Math.round(q.y + rand(-10, 10))); }
    net.pushDrop({ p, v: value, c: s.skin, n: save.name || 'Rookie', by: cause.by ? String(cause.by.name || '').slice(0, 16) : '', w: cause.wall ? 1 : 0 });
  } else {
    for (let k = 0; k < count; k++) {
      const p = s.pts[Math.floor((k / count) * s.pts.length)];
      spawnFood(p.x + rand(-10, 10), p.y + rand(-10, 10), value, { color: cols[k % cols.length], life: rand(18, 26), big: false });
    }
  }
  if (!cause.quit && !cause.win) {
    if (cause.by) addFeed(`${feedName(cause.by)} <i>took out</i> ${feedName(s)}`);
    else if (cause.wall) addFeed(`${feedName(s)} <i>${G.mode === 'shrink' ? 'got caught by the zone' : 'bonked the wall'}</i>`);
  }
  burst(s.x, s.y, s === G.player || cause.by === G.player ? effectById(save.effect) : { colors: cols, n: 14 });
  if (s === G.player) { playerDied(cause); return; }
  s.respawnAt = G.time + rand(2.5, 5);
  if (G.mode === 'shrink' && G.state === 'playing') s.respawnAt = Infinity;
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
    if (px * px + py * py > (G.arenaR - b.r * 2) ** 2) { worst = Math.max(worst, w); continue; }
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
    if (Math.hypot(b.x, b.y) > G.arenaR - Math.min(280, G.arenaR * 0.35)) desired = Math.atan2(-b.y, -b.x) + rand(-0.5, 0.5);

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
      if (f.gone) continue;
      foods[i] = foods[foods.length - 1];
      foods.pop();
      s.mass += f.value;
      if (s === G.player) {
        if (f.slot !== undefined && net) { net.eatFood(f.slot, f.gen); placeSlot(f.slot, f.gen + 1); }
        else if (f.drop && net) net.eatDrop(f.drop, f.k);
        onPlayerEat(f);
      }
    } else {
      const pull = Math.min(d, (260 + s.r * 4) * dt);
      f.x -= (dx / d) * pull; f.y -= (dy / d) * pull;
    }
  }
}
function onPlayerEat(f) {
  save.stats.orbs++;
  if (f.big) save.stats.bigOrbs++;
  if (G.player && G.player.mass > G.runMax) G.runMax = Math.floor(G.player.mass);
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
  if (G.mode === 'shrink') {
    G.snakes = G.snakes.filter(s => !s.isBot);
    G.foods = [];
    G.arenaR = ARENA_R;
  }
  if (G.mode === 'online' && net && net.room !== G.room) enterWorld(G.room || ROOM);
  fillWorld();
  collidables = G.snakes.filter(s => !s.dead).concat(Object.values(G.remote));
  const p = safeSpot(420);
  G.player = makeSnake({ x: p.x, y: p.y, name: save.name || 'Rookie', skin: save.skin, angle: Math.atan2(-p.y, -p.x) });
  G.player.isPlayer = true;
  G.desired = G.player.angle;
  G.snakes.push(G.player);
  Object.assign(G, { state: 'playing', runTime: 0, runKos: 0, bestRank: 99, combo: 0, deathInfo: null, runMax: START_MASS });
  input.boostKey = input.boostMouse = input.boostTouch = false;
  hide('#startOverlay'); hide('#deathCard'); hide('#pauseOverlay');
  $('#pauseBtn').classList.toggle('hidden', G.mode === 'online');
  if (G.mode === 'shrink') toast('The zone closes in 10 seconds — be the last snake!');
  if (innerWidth < 820) $('#frame').scrollIntoView({ block: 'end', behavior: 'smooth' });
  if (G.mode !== 'shrink') toast(G.mode === 'online' ? 'You\'re live — good luck!' : 'Go get \'em!');
  syncFrameState();
}
function pause() {
  if (G.state !== 'playing') return;
  if (G.mode === 'online') { toast('Online runs can\'t be paused'); return; }
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
  $('#pauseBtn').classList.toggle('hidden', G.mode === 'online');
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
  const win = !!cause.win;
  G.state = 'dying';
  G.dyingT = cause.quit ? 0.15 : win ? 1.6 : 1.2;
  if (win) { sfx.level(); burst(p.x, p.y, effectById(save.effect)); burstConfettiWorld(p.x, p.y); }
  else if (!cause.quit) { shake(22); sfx.die(); navigator.vibrate?.(140); }
  const by = cause.by;
  if (net && G.mode === 'online') {
    if (by && by.isRemote) net.reportKill(by.uid, save.name || 'Rookie', by.name);
    net.removeMe();
  }
  const placement = G.mode === 'shrink' ? 1 + G.snakes.filter(s => s.isBot && !s.dead).length : 0;
  const score = Math.floor(p.mass);
  const newBest = score > save.best;
  const coins = Math.max(5, Math.floor(score / 6) + Math.floor(G.runTime / 15)) + (win ? 150 : 0);
  const xp = Math.floor(score * 0.35 + G.runTime / 4 + G.runKos * 20) + 5 + (win ? 120 : 0);
  recordRunStats({ score, win, time: G.runTime, mode: G.mode });
  save.best = Math.max(save.best, score);
  save.runs++;
  save.coins += coins;
  save.history = [...save.history, { score, date: today() }].sort((a, b) => b.score - a.score).slice(0, 5);
  addXp(xp);
  persist();
  if (net && save.best > save.submittedBest) {
    submitBest();
  }
  G.deathInfo = {
    title: win ? 'Victory!' : cause.quit ? 'Run ended' : newBest && score > 20 ? 'New record!' : pick(DEATH_TITLES),
    by: win ? 'Last snake standing — you won the Shrink battle! +150 bonus coins' : cause.quit ? 'You wrapped things up early.' : cause.wall ? (G.mode === 'shrink' ? 'The zone got you.' : 'You bonked into the arena wall.') : by ? `You ran into ${by.name}${by.isBot && G.mode === 'online' ? ' (bot)' : ''}.` : 'You got coiled.',
    score, newBest: newBest && score > 0, kos: G.runKos, time: G.runTime, rank: G.mode === 'shrink' ? placement : G.bestRank, rankLabel: G.mode === 'shrink' ? 'Placed' : 'Top rank', coins, xp, win,
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
  $('#finalRankLabel').textContent = d.rankLabel || 'Top rank';
  $('#deathCard').classList.toggle('victory', !!d.win);
  $('#deathKicker span').textContent = d.win ? 'Victory' : 'Run over';
  $('#runReward').textContent = d.coins;
  const goal = SKINS.filter(s => s.cost > 0 && s.rarity !== 'rank' && !save.ownedSkins.includes(s.id)).sort((x, y) => x.cost - y.cost);
  const afford = goal.filter(s => s.cost <= save.coins).pop();
  const next = goal.find(s => s.cost > save.coins);
  const nu = $('#nextUnlock');
  if (afford) { nu.innerHTML = `<canvas class="pv sm" data-pv="skin:${afford.id}"></canvas><span>You can unlock <b>${esc(afford.name)}</b> now!</span><button class="item-btn buy" id="nuShop">Shop</button>`; }
  else if (next) { nu.innerHTML = `<canvas class="pv sm" data-pv="skin:${next.id}"></canvas><span>Next: <b>${esc(next.name)}</b><div class="feat-bar"><i style="width:${Math.round(save.coins / next.cost * 100)}%"></i></div><small>${(next.cost - save.coins).toLocaleString()} coins to go</small></span>`; }
  nu.classList.toggle('hidden', !afford && !next);
  const nb = $('#nuShop'); if (nb) nb.onclick = () => { shopTab = 'skins'; $$('.shop-tab').forEach(x => x.classList.toggle('active', x.dataset.tab === 'skins')); openShop(); };
  $('#runXp').textContent = d.xp;
  show('#deathCard'); hide('#pauseBtn');
  syncFrameState();
  setTimeout(() => $('#againBtn').focus({ preventScroll: true }), 50);
}
function awardKO(name, x, y, remote = false) {
  G.runKos++;
  if (remote) save.stats.onlineKos++;
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
    r.dev = v.dv === 1;
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
  net.publish({ n: save.name || 'Rookie', s: Math.floor(p.mass), c: save.skin, a: Math.round(p.angle * 100) / 100, bo: p.boosting ? 1 : 0, rk: rankIndexFor(save.level), ...(isDev ? { dv: 1 } : {}), k, b });
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
    if (isDev && devGod && G.mode !== 'online') p.energy = 100;
  }
  for (const s of G.snakes) if (s.isBot && !s.dead) botThink(s, dt);
  for (const s of G.snakes) if (!s.dead) moveSnake(s, dt);
  updateRemote(dt);

  for (const s of G.snakes.slice()) {
    if (s.dead) continue;
    if (s === p && G.state !== 'playing') continue;
    const hit = checkCollision(s);
    if (hit && s === p && isDev && devGod && G.mode !== 'online') {
      if (hit.wall) { const d = Math.hypot(s.x, s.y) || 1, m = (G.arenaR - s.r * 2) / d; if (m < 1) { s.x *= m; s.y *= m; } s.angle = Math.atan2(-s.y, -s.x); }
      continue;
    }
    if (hit) killSnake(s, hit);
  }
  for (const s of G.snakes) if (!s.dead && !(s.isBot && G.mode === 'online')) eatFood(s, dt);

  // food upkeep
  const foods = G.foods;
  for (let i = foods.length - 1; i >= 0; i--) {
    const f = foods[i];
    if (f.gone || (G.mode === 'shrink' && f.x * f.x + f.y * f.y > G.arenaR * G.arenaR)) { foods[i] = foods[foods.length - 1]; foods.pop(); continue; }
    if (f.max) {
      f.life -= dt;
      if (f.life <= 0) { foods[i] = foods[foods.length - 1]; foods.pop(); continue; }
    }
    if (f.vx || f.vy) { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.94; f.vy *= 0.94; }
  }
  if (G.mode !== 'online') for (let i = 0; i < 6 && foods.length < FOOD_TARGET * (G.mode === 'shrink' ? Math.max(0.25, (G.arenaR / ARENA_R) ** 2) : 1); i++) spawnFood();
  if (G.mode === 'online' && net && G.room && G.time > G.sweepAt) {
    G.sweepAt = G.time + 10;
    for (const [id, d] of G.drops) if (net.now() - d.t > 45000) { net.removeDrop(id); G.drops.delete(id); }
  }
  if (G.mode === 'online' && G.time > G.botCheckAt) { G.botCheckAt = G.time + 2; fillWorld(); }

  // shrinking arena
  if (G.mode === 'shrink' && (G.state === 'playing' || G.state === 'dying') && G.player) {
    const el = Math.max(0, G.runTime - SHRINK.delay);
    G.arenaR = Math.max(SHRINK.end, ARENA_R - (el / SHRINK.dur) * (ARENA_R - SHRINK.end));
    if (G.state === 'playing' && G.runTime > 2 && !G.snakes.some(s => s.isBot && !s.dead)) playerDied({ win: true });
  } else if (G.arenaR < ARENA_R) G.arenaR = Math.min(ARENA_R, G.arenaR + dt * 600);

  // bot respawns
  for (let i = G.snakes.length - 1; i >= 0; i--) {
    const s = G.snakes[i];
    if (s.isBot && s.dead && G.time > s.respawnAt && !(G.mode === 'shrink' && (G.state === 'playing' || G.state === 'dying'))) { G.snakes.splice(i, 1); spawnBot(G.player && !G.player.dead ? G.player : null); }
  }

  for (const q of G.particles) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.95; q.vy *= 0.95; }
  G.particles = G.particles.filter(q => q.life > 0);
  for (const s of G.snakes) if (!s.dead && skinById(s.skin).trail && s.x > view.x0 - 200 && s.x < view.x1 + 200 && s.y > view.y0 - 200 && s.y < view.y1 + 200) SK.trailTick(s, skinById(s.skin), dt, G.trails);
  for (const r of Object.values(G.remote)) if (skinById(r.skin).trail) SK.trailTick(r, skinById(r.skin), dt, G.trails);
  SK.updateTrails(G.trails, dt);
  for (const g of G.rings) g.life -= dt;
  G.rings = G.rings.filter(g => g.life > 0);
  for (const t of G.texts) { t.life -= dt; t.y -= 40 * dt; }
  G.texts = G.texts.filter(t => t.life > 0);

  if (G.state === 'playing' && p && !p.dead && G.mode === 'online' && net && performance.now() - publishAt > 110) { publishAt = performance.now(); publishPlayer(); }
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
  if (G.arenaR < ARENA_R - 1) {
    ctx.beginPath(); ctx.arc(0, 0, ARENA_R + 400, 0, TAU); ctx.arc(0, 0, G.arenaR, 0, TAU, true);
    ctx.fillStyle = `rgba(255,50,90,${0.16 + 0.05 * Math.sin(G.time * 4)})`; ctx.fill();
  }
  ctx.beginPath(); ctx.arc(0, 0, G.arenaR, 0, TAU);

  // glowing border (brighter when the player is close)
  let near = 0;
  if (G.player && !G.player.dead) near = clamp(1 - (G.arenaR - Math.hypot(G.player.x, G.player.y)) / 260, 0, 1);
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

  SK.drawTrails(ctx, G.trails, view);

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
  if (s.pts.length < 2) return;
  const pad = 80;
  if (s.bb && (s.bb.x1 < view.x0 - pad || s.bb.x0 > view.x1 + pad || s.bb.y1 < view.y0 - pad || s.bb.y0 > view.y1 + pad)) return;
  const sk = skinById(s.skin);
  SK.drawSnakeBody(ctx, s, sk, { t: G.time, look: isMe ? G.desired : (s.target ?? s.angle), blink: s.blink < 0, sp: SP });

  // name tag
  const r = s.r, hx = s.x, hy = s.y;
  const label = isMe ? (save.name || 'You') : s.name;
  const dev = isMe ? isDev : !!s.dev;
  const rk = isMe ? rankIndexFor(save.level) : (s.rk ?? -1);
  ctx.font = '700 13px Nunito, sans-serif';
  ctx.textAlign = 'center';
  const bw = dev ? 34 : rk >= 0 ? 20 : 0;
  const tw = ctx.measureText(label).width + 16 + bw;
  const ty = hy - r - 26 - SK.headroom(sk);
  ctx.fillStyle = isMe ? 'rgba(56,225,255,0.22)' : 'rgba(10,8,30,0.55)';
  pill(hx - tw / 2, ty, tw, 19, 9.5);
  ctx.fill();
  if (dev) drawDevChip(hx - tw / 2 + 4, ty + 3);
  else if (rk >= 0) drawRankChip(hx - tw / 2 + 11, ty + 9.5, RANKS[rk]);
  ctx.fillStyle = isMe ? '#bff4ff' : '#e9e6ff';
  ctx.fillText(label, hx + bw / 2, ty + 14);
}
function drawDevChip(x, y) {
  const g = ctx.createLinearGradient(x, 0, x + 30, 0);
  g.addColorStop(0, '#ff5fa2'); g.addColorStop(1, '#38e1ff');
  ctx.fillStyle = g;
  pill(x, y, 30, 13, 6.5); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '800 9px Nunito, sans-serif';
  ctx.fillText('DEV', x + 15, y + 10);
  ctx.font = '700 13px Nunito, sans-serif';
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
function pill(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + r, y + h); ctx.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5); ctx.closePath();
}

/* ---------- live skin / effect previews ---------- */
function animatePreviews(t, dt) {
  const scopes = [];
  if (!$('#shopModal').classList.contains('hidden')) scopes.push($('#shopModal'));
  if (!$('#rankModal').classList.contains('hidden')) scopes.push($('#rankModal'));
  if (!$('#profileModal').classList.contains('hidden')) scopes.push($('#profileModal'));
  scopes.push($('.shop-card'));
  if (!$('#deathCard').classList.contains('hidden')) scopes.push($('#deathCard'));
  for (const scope of scopes) {
    for (const cv of scope.querySelectorAll('canvas[data-pv]')) {
      const r = cv.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || !r.width) continue;
      const [kind, id] = cv.dataset.pv.split(':');
      if (kind === 'skin') SK.drawSkinPreview(cv, skinById(id), t, dt);
      else SK.drawEffectPreview(cv, effectById(id), t);
    }
  }
}

let miniFrame = 0;
function renderMinimap() {
  if (miniFrame++ % 5) return;
  const S = mini.width, c = S / 2, k = (S / 2 - 6) / ARENA_R;
  mctx.clearRect(0, 0, S, S);
  mctx.fillStyle = 'rgba(13,11,36,0.72)';
  mctx.beginPath(); mctx.arc(c, c, S / 2 - 2, 0, TAU); mctx.fill();
  mctx.strokeStyle = 'rgba(255,95,162,0.7)'; mctx.lineWidth = 3; mctx.stroke();
  if (G.arenaR < ARENA_R - 1) { mctx.strokeStyle = '#ff3b5c'; mctx.lineWidth = 2.5; mctx.beginPath(); mctx.arc(c, c, G.arenaR * k, 0, TAU); mctx.stroke(); }
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
  const zc = $('#zoneChip');
  if (G.mode === 'shrink' && G.state === 'playing') {
    const left = Math.max(0, SHRINK.delay + SHRINK.dur - G.runTime);
    zc.classList.remove('hidden');
    zc.innerHTML = G.runTime < SHRINK.delay ? `Zone in <b>${Math.ceil(SHRINK.delay - G.runTime)}s</b>` : left > 0 ? `Zone <b>${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}</b>` : '<b>Final zone!</b>';
  } else zc.classList.add('hidden');
  if (G.feed.length) renderFeed();
  if (now - boardAt > 500) { boardAt = now; if (boardTab === 'arena') renderBoard(); }
}

let boardTab = 'arena';
function renderBoard() {
  const el = $('#leaderboard'), note = $('#boardNote');
  if (boardTab === 'arena') {
    const rows = collidables.filter(s => !s.dead).map(s => ({
      name: s === G.player ? save.name || 'Rookie' : s.name, score: Math.floor(s.mass), color: skinColors(s)[0],
      me: s === G.player, tag: s.isRemote ? '' : s.isBot && G.mode === 'online' ? 'bot' : '', uid: s === G.player ? (net && net.uid) : s.isRemote ? s.uid : '',
      rk: (s === G.player ? isDev : s.dev) ? -2 : s === G.player ? rankIndexFor(save.level) : (s.rk ?? -1),
    })).sort((a, b) => b.score - a.score);
    const top = rows.slice(0, 8);
    const meIdx = rows.findIndex(r => r.me);
    if (meIdx >= 8) top[7] = { ...rows[meIdx], rank: meIdx + 1 };
    el.innerHTML = top.map((r, i) => row(r.rank || i + 1, r.name, r.score, r.color, r.me, r.tag, r.rk, r.uid)).join('');
    note.textContent = G.mode === 'online' ? (Object.keys(G.remote).length ? `${Object.keys(G.remote).length} real player${Object.keys(G.remote).length > 1 ? 's' : ''} in your arena` : 'No one else here yet — share your link!') : '';
  } else if (boardTab === 'weekly') {
    if (G.weeklyRows) {
      el.innerHTML = G.weeklyRows.length
        ? G.weeklyRows.map((r, i) => row(i + 1, r.name, r.score, skinById(r.skin).colors[0], net && r.uid === net.uid, '', Number.isInteger(r.rk) ? r.rk : -1, r.uid)).join('')
        : '<li class="empty">Fresh week — grab the #1 spot!</li>';
    } else el.innerHTML = `<li class="empty">${net ? 'Loading this week…' : 'Weekly board needs the online version'}</li>`;
    note.innerHTML = `Resets in <b>${weekResetText()}</b> · top 3 win the <b>Weekly Champ</b> skin`;
  } else {
    if (G.globalRows) {
      el.innerHTML = G.globalRows.length
        ? G.globalRows.map((r, i) => row(i + 1, r.name, r.score, skinById(r.skin).colors[0], net && r.uid === net.uid, '', Number.isInteger(r.rk) ? r.rk : -1, r.uid)).join('')
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
function row(rank, name, score, color, me, tag = '', rk = null, uid = '') {
  return `<li class="${me ? 'me' : ''} ${uid && net ? 'click' : ''}" ${uid ? `data-uid="${esc(uid)}"` : ''}><span class="rk">${rank}</span><span class="dot" style="background:${color};--c:${color}"></span>${rk !== null && (rk >= 0 || rk === -2) ? badgeHTML(rk) : ''}<span class="nm">${esc(name)}${me ? ' <small>(you)</small>' : ''}${tag ? ` <small>${tag}</small>` : ''}</span><span class="sc">${Number(score).toLocaleString()}</span></li>`;
}

function renderProfile() {
  $('#playerName').textContent = save.name || 'Rookie';
  $('#titleText').textContent = save.title || '';
  $('#titleText').classList.toggle('hidden', !save.title);
  $('#achCount').textContent = `${ACH.filter(ac => save.ach[ac.id]).length}/${ACH.length}`;
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
  updateTeaser();
  const ri = rankIndexFor(save.level), next = RANKS[ri + 1];
  $('#rankRow').innerHTML = isDev ? `${badgeHTML(-2, 'mid')}<span class="rank-txt"><b>Developer</b><small>Everything unlocked · hidden from all-time board</small></span>` : `${badgeHTML(ri, 'mid')}<span class="rank-txt"><b>${rankName(ri)}</b><small>${next ? `Next: ${next.name} at level ${next.level}` : 'Top rank reached!'}</small></span>`;
  $('.avatar-wrap').style.setProperty('--tier', ri >= 0 ? RANKS[ri].tier.color : '#9b7bff');
  drawAvatar();
  renderDaily();
  if (G.player && !G.player.dead) { G.player.skin = save.skin; G.player.name = save.name || 'Rookie'; }
}
function drawAvatar(t = G.time, dt = 0) {
  SK.drawSkinPreview($('#avatar'), skinById(save.skin), t, dt, 'coil');
}
function skinCss(s) {
  if (s.colors.length < 2) return s.colors[0];
  const w = 14;
  return `repeating-linear-gradient(90deg, ${s.colors.map((c, i) => `${c} ${i * w}px ${(i + 1) * w}px`).join(', ')})`;
}
let teaserIdx = 0, teaserTimer = null;
function updateTeaser() {
  const cands = SKINS.filter(s => !s.rank && s.rank !== 0 && s.cost > 0 && !save.ownedSkins.includes(s.id)).sort((x, y) => y.cost - x.cost);
  const list = cands.length ? cands : SKINS.filter(s => s.rarity === 'legendary' || s.rarity === 'epic');
  const sk = list[teaserIdx % list.length];
  const cv = $('#shopTeaser');
  if (!cv || !sk) return;
  cv.dataset.pv = `skin:${sk.id}`;
  $('#teaserName').innerHTML = `<b>${esc(sk.name)}</b> <span class="r-${sk.rarity}">${sk.rarity}</span>`;
  if (!teaserTimer) teaserTimer = setInterval(() => { teaserIdx++; updateTeaser(); }, 3500);
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
  checkAchievements();
}

/* ---------- ranks UI ---------- */
function badgeHTML(ri, cls = '') {
  if (ri === -2) return `<span class="rbadge dev ${cls}" title="Developer">DEV</span>`;
  if (ri < 0 || !RANKS[ri]) return `<span class="rbadge none ${cls}" title="Unranked">–</span>`;
  const R = RANKS[ri];
  return `<span class="rbadge ${cls}" style="--t:${R.tier.color};--d:${R.tier.dark}" title="${R.name}">${R.tier.name[0]}${R.div}</span>`;
}
function rewardItem(rw) { return rw.type === 'skin' ? skinById(rw.id) : effectById(rw.id); }
function rewardPreview(rw, big = false) {
  return rw.type === 'skin'
    ? `<canvas class="pv ${big ? 'big' : 'sm'}" data-pv="skin:${rw.id}"></canvas>`
    : `<canvas class="pv fx ${big ? 'big' : 'sm'}" data-pv="fx:${rw.id}"></canvas>`;
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
  $('#rankReward').innerHTML = `${rewardPreview(R.reward, true)}<span><small>${R.reward.type === 'skin' ? 'New skin' : 'New KO effect'} unlocked</small><b>${esc(it.name)}</b></span>`;
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
  const skinsTab = shopTab === 'skins';
  const list = (skinsTab ? SKINS : EFFECTS).slice().sort((x, y) => (x.rarity === 'rank') - (y.rarity === 'rank') || (x.rarity === 'rank' ? x.rank - y.rank : x.cost - y.cost));
  const owned = skinsTab ? save.ownedSkins : save.ownedEffects;
  const equipped = skinsTab ? save.skin : save.effect;
  const card = it => {
    const own = owned.includes(it.id), eq = equipped === it.id;
    const R = it.rarity === 'rank' ? RANKS[it.rank] : null;
    const feats = skinsTab ? SK.features(it) : [it.ring ? 'Shockwave' : null, `${it.n} particles`].filter(Boolean);
    const btn = eq ? '<button class="item-btn" disabled>Equipped</button>'
      : own ? `<button class="item-btn eq" data-id="${it.id}">Equip</button>`
      : R ? `<button class="item-btn locked" data-id="${it.id}">Reach ${R.name}</button>`
      : it.rarity === 'exclusive' ? `<button class="item-btn locked" data-id="${it.id}">Top 3 weekly</button>`
      : `<button class="item-btn buy ${save.coins < it.cost ? 'cant' : ''}" data-id="${it.id}"><span class="coin"></span>${it.cost.toLocaleString()}</button>`;
    return `<article class="item rar-${it.rarity} ${eq ? 'equipped' : ''} ${own ? 'owned' : ''}" ${R ? `style="--t:${R.tier.color}"` : ''}>
      <canvas class="pv card-pv ${skinsTab ? '' : 'fx'}" data-pv="${skinsTab ? 'skin' : 'fx'}:${it.id}"></canvas>
      <div class="item-top"><div class="item-name">${esc(it.name)}</div><div class="item-rarity r-${it.rarity}" ${R ? `style="color:${R.tier.color}"` : ''}>${R ? `${R.name}` : it.rarity}</div></div>
      ${it.tag ? `<div class="item-tag">${esc(it.tag)}</div>` : ''}
      <div class="chips">${feats.map(f => `<span>${esc(f)}</span>`).join('')}</div>
      ${btn}</article>`;
  };
  let featured = '';
  if (skinsTab) {
    const want = SKINS.filter(s => s.cost > 0 && s.rarity !== 'rank' && !owned.includes(s.id)).sort((x, y) => y.cost - x.cost)[0];
    if (want) {
      const pct = Math.min(100, Math.round((save.coins / want.cost) * 100));
      featured = `<div class="featured rar-${want.rarity}">
        <canvas class="pv feat-pv" data-pv="skin:${want.id}"></canvas>
        <div class="feat-info">
          <span class="feat-kicker">★ Featured · ${want.rarity}</span>
          <h3>${esc(want.name)}</h3>
          <p>${esc(want.tag || '')}</p>
          <div class="chips">${SK.features(want).map(f => `<span>${esc(f)}</span>`).join('')}</div>
          <div class="feat-buy"><div class="feat-bar"><i style="width:${pct}%"></i></div><small>${save.coins >= want.cost ? 'You can afford it!' : `${(want.cost - save.coins).toLocaleString()} coins to go`}</small>
          <button class="item-btn buy ${save.coins < want.cost ? 'cant' : ''}" data-id="${want.id}"><span class="coin"></span>${want.cost.toLocaleString()}</button></div>
        </div></div>`;
    }
  }
  const shop = list.filter(it => it.rarity !== 'rank' && it.rarity !== 'exclusive'), ranked = list.filter(it => it.rarity === 'rank'), excl = list.filter(it => it.rarity === 'exclusive');
  $('#shopItems').innerHTML = featured +
    `<div class="shop-grid">${shop.map(card).join('')}</div>` +
    (excl.length ? `<h4 class="shop-sub">Exclusive <small>finish top 3 on a weekly leaderboard</small></h4><div class="shop-grid">${excl.map(card).join('')}</div>` : '') +
    (ranked.length ? `<h4 class="shop-sub">Rank rewards <small>earn these by ranking up — they can't be bought</small></h4><div class="shop-grid">${ranked.map(card).join('')}</div>` : '');
  $$('#shopItems .item-btn[data-id]').forEach(b => { b.onclick = () => buyOrEquip(b.dataset.id); });
}
function buyOrEquip(id, type) {
  const skins = type ? type === 'skin' : shopTab === 'skins';
  const item = (skins ? SKINS : EFFECTS).find(x => x.id === id);
  const owned = skins ? save.ownedSkins : save.ownedEffects;
  if (!item) return;
  if (!owned.includes(id) && item.rarity === 'exclusive') { toast('Finish top 3 on a weekly leaderboard to earn this'); return; }
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
  checkAchievements();
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

/* =========================================================
   run stats, achievements, titles
   ========================================================= */
function burstConfettiWorld(x, y) {
  for (let i = 0; i < 70; i++) {
    const a = rand(0, TAU), v = rand(80, 380);
    G.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.8, 1.6), max: 1.6, color: pick(FOOD_COLORS), size: rand(3, 6) });
  }
}
function recordRunStats({ score, win, time, mode }) {
  const st = save.stats;
  st.time += Math.round(time);
  st.maxSize = Math.max(st.maxSize, score, G.runMax || 0);
  if (win) st.shrinkWins++;
  if (mode === 'online') st.onlineRuns++;
  submitWeekly(score);
  setTimeout(checkAchievements, 2400);
}
const ACH = [
  { id: 'first-bite', name: 'First bite', desc: 'Eat your first orb', stat: s => s.stats.orbs, goal: 1, coins: 10 },
  { id: 'snacker', name: 'Snacker', desc: 'Eat 1,000 orbs', stat: s => s.stats.orbs, goal: 1000, coins: 60 },
  { id: 'glutton', name: 'Bottomless', desc: 'Eat 10,000 orbs', stat: s => s.stats.orbs, goal: 10000, coins: 250, title: 'Bottomless' },
  { id: 'golden', name: 'Gold digger', desc: 'Eat 50 big golden orbs', stat: s => s.stats.bigOrbs, goal: 50, coins: 80 },
  { id: 'first-ko', name: 'First takedown', desc: 'Get your first KO', stat: s => s.kills, goal: 1, coins: 20 },
  { id: 'hunter', name: 'Hunter', desc: 'Get 50 KOs', stat: s => s.kills, goal: 50, coins: 120, title: 'Hunter' },
  { id: 'apex', name: 'Apex predator', desc: 'Get 250 KOs', stat: s => s.kills, goal: 250, coins: 400, title: 'Apex Predator' },
  { id: 'size-100', name: 'Growing up', desc: 'Reach size 100', stat: s => s.stats.maxSize, goal: 100, coins: 30 },
  { id: 'size-500', name: 'Big noodle', desc: 'Reach size 500', stat: s => s.stats.maxSize, goal: 500, coins: 150, title: 'Big Noodle' },
  { id: 'size-1000', name: 'Absolute unit', desc: 'Reach size 1,000', stat: s => s.stats.maxSize, goal: 1000, coins: 400, title: 'Absolute Unit' },
  { id: 'runs-10', name: 'Warming up', desc: 'Play 10 runs', stat: s => s.runs, goal: 10, coins: 30 },
  { id: 'runs-100', name: 'Regular', desc: 'Play 100 runs', stat: s => s.runs, goal: 100, coins: 200, title: 'Regular' },
  { id: 'hour', name: 'Dedicated', desc: 'Play for 1 hour in total', stat: s => Math.floor(s.stats.time / 60), goal: 60, coins: 150, title: 'Dedicated', unit: 'min' },
  { id: 'shrink-win', name: 'Last snake standing', desc: 'Win a Shrink battle', stat: s => s.stats.shrinkWins, goal: 1, coins: 100, title: 'Last One Standing' },
  { id: 'shrink-5', name: 'Survivor', desc: 'Win 5 Shrink battles', stat: s => s.stats.shrinkWins, goal: 5, coins: 300, title: 'Survivor' },
  { id: 'online-1', name: 'Hello, world', desc: 'Play an online run', stat: s => s.stats.onlineRuns, goal: 1, coins: 30 },
  { id: 'online-ko', name: 'Player hunter', desc: 'KO a real player online', stat: s => s.stats.onlineKos, goal: 1, coins: 100, title: 'Player Hunter' },
  { id: 'friend-1', name: 'Buddy', desc: 'Add a friend', stat: s => s.stats.friends, goal: 1, coins: 50 },
  { id: 'friend-5', name: 'Social butterfly', desc: 'Have 5 friends', stat: s => s.stats.friends, goal: 5, coins: 150, title: 'Social Butterfly' },
  { id: 'collector-5', name: 'Collector', desc: 'Own 5 shop skins', stat: s => s.ownedSkins.filter(id => { const k = skinById(id); return k.cost > 0 && k.rarity !== 'rank'; }).length, goal: 5, coins: 100 },
  { id: 'collector-all', name: 'Completionist', desc: 'Own every shop skin', stat: s => s.ownedSkins.filter(id => { const k = skinById(id); return k.cost > 0 && k.rarity !== 'rank'; }).length, goal: () => SKINS.filter(k => k.cost > 0 && k.rarity !== 'rank').length, coins: 1000, title: 'Completionist' },
  { id: 'rank-gold', name: 'Going gold', desc: 'Reach Gold rank', stat: s => rankIndexFor(s.level) + 1, goal: 7, coins: 100, show: s => rankName(rankIndexFor(s.level)) },
  { id: 'rank-diamond', name: 'Shine bright', desc: 'Reach Diamond rank', stat: s => rankIndexFor(s.level) + 1, goal: 13, coins: 300, title: 'Diamond', show: s => rankName(rankIndexFor(s.level)) },
  { id: 'rank-champ', name: 'Champion', desc: 'Reach Champion rank', stat: s => rankIndexFor(s.level) + 1, goal: 16, coins: 600, title: 'Champion', show: s => rankName(rankIndexFor(s.level)) },
  { id: 'weekly', name: 'Weekly legend', desc: 'Finish top 3 on a weekly board', stat: s => s.stats.weeklyTop, goal: 1, coins: 500, title: 'Weekly Legend' },
  { id: 'streak-7', name: 'Loyal', desc: 'Claim the daily drop 7 days in a row', stat: s => s.streak, goal: 7, coins: 150, title: 'Loyal' },
];
const achGoal = a => (typeof a.goal === 'function' ? a.goal() : a.goal);
let achQueue = [], achShowing = false;
function checkAchievements() {
  let changed = false;
  for (const ac of ACH) {
    if (save.ach[ac.id]) continue;
    if (ac.stat(save) >= achGoal(ac)) {
      save.ach[ac.id] = Date.now();
      save.coins += ac.coins;
      achQueue.push(ac);
      changed = true;
    }
  }
  if (changed) { persist(); showAchToasts(); }
}
function showAchToasts() {
  if (achShowing) return;
  const ac = achQueue.shift();
  if (!ac) return;
  achShowing = true;
  const el = $('#achToast');
  el.innerHTML = `<span class="trophy"></span><span><small>Achievement unlocked</small><b>${esc(ac.name)}</b><em>+${ac.coins} coins${ac.title ? ` · title “${esc(ac.title)}”` : ''}</em></span>`;
  el.classList.add('show');
  sfx.coin();
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => { achShowing = false; showAchToasts(); }, 350); }, 3200);
}
function titles() { return ACH.filter(ac => ac.title && save.ach[ac.id]).map(ac => ac.title); }
function openAch() {
  const unlocked = ACH.filter(ac => save.ach[ac.id]).length;
  $('#achSummary').textContent = `${unlocked} of ${ACH.length} unlocked`;
  const ts = titles();
  $('#titleSelect').innerHTML = `<option value="">No title</option>` + ts.map(t => `<option ${t === save.title ? 'selected' : ''}>${esc(t)}</option>`).join('');
  $('#titleSelect').disabled = !ts.length;
  $('#achList').innerHTML = ACH.map(ac => {
    const got = !!save.ach[ac.id], goal = achGoal(ac), cur = Math.min(goal, ac.stat(save));
    return `<li class="${got ? 'got' : ''}"><span class="ach-ico"></span><div><b>${esc(ac.name)}</b><small>${esc(ac.desc)}${ac.title ? ` · <i>title: ${esc(ac.title)}</i>` : ''}</small>
      ${got ? '' : `<div class="feat-bar"><i style="width:${Math.round((cur / goal) * 100)}%"></i></div><small>${ac.show ? esc(ac.show(save)) : `${cur.toLocaleString()} / ${goal.toLocaleString()}${ac.unit ? ' ' + ac.unit : ''}`}</small>`}</div>
      <span class="ach-reward">${got ? 'Done' : `<span class="coin"></span>${ac.coins}`}</span></li>`;
  }).join('');
  show('#achModal');
}

/* =========================================================
   weekly leaderboard
   ========================================================= */
function weekId(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${String(Math.ceil(((t - y0) / 864e5 + 1) / 7)).padStart(2, '0')}`;
}
const prevWeekId = () => weekId(new Date(Date.now() - 7 * 864e5));
function weekResetText() {
  const now = new Date(), d = now.getUTCDay() || 7;
  const ms = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (8 - d)) - now.getTime();
  const h = Math.floor(ms / 36e5);
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${Math.floor((ms % 36e5) / 6e4)}m`;
}
function submitWeekly(score) {
  const w = weekId();
  if (save.weekBest.w !== w) save.weekBest = { w, s: 0 };
  if (score <= save.weekBest.s) return;
  save.weekBest.s = score;
  if (net && !isDev) net.submitWeekly(w, save.name || 'Rookie', score, save.skin, rankIndexFor(save.level)).catch(() => {});
}
async function checkWeeklyChamp() {
  if (!net || isDev) return;
  const prev = prevWeekId();
  if (save.weeklyClaims.includes(prev)) return;
  try {
    const rows = await net.topOfWeek(prev, 3);
    const place = rows.findIndex(r => r.uid === net.uid);
    save.weeklyClaims.push(prev);
    if (place >= 0) {
      if (!save.ownedSkins.includes('weekly-champ')) save.ownedSkins.push('weekly-champ');
      save.coins += 500;
      save.stats.weeklyTop = 1;
      celebrate('Weekly Champ!', `You finished #${place + 1} last week. +500 coins`, { type: 'skin', id: 'weekly-champ' });
      checkAchievements();
    }
    persist();
  } catch {}
}
function celebrate(title, sub, reward) {
  $('#rankBadge').innerHTML = '<span class="trophy big"></span>';
  $('#rankTitle').textContent = title;
  $('#rankReward').innerHTML = `${rewardPreview(reward, true)}<span><small>${esc(sub)}</small><b>${esc(rewardItem(reward).name)}</b></span>`;
  $('#rankEquip').dataset.type = reward.type;
  $('#rankEquip').dataset.id = reward.id;
  $('#rankModal').style.setProperty('--t', '#ffd23f');
  show('#rankModal');
  sfx.level();
  burstConfetti('#ffd23f');
}

/* =========================================================
   public profile, friends, private rooms
   ========================================================= */
let pubTimer = null;
function savePublicSoon() {
  if (!net) return;
  clearTimeout(pubTimer);
  pubTimer = setTimeout(() => {
    net.savePublic({ name: save.name || 'Rookie', skin: save.skin, rk: isDev ? -2 : rankIndexFor(save.level), level: save.level, best: save.best, kills: save.kills, runs: save.runs, title: save.title || '', fc: save.fc || '' }).catch(() => {});
  }, 2500);
}
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randCode = n => Array.from({ length: n }, () => CODE_CHARS[(Math.random() * CODE_CHARS.length) | 0]).join('');
async function ensureFriendCode() {
  if (!net || save.fc) return;
  for (let i = 0; i < 6 && !save.fc; i++) {
    const code = randCode(6);
    if (await net.claimFriendCode(code)) { save.fc = code; persist(); }
  }
  renderSocial();
}
const social = { friends: new Map(), requests: [], unsubs: [], sent: new Set() };
function setupSocial() {
  social.unsubs.forEach(u => u && u());
  social.unsubs = [];
  for (const f of social.friends.values()) f.unsubs.forEach(u => u && u());
  social.friends = new Map();
  social.requests = [];
  if (!net) return;
  social.unsubs.push(net.watchRequests(list => { social.requests = list; renderSocial(); }));
  social.unsubs.push(net.watchFriends(uids => {
    for (const [id, f] of social.friends) if (!uids.includes(id)) { f.unsubs.forEach(u => u && u()); social.friends.delete(id); }
    for (const id of uids.slice(0, 60)) {
      if (social.friends.has(id)) continue;
      const f = { uid: id, pub: null, online: false, where: null, unsubs: [] };
      social.friends.set(id, f);
      f.unsubs.push(net.watchPublic(id, v => { f.pub = v; renderSocial(); }));
      f.unsubs.push(net.watchPresence(id, v => { f.online = v; renderSocial(); }));
      f.unsubs.push(net.watchWhere(id, v => { f.where = v; renderSocial(); }));
    }
    if (uids.length !== save.stats.friends) { save.stats.friends = uids.length; checkAchievements(); persist(); }
    renderSocial();
  }));
}
function roomLabel(room) { return !room ? '' : room === ROOM ? 'public arena' : `room ${room}`; }
function renderSocial() {
  const reqN = social.requests.length;
  $('#socialBadge').textContent = reqN;
  $('#socialBadge').classList.toggle('hidden', !reqN);
  if ($('#socialModal').classList.contains('hidden')) return;
  $('#myCode').textContent = save.fc || (net ? '……' : '—');
  $('#guestNote').classList.toggle('hidden', !(net && net.user && net.user.anonymous));
  $('#reqList').innerHTML = reqN ? social.requests.map(r => `<li><span class="nm"><b>${esc(r.n || 'Player')}</b> <small>wants to be friends</small></span><button class="item-btn eq" data-acc="${esc(r.uid)}">Accept</button><button class="icon-x" data-dec="${esc(r.uid)}" title="Decline">✕</button></li>`).join('') : '';
  $('#reqWrap').classList.toggle('hidden', !reqN);
  const fr = [...social.friends.values()].sort((x, y) => (y.online - x.online) || String(x.pub?.name || '').localeCompare(String(y.pub?.name || '')));
  $('#friendList').innerHTML = fr.length ? fr.map(f => {
    const p = f.pub || {}, room = f.online && f.where ? f.where.room : '';
    const status = !f.online ? 'Offline' : room ? `Playing in the ${roomLabel(room)}` : 'Online in the menu';
    const canJoin = room && room !== G.room;
    return `<li data-uid="${esc(f.uid)}"><span class="fdot ${f.online ? 'on' : ''}"></span>${badgeHTML(Number.isInteger(p.rk) ? p.rk : -1)}<span class="nm"><b>${esc(p.name || 'Player')}</b><small>${esc(status)}</small></span>${canJoin ? `<button class="item-btn eq" data-join="${esc(room)}">Join</button>` : ''}</li>`;
  }).join('') : '<li class="empty">No friends yet. Share your code or add theirs!</li>';
  const inRoom = G.mode === 'online' && G.room && G.room !== ROOM;
  $('#roomNow').innerHTML = G.mode !== 'online' ? `You're playing <b>${G.mode === 'shrink' ? 'Shrink' : 'Solo'}</b> (offline).` : inRoom ? `You're in private room <b class="code">${esc(G.room)}</b>` : 'You\'re in the <b>public arena</b>.';
  $('#copyInvite').classList.toggle('hidden', !inRoom);
  $('#toPublic').classList.toggle('hidden', !(G.mode === 'online' && inRoom));
}
function openSocial(tab = 'friends') {
  if (!net) { toast(isConfigured(FB_CONFIG) ? 'Still connecting…' : 'Friends need the online version'); return; }
  $$('.soc-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $$('.soc-pane').forEach(p => p.classList.toggle('hidden', p.dataset.pane !== tab));
  show('#socialModal');
  renderSocial();
  ensureFriendCode();
}
async function addFriendByCode(raw) {
  const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 6) { toast('Friend codes are 6 letters/numbers'); return; }
  if (code === save.fc) { toast("That's your own code!"); return; }
  const id = await net.lookupFriendCode(code).catch(() => null);
  if (!id) { toast('No player found with that code'); return; }
  await sendRequest(id);
}
async function sendRequest(id) {
  if (social.friends.has(id)) { toast("You're already friends"); return; }
  const incoming = social.requests.find(r => r.uid === id);
  if (incoming) { await net.acceptRequest(id).catch(() => {}); toast('Friend added!'); return; }
  try { await net.sendFriendRequest(id, save.name || 'Rookie'); social.sent.add(id); toast('Friend request sent!'); sfx.click(); }
  catch { toast("Couldn't send the request"); }
}
function normRoom(raw) {
  const c = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^COIL/, '');
  return c.length === 4 ? `COIL-${c}` : null;
}
function inviteLink(room) { return `${location.origin}${location.pathname}?room=${room}`; }
function joinRoomCode(room) {
  if (!room) { toast('Room codes look like COIL-7Q2K'); return; }
  if (setMode('online', room)) {
    hide('#socialModal');
    try { history.replaceState(null, '', room === ROOM ? location.pathname : `?room=${room}`); } catch {}
    toast(room === ROOM ? 'Back in the public arena' : `Joined ${room}`);
  }
}
async function copyText(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg); } catch { prompt('Copy this:', text); }
}

/* ---------- profile popup ---------- */
async function openProfile(id) {
  if (!net || !id) return;
  const p = await net.getPublic(id).catch(() => null);
  if (!p) { toast('No profile yet for that player'); return; }
  const me = id === net.uid;
  const rk = Number.isInteger(p.rk) ? p.rk : -1;
  $('#pfCanvas').dataset.pv = `skin:${skinById(p.skin).id}`;
  $('#pfName').textContent = p.name || 'Player';
  $('#pfTitle').textContent = p.title || '';
  $('#pfTitle').classList.toggle('hidden', !p.title);
  $('#pfRank').innerHTML = `${badgeHTML(rk, 'mid')}<span><b>${rk === -2 ? 'Developer' : rankName(rk)}</b><small>Level ${Number(p.level) || 1}</small></span>`;
  $('#pfStats').innerHTML = [['Best', p.best], ['KOs', p.kills], ['Runs', p.runs]].map(([k, v]) => `<div class="stat"><span>${k}</span><b>${(Number(v) || 0).toLocaleString()}</b></div>`).join('');
  const btn = $('#pfFriend');
  btn.dataset.uid = id;
  btn.disabled = false;
  if (me) { btn.textContent = "That's you!"; btn.disabled = true; }
  else if (social.friends.has(id)) { btn.textContent = 'Friends ✓ (remove)'; btn.dataset.act = 'remove'; }
  else if (social.requests.some(r => r.uid === id)) { btn.textContent = 'Accept friend request'; btn.dataset.act = 'add'; }
  else if (social.sent.has(id)) { btn.textContent = 'Request sent'; btn.disabled = true; }
  else { btn.textContent = 'Add friend'; btn.dataset.act = 'add'; }
  show('#profileModal');
}

function setMode(mode, room = ROOM) {
  if (G.state === 'playing' || G.state === 'paused' || G.state === 'dying') { toast('Finish this run first'); return false; }
  if (mode === 'online' && !net) {
    toast(isConfigured(FB_CONFIG) ? 'Still connecting to the server…' : 'Online play needs Firebase — see SETUP guide');
    return false;
  }
  const wasOnline = G.mode === 'online';
  if (G.player) { const i = G.snakes.indexOf(G.player); if (i >= 0) G.snakes.splice(i, 1); G.player = null; }
  if (wasOnline && (mode !== 'online' || room !== G.room)) leaveWorld();
  G.mode = mode;
  G.arenaR = ARENA_R;
  if (mode === 'online' && G.room !== room) enterWorld(room);
  if (mode !== 'online' && wasOnline) G.foods = [];
  if (mode === 'online' && room === ROOM) { try { history.replaceState(null, '', location.pathname); } catch {} }
  updateModeUI();
  fillWorld();
  renderBoard();
  renderSocial();
  return true;
}
function updateModeUI() {
  const mode = G.mode, priv = mode === 'online' && G.room && G.room !== ROOM;
  $$('.mode').forEach(b => { const on = b.dataset.mode === mode; b.classList.toggle('active', on); b.setAttribute('aria-checked', on); });
  $('#modeKicker').textContent = mode === 'online' ? (priv ? `Private room ${G.room}` : 'Online arena') : mode === 'shrink' ? 'Shrink battle' : 'Solo arena';
  $('#arenaStatus').textContent = mode === 'online' ? (priv ? `Private room ${G.room}` : 'Online arena · live') : mode === 'shrink' ? 'Shrink battle · last snake wins' : 'Solo arena';
  $('#liveDot').classList.toggle('online', mode === 'online');
  $('#inviteBtn').classList.toggle('hidden', !priv);
  $('#onlineSub').textContent = !net ? $('#onlineSub').textContent : priv ? G.room : 'Real players, live';
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
  const dot = $('#acctDot'), text = $('#acctText');
  const hideAll = () => ['#acctActions', '#googleBtn', '#logoutBtn', '#copyIdBtn', '#devBtn'].forEach(hide);
  hideAll();
  if (!net) {
    dot.classList.remove('on');
    text.textContent = 'Progress is saved in this browser.';
    return;
  }
  dot.classList.add('on');
  if (user && !user.anonymous) {
    text.innerHTML = `Signed in as <b>${esc(user.email || user.name || 'your account')}</b>${isDev ? ' <span class="rbadge dev">DEV</span>' : ''}<br><small>Progress syncs on every device.</small>`;
    show('#logoutBtn');
    show('#copyIdBtn');
    $('#devBtn').classList.toggle('hidden', !isDev);
  } else {
    text.innerHTML = 'Playing as a guest.<br><small>Make a free account to keep your progress on any device.</small>';
    show('#acctActions');
    show('#googleBtn');
  }
}

/* ---------- email + password accounts ---------- */
let authMode = 'signup', authBusy = false;
function openAuth(mode) {
  if (!net) { toast(isConfigured(FB_CONFIG) ? 'Still connecting — try again in a second' : 'Accounts need the online version'); return; }
  setAuthMode(mode);
  $('#authMsg').textContent = '';
  $('#authMsg').className = 'auth-msg';
  show('#authModal');
  if (G.state === 'playing' && G.mode === 'solo') pause();
  setTimeout(() => $('#authEmail').focus(), 40);
}
function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === 'signup';
  $$('.auth-tab').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  $('#authTitle').textContent = signup ? 'Create your account' : 'Welcome back';
  $('#authSubmit').textContent = signup ? 'Create account' : 'Log in';
  $('#confirmField').classList.toggle('hidden', !signup);
  $('#forgotBtn').classList.toggle('hidden', signup);
  $('#authPass').autocomplete = signup ? 'new-password' : 'current-password';
  $('#authNote').textContent = signup ? 'Your current coins, skins and rank come with you.' : 'Logging in loads the progress saved on that account.';
  $('#authMsg').textContent = '';
}
function authError(e) {
  const code = (e && e.code) || '';
  if (code.includes('email-already-in-use') || code.includes('credential-already-in-use')) return 'That email already has an account — try Log in.';
  if (code.includes('invalid-email')) return "That email doesn't look right.";
  if (code.includes('weak-password')) return 'Password needs at least 6 characters.';
  if (code.includes('missing-password')) return 'Type your password.';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found') || code.includes('invalid-login')) return 'Email or password is incorrect.';
  if (code.includes('too-many-requests')) return 'Too many tries — wait a minute and try again.';
  if (code.includes('operation-not-allowed')) return "Email sign-in isn't turned on in Firebase yet.";
  if (code.includes('network-request-failed')) return 'No connection — check your internet.';
  if (code.includes('provider-already-linked')) return 'This guest is already linked to an account.';
  return 'Something went wrong — please try again.';
}
function authMsg(text, ok = false) { const m = $('#authMsg'); m.textContent = text; m.className = `auth-msg${ok ? ' ok' : ''}`; }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
async function submitAuth(e) {
  e.preventDefault();
  if (authBusy || !net) return;
  const email = $('#authEmail').value.trim().toLowerCase();
  const pass = $('#authPass').value;
  if (!EMAIL_RE.test(email)) return authMsg("That email doesn't look right.");
  if (pass.length < 6) return authMsg('Password needs at least 6 characters.');
  if (authMode === 'signup' && pass !== $('#authPass2').value) return authMsg("Passwords don't match.");
  authBusy = true;
  const btn = $('#authSubmit'), label = btn.textContent;
  btn.disabled = true; btn.textContent = authMode === 'signup' ? 'Creating…' : 'Logging in…';
  try {
    if (authMode === 'signup') {
      const u = await net.signUpEmail(email, pass);
      renderAccount(u);
      scheduleCloudSave();
      hide('#authModal');
      sfx.coin();
      toast('Account created — your progress is safe!');
    } else {
      await net.signInEmail(email, pass);
      hide('#authModal');
      sfx.click();
      toast('Welcome back!');
    }
    $('#authPass').value = ''; $('#authPass2').value = '';
  } catch (err) {
    authMsg(authError(err));
  } finally {
    authBusy = false; btn.disabled = false; btn.textContent = label;
  }
}
async function forgotPassword() {
  const email = $('#authEmail').value.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) { authMsg('Type your email above first, then tap "Forgot password?" again.'); $('#authEmail').focus(); return; }
  try { await net.resetPassword(email); } catch (err) { if (!String(err.code).includes('user-not-found')) return authMsg(authError(err)); }
  authMsg('If that email has an account, a reset link is on its way. Check your inbox (and spam).', true);
}
async function logOut() {
  if (!net) return;
  if (!confirm('Log out on this device? Your progress stays saved in your account.')) return;
  clearTimeout(cloudTimer);
  try { const { settings, updated, ...data } = save; await net.saveProfile(data); } catch {}
  const settings = save.settings;
  if (G.state === 'playing' || G.state === 'paused') { G.state = 'playing'; hide('#pauseOverlay'); killSnake(G.player, { quit: true }); }
  isDev = false; devGod = false; document.body.classList.remove('is-dev');
  save = normalize({ settings, name: save.name });
  if (G.mode === 'online') { leaveWorld(); G.mode = 'solo'; updateModeUI(); fillWorld(); }
  writeLocal();
  renderProfile();
  await net.signOutUser().catch(() => {});
  toast('Logged out');
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
/* ---------- developer mode ---------- */
let isDev = false, devGod = false;
function submitBest(name = save.name || 'Rookie') {
  if (!net || isDev || save.best <= 0) return;
  net.submitScore(name, save.best, save.skin, rankIndexFor(save.level)).then(() => { save.submittedBest = save.best; writeLocal(); }).catch(() => {});
}
async function refreshDev() {
  const was = isDev;
  isDev = net ? await net.checkDev() : false;
  document.body.classList.toggle('is-dev', isDev);
  if (!isDev) devGod = false;
  if (isDev) {
    save.ownedSkins = SKINS.map(s => s.id);
    save.ownedEffects = EFFECTS.map(e => e.id);
    save.coins = Math.max(save.coins, 999999);
    if (save.level < 50) { save.level = 50; save.xp = 0; }
    persist();
    net.removeLeaderboardEntry().catch(() => {});
    if (!was) toast('Dev mode on — everything unlocked');
  }
  renderAccount(net && net.user);
  renderProfile();
  return isDev;
}
function openDev() {
  if (!isDev) return;
  $('#devGod').checked = devGod;
  $('#devLevel').value = save.level;
  show('#devModal');
}

async function syncProfile(switched = false) {
  try {
    const cloud = await net.loadProfile();
    if (cloud && switched) {
      save = normalize({ ...cloud, settings: save.settings });
      writeLocal();
      renderProfile();
      if (save.name) hide('#nameModal');
      await refreshDev();
      renderBoard();
      return;
    }
    if (cloud) {
      const c = normalize(cloud);
      const base = (c.updated || 0) > (save.updated || 0) ? c : save;
      const merged = {
        ...base,
        best: Math.max(c.best, save.best),
        kills: Math.max(c.kills, save.kills),
        runs: Math.max(c.runs, save.runs),
        submittedBest: Math.max(c.submittedBest, save.submittedBest),
        ...((c.level > save.level || (c.level === save.level && c.xp > save.xp)) ? { level: c.level, xp: c.xp } : { level: save.level, xp: save.xp }),
        ownedSkins: [...new Set([...c.ownedSkins, ...save.ownedSkins])],
        ownedEffects: [...new Set([...c.ownedEffects, ...save.ownedEffects])],
        history: [...c.history, ...save.history].sort((a, b) => b.score - a.score).filter((h, i, arr) => arr.findIndex(x => x.score === h.score && x.date === h.date) === i).slice(0, 5),
        name: base.name || save.name || c.name,
        stats: Object.fromEntries(STAT_KEYS.map(k => [k, Math.max(c.stats[k] || 0, save.stats[k] || 0)])),
        ach: { ...c.ach, ...save.ach },
        weeklyClaims: [...new Set([...c.weeklyClaims, ...save.weeklyClaims])],
        fc: c.fc || save.fc,
        settings: save.settings,
      };
      save = normalize(merged);
      writeLocal();
      renderProfile();
      if (save.name) hide('#nameModal');
    }
    scheduleCloudSave();
    await refreshDev();
    submitBest();
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
      onUser: (user, changed) => {
        renderAccount(user);
        if (!changed) return;
        syncProfile(true).then(() => { ensureFriendCode(); savePublicSoon(); });
        setupSocial();
        if (G.mode === 'online' && G.room && G.state !== 'playing') { const r = G.room; leaveWorld(); enterWorld(r); }
      },
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
  net.watchWeekly(weekId(), rows => { G.weeklyRows = rows; if (boardTab === 'weekly') renderBoard(); });
  setupSocial();
  setTimeout(() => { ensureFriendCode(); checkWeeklyChamp(); savePublicSoon(); }, 1500);
  const qRoom = normRoom(new URLSearchParams(location.search).get('room'));
  if (qRoom) setTimeout(() => joinRoomCode(qRoom), 300);
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
function modalOpen() { return ['#achModal', '#socialModal', '#profileModal', '#devModal'].some(m => !$(m).classList.contains('hidden')) || !$('#authModal').classList.contains('hidden') || !$('#rankModal').classList.contains('hidden') || !$('#shopModal').classList.contains('hidden') || !$('#nameModal').classList.contains('hidden'); }

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
  $$('.mode').forEach(b => { b.onclick = () => { sfx.click(); setMode(b.dataset.mode, b.dataset.mode === 'online' ? (G.mode === 'online' && G.room ? G.room : ROOM) : undefined); }; });
  $('#leaderboard').addEventListener('click', e => { const li = e.target.closest('li[data-uid]'); if (li && net) openProfile(li.dataset.uid); });
  $('#achBtn').onclick = () => { sfx.click(); openAch(); };
  $('#achClose').onclick = () => hide('#achModal');
  $('#achModal').addEventListener('click', e => { if (e.target.id === 'achModal') hide('#achModal'); });
  $('#titleSelect').onchange = e => { save.title = e.target.value; persist(); toast(save.title ? `Title set: ${save.title}` : 'Title removed'); };
  $('#socialBtn').onclick = () => { sfx.click(); openSocial('friends'); };
  $('#socialClose').onclick = () => hide('#socialModal');
  $('#socialModal').addEventListener('click', e => {
    if (e.target.id === 'socialModal') { hide('#socialModal'); return; }
    const acc = e.target.closest('[data-acc]'), dec = e.target.closest('[data-dec]'), join = e.target.closest('[data-join]'), li = e.target.closest('#friendList li[data-uid]');
    if (acc) { net.acceptRequest(acc.dataset.acc).then(() => { toast('Friend added!'); sfx.coin(); }).catch(() => toast("Couldn't accept")); return; }
    if (dec) { net.declineRequest(dec.dataset.dec).catch(() => {}); return; }
    if (join) { joinRoomCode(join.dataset.join); return; }
    if (li) openProfile(li.dataset.uid);
  });
  $$('.soc-tab').forEach(b => { b.onclick = () => openSocial(b.dataset.tab); });
  $('#copyCode').onclick = () => save.fc && copyText(save.fc, 'Friend code copied');
  $('#addFriendBtn').onclick = () => addFriendByCode($('#addFriendInput').value);
  $('#addFriendInput').addEventListener('keydown', e => { if (e.key === 'Enter') addFriendByCode(e.target.value); });
  $('#createRoom').onclick = () => { const code = `COIL-${randCode(4)}`; joinRoomCode(code); setTimeout(() => copyText(inviteLink(code), 'Room created — invite link copied!'), 200); };
  $('#joinRoomBtn').onclick = () => joinRoomCode(normRoom($('#joinRoomInput').value));
  $('#joinRoomInput').addEventListener('keydown', e => { if (e.key === 'Enter') joinRoomCode(normRoom(e.target.value)); });
  $('#copyInvite').onclick = () => copyText(inviteLink(G.room), 'Invite link copied!');
  $('#inviteBtn').onclick = () => copyText(inviteLink(G.room), 'Invite link copied!');
  $('#toPublic').onclick = () => joinRoomCode(ROOM);
  $('#pfClose').onclick = () => hide('#profileModal');
  $('#profileModal').addEventListener('click', e => { if (e.target.id === 'profileModal') hide('#profileModal'); });
  $('#pfFriend').onclick = async () => {
    const b = $('#pfFriend'), id = b.dataset.uid;
    if (b.dataset.act === 'remove') { if (confirm('Remove this friend?')) { await net.removeFriend(id).catch(() => {}); toast('Friend removed'); hide('#profileModal'); } return; }
    b.disabled = true; await sendRequest(id); openProfile(id);
  };
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
    submitBest(n);
  };
  $('#nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#saveName').click(); } });
  $('#nameModal').addEventListener('click', e => { if (e.target.id === 'nameModal' && save.name) hide('#nameModal'); });

  const toggleSound = () => { save.settings.sound = !save.settings.sound; persist(); if (save.settings.sound) sfx.click(); toast(save.settings.sound ? 'Sound on' : 'Sound off'); };
  $('#soundBtn').onclick = toggleSound;
  $('#soundToggle').onchange = e => { save.settings.sound = e.target.checked; persist(); };
  $('#sensitivity').oninput = e => { save.settings.sensitivity = Number(e.target.value); persist(); };
  $('#shakeToggle').onchange = e => { save.settings.shake = e.target.checked; persist(); };

  $('#signupBtn').onclick = () => openAuth('signup');
  $('#copyIdBtn').onclick = async () => { try { await navigator.clipboard.writeText(net.uid); toast('Player ID copied'); } catch { prompt('Your player ID:', net.uid); } };
  $('#devBtn').onclick = openDev;
  $('#devClose').onclick = () => hide('#devModal');
  $('#devModal').addEventListener('click', e => { if (e.target.id === 'devModal') hide('#devModal'); });
  $('#devGod').onchange = e => { devGod = e.target.checked; toast(devGod ? 'Invincible on (solo only)' : 'Invincible off'); };
  $('#devCoins').onclick = () => { save.coins += 10000; persist(); sfx.coin(); toast('+10,000 coins'); };
  $('#devSetLevel').onclick = () => { const l = clamp(parseInt($('#devLevel').value, 10) || 1, 1, 999); save.level = l; save.xp = 0; persist(); toast(`Level set to ${l}`); };
  $('#devGrow').onclick = () => { if (G.player && !G.player.dead && G.state !== 'menu') { G.player.mass += 250; toast('+250 size'); } else toast('Start a run first'); };
  $('#devFood').onclick = () => { const c = G.player && !G.player.dead ? G.player : { x: G.cam.x, y: G.cam.y }; for (let i = 0; i < 120; i++) spawnFood(c.x + rand(-260, 260), c.y + rand(-260, 260), 3, { life: 30 }); toast('Snack time'); };
  $('#loginBtn').onclick = () => openAuth('login');
  $('#logoutBtn').onclick = logOut;
  $$('.auth-tab').forEach(b => { b.onclick = () => setAuthMode(b.dataset.mode); });
  $('#authForm').addEventListener('submit', submitAuth);
  $('#forgotBtn').onclick = forgotPassword;
  $('#authClose').onclick = () => hide('#authModal');
  $('#authModal').addEventListener('click', e => { if (e.target.id === 'authModal') hide('#authModal'); });
  $('#pwToggle').onclick = () => { const p = $('#authPass'), s = p.type === 'password'; p.type = s ? 'text' : 'password'; $('#authPass2').type = p.type; $('#pwToggle').textContent = s ? 'Hide' : 'Show'; };
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
      for (const m of ['#achModal', '#socialModal', '#profileModal']) if (!$(m).classList.contains('hidden')) { hide(m); return; }
      if (!$('#devModal').classList.contains('hidden')) { hide('#devModal'); return; }
      if (!$('#authModal').classList.contains('hidden')) { hide('#authModal'); return; }
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
let avatarFrame = 0;
function frame(t) {
  const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
  last = t;
  if (G.state !== 'paused') update(dt);
  render();
  renderMinimap();
  hud(t);
  if (++avatarFrame % 2 === 0) drawAvatar(t / 1000, dt * 2);
  animatePreviews(t / 1000, dt);
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
  setTimeout(checkAchievements, 3000);
  setInterval(() => { if (boardTab === 'weekly') renderBoard(); }, 60000);
  connect();
}
init();

// exposed for debugging in the browser console
window.coil = { G, get save() { return save; }, ready: true, addXp: n => { addXp(n); persist(); }, RANKS };
})();
