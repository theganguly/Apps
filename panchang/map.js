/**
 * Offline-first location map. A schematic India/Gujarat outline is drawn as inline SVG (no assets,
 * no network). A draggable crosshair picks lat/lon. If — and only if — the user presses
 * "Load detailed map", OpenStreetMap raster tiles are fetched and drawn underneath.
 * Everything is in Web-Mercator "world units" (0..256) so tiles line up exactly with the outline.
 */
import { h, setKids } from './dom';
import { T } from './state';

const NS = 'http://www.w3.org/2000/svg';
const INDIA = [[68.2, 23.7], [68.8, 23.95], [69.5, 24.3], [70.1, 24.4], [70.3, 25.7], [70.2, 27.7], [71.9, 28.4], [73.2, 29.2], [74.0, 30.0], [74.5, 31.0], [74.6, 31.9], [75.2, 32.5], [74.6, 33.2], [74.0, 34.5], [75.5, 36.0], [77.0, 35.6], [78.2, 35.5], [79.0, 34.3], [78.5, 32.7], [79.0, 31.2], [80.2, 30.6], [81.0, 30.1], [80.3, 28.8], [81.5, 28.4], [83.0, 27.4], [84.5, 27.1], [86.0, 26.6], [88.1, 26.4], [88.2, 27.3], [88.8, 28.1], [89.0, 26.9], [91.0, 26.8], [92.0, 27.8], [93.5, 28.6], [95.5, 29.3], [97.3, 28.3], [96.4, 27.2], [95.2, 26.5], [94.7, 25.2], [94.2, 24.0], [93.3, 22.9], [93.1, 22.2], [92.4, 21.6], [92.3, 22.7], [91.7, 23.5], [91.2, 24.2], [90.7, 25.1], [89.8, 25.3], [89.0, 25.3], [88.3, 25.3], [88.2, 24.5], [88.6, 24.2], [88.9, 23.3], [89.0, 22.2], [88.8, 21.7], [87.5, 21.5], [86.9, 20.8], [86.2, 20.0], [85.0, 19.3], [84.0, 18.4], [82.5, 17.0], [81.3, 16.2], [80.3, 15.5], [80.2, 13.5], [80.3, 12.5], [79.8, 11.8], [79.8, 10.3], [79.3, 9.4], [78.2, 8.8], [77.5, 8.1], [76.9, 8.5], [76.3, 9.5], [75.7, 11.2], [74.8, 12.9], [74.2, 14.5], [73.8, 15.5], [73.3, 17.0], [72.9, 18.9], [72.8, 20.3], [72.7, 21.1], [72.6, 21.7], [72.5, 22.3], [72.2, 22.0], [72.1, 21.4], [71.4, 20.9], [70.8, 20.7], [70.2, 20.9], [69.8, 21.2], [69.4, 21.7], [69.0, 22.2], [69.3, 22.5], [70.0, 22.6], [70.4, 22.9], [69.8, 22.8], [69.0, 22.9], [68.6, 23.1], [68.3, 23.5]];
const GUJARAT = [[68.2, 23.7], [68.8, 23.95], [69.5, 24.3], [70.1, 24.4], [70.9, 24.3], [71.4, 24.6], [72.2, 24.6], [72.8, 24.4], [73.2, 24.2], [73.6, 23.9], [74.0, 23.6], [74.3, 23.2], [74.2, 22.6], [73.7, 22.0], [73.9, 21.4], [73.6, 20.8], [73.2, 20.4], [72.9, 20.2], [72.7, 20.6], [72.7, 21.1], [72.6, 21.7], [72.5, 22.3], [72.2, 22.0], [72.1, 21.4], [71.4, 20.9], [70.8, 20.7], [70.2, 20.9], [69.8, 21.2], [69.4, 21.7], [69.0, 22.2], [69.3, 22.5], [70.0, 22.6], [70.4, 22.9], [69.8, 22.8], [69.0, 22.9], [68.6, 23.1], [68.3, 23.5]];

// Web-Mercator on a 256-unit world
const px = (lon) => (lon + 180) / 360 * 256;
const py = (lat) => { const s = Math.sin(lat * Math.PI / 180); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 256; };
const unLon = (x) => x / 256 * 360 - 180;
const unLat = (y) => { const n = Math.PI - 2 * Math.PI * y / 256; return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); };

const VIEWS = {
  india: { lon0: 67, lon1: 98.5, lat0: 6, lat1: 37.5, z: 5, grid: 5 },
  gujarat: { lon0: 67.8, lon1: 74.8, lat0: 20, lat1: 25, z: 7, grid: 1 },
};
const poly = (pts) => 'M' + pts.map(([lo, la]) => `${px(lo).toFixed(3)},${py(la).toFixed(3)}`).join('L') + 'Z';
const svg = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v); if (text !== undefined) e.textContent = text; return e; };

/**
 * MapPicker({ lat, lon, cities, onPick }) → { el, setPoint(lat, lon) }
 *   onPick(lat, lon) fires while the user taps / drags.
 */
export function MapPicker({ lat, lon, cities = [], onPick }) {
  let view = lat !== undefined && lat > 20 && lat < 25 && lon > 67.8 && lon < 74.8 ? 'gujarat' : 'india';
  let online = false, tileFail = 0;
  const wrap = h('div', { class: 'mapbox' });
  const status = h('div', { class: 'mapstatus' });
  const hint = h('p', { class: 'maphint' }, T('mapHint'));
  const attrib = h('div', { class: 'mapattr' });
  let svgEl = null, cross = null, pt = { lat, lon };

  function build() {
    const v = VIEWS[view];
    const x0 = px(v.lon0), x1 = px(v.lon1), y0 = py(v.lat1), y1 = py(v.lat0);
    const s = svg('svg', { viewBox: `${x0} ${y0} ${x1 - x0} ${y1 - y0}`, class: 'mapsvg', role: 'img', 'aria-label': T('mapOffline'), preserveAspectRatio: 'xMidYMid meet' });
    s.append(svg('rect', { x: x0, y: y0, width: x1 - x0, height: y1 - y0, fill: 'var(--paper2)' }));
    if (online) {
      const tiles = svg('g', { class: 'tiles' });
      const n = 2 ** v.z, t = 256 / n;
      const tx0 = Math.floor(x0 / t), tx1 = Math.floor((x1 - 1e-9) / t), ty0 = Math.floor(y0 / t), ty1 = Math.floor((y1 - 1e-9) / t);
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
        const im = svg('image', { x: tx * t, y: ty * t, width: t, height: t, href: `https://tile.openstreetmap.org/${v.z}/${tx}/${ty}.png` });
        im.addEventListener('error', () => { if (++tileFail >= 3 && online) { online = false; tileFail = 0; status.dataset.fail = '1'; render(); } });
        tiles.append(im);
      }
      s.append(tiles);
    }
    // graticule
    const g = svg('g', { stroke: 'var(--line)', 'stroke-width': 0.12, fill: 'none' });
    for (let lo = Math.ceil(v.lon0 / v.grid) * v.grid; lo <= v.lon1; lo += v.grid) {
      g.append(svg('line', { x1: px(lo), y1: y0, x2: px(lo), y2: y1 }));
      g.append(svg('text', { x: px(lo) + 0.3, y: y1 - 0.4, 'font-size': view === 'india' ? 1.6 : 0.9, fill: 'var(--inksoft)', stroke: 'none' }, lo + '°'));
    }
    for (let la = Math.ceil(v.lat0 / v.grid) * v.grid; la <= v.lat1; la += v.grid) {
      g.append(svg('line', { x1: x0, y1: py(la), x2: x1, y2: py(la) }));
      g.append(svg('text', { x: x0 + 0.3, y: py(la) - 0.3, 'font-size': view === 'india' ? 1.6 : 0.9, fill: 'var(--inksoft)', stroke: 'none' }, la + '°'));
    }
    s.append(g);
    s.append(svg('path', { d: poly(INDIA), fill: online ? 'rgba(224,123,36,.10)' : '#fbf7ec', stroke: 'var(--ink)', 'stroke-width': view === 'india' ? 0.25 : 0.12, 'stroke-linejoin': 'round' }));
    s.append(svg('path', { d: poly(GUJARAT), fill: 'rgba(184,30,43,.07)', stroke: 'var(--sindoor)', 'stroke-width': view === 'india' ? 0.18 : 0.1, 'stroke-linejoin': 'round' }));
    for (const c of cities) s.append(svg('circle', { cx: px(c.lon), cy: py(c.lat), r: view === 'india' ? 0.35 : 0.16, fill: 'var(--inksoft)', opacity: 0.55 }));
    cross = svg('g', { class: 'cross', 'pointer-events': 'none' });
    const r = view === 'india' ? 1.5 : 0.7;
    cross.append(svg('circle', { r, fill: 'none', stroke: 'var(--sindoor)', 'stroke-width': r / 7 }), svg('circle', { r: r / 6, fill: 'var(--sindoor)' }),
      svg('path', { d: `M${-r * 1.7},0H${r * 1.7}M0,${-r * 1.7}V${r * 1.7}`, stroke: 'var(--sindoor)', 'stroke-width': r / 9 }));
    s.append(cross);
    placeCross();

    let dragging = false;
    const pick = (e) => {
      const rect = s.getBoundingClientRect();
      const vb = s.viewBox.baseVal;
      const k = Math.min(rect.width / vb.width, rect.height / vb.height);
      const offX = (rect.width - vb.width * k) / 2, offY = (rect.height - vb.height * k) / 2;
      const wx = vb.x + (e.clientX - rect.left - offX) / k, wy = vb.y + (e.clientY - rect.top - offY) / k;
      const la = Math.max(v.lat0, Math.min(v.lat1, unLat(wy))), lo = Math.max(v.lon0, Math.min(v.lon1, unLon(wx)));
      pt = { lat: Math.round(la * 1e6) / 1e6, lon: Math.round(lo * 1e6) / 1e6 };
      placeCross();
      onPick && onPick(pt.lat, pt.lon);
    };
    s.addEventListener('pointerdown', (e) => { dragging = true; try { s.setPointerCapture(e.pointerId); } catch { /* ignore */ } pick(e); });
    s.addEventListener('pointermove', (e) => { if (dragging) pick(e); });
    const stop = () => { dragging = false; };
    s.addEventListener('pointerup', stop); s.addEventListener('pointercancel', stop);
    svgEl = s;
    return s;
  }
  function placeCross() {
    if (!cross) return;
    const v = VIEWS[view];
    if (pt.lat === undefined || Number.isNaN(pt.lat) || pt.lat < v.lat0 || pt.lat > v.lat1 || pt.lon < v.lon0 || pt.lon > v.lon1) { cross.setAttribute('visibility', 'hidden'); return; }
    cross.setAttribute('visibility', 'visible');
    cross.setAttribute('transform', `translate(${px(pt.lon)} ${py(pt.lat)})`);
  }
  function render() {
    const toggle = h('div', { class: 'maptools' },
      h('div', { class: 'seg' },
        ['india', 'gujarat'].map((k) => h('button', { class: view === k ? 'on' : '', onclick: () => { view = k; render(); } }, k === 'india' ? T('mapIndia') : T('mapGujarat')))),
      h('button', { class: 'linkbtn', onclick: () => { online = !online; tileFail = 0; delete status.dataset.fail; render(); } }, online ? T('hideDetailedMap') : T('loadDetailedMap')));
    const onl = typeof navigator !== 'undefined' && navigator.onLine === false ? '⛔ ' : '';
    status.textContent = '';
    status.append(h('span', { class: online ? 'dot g' : 'dot', style: online ? '' : 'background:var(--saffron)' }), ' ', online ? T('mapOnline') : T('mapOffline'));
    if (status.dataset.fail) status.append(h('div', { class: 'bad-t' }, onl + T('mapTilesFail')));
    attrib.textContent = online ? '© OpenStreetMap contributors' : '';
    setKids(wrap, toggle, status, build(), attrib, hint);
  }
  render();
  return { el: wrap, setPoint(la, lo) { pt = { lat: la, lon: lo }; placeCross(); }, refresh: render };
}
