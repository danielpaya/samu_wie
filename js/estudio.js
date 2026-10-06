// Estudio de historias · Lunes de Datos · IEEE WIE
// Dibuja las dos plantillas ("¿Sabías que…?" y "Un día como hoy") en un <canvas> de 1080×1920
// y exporta video MP4 cuadro por cuadro.
(() => {
'use strict';
const C = document.getElementById('story');
const ctx = C.getContext('2d');
const W = 1080, H = 1920, D = Math.PI / 180, TAU = Math.PI * 2;
const LOOP = 2.5; // segundos: todo el movimiento se repite cada 2,5 s, así el video hace bucle perfecto
const F = { disp: '"Playfair Display", Georgia, serif', hand: 'Kalam, "Comic Sans MS", cursive', script: 'Caveat, cursive', sans: 'Montserrat, Arial, sans-serif' };
const COL = { paper: '#F5EFF8', plum: '#3D0F5E', deep: '#4A1470', accent: '#7B2FA8', lilac: '#E6D2F5', soft: '#E9D6F8', line: '#CFB2E8', spark: '#A673D6' };
const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

const state = {
  tpl: 'a',
  num: '01', catA: 'TECNOLOGÍA',
  fact: 'En 1942 la actriz Hedy Lamarr patentó un sistema de salto de frecuencia, precursor de tecnologías como el Wi-Fi y el Bluetooth.',
  source: 'Patente de EE. UU. 2.292.387 (1942)',
  day: '10', month: 11, year: '1815', catB: 'CIENCIA',
  title: 'Nace Ada Lovelace',
  desc: 'Escribió el que se considera el primer algoritmo pensado para una máquina, un siglo antes de las computadoras modernas.',
  handle: '@tucuenta', mode: 'dots', dur: 10
};
const KEYS = Object.keys(state);
try { const saved = JSON.parse(localStorage.getItem('ldd-studio') || '{}'); KEYS.forEach(k => { if (saved[k] !== undefined) state[k] = saved[k]; }); } catch (e) {}
function persist() { try { const o = {}; KEYS.forEach(k => o[k] = state[k]); localStorage.setItem('ldd-studio', JSON.stringify(o)); } catch (e) {}
}

/* ---------- utilidades de dibujo ---------- */
const PATHS = {};
function path(d) { return PATHS[d] || (PATHS[d] = new Path2D(d)); }
const ICON = {
  heart: ['M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z'],
  spark: ['M12 2 C12 8 16 12 22 12 C16 12 12 16 12 22 C12 16 8 12 2 12 C8 12 12 8 12 2Z'],
  note: ['M9 18V5l12-2v13', 'M3 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0', 'M15 16a3 3 0 1 0 6 0a3 3 0 1 0 -6 0'],
  book: ['M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z', 'M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z'],
  bolt: ['M13 2 4 14h7l-1 8 9-12h-7z'],
  bulb: ['M9 18h6M10 22h4', 'M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z']
};
function icon(name, x, y, size, color, lw) {
  const s = size / 24; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = color; ctx.lineWidth = lw / s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ICON[name].forEach(d => ctx.stroke(path(d))); ctx.restore();
}
function doodle(ds, x, y, color, lw) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ds.forEach(d => ctx.stroke(path(d))); ctx.restore();
}
function sparkle(cx, cy, size, color, lw, t, ph) {
  const s = size / 24 * (1 + 0.14 * Math.sin(TAU * t / LOOP + ph));
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(0.12 * Math.sin(TAU * t / LOOP + ph)); ctx.scale(s, s); ctx.translate(-12, -12);
  ctx.strokeStyle = color; ctx.lineWidth = lw / s; ctx.lineJoin = 'round'; ctx.stroke(path(ICON.spark[0])); ctx.restore();
}
function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function font(weight, size, fam, italic) { return (italic ? 'italic ' : '') + weight + ' ' + size + 'px ' + fam; }
function spaced(str, x, y, ls, align) {
  const chars = Array.from(str); const ws = chars.map(ch => ctx.measureText(ch).width);
  const total = ws.reduce((a, b) => a + b, 0) + ls * Math.max(0, chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const prev = ctx.textAlign; ctx.textAlign = 'left';
  chars.forEach((ch, i) => { ctx.fillText(ch, cx, y); cx += ws[i] + ls; });
  ctx.textAlign = prev; return total;
}
function spacedWidth(str, ls) { const chars = Array.from(str); return chars.reduce((a, ch) => a + ctx.measureText(ch).width, 0) + ls * Math.max(0, chars.length - 1); }
function wrap(str, maxW) {
  const words = String(str).split(/\s+/).filter(Boolean); const lines = []; let line = '';
  for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
  if (line) lines.push(line); return lines;
}
function fitSingle(str, weight, fam, italic, max, min, maxW) {
  let s = max; ctx.font = font(weight, s, fam, italic);
  while (s > min && ctx.measureText(str).width > maxW) { s -= 2; ctx.font = font(weight, s, fam, italic); }
  return s;
}
function fitWrap(str, weight, fam, max, min, maxW, maxLines) {
  let s = max, lines;
  do { ctx.font = font(weight, s, fam); lines = wrap(str, maxW); s -= 1; } while (lines.length > maxLines && s >= min);
  return { size: s + 1, lines: lines.slice(0, maxLines) };
}
function shadowed(fn, color, blur, oy) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.shadowOffsetY = oy; fn(); ctx.restore(); }
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

/* ---------- capas de papel y acuarela (SVG con filtros, se rasterizan una sola vez) ---------- */
const FILTERS = `
<filter id="wc" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="3" seed="4" result="warp"/><feDisplacementMap in="SourceGraphic" in2="warp" scale="70" xChannelSelector="R" yChannelSelector="G" result="shape"/><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" seed="9" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.45" result="mask"/><feComposite in="shape" in2="mask" operator="in" result="tex"/><feGaussianBlur in="tex" stdDeviation="1.2"/></filter>
<filter id="dry" x="-10%" y="-40%" width="120%" height="180%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="2" result="warp"/><feDisplacementMap in="SourceGraphic" in2="warp" scale="26" xChannelSelector="R" yChannelSelector="G" result="shape"/><feTurbulence type="fractalNoise" baseFrequency="0.003 0.11" numOctaves="3" seed="11" result="streak"/><feColorMatrix in="streak" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 1.9" result="mask"/><feComposite in="shape" in2="mask" operator="in"/></filter>
<filter id="torn" x="-5%" y="-10%" width="110%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G" result="edge"/><feDropShadow in="edge" dx="0" dy="8" stdDeviation="9" flood-color="#3D0F5E" flood-opacity="0.22"/></filter>`;
const CORNER = `<g transform="translate(780 0)"><path d="M40 0 L 300 0 L 300 270 C 240 250 210 280 160 250 C 110 225 70 240 30 200 C 10 140 50 120 20 70 Z" fill="#4A1470" filter="url(#torn)"/></g>`;
function svgDoc(inner, withBg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${FILTERS}</defs>${withBg ? `<rect width="${W}" height="${H}" fill="#F5EFF8"/>` : ''}${inner}</svg>`;
}
const SVG_A1 = svgDoc(`
<path d="M-40 -40 L 520 -30 C 560 120 470 230 330 250 C 210 270 90 330 -40 300 Z" fill="#C9A3E6" opacity="0.55" filter="url(#wc)"/>
<path d="M-60 520 C 120 480 260 560 240 700 C 220 820 60 880 -60 860 Z" fill="#D9BDEE" opacity="0.6" filter="url(#wc)"/>
<path d="M640 1000 C 820 940 1120 960 1140 1120 C 1160 1300 960 1380 780 1330 C 640 1290 560 1100 640 1000 Z" fill="#C59BE4" opacity="0.4" filter="url(#wc)"/>
<path d="M-60 1600 C 200 1560 520 1640 640 1780 C 700 1860 640 1980 -60 1980 Z" fill="#9D5FD0" opacity="0.5" filter="url(#wc)"/>
<path d="M760 1760 C 900 1700 1120 1720 1140 1820 L 1140 1990 L 700 1990 Z" fill="#7E3DB5" opacity="0.55" filter="url(#wc)"/>
<rect x="-40" y="440" width="560" height="70" rx="20" fill="#A673D6" opacity="0.55" transform="rotate(-9 240 475)" filter="url(#dry)"/>
<rect x="620" y="1520" width="520" height="56" rx="18" fill="#A673D6" opacity="0.5" transform="rotate(-14 880 1548)" filter="url(#dry)"/>
<rect x="40" y="1205" width="420" height="40" rx="14" fill="#B98BDF" opacity="0.45" transform="rotate(4 250 1225)" filter="url(#dry)"/>
${CORNER}`, true);
const SVG_A2 = svgDoc(`<g transform="rotate(-1.5 540 1343)"><rect x="58" y="1234" width="964" height="218" fill="#FFFFFF" filter="url(#torn)"/></g>`, false);
const SVG_B1 = svgDoc(`
<path d="M-40 -40 L 480 -30 C 520 110 430 220 300 240 C 180 260 80 300 -40 280 Z" fill="#C9A3E6" opacity="0.55" filter="url(#wc)"/>
<path d="M700 640 C 900 600 1120 640 1140 800 C 1160 960 980 1040 820 990 C 690 950 620 720 700 640 Z" fill="#C59BE4" opacity="0.45" filter="url(#wc)"/>
<path d="M-60 1080 C 120 1040 300 1110 280 1240 C 260 1350 80 1400 -60 1380 Z" fill="#D9BDEE" opacity="0.6" filter="url(#wc)"/>
<path d="M-60 1620 C 220 1590 480 1680 560 1800 C 600 1880 560 1990 -60 1990 Z" fill="#9D5FD0" opacity="0.5" filter="url(#wc)"/>
<path d="M700 1700 C 860 1640 1120 1660 1140 1780 L 1140 1990 L 640 1990 Z" fill="#7E3DB5" opacity="0.5" filter="url(#wc)"/>
<rect x="560" y="560" width="560" height="64" rx="20" fill="#A673D6" opacity="0.5" transform="rotate(-8 840 592)" filter="url(#dry)"/>
<rect x="-40" y="1060" width="480" height="48" rx="16" fill="#B98BDF" opacity="0.45" transform="rotate(6 200 1084)" filter="url(#dry)"/>
${CORNER}`, true);

function rasterSVG(svg) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => { const c = mk(W, H); c.getContext('2d').drawImage(img, 0, 0); res(c); };
    img.onerror = () => res(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
const L = {};
function buildGrain() {
  const c = mk(540, 960), g = c.getContext('2d'), id = g.createImageData(540, 960), d = id.data;
  for (let i = 0; i < d.length; i += 4) { d[i] = 60; d[i + 1] = 15; d[i + 2] = 94; d[i + 3] = Math.random() * 30; }
  g.putImageData(id, 0, 0); return c;
}

/* ---------- logos ---------- */
const logoP = new Image(), logoW = new Image();
logoP.src = window.WIE_LOGOS.morado; logoW.src = window.WIE_LOGOS.blanco;
function loaded(img) { return new Promise(r => { if (img.complete && img.naturalWidth) r(); else { img.onload = r; img.onerror = r; } }); }

const PHOTO_LABEL = 'FOTO O ILUSTRACIÓN';
/* ---------- foto: semitono en ondas o foto teñida ---------- */
const PH = 420, STEP_PH = 12, STEP_DOT = 14;
let photoImg = null, photoGrid = null, photoDuo = null;
function coverDraw(g, img, w, h) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight); const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  g.drawImage(img, (w - dw) / 2, (h - dh) / 2.6, dw, dh);
}
function processPhoto(img) {
  const n = PH / STEP_PH, g1 = mk(n, n), x1 = g1.getContext('2d'); coverDraw(x1, img, n, n);
  const d1 = x1.getImageData(0, 0, n, n).data; photoGrid = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) { const l = (0.299 * d1[i * 4] + 0.587 * d1[i * 4 + 1] + 0.114 * d1[i * 4 + 2]) / 255; photoGrid[i] = Math.min(1, Math.max(0, (1 - l - 0.08) * 1.35)); }
  const c = mk(PH, PH), x = c.getContext('2d'); coverDraw(x, img, PH, PH);
  const id = x.getImageData(0, 0, PH, PH), d = id.data, dk = hex('#2B0B40'), lt = hex('#F0E4F8');
  for (let i = 0; i < d.length; i += 4) {
    let l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255; l = Math.min(1, Math.max(0, (l - 0.5) * 1.12 + 0.5));
    d[i] = dk[0] + (lt[0] - dk[0]) * l; d[i + 1] = dk[1] + (lt[1] - dk[1]) * l; d[i + 2] = dk[2] + (lt[2] - dk[2]) * l;
  }
  x.putImageData(id, 0, 0); photoDuo = c;
}
function halftone(u, v) {
  const d = Math.hypot((u - 0.5) * 1.1, v - 0.42);
  return Math.max(0, 1 - d * 1.7);
}
let exporting = false;
function drawPhoto(t, x, y) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, PH, PH); ctx.clip();
  const useDuo = state.mode === 'photo' && photoDuo;
  if (useDuo) ctx.drawImage(photoDuo, x, y);
  else { const g = ctx.createLinearGradient(x, y, x, y + PH); g.addColorStop(0, '#AC84D4'); g.addColorStop(1, '#9E72CA'); ctx.fillStyle = g; ctx.fillRect(x, y, PH, PH); }
  const step = useDuo ? STEP_DOT : (photoGrid ? STEP_PH : 9), n = Math.ceil(PH / step) + 1;
  ctx.beginPath();
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const px = i * step + step / 2, py = j * step + step / 2;
    const dist = Math.hypot(px - PH * 0.5, py - PH * 0.42);
    const wave = Math.sin(TAU * t / LOOP - dist * 0.035);
    let r;
    if (useDuo) r = (step / 2) * 0.32 * (0.8 + 0.2 * wave);
    else if (photoGrid) { const gi = Math.min(PH / STEP_PH - 1, i), gj = Math.min(PH / STEP_PH - 1, j); r = (step / 2) * Math.sqrt(photoGrid[gj * (PH / STEP_PH) + gi]) * (0.8 + 0.2 * wave); }
    else r = (step / 2) * (0.25 + 0.75 * halftone(px / PH, py / PH)) * (0.72 + 0.28 * wave);
    if (r < 0.6) continue;
    const oy = wave * 1.4;
    ctx.moveTo(x + px + r, y + py + oy); ctx.arc(x + px, y + py + oy, r, 0, TAU);
  }
  ctx.fillStyle = useDuo ? 'rgba(255,255,255,0.2)' : (photoGrid ? '#4E1A78' : '#7A4AA6'); ctx.fill();
  if (!photoGrid && !useDuo && !exporting && !recording) {
    ctx.font = font(700, 20, F.sans); const lw = spacedWidth(PHOTO_LABEL, 2) + 44;
    rr(ctx, x + (PH - lw) / 2, y + PH - 74, lw, 42, 21); ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.fill();
    ctx.fillStyle = '#4A1470'; spaced(PHOTO_LABEL, x + PH / 2, y + PH - 46, 2, 'center');
  }
  ctx.restore();
}

/* ---------- piezas comunes ---------- */
function cornerList(lines) {
  ctx.save(); ctx.translate(838, 66); ctx.rotate(-9 * D); ctx.fillStyle = '#E3CCF4'; ctx.font = font(700, 26, F.hand);
  lines.forEach((s, i) => ctx.fillText(s, 0, i * 29)); ctx.restore();
}
function badge(cx, cy) {
  shadowed(() => { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(cx, cy, 56, 0, TAU); ctx.fill(); }, 'rgba(61,15,94,0.25)', 18, 8);
  ctx.fillStyle = COL.accent; ctx.beginPath(); ctx.arc(cx, cy, 51, 0, TAU); ctx.fill();
  if (logoW.naturalWidth) ctx.drawImage(logoW, cx - 39, cy - 37, 78, 70);
}
function whiteBox(x, y, w, h) { shadowed(() => { rr(ctx, x, y, w, h, 30); ctx.fillStyle = '#FFFFFF'; ctx.fill(); }, 'rgba(61,15,94,0.18)', 34, 16); }
function sticky(cx, cy, w, h, rot) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot * D);
  shadowed(() => { ctx.fillStyle = COL.soft; ctx.fillRect(-w / 2, -h / 2, w, h); }, 'rgba(61,15,94,0.22)', 28, 14);
  ctx.fillStyle = 'rgba(0,0,0,0.035)'; ctx.beginPath(); ctx.moveTo(w / 2, h / 2 - 34); ctx.lineTo(w / 2, h / 2); ctx.lineTo(w / 2 - 34, h / 2); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.translate(0, -h / 2); ctx.rotate(-6 * D); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-50, -17, 100, 34); ctx.restore();
}
function handle() { const h = (state.handle || '').trim(); return h ? (h[0] === '@' ? h : '@' + h) : '@tucuenta'; }
const ARROW_DOWN = ['M20 14 C 100 10 128 70 70 132', 'M66 106 L 68 136 L 96 124'];
const BURST = ['M10 50 L 30 34', 'M36 60 L 66 52', 'M24 16 L 40 6'];


/* ---------- papel rasgado dibujado (crece según el texto) ---------- */
function tornPath(x, y, w, h, seed) {
  let s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  ctx.beginPath(); ctx.moveTo(x, y + rnd() * 6);
  for (let px = x; px <= x + w; px += 7) ctx.lineTo(px, y + rnd() * 7 - 1);
  for (let py = y; py <= y + h; py += 9) ctx.lineTo(x + w + rnd() * 5 - 2, py);
  for (let px = x + w; px >= x; px -= 7) ctx.lineTo(px, y + h + rnd() * 7 - 3);
  for (let py = y + h; py >= y; py -= 9) ctx.lineTo(x + rnd() * 5 - 2, py);
  ctx.closePath();
}
function paper(x, y, w, h, seed) {
  shadowed(() => { tornPath(x, y, w, h, seed); ctx.fillStyle = '#FFFFFF'; ctx.fill(); }, 'rgba(61,15,94,0.22)', 18, 8);
}
function chip(text, x, y) {
  ctx.font = font(700, 18, F.sans); const tw = spacedWidth(text, 3);
  rr(ctx, x, y, tw + 40, 44, 22); ctx.fillStyle = COL.accent; ctx.fill();
  ctx.fillStyle = '#FFFFFF'; spaced(text, x + 20, y + 29, 3);
}

/* ---------- engranajes ---------- */
const MOD = 8.6; // radio por diente: así todos los engranajes encajan entre sí
function gear(cx, cy, teeth, ang, fill) {
  const r = teeth * MOD, rt = r + 9, r0 = r - 10, step = TAU / teeth;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
  ctx.beginPath();
  for (let k = 0; k < teeth; k++) {
    const a0 = k * step - step / 2;
    [[r0, a0], [r0, a0 + 0.2 * step], [rt, a0 + 0.34 * step], [rt, a0 + 0.66 * step], [r0, a0 + 0.8 * step]].forEach(([rad, a], i) => {
      const X = rad * Math.cos(a), Y = rad * Math.sin(a);
      if (k === 0 && i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    });
  }
  ctx.closePath();
  ctx.moveTo(r * 0.26, 0); ctx.arc(0, 0, r * 0.26, 0, TAU);
  shadowed(() => { ctx.fillStyle = fill; ctx.fill('evenodd'); }, 'rgba(30,8,46,0.28)', 18, 8);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r * 0.64, 0, TAU); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  for (let k = 0; k < 5; k++) { const a = k * TAU / 5; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.09, 0, TAU); ctx.fill(); }
  ctx.restore();
}
// ángulo del engranaje 2 para que sus dientes entren en los huecos del 1
function mesh(a1, t1, t2, theta) { return theta + Math.PI + Math.PI / t2 - (t1 / t2) * (a1 - theta); }
function gearAt(c1, t1, t2, theta) { const d = (t1 + t2) * MOD; return [c1[0] + d * Math.cos(theta), c1[1] + d * Math.sin(theta)]; }

/* ---------- sello, bombillo y átomo ---------- */
function stamp(cx, cy, r, t, top, mid, rot) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot * D);
  shadowed(() => { ctx.fillStyle = COL.accent; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); }, 'rgba(61,15,94,0.25)', 16, 8);
  ctx.save(); ctx.rotate((t / LOOP) * 14 / (r - 9)); ctx.setLineDash([6, 8]); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r - 9, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  ctx.fillStyle = '#E6D2F5'; ctx.font = font(700, 15, F.sans); spaced(top, 0, -14, 3, 'center');
  const ms = fitSingle(mid || ' ', 900, F.disp, false, 42, 18, r * 1.45);
  ctx.fillStyle = '#FFFFFF'; ctx.font = font(900, ms, F.disp); ctx.textAlign = 'center'; ctx.fillText(mid, 0, 28); ctx.textAlign = 'left';
  ctx.restore();
}
function bulb(x, y, t) {
  const fl = 0.5 + 0.5 * Math.sin(TAU * t / LOOP), cx = x + 55, cy = y + 41;
  ctx.fillStyle = 'rgba(201,163,230,' + (0.22 + 0.3 * fl) + ')'; ctx.beginPath(); ctx.arc(cx, cy, 44 + 6 * fl, 0, TAU); ctx.fill();
  icon('bulb', x, y, 110, COL.plum, 3.6);
  ctx.save(); ctx.globalAlpha = 0.35 + 0.65 * fl; ctx.strokeStyle = COL.plum; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (let a = -160; a <= -20; a += 35) { const r = a * D; ctx.beginPath(); ctx.moveTo(cx + Math.cos(r) * 68, cy + Math.sin(r) * 68); ctx.lineTo(cx + Math.cos(r) * 88, cy + Math.sin(r) * 88); ctx.stroke(); }
  ctx.restore();
}
function atom(cx, cy, t) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-12 * D);
  ctx.strokeStyle = COL.plum; ctx.lineWidth = 3.5;
  for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(i * 60 * D); ctx.beginPath(); ctx.ellipse(0, 0, 96, 34, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
  shadowed(() => { ctx.fillStyle = COL.accent; ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill(); }, 'rgba(61,15,94,0.3)', 10, 4);
  for (let i = 0; i < 3; i++) {
    const ph = TAU * t / LOOP + i * 2.1, a = i * 60 * D;
    const ex = 96 * Math.cos(ph), ey = 34 * Math.sin(ph);
    ctx.fillStyle = i === 1 ? COL.plum : COL.accent; ctx.beginPath();
    ctx.arc(ex * Math.cos(a) - ey * Math.sin(a), ex * Math.sin(a) + ey * Math.cos(a), 9, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* ---------- calendario de taco con esquina que se levanta ---------- */
function calendar(t, ax, ay) {
  const w = 500, h = 470, x0 = -w / 2, x1 = w / 2;
  ctx.save(); ctx.translate(ax, ay); ctx.rotate(1.1 * D * Math.sin(TAU * t / LOOP));
  shadowed(() => { rr(ctx, x0 + 12, 14, w, h, 18); ctx.fillStyle = '#E3D1F0'; ctx.fill(); }, 'rgba(30,8,46,0.3)', 30, 16);
  rr(ctx, x0 + 6, 7, w, h, 18); ctx.fillStyle = '#EFE3F7'; ctx.fill();
  const c = 50 + 34 * (0.5 + 0.5 * Math.sin(TAU * t / LOOP - 1));
  ctx.beginPath(); ctx.moveTo(x0 + 18, 0); ctx.lineTo(x1 - 18, 0); ctx.arcTo(x1, 0, x1, 18, 18); ctx.lineTo(x1, h - c); ctx.lineTo(x1 - c, h);
  ctx.lineTo(x0 + 18, h); ctx.arcTo(x0, h, x0, h - 18, 18); ctx.lineTo(x0, 18); ctx.arcTo(x0, 0, x0 + 18, 0, 18); ctx.closePath();
  ctx.fillStyle = '#FFFFFF'; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = COL.accent; ctx.fillRect(x0, 0, w, 118); ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(x0, 112, w, 6);
  ctx.strokeStyle = '#F0E6F6'; ctx.lineWidth = 2; [400, 440].forEach(yy => { ctx.beginPath(); ctx.moveTo(x0 + 60, yy + 6); ctx.lineTo(x1 - 60, yy + 6); ctx.stroke(); });
  ctx.restore();
  ctx.fillStyle = '#FFFFFF'; ctx.font = font(800, 40, F.sans); spaced(MESES[state.month] || '', 0, 82, 8, 'center');
  [-150, 150].forEach(rx => {
    ctx.fillStyle = '#2A0B3F'; ctx.beginPath(); ctx.arc(rx, 26, 11, 0, TAU); ctx.fill();
    const g = ctx.createLinearGradient(rx - 24, 0, rx + 8, 0); g.addColorStop(0, '#7A7083'); g.addColorStop(0.55, '#F4F0F7'); g.addColorStop(1, '#8F8597');
    ctx.strokeStyle = g; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(rx, 26); ctx.lineTo(rx, -22); ctx.arc(rx - 12, -22, 12, 0, Math.PI, true); ctx.lineTo(rx - 24, 8); ctx.stroke();
  });
  const day = String(state.day || '').slice(0, 2);
  const ds = fitSingle(day || ' ', 900, F.disp, false, 250, 120, 420);
  ctx.fillStyle = COL.plum; ctx.font = font(900, ds, F.disp); ctx.textAlign = 'center'; ctx.fillText(day, 0, 352);
  ctx.fillStyle = COL.accent; ctx.font = font(700, 58, F.hand); ctx.fillText(String(state.year || ''), 0, 432); ctx.textAlign = 'left';
  // esquina doblada
  shadowed(() => {
    ctx.beginPath(); ctx.moveTo(x1, h - c); ctx.lineTo(x1 - c, h); ctx.lineTo(x1 - c, h - c); ctx.closePath();
    const g = ctx.createLinearGradient(x1 - c / 2, h - c / 2, x1 - c, h - c); g.addColorStop(0, '#E2CFF1'); g.addColorStop(1, '#FBF7FD');
    ctx.fillStyle = g; ctx.fill();
  }, 'rgba(30,8,46,0.25)', 10, 3);
  ctx.restore();
}

/* ---------- bloque inferior: sticker + llamada a la acción ---------- */
function bottomBlock(top, cta, boxLabel) {
  const sy = Math.max(1540, top);
  whiteBox(240, sy, 600, 110);
  if (!exporting && !recording) { ctx.fillStyle = '#BBA6CC'; ctx.font = font(500, 17, F.sans); spaced(boxLabel, 540, sy + 88, 4, 'center'); }
  badge(540, sy + 2);
  ctx.save(); ctx.translate(540, sy + 178); ctx.rotate(-2 * D); ctx.font = font(700, 44, F.hand);
  const cw = ctx.measureText(cta).width, tot = cw + 12 + 38;
  ctx.fillStyle = COL.plum; ctx.fillText(cta, -tot / 2, 0); icon('heart', -tot / 2 + cw + 12, -34, 38, COL.accent, 2.2); ctx.restore();
  ctx.fillStyle = COL.deep; ctx.font = font(600, 22, F.sans); spaced('SÍGUENOS · ' + handle(), 540, sy + 234, 3, 'center');
}
function headerPills(text) {
  ctx.save(); ctx.translate(540, 523); ctx.rotate(-1 * D);
  rr(ctx, -460, -41, 920, 82, 41); ctx.fillStyle = COL.lilac; ctx.fill();
  const ps = fitSingle(text, 700, F.hand, false, 32, 22, 840);
  ctx.font = font(700, ps, F.hand); const pw = ctx.measureText(text).width, tot = pw + 14 + 32;
  ctx.fillStyle = COL.deep; ctx.fillText(text, -tot / 2, 12); icon('heart', -tot / 2 + pw + 14, -17, 32, COL.deep, 2.2); ctx.restore();
  rr(ctx, 330, 584, 420, 46, 23); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill(); ctx.strokeStyle = COL.line; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = COL.deep; ctx.font = font(500, 19, F.sans); spaced('UN ESPACIO DE IEEE WIE', 540, 614, 5, 'center');
}

/* ---------- plantilla A: ¿sabías que…? ---------- */
const G1 = [812, 935];
function drawA(t) {
  if (L.a1) ctx.drawImage(L.a1, 0, 0); else { ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, W, H); }
  cornerList(['CIENCIA', 'INGENIERÍA', 'TECNOLOGÍA', 'HISTORIA']);
  icon('heart', 962, 186, 30, '#E3CCF4', 2.2);
  if (logoP.naturalWidth) ctx.drawImage(logoP, 48, 64, 210, 187);
  sparkle(67, 327, 54, COL.spark, 1.3, t, 0); sparkle(630, 86, 40, COL.spark, 1.5, t, 2);
  ctx.textAlign = 'left'; ctx.fillStyle = COL.plum; ctx.font = font(900, 104, F.disp); ctx.fillText('Lunes de', 282, 216);
  ctx.fillStyle = COL.accent; ctx.font = font(900, 196, F.disp, true); ctx.fillText('Datos', 128, 392);
  bulb(690, 252, t);
  headerPills('DATOS QUE INSPIRAN, MENTES QUE TRANSFORMAN');

  ctx.save(); ctx.translate(70, 708); ctx.rotate(-3 * D); ctx.fillStyle = COL.plum; ctx.font = font(700, 64, F.hand); ctx.fillText('¿SABÍAS QUE…?', 0, 0); ctx.restore();
  doodle(['M4 22 C 120 6 300 4 470 10'], 66, 712, COL.spark, 5);
  sparkle(560, 690, 44, COL.spark, 1.5, t, 1);

  const a1 = (t / LOOP) * 2 * TAU / 14, th2 = 35 * D, th3 = -150 * D;
  const g3 = gearAt(G1, 14, 10, th3), g2 = gearAt(G1, 14, 9, th2);
  gear(g3[0], g3[1], 10, mesh(a1, 14, 10, th3), '#B98BDF');
  gear(G1[0], G1[1], 14, a1, COL.accent);
  gear(g2[0], g2[1], 9, mesh(a1, 14, 9, th2), COL.plum);

  ctx.save(); ctx.translate(268, 948); ctx.rotate(-4 * D); ctx.scale(0.86, 0.86);
  shadowed(() => { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-228, -230, 456, 460); }, 'rgba(61,15,94,0.25)', 38, 20);
  drawPhoto(t, -210, -212);
  ctx.save(); ctx.translate(0, -230); ctx.rotate(3 * D); ctx.fillStyle = 'rgba(214,188,236,0.82)'; ctx.fillRect(-78, -21, 156, 42); ctx.restore();
  ctx.restore();
  stamp(985, 790, 66, t, 'DATO', '#' + String(state.num || '').replace(/^#/, ''), -10);

  // tira de papel con el dato: su alto depende del texto
  const fw = fitWrap(state.fact || '', 900, F.disp, 44, 30, 870, 4), lh = fw.size * 1.16;
  const first = 36 + 44 + 30 + fw.size, last = first + (fw.lines.length - 1) * lh;
  const src = (state.source || '').trim(), ph = (src ? last + 52 : last) + 36;
  ctx.save(); ctx.translate(540, 1162); ctx.rotate(-1.2 * D);
  paper(-480, 0, 960, ph, 7);
  chip((state.catA || 'DATO').toUpperCase(), -436, 36);
  ctx.fillStyle = COL.plum; ctx.font = font(900, fw.size, F.disp); fw.lines.forEach((ln, i) => ctx.fillText(ln, -436, first + i * lh));
  if (src) { ctx.fillStyle = '#8A62AB'; ctx.font = font(600, 19, F.sans); spaced('FUENTE: ' + src.toUpperCase(), -436, last + 52, 1.5); }
  ctx.restore();

  bottomBlock(1162 + ph + 30, '¿LO SABÍAS? RESPONDE AQUÍ', 'STICKER DE ENCUESTA AQUÍ');
}

/* ---------- plantilla B: un día como hoy ---------- */
const GB = [150, 880];
function drawB(t) {
  if (L.b1) ctx.drawImage(L.b1, 0, 0); else { ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, W, H); }
  cornerList(['FECHAS QUE', 'HICIERON', 'HISTORIA', 'EN STEM']);
  icon('heart', 962, 186, 30, '#E3CCF4', 2.2);
  if (logoP.naturalWidth) ctx.drawImage(logoP, 48, 64, 210, 187);
  sparkle(623, 143, 46, COL.spark, 1.4, t, 1); sparkle(345, 225, 30, COL.spark, 1.8, t, 3);
  ctx.textAlign = 'left'; ctx.fillStyle = COL.plum; ctx.font = font(900, 104, F.disp); ctx.fillText('Un día como', 70, 382);
  ctx.fillStyle = COL.accent; ctx.font = font(900, 170, F.disp, true); ctx.fillText('hoy…', 70, 540);
  ctx.save(); ctx.translate(560, 474); ctx.rotate(-4 * D); ctx.fillStyle = COL.deep; ctx.font = font(700, 38, F.hand);
  ctx.fillText('EN LA HISTORIA DE LA', 0, 0); ctx.fillText('CIENCIA Y LA INGENIERÍA', 0, 44); ctx.restore();

  const a1 = (t / LOOP) * 2 * TAU / 10, th = 68 * D, g2 = gearAt(GB, 10, 7, th);
  gear(g2[0], g2[1], 7, mesh(a1, 10, 7, th), COL.plum);
  gear(GB[0], GB[1], 10, a1, '#B98BDF');
  calendar(t, 540, 620);
  atom(935, 850, t);
  doodle(BURST, 880, 650, COL.plum, 4);
  sparkle(1010, 1010, 44, COL.spark, 1.5, t, 4);

  const tw = fitWrap(state.title || '', 900, F.disp, 60, 40, 870, 2), tlh = tw.size * 1.08;
  ctx.save(); const dw = fitWrap(state.desc || '', 400, F.hand, 32, 22, 870, 4); ctx.restore(); const dlh = dw.size * 1.22;
  const t1 = 36 + 44 + 26 + tw.size, tLast = t1 + (tw.lines.length - 1) * tlh;
  const d1 = tLast + 22 + dw.size, dLast = d1 + (dw.lines.length - 1) * dlh, ph = dLast + 40;
  ctx.save(); ctx.translate(540, 1120); ctx.rotate(-1.2 * D);
  paper(-480, 0, 960, ph, 11);
  chip((state.catB || 'EFEMÉRIDE').toUpperCase(), -436, 36);
  ctx.fillStyle = COL.plum; ctx.font = font(900, tw.size, F.disp); tw.lines.forEach((ln, i) => ctx.fillText(ln, -436, t1 + i * tlh));
  ctx.fillStyle = COL.deep; ctx.font = font(400, dw.size, F.hand); dw.lines.forEach((ln, i) => ctx.fillText(ln, -436, d1 + i * dlh));
  ctx.restore();

  bottomBlock(1120 + ph + 30, '¿CONOCÍAS ESTA HISTORIA?', 'STICKER DE PREGUNTA O ENCUESTA AQUÍ');
}

/* ---------- bucle ---------- */
let t0 = performance.now(), ready = false, rendering = false;
function frame(now) {
  if (rendering) { requestAnimationFrame(frame); return; }
  const t = (now - t0) / 1000;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  if (!ready) { ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, W, H); }
  else {
    (state.tpl === 'a' ? drawA : drawB)(reduced && !recording ? 0 : t);
    if (L.grain) ctx.drawImage(L.grain, 0, 0, W, H);
  }
  requestAnimationFrame(frame);
}
const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
requestAnimationFrame(frame);

const fontSpecs = ['900 100px "Playfair Display"', 'italic 900 100px "Playfair Display"', '700 40px Kalam', '400 40px Kalam', '700 40px Caveat', '500 20px Montserrat', '600 20px Montserrat', '700 20px Montserrat', '800 20px Montserrat'];
const fontsReady = Promise.race([Promise.all(fontSpecs.map(f => document.fonts.load(f, 'ÁÉÍÓÚáéíóúñ¿?¡!…AaBb'))).catch(() => {}), new Promise(r => setTimeout(r, 5000))]);
Promise.all([loaded(logoP), loaded(logoW), fontsReady, rasterSVG(SVG_A1), rasterSVG(SVG_B1)]).then(r => {
  L.a1 = r[3]; L.b1 = r[4]; L.grain = buildGrain(); ready = true;
});

/* ---------- controles ---------- */
const $ = id => document.getElementById(id);
const fields = { num: 'f-num', catA: 'f-catA', fact: 'f-fact', source: 'f-source', day: 'f-day', month: 'f-month', year: 'f-year', catB: 'f-catB', title: 'f-title', desc: 'f-desc', handle: 'f-handle' };
Object.entries(fields).forEach(([k, id]) => {
  const el = $(id); el.value = state[k];
  const upd = () => { state[k] = k === 'month' ? +el.value : el.value; persist(); };
  el.addEventListener('input', upd); el.addEventListener('change', upd);
});
$('mode-' + (state.mode === 'photo' ? 'photo' : 'dots')).checked = true;
document.querySelectorAll('input[name="f-mode"]').forEach(r => r.addEventListener('change', () => { state.mode = r.value; persist(); }));
$('dur-' + (state.dur === 15 ? '15' : '10')).checked = true;
document.querySelectorAll('input[name="f-dur"]').forEach(r => r.addEventListener('change', () => { state.dur = +r.value; persist(); updateVideoLabel(); }));
function setTab(which) {
  state.tpl = which; persist();
  $('tab-a').setAttribute('aria-selected', which === 'a'); $('tab-b').setAttribute('aria-selected', which === 'b');
  $('panel-a').hidden = which !== 'a'; $('panel-b').hidden = which !== 'b';
}
$('tab-a').addEventListener('click', () => setTab('a')); $('tab-b').addEventListener('click', () => setTab('b'));
setTab(state.tpl === 'b' ? 'b' : 'a');

$('f-photo').addEventListener('change', e => {
  const file = e.target.files && e.target.files[0]; if (!file) return;
  const rd = new FileReader();
  rd.onload = () => { const img = new Image(); img.onload = () => { photoImg = img; processPhoto(img); $('clear-photo').hidden = false; $('photo-note').textContent = 'Foto lista. Se ajusta sola al marco.'; }; img.onerror = () => { $('photo-note').textContent = 'No se pudo abrir esa imagen. Prueba con un JPG o PNG.'; }; img.src = rd.result; };
  rd.readAsDataURL(file);
});
$('clear-photo').addEventListener('click', () => { photoImg = photoGrid = photoDuo = null; $('f-photo').value = ''; $('clear-photo').hidden = true; $('photo-note').textContent = 'Sin foto se muestran los puntos en ondas.'; });

const status = $('status'), meter = $('meter');
function say(msg, kind) { status.textContent = msg; status.className = 'status' + (kind ? ' ' + kind : ''); }
// Descarga local: crea el archivo y lo guarda en la carpeta de descargas del navegador.
function offer(filename, blob) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return Promise.resolve(true);
  } catch (e) { say('No se pudo guardar el archivo.', 'warn'); return Promise.resolve(false); }
}
function slug() { return ((state.tpl === 'a' ? 'dato-' + state.num : state.day + '-' + (MESES[state.month] || '') + '-' + state.year) || 'historia').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'historia'; }

const canRecord = typeof MediaRecorder !== 'undefined' && typeof C.captureStream === 'function';
const MIME = canRecord ? ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(m => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } }) : null;
let recording = false;
function updateVideoLabel() { if (!recording) $('btn-video').textContent = 'Descargar video (' + state.dur + ' s)'; }
updateVideoLabel();
if ((!canRecord || !MIME) && !(typeof VideoEncoder !== 'undefined')) { $('btn-video').disabled = true; say('Este navegador no puede grabar video. Usa “Descargar imagen” o abre la página en Chrome.', 'warn'); }

function lock(on) { ['btn-video', 'btn-png', 'tab-a', 'tab-b'].forEach(id => $(id).disabled = on); document.querySelectorAll('.panel input, .panel textarea, .panel select').forEach(el => el.disabled = on); }
const FPS = 30;
const hasCodecs = typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';
async function pickCodec() {
  if (!hasCodecs || !window.Mp4Muxer) return null;
  const list = [['avc1.640028', 'avc'], ['avc1.4d0028', 'avc'], ['avc1.42002a', 'avc'], ['avc1.420028', 'avc'], ['vp09.00.40.08', 'vp9']];
  for (const [codec, mux] of list) {
    try { const r = await VideoEncoder.isConfigSupported({ codec, width: W, height: H, bitrate: 12000000, framerate: FPS }); if (r.supported) return { codec, mux }; } catch (e) {}
  }
  return null;
}
function paint(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  (state.tpl === 'a' ? drawA : drawB)(t);
  if (L.grain) ctx.drawImage(L.grain, 0, 0, W, H);
}
const nextTick = () => new Promise(r => setTimeout(r, 0));
async function renderMp4(secs) {
  const pick = await pickCodec(); if (!pick) return null; const codec = pick.codec;
  const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: pick.mux, width: W, height: H, frameRate: FPS }, fastStart: 'in-memory' });
  let failed = null;
  const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: e => { failed = e; } });
  enc.configure({ codec, width: W, height: H, bitrate: 12000000, framerate: FPS, latencyMode: 'quality' });
  const total = Math.round(secs * FPS);
  for (let i = 0; i < total; i++) {
    if (failed) throw failed;
    paint(i / FPS);
    const vf = new VideoFrame(C, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
    enc.encode(vf, { keyFrame: i % (FPS * 2) === 0 }); vf.close();
    while (enc.encodeQueueSize > 4) await new Promise(r => setTimeout(r, 4));
    if (i % 6 === 0) { meter.style.width = ((i + 1) / total * 100) + '%'; $('btn-video').textContent = 'Creando video ' + Math.round((i + 1) / total * 100) + '%'; await nextTick(); }
  }
  await enc.flush(); enc.close(); muxer.finalize();
  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}
async function recordRealtime(secs) {
  const stream = C.captureStream(FPS); let rec;
  try { rec = new MediaRecorder(stream, { mimeType: MIME, videoBitsPerSecond: 12000000 }); } catch (e) { return null; }
  const chunks = []; rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise(r => { rec.onstop = r; });
  rendering = true; const start = performance.now(); rec.start(250);
  await new Promise(res => {
    const step = () => {
      const el = (performance.now() - start) / 1000;
      paint(Math.min(el, secs));
      meter.style.width = Math.min(100, el / secs * 100) + '%'; $('btn-video').textContent = 'Grabando ' + Math.min(secs, Math.floor(el)) + ' / ' + secs + ' s';
      if (el >= secs + 0.1) res(); else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  rec.stop(); await stopped; stream.getTracks().forEach(tr => tr.stop());
  return new Blob(chunks, { type: MIME.split(';')[0] });
}
$('btn-video').addEventListener('click', async () => {
  if (recording || !ready) return;
  const secs = state.dur;
  recording = true; exporting = true; lock(true); say('Creando el video cuadro por cuadro…');
  let blob = null, ext = 'mp4';
  try {
    rendering = true; blob = await renderMp4(secs);
    if (!blob && canRecord && MIME) { say('Grabando… mantén esta pantalla abierta.'); blob = await recordRealtime(secs); ext = MIME.indexOf('mp4') >= 0 ? 'mp4' : 'webm'; }
  } catch (e) { blob = null; }
  rendering = false; recording = false; exporting = false; t0 = performance.now(); lock(false); updateVideoLabel(); meter.style.width = '100%';
  if (!blob) { say('No se pudo crear el video en este navegador. Prueba en Chrome o usa “Descargar imagen”.', 'warn'); meter.style.width = '0'; return; }
  say('Video listo, descargando…');
  const ok = await offer('lunes-de-datos-' + slug() + '.' + ext, blob);
  if (ok) say(ext === 'mp4' ? 'Video guardado en MP4, listo para tu historia.' : 'Video guardado en WebM. Si Instagram no lo acepta, súbelo desde Chrome en Android o conviértelo a MP4.', 'ok');
  setTimeout(() => { meter.style.width = '0'; }, 1500);
});
$('btn-png').addEventListener('click', () => {
  if (!ready) return;
  exporting = true; (state.tpl === 'a' ? drawA : drawB)((performance.now() - t0) / 1000); if (L.grain) ctx.drawImage(L.grain, 0, 0, W, H);
  C.toBlob(async blob => {
    exporting = false;
    if (!blob) { say('No se pudo crear la imagen.', 'warn'); return; }
    const ok = await offer('lunes-de-datos-' + slug() + '.png', blob);
    if (ok) say('Imagen guardada.', 'ok');
  }, 'image/png');
});
})();
