// coil — skin catalog + snake renderer (patterns, accessories, trails, live previews)
(() => {
'use strict';
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);

/* =========================================================
   catalog
   pattern: gradient | flow | bands | dots | tiger | scales | metal | crystal | galaxy | royal | ghost
   acc:     bow | shades | antenna | ears | whiskers | horns | halo | crown | visor
   eyes:    cute | star | spooky | shades | visor
   trail:   sparkle | bubbles | fire | embers | stars | hearts | rainbow | frost | prism
   ========================================================= */
const SHOP = [
  { id: 'aurora', name: 'Aurora', tag: 'The classic glow.', colors: ['#38e1ff', '#9b7bff'], pattern: 'gradient', cost: 0, rarity: 'starter' },
  { id: 'bubblegum', name: 'Bubblegum', tag: 'Pop, pop, pop!', colors: ['#ff7ab8', '#ffc2de'], pattern: 'gradient', acc: 'bow', trail: 'bubbles', cost: 150, rarity: 'common' },
  { id: 'lemonade', name: 'Lemonade', tag: 'Too cool for pulp.', colors: ['#ffe45c', '#ffb23f'], pattern: 'bands', band: 2, eyes: 'shades', cost: 220, rarity: 'common' },
  { id: 'mint', name: 'Mint chip', tag: 'One scoop, extra chips.', colors: ['#7dffd2', '#c9fff0'], accent: '#4a2e1f', pattern: 'dots', cost: 300, rarity: 'common' },
  { id: 'limelight', name: 'Limelight', tag: 'Fully charged.', colors: ['#b6ff5c', '#38e1ff', '#b6ff5c'], pattern: 'flow', speed: 0.5, acc: 'antenna', accent: '#b6ff5c', trail: 'sparkle', cost: 380, rarity: 'rare' },
  { id: 'tiger', name: 'Tiger', tag: 'Rawr (politely).', colors: ['#ffa447', '#ffcf8a'], accent: '#2a1838', pattern: 'tiger', acc: 'ears', earInner: '#ffd9b3', cost: 480, rarity: 'rare' },
  { id: 'neon-cat', name: 'Neon kitty', tag: 'Nine lives. Maybe.', colors: ['#ff6fcf', '#9b7bff'], pattern: 'gradient', acc: 'ears', whiskers: true, earInner: '#ffd1ee', trail: 'hearts', cost: 560, rarity: 'rare' },
  { id: 'galaxy', name: 'Galaxy', tag: 'Carries a whole universe.', colors: ['#2d1f7a', '#5a2fb0', '#ff5fa2'], pattern: 'galaxy', trail: 'stars', aura: '#9b7bff', cost: 700, rarity: 'epic' },
  { id: 'lava', name: 'Lava lamp', tag: 'Hot. Very hot.', colors: ['#ff4d4d', '#ff9f43', '#ffd23f', '#ff9f43'], pattern: 'flow', speed: 0.6, trail: 'embers', aura: '#ff7a3d', cost: 800, rarity: 'epic' },
  { id: 'robot', name: 'Robo-snek', tag: 'Beep boop. Snack detected.', colors: ['#d3d9ee', '#8a93b5'], pattern: 'metal', acc: 'antenna', accent: '#38e1ff', eyes: 'visor', cheeks: false, cost: 900, rarity: 'epic' },
  { id: 'ghost', name: 'Boo', tag: 'Spooky, but friendly.', colors: ['#f4f1ff', '#c9c2ff'], pattern: 'ghost', eyes: 'spooky', cheeks: false, trail: 'frost', aura: '#c9c2ff', cost: 1000, rarity: 'epic' },
  { id: 'rainbow', name: 'Rainbow road', tag: 'Leaves a rainbow everywhere.', colors: ['#ff5fa2', '#ff9f43', '#ffd23f', '#b6ff5c', '#38e1ff', '#9b7bff'], pattern: 'flow', speed: 0.7, trail: 'rainbow', aura: '#ffffff', cost: 1300, rarity: 'legendary' },
  { id: 'caterpillar', name: 'Caterpillar', tag: 'Very hungry. Very cute.', colors: ['#9be15d', '#5fcf6a'], accent: '#ffe45c', pattern: 'bands', band: 1, legs: true, acc: 'antenna', cost: 650, rarity: 'epic', character: true },
  { id: 'donut', name: 'Donut run', tag: 'A whole dozen, on the move.', colors: ['#ff7ab8', '#7a4a2b', '#7dffd2', '#fff2cc'], shape: 'donut', cost: 750, rarity: 'epic', character: true },
  { id: 'pearls', name: 'String of pearls', tag: 'Fancy. Extremely fancy.', colors: ['#fff8f0', '#ffd9ec', '#d9e8ff'], shape: 'pearls', eyes: 'star', starColor: '#ff9fce', aura: '#ffd9ec', cost: 900, rarity: 'epic', character: true },
  { id: 'fruit', name: 'Fruit salad', tag: 'Part of a balanced diet.', colors: ['#ff3b5c', '#9be15d'], shape: 'fruit', cost: 1000, rarity: 'epic', character: true },
  { id: 'shark', name: 'Shark', tag: 'Dun dun... dun dun...', colors: ['#7fb2ff', '#4a74d9'], pattern: 'gradient', fins: true, snout: true, trail: 'bubbles', cost: 1200, rarity: 'legendary', character: true },
  { id: 'train', name: 'Choo-choo', tag: 'All aboard the snack express!', colors: ['#ff5a4e', '#38e1ff', '#ffd23f', '#b6ff5c', '#9b7bff'], shape: 'train', trail: 'smoke', cost: 1500, rarity: 'legendary', character: true },
  { id: 'mecha', name: 'Mecha-pede', tag: 'Forty legs. Zero chill.', colors: ['#c9d1ea', '#8a93b5', '#5b6386'], accent: '#38e1ff', shape: 'mecha', eyes: 'visor', cost: 1800, rarity: 'legendary', character: true },
  { id: 'rocket', name: 'Rocket', tag: 'To the moon (and back).', colors: ['#f4f1ff', '#ff5a4e'], shape: 'rocket', trail: 'fire', aura: '#ff9f43', cost: 2500, rarity: 'mythic', character: true },
  { id: 'dragon', name: 'Dragon', tag: 'Breathes fire. Literally.', colors: ['#3ddc8c', '#1a9e62'], accent: '#ffd23f', pattern: 'scales', acc: 'horns', trail: 'fire', aura: '#5cffc8', eyes: 'star', starColor: '#ffd23f', cost: 1600, rarity: 'legendary' },
];
// Rank skins: clean metallic finishes; Elite versions add trails, auras and accessories.
const EXCLUSIVE = [
  { id: 'weekly-champ', name: 'Weekly Champ', tag: 'Only for a weekly top 3.', colors: ['#fff6c9', '#ffd23f', '#ffe98f'], shape: 'pearls', acc: 'crown', eyes: 'star', starColor: '#ffd23f', trail: 'sparkle', trailColors: ['#ffd23f', '#fff6c9'], aura: '#ffd23f', cost: 0, rarity: 'exclusive', character: true },
];
const RANK = [
  { id: 'bronze', name: 'Bronze', tag: 'Polished and proud.', colors: ['#ffc896', '#d9854a', '#a85c2a'], pattern: 'metal' },
  { id: 'bronze-elite', name: 'Bronze Elite', tag: 'Forged in the arena.', colors: ['#ffd9b3', '#e08d4f', '#9c4f1f'], pattern: 'metal', trail: 'embers', aura: '#f0a56b', eyes: 'star', starColor: '#ffd9b3' },
  { id: 'silver', name: 'Silver', tag: 'Chrome finish.', colors: ['#ffffff', '#c5cce6', '#8790b3'], pattern: 'metal' },
  { id: 'silver-elite', name: 'Silver Elite', tag: 'Ice cold.', colors: ['#ffffff', '#cfe9ff', '#8fa3d6'], pattern: 'crystal', trail: 'frost', aura: '#bfe6ff', eyes: 'star', starColor: '#bfe6ff' },
  { id: 'gold', name: 'Gold', tag: '24 karat snek.', colors: ['#fff1a8', '#ffcc33', '#c98b00'], pattern: 'metal' },
  { id: 'gold-elite', name: 'Gold Elite', tag: 'Blessed by the arena.', colors: ['#fff6c9', '#ffd23f', '#d69a00'], pattern: 'metal', acc: 'halo', trail: 'sparkle', trailColors: ['#ffd23f', '#fff6c9'], aura: '#ffd23f', eyes: 'star', starColor: '#fff6c9' },
  { id: 'platinum', name: 'Platinum', tag: 'Pearl shimmer.', colors: ['#e9fff8', '#9ff5dc', '#c9d6ff', '#e9fff8'], pattern: 'flow', speed: 0.15, metal: true },
  { id: 'platinum-elite', name: 'Platinum Elite', tag: 'Northern lights.', colors: ['#5cffc8', '#38e1ff', '#c9a8ff', '#5cffc8'], pattern: 'flow', speed: 0.3, metal: true, trail: 'stars', aura: '#5cffc8', eyes: 'star', starColor: '#e9fff8' },
  { id: 'diamond', name: 'Diamond', tag: 'Cut to perfection.', colors: ['#d8fbff', '#38e1ff', '#2a8cff'], pattern: 'crystal' },
  { id: 'diamond-elite', name: 'Diamond Elite', tag: 'Flawless.', colors: ['#ffffff', '#7ceeff', '#6f7cff'], pattern: 'crystal', metal: true, trail: 'prism', aura: '#7ceeff', eyes: 'star', starColor: '#ffffff' },
  { id: 'champion', name: 'Champion', tag: 'Royalty of the arena.', colors: ['#ff5fa2', '#9b4bff'], accent: '#ffd23f', pattern: 'royal', acc: 'crown', aura: '#ff5fa2' },
  { id: 'champion-elite', name: 'Legend', tag: 'The one everyone chases.', colors: ['#ff5fa2', '#ffd23f', '#5cffc8', '#38e1ff', '#9b7bff'], pattern: 'flow', speed: 0.5, metal: true, acc: 'crown', trail: 'prism', aura: '#ffffff', eyes: 'star', starColor: '#ffd23f' },
];

const ACC_NAMES = { bow: 'Bow', shades: 'Shades', antenna: 'Antenna', ears: 'Ears', horns: 'Horns', halo: 'Halo', crown: 'Crown' };
const TRAIL_NAMES = { smoke: 'Smoke puffs', sparkle: 'Sparkle trail', bubbles: 'Bubble trail', fire: 'Fire trail', embers: 'Ember trail', stars: 'Star trail', hearts: 'Heart trail', rainbow: 'Rainbow trail', frost: 'Frost trail', prism: 'Prism trail' };
function features(sk) {
  const f = [];
  if (sk.pattern === 'flow' || sk.pattern === 'galaxy') f.push('Animated');
  if (sk.pattern === 'metal' || sk.metal) f.push('Shine');
  if (sk.pattern === 'crystal') f.push('Crystal');
  if (sk.acc && ACC_NAMES[sk.acc]) f.push(ACC_NAMES[sk.acc]);
  if (sk.eyes === 'shades') f.push('Shades');
  if (sk.eyes === 'visor') f.push('Visor');
  if (sk.eyes === 'star') f.push('Star eyes');
  if (sk.character) f.unshift('Character');
  if (sk.legs) f.push('Legs');
  if (sk.fins) f.push('Fins');
  if (sk.trail) f.push(TRAIL_NAMES[sk.trail]);
  if (sk.aura) f.push('Aura');
  return f;
}

/* =========================================================
   color helpers
   ========================================================= */
const hexCache = new Map();
function rgbOf(hex) {
  let v = hexCache.get(hex);
  if (!v) { const n = parseInt(hex.slice(1), 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; hexCache.set(hex, v); }
  return v;
}
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c, a = 1) => (a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);
const shade = (c, k) => (k < 0 ? [c[0] * (1 + k), c[1] * (1 + k), c[2] * (1 + k)] : [c[0] + (255 - c[0]) * k, c[1] + (255 - c[1]) * k, c[2] + (255 - c[2]) * k]);
function sample(pal, u, cyclic) {
  const m = cyclic ? pal.length : pal.length - 1;
  if (m <= 0) return pal[0];
  let x = u * m;
  x = cyclic ? ((x % m) + m) % m : Math.min(Math.max(x, 0), m - 1e-4);
  const i = Math.floor(x);
  return mix(pal[i], pal[(i + 1) % pal.length], x - i);
}
function compile(sk) {
  if (sk._pal) return sk;
  sk._pal = sk.colors.map(rgbOf);
  sk._base = sk.pattern === 'galaxy' ? sk._pal.slice(0, 2) : sk._pal;
  sk._outline = shade(sk._pal[sk._pal.length > 2 ? 2 : 1] || sk._pal[0], -0.62);
  sk._aura = sk.aura ? rgbOf(sk.aura) : null;
  sk._accent = sk.accent ? rgbOf(sk.accent) : null;
  return sk;
}
function colorAt(sk, i, n, t, k) {
  switch (sk.pattern) {
    case 'flow': return sample(sk._pal, i * 0.012 - t * (sk.speed || 0.35), true);
    case 'bands': return sk._pal[Math.floor(k / (sk.band || 3)) % sk._pal.length];
    case 'scales': { const b = sample(sk._pal, i / n, false); return k % 2 ? shade(b, -0.16) : b; }
    case 'crystal': { const b = sample(sk._pal, (i / n) * 0.9, false); const m = k % 3; return m === 0 ? shade(b, 0.4) : m === 1 ? b : shade(b, -0.14); }
    case 'metal': { const b = sample(sk._pal, 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(i * 0.09 - t * 1.6)), false); return b; }
    default: return sample(sk._base, i / Math.max(1, n - 1), false);
  }
}

/* =========================================================
   glow sprites
   ========================================================= */
const glowCache = new Map();
function glow(color) {
  let c = glowCache.get(color);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const [r, gg, b] = typeof color === 'string' ? rgbOf(color) : color;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.14, `rgba(${r},${gg},${b},1)`);
  gr.addColorStop(0.32, `rgba(${r},${gg},${b},0.75)`);
  gr.addColorStop(0.55, `rgba(${r},${gg},${b},0.18)`);
  gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  glowCache.set(color, c);
  return c;
}
function hash(k) { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

/* =========================================================
   snake body renderer
   s: { pts, r, x, y, angle, boosting }  o: { t, look, blink, sp }
   ========================================================= */
function drawSnakeBody(c, s, sk, o) {
  compile(sk);
  const pts = s.pts, n = pts.length;
  if (n < 2) return;
  if (sk.shape && SHAPES[sk.shape]) { drawShaped(c, s, sk, o); return; }
  const t = o.t, r = s.r, sp = o.sp || 6;
  const step = Math.max(1, Math.round((r * 0.55) / sp));
  const radiusAt = i => { const q = i / n; return q > 0.62 ? r * (1 - ((q - 0.62) / 0.38) * 0.55) : r; };
  const ghost = sk.pattern === 'ghost';
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // glow / aura
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for (let i = 2; i < n; i += 2) c.lineTo(pts[i].x, pts[i].y);
  c.lineTo(pts[n - 1].x, pts[n - 1].y);
  if (sk._aura) {
    const pulse = 0.17 + 0.07 * Math.sin(t * 3);
    c.strokeStyle = css(sk._aura, s.boosting ? pulse * 1.8 : pulse);
    c.lineWidth = r * 2 + (s.boosting ? 36 : 26);
  } else {
    c.strokeStyle = css(sk._pal[0], s.boosting ? 0.3 : 0.12);
    c.lineWidth = r * 2 + (s.boosting ? 28 : 16);
  }
  c.stroke();

  // outline (one batched path)
  if (!ghost) {
    c.beginPath();
    for (let i = n - 1 - ((n - 1) % step); i >= 0; i -= step) {
      const p = pts[i], rr = radiusAt(i) + Math.max(1.5, r * 0.13);
      c.moveTo(p.x + rr, p.y);
      c.arc(p.x, p.y, rr, 0, TAU);
    }
    c.fillStyle = css(sk._outline, 0.95);
    c.fill();
  }

  // body segments, tail -> head
  for (let i = n - 1 - ((n - 1) % step); i >= step; i -= step) {
    const p = pts[i], rr = radiusAt(i);
    const col = colorAt(sk, i, n, t, i / step | 0);
    if (ghost) c.globalAlpha = Math.max(0.08, 0.9 - (i / n) * 0.85);
    c.fillStyle = css(col);
    c.beginPath(); c.arc(p.x, p.y, rr, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;

  // pattern details
  const acc = sk._accent;
  if (sk.pattern === 'dots' || sk.pattern === 'tiger' || sk.pattern === 'galaxy' || sk.pattern === 'royal' || sk.pattern === 'crystal') {
    for (let i = step * 3; i < n - step; i += step) {
      const k = i / step | 0, p = pts[i], q = pts[Math.max(0, i - step)];
      let dx = q.x - p.x, dy = q.y - p.y; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      const px = -dy, py = dx, rr = radiusAt(i);
      if (sk.pattern === 'dots' && k % 3 === 0) {
        c.fillStyle = css(acc);
        const h = hash(k);
        c.beginPath(); c.arc(p.x + px * rr * (h - 0.5) * 1.1, p.y + py * rr * (h - 0.5) * 1.1, rr * 0.2, 0, TAU); c.fill();
        c.beginPath(); c.arc(p.x - px * rr * 0.45 * (hash(k + 3) > 0.5 ? 1 : -1), p.y - py * rr * 0.45 * (hash(k + 3) > 0.5 ? 1 : -1), rr * 0.14, 0, TAU); c.fill();
      } else if (sk.pattern === 'tiger' && k % 4 === 0) {
        c.strokeStyle = css(acc); c.lineWidth = rr * 0.3;
        c.beginPath();
        c.moveTo(p.x + px * rr * 0.82 + dx * rr * 0.25, p.y + py * rr * 0.82 + dy * rr * 0.25);
        c.lineTo(p.x - dx * rr * 0.12, p.y - dy * rr * 0.12);
        c.lineTo(p.x - px * rr * 0.82 + dx * rr * 0.25, p.y - py * rr * 0.82 + dy * rr * 0.25);
        c.stroke();
      } else if (sk.pattern === 'galaxy') {
        const h = hash(k);
        if (h < 0.5) {
          const tw = 0.55 + 0.45 * Math.sin(t * 4 + k * 1.7);
          c.fillStyle = h < 0.12 ? css(sk._pal[2], tw) : `rgba(255,255,255,${tw})`;
          c.beginPath(); c.arc(p.x + px * rr * (h * 2 - 0.5), p.y + py * rr * (h * 2 - 0.5), rr * (h < 0.12 ? 0.22 : 0.11) * (0.8 + tw * 0.4), 0, TAU); c.fill();
        }
      } else if (sk.pattern === 'royal' && k % 5 === 0) {
        c.strokeStyle = css(acc); c.lineWidth = rr * 0.26;
        c.beginPath(); c.moveTo(p.x + px * rr * 0.9, p.y + py * rr * 0.9); c.lineTo(p.x - px * rr * 0.9, p.y - py * rr * 0.9); c.stroke();
        c.fillStyle = '#ffffff';
        c.beginPath(); c.arc(p.x, p.y, rr * 0.13, 0, TAU); c.fill();
      } else if (sk.pattern === 'crystal' && k % 3 === 0) {
        const tw = Math.sin(t * 3.2 + k * 2.1);
        if (tw > 0.3) {
          const g = rr * 0.55 * tw, gx = p.x - px * rr * 0.3, gy = p.y - py * rr * 0.3;
          c.fillStyle = `rgba(255,255,255,${tw})`;
          c.beginPath(); c.moveTo(gx, gy - g); c.lineTo(gx + g * 0.28, gy); c.lineTo(gx, gy + g); c.lineTo(gx - g * 0.28, gy); c.closePath(); c.fill();
          c.beginPath(); c.moveTo(gx - g, gy); c.lineTo(gx, gy + g * 0.28); c.lineTo(gx + g, gy); c.lineTo(gx, gy - g * 0.28); c.closePath(); c.fill();
        }
      }
    }
  }

  // caterpillar legs / shark fins
  if (sk.legs) {
    c.strokeStyle = css(sk._outline); c.lineCap = 'round';
    for (let i = step * 2; i < n * 0.9; i += step) {
      const p = pts[i], q = pts[Math.max(0, i - step)], rr = radiusAt(i);
      let dx = q.x - p.x, dy = q.y - p.y; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      const wig = Math.sin(t * 14 + i * 0.5) * 0.35;
      c.lineWidth = rr * 0.22;
      for (const sd of [-1, 1]) {
        c.beginPath();
        c.moveTo(p.x - dy * sd * rr * 0.8, p.y + dx * sd * rr * 0.8);
        c.lineTo(p.x - dy * sd * rr * 1.25 + dx * rr * wig, p.y + dx * sd * rr * 1.25 + dy * rr * wig);
        c.stroke();
      }
      if ((i / step | 0) % 2 === 0) { c.fillStyle = css(sk._accent); c.beginPath(); c.arc(p.x, p.y, rr * 0.22, 0, TAU); c.fill(); }
    }
  }
  if (sk.fins) {
    const dark = shade(sk._pal[1], -0.25);
    const at = (i, fn) => { const p = pts[i], q = pts[Math.max(0, i - 2)]; const a = Math.atan2(q.y - p.y, q.x - p.x); c.save(); c.translate(p.x, p.y); c.rotate(a); fn(radiusAt(i)); c.restore(); };
    c.fillStyle = css(dark);
    at(Math.floor(n * 0.22), rr => { c.beginPath(); c.moveTo(rr * 0.9, 0); c.quadraticCurveTo(-rr * 0.2, -rr * 0.35, -rr * 1.6, -rr * 0.05); c.lineTo(-rr * 1.6, rr * 0.05); c.quadraticCurveTo(-rr * 0.2, rr * 0.35, rr * 0.9, 0); c.fill(); });
    at(n - 1, rr => { c.beginPath(); c.moveTo(rr * 0.6, 0); c.lineTo(-rr * 1.5, -rr * 1.7); c.lineTo(-rr * 0.9, 0); c.lineTo(-rr * 1.5, rr * 1.7); c.closePath(); c.fill(); });
    at(Math.min(n - 1, 6), rr => { for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(rr * 0.2, sd * rr * 0.8); c.lineTo(-rr * 0.9, sd * rr * 1.75); c.lineTo(-rr * 0.5, sd * rr * 0.7); c.closePath(); c.fill(); } });
  }

  // gloss along the back
  const metal = sk.pattern === 'metal' || sk.metal || sk.pattern === 'crystal';
  c.beginPath();
  const off = r * 0.34;
  c.moveTo(pts[0].x - off, pts[0].y - off);
  for (let i = 3; i < n * 0.75; i += 3) c.lineTo(pts[i].x - off * (radiusAt(i) / r), pts[i].y - off * (radiusAt(i) / r));
  c.strokeStyle = `rgba(255,255,255,${metal ? 0.34 : ghost ? 0.25 : 0.17})`;
  c.lineWidth = r * (metal ? 0.42 : 0.5);
  c.stroke();

  // moving shine sweep for metallic finishes
  if (metal) {
    const span = 20, period = n + span * 3;
    const m = ((t * 80) % period) - span;
    for (let i = Math.max(0, Math.floor(m - span)); i < Math.min(n, m + span); i += step) {
      const a = 1 - Math.abs(i - m) / span;
      if (a <= 0) continue;
      c.fillStyle = `rgba(255,255,255,${a * 0.42})`;
      c.beginPath(); c.arc(pts[i].x, pts[i].y, radiusAt(i) * 0.82, 0, TAU); c.fill();
    }
  }

  drawHead(c, s, sk, o);
}

function drawHead(c, s, sk, o) {
  const r = s.r, hx = s.x, hy = s.y, a = s.angle, t = o.t;
  const fx = Math.cos(a), fy = Math.sin(a), px = -fy, py = fx;
  const headCol = colorAt(sk, 0, s.pts.length, t, 0);
  const dark = sk._outline;

  // behind-head accessories
  if (sk.acc === 'ears') {
    for (const side of [-1, 1]) {
      const bx = hx - fx * r * 0.1, by = hy - fy * r * 0.1;
      const tip = [bx + px * side * r * 1.25 - fx * r * 0.55, by + py * side * r * 1.25 - fy * r * 0.55];
      const b1 = [bx + px * side * r * 0.45 - fx * r * 0.2, by + py * side * r * 0.45 - fy * r * 0.2];
      const b2 = [bx + px * side * r * 0.95 + fx * r * 0.35, by + py * side * r * 0.95 + fy * r * 0.35];
      c.fillStyle = css(dark);
      c.beginPath(); c.moveTo(...tip); c.lineTo(...b1); c.lineTo(...b2); c.closePath(); c.fill();
      c.fillStyle = css(headCol);
      c.beginPath(); c.moveTo(tip[0] - px * side * r * 0.12, tip[1] - py * side * r * 0.12); c.lineTo(b1[0] + fx * r * 0.08, b1[1] + fy * r * 0.08); c.lineTo(b2[0] - px * side * r * 0.08, b2[1] - py * side * r * 0.08); c.closePath(); c.fill();
      c.fillStyle = sk.earInner || '#ffd1ee';
      const cx = (tip[0] + b1[0] + b2[0]) / 3, cy = (tip[1] + b1[1] + b2[1]) / 3;
      c.beginPath(); c.moveTo(cx + (tip[0] - cx) * 0.55, cy + (tip[1] - cy) * 0.55); c.lineTo(cx + (b1[0] - cx) * 0.45, cy + (b1[1] - cy) * 0.45); c.lineTo(cx + (b2[0] - cx) * 0.45, cy + (b2[1] - cy) * 0.45); c.closePath(); c.fill();
    }
  } else if (sk.acc === 'horns') {
    for (const side of [-1, 1]) {
      const b = [hx - fx * r * 0.35 + px * side * r * 0.55, hy - fy * r * 0.35 + py * side * r * 0.55];
      const tip = [hx - fx * r * 1.55 + px * side * r * 1.05, hy - fy * r * 1.55 + py * side * r * 1.05];
      c.fillStyle = '#fff4d6';
      c.strokeStyle = 'rgba(90,60,20,0.55)'; c.lineWidth = Math.max(1, r * 0.08);
      c.beginPath();
      c.moveTo(b[0] + fx * r * 0.28, b[1] + fy * r * 0.28);
      c.quadraticCurveTo(tip[0] + fx * r * 0.5, tip[1] + fy * r * 0.5, tip[0], tip[1]);
      c.quadraticCurveTo(b[0] - fx * r * 0.1 + px * side * r * 0.2, b[1] - fy * r * 0.1 + py * side * r * 0.2, b[0] - fx * r * 0.22, b[1] - fy * r * 0.22);
      c.closePath(); c.fill(); c.stroke();
    }
  } else if (sk.acc === 'antenna') {
    const accent = sk.accent || '#b6ff5c';
    for (const side of [-1, 1]) {
      const b = [hx - fx * r * 0.2 + px * side * r * 0.35, hy - fy * r * 0.2 + py * side * r * 0.35];
      const e = [hx - fx * r * 1.25 + px * side * r * 0.95, hy - fy * r * 1.25 + py * side * r * 0.95];
      c.strokeStyle = css(dark); c.lineWidth = Math.max(1.2, r * 0.13);
      c.beginPath(); c.moveTo(...b); c.lineTo(...e); c.stroke();
      const pulse = 0.75 + 0.25 * Math.sin(t * 6 + side);
      c.globalCompositeOperation = 'lighter';
      const g = r * 1.5 * pulse;
      c.drawImage(glow(accent), e[0] - g / 2, e[1] - g / 2, g, g);
      c.globalCompositeOperation = 'source-over';
      c.fillStyle = accent;
      c.beginPath(); c.arc(e[0], e[1], r * 0.2, 0, TAU); c.fill();
    }
  }

  // head
  if (sk.snout) {
    c.save(); c.translate(hx, hy); c.rotate(a);
    c.fillStyle = css(dark, 0.95);
    c.beginPath(); c.ellipse(r * 0.45, 0, r * 1.65, r * 1.12, 0, 0, TAU); c.fill();
    c.fillStyle = css(headCol);
    c.beginPath(); c.ellipse(r * 0.45, 0, r * 1.52, r * 1.0, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath(); c.ellipse(r * 0.7, 0, r * 1.05, r * 0.55, 0, 0, TAU); c.fill();
    c.strokeStyle = css(dark); c.lineWidth = r * 0.1;
    for (const sd of [-1, 1]) for (let g = 0; g < 3; g++) { c.beginPath(); c.arc(-r * 0.35 - g * r * 0.22, sd * r * 0.55, r * 0.35, sd > 0 ? -0.2 : 3.34, sd > 0 ? 1.2 : 1.94 + 3.34); c.stroke(); }
    c.fillStyle = '#fff';
    c.beginPath();
    for (let k = 0; k <= 6; k++) { const yy = -r * 0.5 + (k * r) / 6; c.lineTo(r * 1.75 - (k % 2 ? r * 0.22 : 0), yy); }
    c.lineTo(r * 1.5, r * 0.5); c.lineTo(r * 1.5, -r * 0.5); c.closePath(); c.fill();
    c.restore();
  }
  c.fillStyle = css(dark, 0.95);
  c.beginPath(); c.arc(hx, hy, r * 1.08 + Math.max(1.5, r * 0.13), 0, TAU); c.fill();
  c.fillStyle = sk.pattern === 'ghost' ? css(headCol, 0.95) : css(headCol);
  c.beginPath(); c.arc(hx, hy, r * 1.08, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.22)';
  c.beginPath(); c.arc(hx - r * 0.32, hy - r * 0.38, r * 0.42, 0, TAU); c.fill();

  // eyes
  const eyes = sk.eyes || 'cute';
  const lx = Math.cos(o.look ?? a), ly = Math.sin(o.look ?? a);
  const er = r * 0.42;
  const E = [-1, 1].map(side => [hx + fx * r * 0.38 + px * side * r * 0.5, hy + fy * r * 0.38 + py * side * r * 0.5]);
  if (eyes === 'shades') {
    c.strokeStyle = '#15122e'; c.lineWidth = r * 0.16;
    c.beginPath(); c.moveTo(...E[0]); c.lineTo(...E[1]); c.stroke();
    for (const [ex, ey] of E) {
      c.fillStyle = '#15122e';
      c.beginPath(); c.ellipse(ex, ey, er * 1.12, er * 0.92, a, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = r * 0.09;
      c.beginPath(); c.moveTo(ex - er * 0.45, ey - er * 0.2); c.lineTo(ex - er * 0.05, ey - er * 0.55); c.stroke();
    }
  } else if (eyes === 'visor') {
    const accent = sk.accent || '#38e1ff';
    c.strokeStyle = '#15122e'; c.lineWidth = er * 1.8;
    c.beginPath(); c.moveTo(E[0][0] - px * er * 0.3, E[0][1] - py * er * 0.3); c.lineTo(E[1][0] + px * er * 0.3, E[1][1] + py * er * 0.3); c.stroke();
    const scan = Math.sin(t * 3) * 0.5 + 0.5;
    c.strokeStyle = accent; c.lineWidth = er * 0.45;
    c.beginPath(); c.moveTo(...E[0]); c.lineTo(...E[1]); c.stroke();
    const sx = E[0][0] + (E[1][0] - E[0][0]) * scan, sy = E[0][1] + (E[1][1] - E[0][1]) * scan;
    c.globalCompositeOperation = 'lighter';
    c.drawImage(glow(accent), sx - er * 1.6, sy - er * 1.6, er * 3.2, er * 3.2);
    c.globalCompositeOperation = 'source-over';
  } else if (o.blink) {
    c.strokeStyle = '#1a1644'; c.lineWidth = r * 0.16;
    for (const [ex, ey] of E) { c.beginPath(); c.moveTo(ex - px * er * 0.8, ey - py * er * 0.8); c.lineTo(ex + px * er * 0.8, ey + py * er * 0.8); c.stroke(); }
  } else if (eyes === 'spooky') {
    for (const [ex, ey] of E) {
      c.fillStyle = '#231a4a';
      c.beginPath(); c.ellipse(ex + lx * er * 0.2, ey + ly * er * 0.2, er * 0.62, er * 0.9, a, 0, TAU); c.fill();
    }
    c.fillStyle = '#231a4a';
    c.beginPath(); c.ellipse(hx + fx * r * 0.85, hy + fy * r * 0.85, r * 0.16, r * 0.24, a, 0, TAU); c.fill();
  } else {
    for (const [ex, ey] of E) {
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.fill();
      const pxp = ex + lx * er * 0.38, pyp = ey + ly * er * 0.38;
      if (eyes === 'star') {
        const R = er * 0.72, tw = 0.85 + 0.15 * Math.sin(t * 5);
        c.fillStyle = sk.starColor || '#ffd23f';
        c.beginPath();
        for (let k = 0; k < 10; k++) {
          const ang = -Math.PI / 2 + (k * Math.PI) / 5 + t * 0.8, rad = (k % 2 ? R * 0.42 : R) * tw;
          c.lineTo(pxp + Math.cos(ang) * rad, pyp + Math.sin(ang) * rad);
        }
        c.closePath(); c.fill();
        c.fillStyle = '#1a1644';
        c.beginPath(); c.arc(pxp, pyp, er * 0.2, 0, TAU); c.fill();
      } else {
        c.fillStyle = '#1a1644';
        c.beginPath(); c.arc(pxp, pyp, er * 0.55, 0, TAU); c.fill();
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(pxp - er * 0.18, pyp - er * 0.2, er * 0.18, 0, TAU); c.fill();
      }
    }
  }
  if (sk.cheeks !== false && eyes !== 'visor') {
    c.fillStyle = 'rgba(255,95,162,0.35)';
    for (const side of [-1, 1]) { c.beginPath(); c.arc(hx - fx * r * 0.15 + px * side * r * 0.82, hy - fy * r * 0.15 + py * side * r * 0.82, r * 0.2, 0, TAU); c.fill(); }
  }
  if (sk.whiskers) {
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = Math.max(1, r * 0.07);
    for (const side of [-1, 1]) for (const k of [-1, 0, 1]) {
      const bx = hx + fx * r * 0.62 + px * side * r * 0.55, by = hy + fy * r * 0.62 + py * side * r * 0.55;
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + px * side * r * 0.9 + fx * k * r * 0.3, by + py * side * r * 0.9 + fy * k * r * 0.3); c.stroke();
    }
  }

  // front accessories
  if (sk.acc === 'bow') {
    const bx = hx - fx * r * 0.7, by = hy - fy * r * 0.7, w = r * 0.95;
    c.fillStyle = '#ff2d86';
    for (const side of [-1, 1]) {
      c.beginPath(); c.moveTo(bx, by);
      c.lineTo(bx + px * side * w - fx * w * 0.45, by + py * side * w - fy * w * 0.45);
      c.lineTo(bx + px * side * w + fx * w * 0.45, by + py * side * w + fy * w * 0.45);
      c.closePath(); c.fill();
    }
    c.fillStyle = '#ff85bb';
    c.beginPath(); c.arc(bx, by, r * 0.26, 0, TAU); c.fill();
  } else if (sk.acc === 'crown') {
    drawCrown(c, hx, hy - r * 1.02, r);
  } else if (sk.acc === 'halo') {
    const y = hy - r * 1.55 + Math.sin(t * 2.5) * r * 0.12;
    c.globalCompositeOperation = 'lighter';
    c.drawImage(glow('#ffd23f'), hx - r * 1.6, y - r * 1.1, r * 3.2, r * 2.2);
    c.globalCompositeOperation = 'source-over';
    c.strokeStyle = '#ffe27a'; c.lineWidth = r * 0.2;
    c.beginPath(); c.ellipse(hx, y, r * 0.78, r * 0.26, 0, 0, TAU); c.stroke();
  }
}
function drawCrown(c, x, y, r) {
  const w = r * 1.25, h = r * 0.8;
  c.beginPath();
  c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y - h); c.lineTo(x - w / 4, y - h * 0.45); c.lineTo(x, y - h * 1.12);
  c.lineTo(x + w / 4, y - h * 0.45); c.lineTo(x + w / 2, y - h); c.lineTo(x + w / 2, y); c.closePath();
  const g = c.createLinearGradient(x, y - h, x, y);
  g.addColorStop(0, '#fff3a6'); g.addColorStop(1, '#ffb800');
  c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(120,70,0,0.7)'; c.lineWidth = Math.max(1, r * 0.1); c.stroke();
  c.fillStyle = '#ff5fa2'; c.beginPath(); c.arc(x, y - h * 0.32, r * 0.13, 0, TAU); c.fill();
  c.fillStyle = '#38e1ff'; c.beginPath(); c.arc(x - w * 0.3, y - h * 0.28, r * 0.08, 0, TAU); c.arc(x + w * 0.3, y - h * 0.28, r * 0.08, 0, TAU); c.fill();
}
const headroom = sk => (sk.acc === 'crown' ? 12 : sk.acc === 'halo' ? 14 : sk.shape === 'train' ? 4 : 0);

/* =========================================================
   trails
   ========================================================= */
const RAINBOW = ['#ff5fa2', '#ff9f43', '#ffd23f', '#b6ff5c', '#38e1ff', '#9b7bff'];
const TRAIL = {
  smoke: { rate: 0.07, life: 1.3, size: [5, 9], rise: 26, puff: true, from: 'head', colors: ['#f4f1ff', '#c9c2ff', '#9e97c9'] },
  sparkle: { rate: 0.05, life: 0.9, size: [2.5, 5], glow: true },
  bubbles: { rate: 0.09, life: 1.4, size: [3, 7], rise: 26 },
  fire: { rate: 0.03, life: 0.55, size: [5, 9], glow: true, rise: 34, colors: ['#ffd23f', '#ff9f43', '#ff4d4d'] },
  embers: { rate: 0.05, life: 1.0, size: [2, 4], glow: true, rise: 22, colors: ['#ffd23f', '#ff9f43', '#ff6a3d'] },
  stars: { rate: 0.08, life: 1.1, size: [3.5, 6.5], star: true },
  hearts: { rate: 0.1, life: 1.3, size: [9, 13], heart: true, rise: 22 },
  rainbow: { rate: 0.022, life: 0.7, size: [4, 7], glow: true, rainbow: true },
  frost: { rate: 0.05, life: 1.1, size: [2, 4.5], glow: true, colors: ['#ffffff', '#bfe6ff', '#c9c2ff'] },
  prism: { rate: 0.04, life: 0.9, size: [2.5, 5], glow: true, colors: RAINBOW },
};
function trailTick(s, sk, dt, list, scale = 1, max = 600) {
  const def = sk.trail && TRAIL[sk.trail];
  if (!def || s.pts.length < 6) return;
  compile(sk);
  s._tt = (s._tt || 0) + dt * (s.boosting ? 1.8 : 1);
  while (s._tt > def.rate) {
    s._tt -= def.rate;
    if (list.length >= max) { list.shift(); }
    const n = s.pts.length, i = def.from === 'head' ? 0 : Math.floor(n * rand(0.45, 0.98)), p = def.from === 'head' ? { x: s.x + Math.cos(s.angle) * s.r * 0.05, y: s.y + Math.sin(s.angle) * s.r * 0.05 } : s.pts[Math.min(n - 1, i)];
    const colors = def.colors || sk.trailColors || sk.colors;
    const color = def.rainbow ? RAINBOW[Math.floor(performance.now() / 90) % RAINBOW.length] : colors[(Math.random() * colors.length) | 0];
    const rr = s.r * 0.8 * scale;
    list.push({ kind: sk.trail, x: p.x + rand(-rr, rr), y: p.y + rand(-rr, rr), vx: rand(-12, 12) * scale, vy: (rand(-12, 12) - (def.rise || 0)) * scale, life: def.life, max: def.life, color, size: rand(def.size[0], def.size[1]) * scale, rot: rand(0, TAU) });
  }
}
function updateTrails(list, dt) {
  for (const q of list) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.96; q.vy *= 0.97; q.rot += dt * 2; }
  let w = 0;
  for (let i = 0; i < list.length; i++) if (list[i].life > 0) list[w++] = list[i];
  list.length = w;
}
function drawTrails(c, list, bounds) {
  if (!list.length) return;
  c.globalCompositeOperation = 'lighter';
  for (const q of list) {
    const def = TRAIL[q.kind];
    if (!def.glow) continue;
    if (bounds && (q.x < bounds.x0 || q.x > bounds.x1 || q.y < bounds.y0 || q.y > bounds.y1)) continue;
    const k = q.life / q.max;
    c.globalAlpha = Math.min(1, k * 1.6) * (q.kind === 'sparkle' || q.kind === 'prism' ? 0.6 + 0.4 * Math.sin(q.rot * 4) : 1);
    const sz = q.size * (q.kind === 'fire' ? 3 + k * 3 : 4.5);
    c.drawImage(glow(q.color), q.x - sz / 2, q.y - sz / 2, sz, sz);
  }
  c.globalCompositeOperation = 'source-over';
  for (const q of list) {
    const def = TRAIL[q.kind];
    if (def.glow) continue;
    if (bounds && (q.x < bounds.x0 || q.x > bounds.x1 || q.y < bounds.y0 || q.y > bounds.y1)) continue;
    const k = q.life / q.max;
    c.globalAlpha = Math.min(1, k * 1.8);
    if (def.star) {
      c.fillStyle = q.color;
      c.beginPath();
      for (let j = 0; j < 8; j++) { const ang = q.rot + (j * Math.PI) / 4, rad = j % 2 ? q.size * 0.35 : q.size; c.lineTo(q.x + Math.cos(ang) * rad, q.y + Math.sin(ang) * rad); }
      c.closePath(); c.fill();
    } else if (def.puff) {
      c.fillStyle = q.color; c.globalAlpha = Math.min(0.75, k);
      c.beginPath(); c.arc(q.x, q.y, q.size * (1.6 - k * 0.7), 0, TAU); c.fill();
    } else if (def.heart) {
      c.fillStyle = q.color;
      c.font = `${q.size | 0}px sans-serif`;
      c.textAlign = 'center';
      c.fillText('♥', q.x, q.y);
    } else {
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = Math.max(1, q.size * 0.18);
      c.beginPath(); c.arc(q.x, q.y, q.size * (1.2 - k * 0.3), 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.beginPath(); c.arc(q.x - q.size * 0.35, q.y - q.size * 0.35, q.size * 0.22, 0, TAU); c.fill();
    }
  }
  c.globalAlpha = 1;
}

/* =========================================================
   live previews (shop cards, rank ladder, avatar)
   ========================================================= */
const pvState = new WeakMap();
function fitCanvas(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
  if (w && h && (cv.width !== w || cv.height !== h)) { cv.width = w; cv.height = h; }
}
function drawSkinPreview(cv, sk, t, dt, shape = 'wave') {
  fitCanvas(cv);
  const W = cv.width, H = cv.height;
  if (!W || !H) return;
  const c = cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, W, H);
  let st = pvState.get(cv);
  if (!st || st.sk !== sk) { st = { sk, parts: [], s: { pts: [], blink: 3, _tt: 0 } }; pvState.set(cv, st); }
  const s = st.s;
  const pts = [];
  if (shape === 'coil') {
    s.r = W * 0.075;
    for (let q = 0; q <= 1; q += 0.012) {
      const a = q * TAU * 1.45 + 2.2 + t * 0.35, rr = W * (0.34 - q * 0.2);
      pts.push({ x: W / 2 + Math.cos(a) * rr, y: H / 2 + Math.sin(a) * rr * 0.92 });
    }
    pts.reverse();
  } else {
    s.r = Math.min(H * 0.14, W * 0.06);
    const sp = s.r * 0.5, N = Math.floor((W * 0.72) / sp);
    const headX = W * 0.8 + Math.sin(t * 1.1) * W * 0.03;
    for (let i = 0; i < N; i++) pts.push({ x: headX - i * sp, y: H * 0.54 + Math.sin(i * 0.2 - t * 3.4) * H * 0.18 });
  }
  s.pts = pts;
  s.x = pts[0].x; s.y = pts[0].y;
  s.angle = Math.atan2(pts[0].y - pts[2].y, pts[0].x - pts[2].x);
  s.blink -= dt; if (s.blink < -0.14) s.blink = rand(2, 5);
  trailTick(s, sk, dt, st.parts, s.r / 12, 80);
  updateTrails(st.parts, dt);
  drawTrails(c, st.parts);
  drawSnakeBody(c, s, sk, { t, look: s.angle, blink: s.blink < 0, sp: shape === 'coil' ? W * 0.012 : s.r * 0.5 });
}
function drawEffectPreview(cv, fx, t) {
  fitCanvas(cv);
  const W = cv.width, H = cv.height;
  if (!W || !H) return;
  const c = cv.getContext('2d');
  c.clearRect(0, 0, W, H);
  const period = 1.5, ph = (t % period) / period, e = 1 - Math.pow(1 - ph, 3);
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.42 * (fx.speed ? 1.1 : 0.9);
  if (fx.ring) {
    c.strokeStyle = fx.colors[0]; c.globalAlpha = 1 - ph; c.lineWidth = Math.max(1, 5 * (1 - ph));
    c.beginPath(); c.arc(cx, cy, 4 + R * 1.1 * e, 0, TAU); c.stroke();
  }
  c.globalCompositeOperation = 'lighter';
  const n = Math.min(40, fx.n || 18);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + hash(i) * 0.6, d = R * e * (0.45 + hash(i + 9) * 0.55);
    c.globalAlpha = Math.max(0, 1 - ph * 1.1);
    const sz = (5 + hash(i + 3) * 6) * (W / 150);
    c.drawImage(glow(fx.colors[i % fx.colors.length]), cx + Math.cos(a) * d - sz, cy + Math.sin(a) * d - sz, sz * 2, sz * 2);
  }
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
}

/* =========================================================
   character skins (custom segment + head shapes)
   ========================================================= */
function rrect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
// cute eyes in local (rotated) coordinates: +x is forward
function localEyes(c, r, sk, o, fwd = 0.38, spread = 0.5, size = 0.42, lookRel = 0) {
  const er = r * size, lx = Math.cos(lookRel), ly = Math.sin(lookRel);
  for (const sd of [-1, 1]) {
    const ex = r * fwd, ey = sd * r * spread;
    if (o.blink) { c.strokeStyle = '#1a1644'; c.lineWidth = r * 0.15; c.beginPath(); c.moveTo(ex, ey - er * 0.8); c.lineTo(ex, ey + er * 0.8); c.stroke(); continue; }
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.fill();
    const px = ex + lx * er * 0.38, py = ey + ly * er * 0.38;
    if (sk.eyes === 'star') {
      const R = er * 0.72;
      c.fillStyle = sk.starColor || '#ffd23f'; c.beginPath();
      for (let k = 0; k < 10; k++) { const ang = (k * Math.PI) / 5 + o.t * 0.8, rad = k % 2 ? R * 0.42 : R; c.lineTo(px + Math.cos(ang) * rad, py + Math.sin(ang) * rad); }
      c.closePath(); c.fill();
    } else {
      c.fillStyle = '#1a1644'; c.beginPath(); c.arc(px, py, er * 0.55, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(px - er * 0.2, py - er * 0.18, er * 0.18, 0, TAU); c.fill();
    }
  }
}
function cheeks(c, r, x = 0.05, spread = 0.82) {
  c.fillStyle = 'rgba(255,95,162,0.38)';
  for (const sd of [-1, 1]) { c.beginPath(); c.arc(r * x, sd * r * spread, r * 0.2, 0, TAU); c.fill(); }
}
const SPRINKLES = ['#ffd23f', '#38e1ff', '#ffffff', '#b6ff5c', '#ff5fa2'];
const FRUITS = ['orange', 'melon', 'kiwi', 'lemon'];
const SHAPES = {
  train: {
    gap: 2.05, taper: 0,
    seg(c, rr, k, sk, t) {
      const col = sk._pal[k % sk._pal.length];
      c.fillStyle = '#1a1644';
      c.fillRect(-rr * 1.2, -rr * 0.18, rr * 0.5, rr * 0.36);
      for (const sd of [-1, 1]) for (const wx of [-0.5, 0.5]) { c.fillStyle = '#2a2350'; rrect(c, rr * wx - rr * 0.22, sd * rr * 0.72 - rr * 0.14, rr * 0.44, rr * 0.28 + 1, rr * 0.1); c.fill(); }
      c.fillStyle = css(shade(col, -0.55)); rrect(c, -rr * 0.95, -rr * 0.82, rr * 1.9, rr * 1.64, rr * 0.34); c.fill();
      c.fillStyle = css(col); rrect(c, -rr * 0.85, -rr * 0.72, rr * 1.7, rr * 1.44, rr * 0.28); c.fill();
      c.fillStyle = css(shade(col, 0.35)); rrect(c, -rr * 0.7, -rr * 0.3, rr * 1.4, rr * 0.6, rr * 0.2); c.fill();
      c.fillStyle = 'rgba(255,246,201,0.9)';
      for (const wx of [-0.45, 0, 0.45]) { rrect(c, rr * wx - rr * 0.14, -rr * 0.16, rr * 0.28, rr * 0.32, rr * 0.08); c.fill(); }
    },
    head(c, r, sk, o) {
      const body = sk._pal[0], dark = shade(body, -0.55);
      c.fillStyle = '#2a2350';
      for (const sd of [-1, 1]) for (const wx of [-0.6, 0.2, 0.9]) { rrect(c, r * wx - r * 0.25, sd * r * 0.85 - r * 0.15, r * 0.5, r * 0.3 + 1, r * 0.1); c.fill(); }
      c.fillStyle = css(dark); rrect(c, -r * 1.25, -r * 0.98, r * 2.6, r * 1.96, r * 0.42); c.fill();
      c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(r * 1.3, -r * 0.8); c.lineTo(r * 1.95, 0); c.lineTo(r * 1.3, r * 0.8); c.closePath(); c.fill();
      c.fillStyle = css(body); rrect(c, -r * 1.15, -r * 0.88, r * 2.4, r * 1.76, r * 0.36); c.fill();
      c.fillStyle = '#2a2350'; rrect(c, -r * 1.05, -r * 0.7, r * 0.8, r * 1.4, r * 0.2); c.fill();
      c.fillStyle = 'rgba(255,246,201,0.9)'; rrect(c, -r * 0.95, -r * 0.55, r * 0.6, r * 1.1, r * 0.15); c.fill();
      c.fillStyle = '#2a2350'; c.beginPath(); c.arc(r * 0.05, 0, r * 0.36, 0, TAU); c.fill();
      c.fillStyle = '#5b5480'; c.beginPath(); c.arc(r * 0.05, 0, r * 0.22, 0, TAU); c.fill();
      c.save(); c.translate(r * 0.45, 0); localEyes(c, r, sk, o, 0.45, 0.45, 0.36); c.restore();
      cheeks(c, r, 0.6, 0.72);
    },
  },
  donut: {
    gap: 1.75, taper: 0.25,
    seg(c, rr, k, sk, t) {
      c.fillStyle = '#8a4f22'; c.beginPath(); c.arc(0, 0, rr * 1.05, 0, TAU); c.fill();
      c.fillStyle = '#e8a860'; c.beginPath(); c.arc(0, 0, rr * 0.96, 0, TAU); c.fill();
      c.fillStyle = css(sk._pal[k % sk._pal.length]);
      c.beginPath();
      for (let j = 0; j <= 16; j++) { const a = (j / 16) * TAU, w = rr * (0.8 + 0.07 * Math.sin(j * 2.7 + k)); c.lineTo(Math.cos(a) * w, Math.sin(a) * w); }
      c.closePath(); c.fill();
      c.fillStyle = '#120f33'; c.beginPath(); c.arc(0, 0, rr * 0.28, 0, TAU); c.fill();
      c.strokeStyle = '#e8a860'; c.lineWidth = rr * 0.1; c.stroke();
      c.lineWidth = rr * 0.12; c.lineCap = 'round';
      for (let j = 0; j < 6; j++) {
        const h = hash(k * 7 + j), a = h * TAU, d = rr * (0.45 + hash(k + j * 3) * 0.25);
        c.strokeStyle = SPRINKLES[j % SPRINKLES.length];
        c.beginPath(); c.moveTo(Math.cos(a) * d, Math.sin(a) * d); c.lineTo(Math.cos(a) * d + Math.cos(a * 3) * rr * 0.16, Math.sin(a) * d + Math.sin(a * 3) * rr * 0.16); c.stroke();
      }
    },
    head(c, r, sk, o) {
      const R = r * 1.25;
      c.fillStyle = '#8a4f22'; c.beginPath(); c.arc(0, 0, R * 1.05, 0, TAU); c.fill();
      c.fillStyle = '#e8a860'; c.beginPath(); c.arc(0, 0, R * 0.96, 0, TAU); c.fill();
      c.fillStyle = css(sk._pal[0]);
      c.beginPath(); for (let j = 0; j <= 18; j++) { const a = (j / 18) * TAU, w = R * (0.82 + 0.06 * Math.sin(j * 2.3)); c.lineTo(Math.cos(a) * w, Math.sin(a) * w); } c.closePath(); c.fill();
      c.lineWidth = r * 0.14; c.lineCap = 'round';
      for (let j = 0; j < 8; j++) { const a = hash(j + 50) * TAU, d = R * (0.35 + hash(j + 9) * 0.35); c.strokeStyle = SPRINKLES[j % 5]; c.beginPath(); c.moveTo(Math.cos(a) * d, Math.sin(a) * d); c.lineTo(Math.cos(a) * d + r * 0.18, Math.sin(a) * d + r * 0.1); c.stroke(); }
      localEyes(c, r, sk, o, 0.35, 0.5, 0.42);
      cheeks(c, r, 0.0, 0.85);
    },
  },
  pearls: {
    gap: 1.4, taper: 0.35, string: true,
    seg(c, rr, k, sk, t, a) {
      const col = sk._pal[k % sk._pal.length];
      c.fillStyle = css(shade(col, -0.45)); c.beginPath(); c.arc(0, 0, rr * 0.92, 0, TAU); c.fill();
      c.fillStyle = css(col); c.beginPath(); c.arc(0, 0, rr * 0.84, 0, TAU); c.fill();
      c.rotate(-a);
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.ellipse(-rr * 0.3, -rr * 0.32, rr * 0.28, rr * 0.18, -0.6, 0, TAU); c.fill();
      const tw = Math.sin(t * 3 + k * 1.9);
      if (tw > 0.6) { c.fillStyle = `rgba(255,255,255,${(tw - 0.6) * 2.5})`; c.beginPath(); c.arc(rr * 0.35, rr * 0.3, rr * 0.12, 0, TAU); c.fill(); }
    },
    head(c, r, sk, o) {
      const col = sk._pal[0];
      c.fillStyle = css(shade(col, -0.45)); c.beginPath(); c.arc(0, 0, r * 1.18, 0, TAU); c.fill();
      c.fillStyle = css(col); c.beginPath(); c.arc(0, 0, r * 1.08, 0, TAU); c.fill();
      localEyes(c, r, sk, o, 0.38, 0.5, 0.42);
      cheeks(c, r);
    },
    headAfter(c, s, sk, o) {
      if (sk.acc === 'crown') drawCrown(c, s.x, s.y - s.r * 1.1, s.r);
      c.save(); c.translate(s.x, s.y);
      c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.ellipse(-s.r * 0.4, -s.r * 0.45, s.r * 0.32, s.r * 0.2, -0.6, 0, TAU); c.fill();
      c.restore();
    },
  },
  fruit: {
    gap: 1.7, taper: 0.3,
    seg(c, rr, k, sk, t) {
      const kind = FRUITS[k % 4];
      if (kind === 'orange' || kind === 'lemon') {
        const rind = kind === 'orange' ? '#ff8a1f' : '#f2c900', flesh = kind === 'orange' ? '#ffb347' : '#fff07a';
        c.fillStyle = rind; c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.fill();
        c.fillStyle = '#fff6e0'; c.beginPath(); c.arc(0, 0, rr * 0.88, 0, TAU); c.fill();
        c.fillStyle = flesh; c.beginPath(); c.arc(0, 0, rr * 0.8, 0, TAU); c.fill();
        c.strokeStyle = '#fff6e0'; c.lineWidth = rr * 0.08;
        for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU + k; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * rr * 0.8, Math.sin(a) * rr * 0.8); c.stroke(); }
      } else if (kind === 'melon') {
        c.fillStyle = '#1f8f4a'; c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.fill();
        c.fillStyle = '#c8ffd9'; c.beginPath(); c.arc(0, 0, rr * 0.86, 0, TAU); c.fill();
        c.fillStyle = '#ff4d6d'; c.beginPath(); c.arc(0, 0, rr * 0.78, 0, TAU); c.fill();
        c.fillStyle = '#2a1838';
        for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU + 0.4, d = rr * 0.45; c.beginPath(); c.ellipse(Math.cos(a) * d, Math.sin(a) * d, rr * 0.07, rr * 0.13, a, 0, TAU); c.fill(); }
      } else {
        c.fillStyle = '#7a5230'; c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.fill();
        c.fillStyle = '#9be15d'; c.beginPath(); c.arc(0, 0, rr * 0.88, 0, TAU); c.fill();
        c.fillStyle = '#d7ffb0'; c.beginPath(); c.arc(0, 0, rr * 0.36, 0, TAU); c.fill();
        c.fillStyle = '#2a1838';
        for (let j = 0; j < 10; j++) { const a = (j / 10) * TAU, d = rr * 0.52; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, rr * 0.06, 0, TAU); c.fill(); }
      }
    },
    head(c, r, sk, o) {
      c.fillStyle = '#3ddc8c';
      for (let j = 0; j < 5; j++) { const a = Math.PI + (j - 2) * 0.45; c.beginPath(); c.ellipse(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95, r * 0.55, r * 0.22, a, 0, TAU); c.fill(); }
      c.fillStyle = '#c21d3d'; c.beginPath(); c.ellipse(r * 0.1, 0, r * 1.25, r * 1.12, 0, 0, TAU); c.fill();
      c.fillStyle = '#ff3b5c'; c.beginPath(); c.ellipse(r * 0.1, 0, r * 1.15, r * 1.03, 0, 0, TAU); c.fill();
      c.fillStyle = '#ffe45c';
      for (let j = 0; j < 12; j++) { const a = hash(j) * TAU, d = r * (0.35 + hash(j + 4) * 0.55); const x = r * 0.1 + Math.cos(a) * d, y = Math.sin(a) * d * 0.9; if (x > r * 0.1 && Math.abs(y) < r * 0.8) continue; c.beginPath(); c.ellipse(x, y, r * 0.05, r * 0.09, a, 0, TAU); c.fill(); }
      localEyes(c, r, sk, o, 0.42, 0.48, 0.4);
      cheeks(c, r, 0.1, 0.78);
    },
  },
  mecha: {
    gap: 1.3, taper: 0.3,
    seg(c, rr, k, sk, t) {
      const swing = Math.sin(t * 16 + k * 0.9) * 0.4;
      c.strokeStyle = css(sk._pal[2]); c.lineWidth = rr * 0.18; c.lineCap = 'round';
      for (const sd of [-1, 1]) {
        c.beginPath(); c.moveTo(0, sd * rr * 0.6);
        c.lineTo(rr * swing * sd, sd * rr * 1.25); c.lineTo(rr * (swing * sd - 0.35), sd * rr * 1.55); c.stroke();
      }
      c.fillStyle = css(shade(sk._pal[2], -0.4));
      c.beginPath(); for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.92); } c.closePath(); c.fill();
      c.fillStyle = css(sk._pal[k % 2]);
      c.beginPath(); for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU; c.lineTo(Math.cos(a) * rr * 0.86, Math.sin(a) * rr * 0.8); } c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-rr * 0.5, -rr * 0.5, rr * 1.0, rr * 0.16);
      const pulse = 0.6 + 0.4 * Math.sin(t * 5 + k);
      c.globalCompositeOperation = 'lighter';
      c.drawImage(glow(sk.accent), -rr * 0.6 * pulse, -rr * 0.6 * pulse, rr * 1.2 * pulse, rr * 1.2 * pulse);
      c.globalCompositeOperation = 'source-over';
    },
    head(c, r, sk, o) {
      c.strokeStyle = css(sk._pal[2]); c.lineWidth = r * 0.2; c.lineCap = 'round';
      const bite = Math.sin(o.t * 6) * 0.15;
      for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(r * 0.7, sd * r * 0.55); c.quadraticCurveTo(r * 1.7, sd * r * (0.9 + bite), r * 1.55, sd * r * 0.15); c.stroke(); }
      c.fillStyle = css(shade(sk._pal[2], -0.4));
      c.beginPath(); for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU + Math.PI / 6; c.lineTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.15); } c.closePath(); c.fill();
      c.fillStyle = css(sk._pal[0]);
      c.beginPath(); for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU + Math.PI / 6; c.lineTo(Math.cos(a) * r * 1.12, Math.sin(a) * r * 1.02); } c.closePath(); c.fill();
      c.fillStyle = '#15122e'; rrect(c, r * 0.15, -r * 0.75, r * 0.6, r * 1.5, r * 0.25); c.fill();
      const scan = Math.sin(o.t * 3);
      c.fillStyle = sk.accent; rrect(c, r * 0.35, -r * 0.6, r * 0.2, r * 1.2, r * 0.1); c.fill();
      c.globalCompositeOperation = 'lighter';
      c.drawImage(glow(sk.accent), r * 0.45 - r * 0.6, scan * r * 0.5 - r * 0.6, r * 1.2, r * 1.2);
      c.globalCompositeOperation = 'source-over';
    },
  },
  rocket: {
    gap: 0.85, taper: 0.1, flame: true,
    seg(c, rr, k, sk, t, a, q) {
      const flick = 0.85 + 0.2 * Math.sin(t * 22 + k * 1.7);
      const stops = [[0, [255, 250, 220]], [0.12, [255, 210, 63]], [0.3, [255, 159, 67]], [0.5, [255, 77, 77]], [0.7, [143, 136, 184]], [1, [90, 84, 130]]];
      let col = stops[stops.length - 1][1];
      for (let j = 1; j < stops.length; j++) if (q <= stops[j][0]) { const [q0, c0] = stops[j - 1], [q1, c1] = stops[j]; col = mix(c0, c1, (q - q0) / (q1 - q0)); break; }
      const smoke = q > 0.55;
      c.globalAlpha = smoke ? Math.max(0.15, 1 - (q - 0.55) * 1.6) : 1;
      if (!smoke) c.globalCompositeOperation = 'lighter';
      c.fillStyle = css(col);
      c.beginPath(); c.arc(0, 0, rr * flick * (smoke ? 1 + (q - 0.55) * 0.8 : 0.9), 0, TAU); c.fill();
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
    },
    head(c, r, sk, o) {
      c.fillStyle = '#ff5a4e';
      for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(-r * 0.4, sd * r * 0.6); c.lineTo(-r * 1.35, sd * r * 1.35); c.lineTo(-r * 1.2, sd * r * 0.4); c.closePath(); c.fill(); }
      c.fillStyle = '#5b5480'; rrect(c, -r * 1.3, -r * 0.5, r * 0.4, r * 1.0, r * 0.12); c.fill();
      c.fillStyle = '#c9c2ff'; c.beginPath(); c.ellipse(r * 0.1, 0, r * 1.45, r * 0.86, 0, 0, TAU); c.fill();
      c.fillStyle = '#f4f1ff'; c.beginPath(); c.ellipse(r * 0.1, 0, r * 1.36, r * 0.78, 0, 0, TAU); c.fill();
      c.fillStyle = '#ff5a4e';
      c.beginPath(); c.moveTo(r * 0.85, -r * 0.62); c.quadraticCurveTo(r * 1.9, 0, r * 0.85, r * 0.62); c.closePath(); c.fill();
      c.fillStyle = '#5b5480'; c.beginPath(); c.arc(r * 0.05, 0, r * 0.55, 0, TAU); c.fill();
      c.fillStyle = '#38e1ff'; c.beginPath(); c.arc(r * 0.05, 0, r * 0.45, 0, TAU); c.fill();
      c.save(); c.translate(r * 0.05, 0); localEyes(c, r, sk, o, 0.05, 0.2, 0.17); c.restore();
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(-r * 0.1, -r * 0.2, r * 0.14, r * 0.08, -0.6, 0, TAU); c.fill();
    },
  },
};
function drawShaped(c, s, sk, o) {
  const S = SHAPES[sk.shape];
  const pts = s.pts, n = pts.length, t = o.t, r = s.r, sp = o.sp || 6;
  const step = Math.max(1, Math.round((r * S.gap) / sp));
  const radiusAt = i => { const q = i / n; return S.taper && q > 0.6 ? r * (1 - ((q - 0.6) / 0.4) * S.taper) : r; };
  c.lineCap = 'round'; c.lineJoin = 'round';
  // glow / aura
  c.beginPath(); c.moveTo(pts[0].x, pts[0].y);
  for (let i = 2; i < n; i += 2) c.lineTo(pts[i].x, pts[i].y);
  const auraCol = sk._aura || sk._pal[0];
  c.strokeStyle = css(auraCol, (s.boosting ? 0.3 : 0.12) + (sk._aura ? 0.06 * Math.sin(t * 3) + 0.05 : 0));
  c.lineWidth = r * 2 + (s.boosting ? 30 : 18);
  c.stroke();
  if (S.string) { c.strokeStyle = 'rgba(255,240,250,0.55)'; c.lineWidth = Math.max(1.2, r * 0.14); c.stroke(); }
  for (let i = n - 1 - ((n - 1) % step); i >= step; i -= step) {
    const p = pts[i], q = pts[Math.max(0, i - step)];
    const a = Math.atan2(q.y - p.y, q.x - p.x);
    c.save(); c.translate(p.x, p.y); c.rotate(a);
    S.seg(c, radiusAt(i), i / step | 0, sk, t, a, i / n);
    c.restore();
  }
  c.save(); c.translate(s.x, s.y); c.rotate(s.angle);
  S.head(c, r, sk, { ...o, t });
  c.restore();
  if (S.headAfter) S.headAfter(c, s, sk, o);
  else if (sk.acc === 'crown') drawCrown(c, s.x, s.y - r * 1.1, r);
}

window.coilSkins = { SHOP, RANK, EXCLUSIVE, features, drawSnakeBody, drawSkinPreview, drawEffectPreview, trailTick, updateTrails, drawTrails, headroom, compile };
})();
