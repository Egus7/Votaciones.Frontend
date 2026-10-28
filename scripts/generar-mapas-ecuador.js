// Genera los mapas SVG (provincias, cantones por provincia, parroquias por cantón)
// a partir del GeoPackage de geoecu (CONALI, CC BY).
// Fuente: https://github.com/f-slg/geoecu/releases/download/datos-v0.2.0/geoecu_dpa_baja.gpkg
// Uso (Node 22+): node scripts/generar-mapas-ecuador.js geoecu_dpa_baja.gpkg public/mapas/ecuador
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const [, , gpkg, outDir] = process.argv;
const db = new DatabaseSync(gpkg, { readOnly: true });

// --- GeoPackage -> anillos [lon, lat]
function leerGeom(buf) {
  const b = Buffer.from(buf);
  const env = [0, 32, 48, 48, 64][(b[3] >> 1) & 7];
  let o = 8 + env;
  const polys = [];
  function geom() {
    const le = b[o] === 1; o += 1;
    const u32 = () => { const v = le ? b.readUInt32LE(o) : b.readUInt32BE(o); o += 4; return v; };
    const f64 = () => { const v = le ? b.readDoubleLE(o) : b.readDoubleBE(o); o += 8; return v; };
    const tipo = u32() % 1000;
    if (tipo === 6) { const n = u32(); for (let i = 0; i < n; i++) geom(); return; }
    if (tipo !== 3) throw new Error('tipo ' + tipo);
    const rings = [];
    const nr = u32();
    for (let r = 0; r < nr; r++) {
      const np = u32(); const ring = [];
      for (let p = 0; p < np; p++) ring.push([f64(), f64()]);
      rings.push(ring);
    }
    polys.push(rings);
  }
  geom();
  return polys;
}

// --- Utilidades geométricas
const r1 = n => Math.round(n * 10) / 10;
function bbox(features) {
  const lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
  for (const f of features) for (const p of f.polys) for (const [x, y] of p[0]) {
    lo[0] = Math.min(lo[0], x); lo[1] = Math.min(lo[1], y);
    hi[0] = Math.max(hi[0], x); hi[1] = Math.max(hi[1], y);
  }
  return { lo, hi };
}
function simplificar(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const pila = [[0, pts.length - 1]];
  while (pila.length) {
    const [a, z] = pila.pop(); let max = 0, idx = -1;
    const [ax, ay] = pts[a], [zx, zy] = pts[z]; const dx = zx - ax, dy = zy - ay; const len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < z; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + zx * ay - zy * ax) / len;
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol && idx > 0) { keep[idx] = 1; pila.push([a, idx], [idx, z]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// Un anillo cerrado se divide en dos tramos para que Douglas-Peucker funcione.
function simplificarAnillo(pts, tol) {
  const m = Math.floor(pts.length / 2);
  return simplificar(pts.slice(0, m + 1), tol).concat(simplificar(pts.slice(m), tol).slice(1));
}
const area = ring => Math.abs(ring.reduce((s, [x, y], i) => {
  const [x2, y2] = ring[(i + 1) % ring.length]; return s + x * y2 - x2 * y; }, 0) / 2);
function centroide(ring) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % ring.length];
    const f = x1 * y2 - x2 * y1; a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f;
  }
  return a ? [cx / (3 * a), cy / (3 * a)] : ring[0];
}
function trazo(polys, proj, tol, minArea) {
  let d = '';
  for (const p of polys) {
    const rings = p.map(r => simplificarAnillo(r.map(proj), tol)).filter(r => r.length >= 4);
    if (!rings.length || area(rings[0]) < minArea) continue;
    for (const r of rings) d += 'M' + r.slice(0, -1).map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L') + 'Z';
  }
  return d;
}

// Proyección equirectangular que encaja el bbox en un alto/ancho máximo.
function proyeccion({ lo, hi }, max, pad, offX = 0) {
  const k = max / Math.max(hi[0] - lo[0], hi[1] - lo[1]);
  return {
    k,
    ancho: Math.ceil(offX + (hi[0] - lo[0]) * k + pad * 2),
    alto: Math.ceil((hi[1] - lo[1]) * k + pad * 2),
    proj: ([x, y]) => [offX + pad + (x - lo[0]) * k, pad + (hi[1] - y) * k],
  };
}

function capa(features, { max = 600, pad = 12, tol = 0.6, minArea = 2, galapagos = null }) {
  const continentales = features.filter(f => f !== galapagos);
  const offX = galapagos ? 210 : 0;
  const { ancho, alto, proj } = proyeccion(bbox(continentales), max, pad, offX);
  let recuadro = null, projGal = null;
  if (galapagos) {
    const gb = bbox([galapagos]);
    recuadro = { x: 12, y: 40, w: 180, h: 160 };
    const k = Math.min((recuadro.w - 20) / (gb.hi[0] - gb.lo[0]), (recuadro.h - 20) / (gb.hi[1] - gb.lo[1]));
    projGal = ([x, y]) => [recuadro.x + 10 + (x - gb.lo[0]) * k, recuadro.y + 10 + (gb.hi[1] - y) * k];
  }
  const items = features.map(f => {
    const p = f === galapagos ? projGal : proj;
    const d = trazo(f.polys, p, tol, f === galapagos ? 0.3 : minArea);
    const mayor = f.polys.map(pl => pl[0].map(p)).sort((a, b) => area(b) - area(a))[0];
    const [cx, cy] = centroide(mayor);
    return { codigo: f.codigo, nombre: f.nombre, d, cx: r1(cx), cy: r1(cy) };
  }).filter(i => i.d);
  const res = { viewBox: `0 0 ${ancho} ${alto}`, items };
  if (recuadro) res.recuadro = recuadro;
  return res;
}

function escribir(rel, data) {
  const ruta = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, JSON.stringify(data));
  return fs.statSync(ruta).size;
}
const leer = (sql) => db.prepare(sql).all().map(r => ({ ...r, polys: leerGeom(r.geom) }));

// Se excluyen las zonas en estudio (código 90 / tipo "zona en estudio").
const provincias = leer("select * from provincias where dpa_provin <> '90' order by dpa_provin")
  .map(r => ({ codigo: r.dpa_provin, nombre: r.provincia, polys: r.polys }));
const cantones = leer("select * from cantones where dpa_provin <> '90' order by dpa_canton")
  .map(r => ({ codigo: r.dpa_canton, nombre: r.canton, provincia: r.dpa_provin, polys: r.polys }));
const parroquias = leer("select * from parroquias where tipo <> 'zona en estudio' order by dpa_parroq")
  .map(r => ({ codigo: r.dpa_parroq, nombre: r.parroquia, canton: r.dpa_canton, polys: r.polys }));

fs.rmSync(outDir, { recursive: true, force: true });
let total = escribir('provincias.json', capa(provincias, { max: 640, tol: 0.7, galapagos: provincias.find(p => p.codigo === '20') }));
for (const prov of provincias) {
  total += escribir(`cantones/${prov.codigo}.json`, capa(cantones.filter(c => c.provincia === prov.codigo), {}));
}
for (const can of cantones) {
  total += escribir(`parroquias/${can.codigo}.json`, capa(parroquias.filter(p => p.canton === can.codigo), {}));
}
console.log('provincias', provincias.length, 'cantones', cantones.length, 'parroquias', parroquias.length, 'bytes', total);
