/* Modal / bottom-sheet manager + glossary sheet + clickable .term spans. */
import { h, icon, cx, setKids } from './dom';
import { S, T, L } from './state';
import { glossaryEntry } from '../lib/glossary';

const CAT_KEY = {
  panchang: 'catPanchang', muhurat: 'catMuhurat', inauspicious: 'catInauspicious', graha: 'catGraha', nakshatra: 'catNakshatra',
  tithi: 'catTithi', yoga: 'catYoga', karan: 'catKaran', rashi: 'catRashi', choghadiya: 'catChoghadiya', hora: 'catHora',
  festival: 'catFestival', eclipse: 'catEclipse', panoti: 'catPanoti',
};

// ------------------------------------------------------------------ generic sheet
let current = null; // { ov, build, titleFn, onClose, opener }
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function sheetOpen() { return !!current; }

/**
 * openSheet({ title: () => string, badge?: () => string, build: () => Node|Node[], onClose?, wide? })
 * `build`/`title` are functions so the sheet can be rebuilt after a language change.
 */
export function openSheet(opts) {
  if (current) closeSheet(true);
  const opener = document.activeElement;
  const titleId = 'sheet-title';
  const ov = h('div', { class: 'sheet-ov', onmousedown: (e) => { if (e.target === ov) closeSheet(); } });
  current = { ov, opts, opener };
  document.body.append(ov);
  document.documentElement.classList.add('sheet-lock');
  fill();
  return { close: () => closeSheet(), rebuild: fill };
}

function fill() {
  if (!current) return;
  const { ov, opts } = current;
  const keepScroll = ov.querySelector('.sheet-body')?.scrollTop ?? 0;
  const body = h('div', { class: 'sheet-body' }, opts.build());
  const sheet = h('div', { class: cx('sheet frame-double', opts.wide && 'wide'), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sheet-title', tabindex: '-1' },
    h('div', { class: 'sheet-hd' },
      opts.back ? h('button', { class: 'sheet-x', 'aria-label': T('back'), onclick: opts.back }, icon('left')) : null,
      h('div', { class: 'sheet-ttl' },
        h('h2', { id: 'sheet-title', class: 'display' }, opts.title()),
        opts.badge ? h('span', { class: 'chip saffron' }, opts.badge()) : null),
      h('button', { class: 'sheet-x', 'aria-label': T('close'), title: T('close'), onclick: () => closeSheet() }, icon('x'))),
    body);
  setKids(ov, sheet);
  body.scrollTop = keepScroll;
  if (!ov.dataset.focused) { (sheet.querySelector('.sheet-x:last-of-type') || sheet).focus(); ov.dataset.focused = '1'; }
}

export function rebuildSheet() { if (current) fill(); }

export function closeSheet(silent) {
  if (!current) return;
  const { ov, opts, opener } = current;
  current = null;
  ov.remove();
  document.documentElement.classList.remove('sheet-lock');
  if (!silent) { try { opts.onClose && opts.onClose(); } catch (e) { console.error(e); } }
  if (!silent && opener && document.contains(opener) && opener.focus) opener.focus();
}

// focus trap + Esc
document.addEventListener('keydown', (e) => {
  if (!current) return;
  if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
  if (e.key !== 'Tab') return;
  const items = [...current.ov.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent !== null || x === document.activeElement);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (!current.ov.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

// ------------------------------------------------------------------ glossary
const entryText = (e, f) => (S.lang === 'gu' ? e[f + 'Gu'] : e[f + 'En']);
const entryName = (e) => (S.lang === 'gu' ? e.gu : e.en);

/** A tappable label. `key` may be undefined/unknown → plain text. */
export function term(key, label, extraClass) {
  if (!key) return label;
  const e = glossaryEntry(key);
  if (!e) return label;
  const tip = `${entryName(e)} — ${entryText(e, 'what')}`;
  return h('span', { class: cx('term', extraClass), 'data-gkey': key, tabindex: '0', role: 'button', title: tip.length > 220 ? tip.slice(0, 217) + '…' : tip }, label);
}

let history = [];
/** Open the glossary sheet for a key (string) or an ad-hoc GlossaryEntry object. */
export function openGlossary(keyOrEntry, push = false) {
  const entry = typeof keyOrEntry === 'string' ? glossaryEntry(keyOrEntry) : keyOrEntry;
  if (!entry) return;
  if (!push || !current) history = [];
  history.push(entry);
  const cur = () => history[history.length - 1];
  const view = () => {
    const e = cur();
    const sec = (title, text) => (text ? h('section', { class: 'gsec' }, h('h3', null, title), h('p', null, text)) : null);
    const rel = (e.related || []).map((k) => glossaryEntry(k)).filter(Boolean);
    return [
      sec(T('whatIs'), entryText(e, 'what')),
      sec(T('howComputed'), entryText(e, 'how')),
      sec(T('significance'), entryText(e, 'why')),
      e.extra ? e.extra() : null,
      rel.length ? h('section', { class: 'gsec' }, h('h3', null, T('relatedTerms')),
        h('div', { class: 'chips' }, rel.map((r) => h('button', { class: 'chip rel', onclick: () => openGlossary(r.key, true) }, entryName(r))))) : null,
    ];
  };
  const back = () => { if (history.length > 1) { history.pop(); rebuildSheet(); } };
  const spec = {
    title: () => entryName(cur()), badge: () => T(CAT_KEY[cur().category] || 'catPanchang'), build: view, wide: false,
    get back() { return history.length > 1 ? back : null; },
    onClose: () => { history = []; },
  };
  if (current && push) { current.opts = spec; fill(); } else openSheet(spec);
}

// delegated handlers (installed once)
document.addEventListener('click', (e) => {
  const t = e.target.closest && e.target.closest('.term');
  if (t && t.dataset.gkey) { e.preventDefault(); openGlossary(t.dataset.gkey); }
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const t = e.target.closest && e.target.closest('.term');
  if (t && t.dataset.gkey) { e.preventDefault(); openGlossary(t.dataset.gkey); }
});
