/* Settings sheet: show/hide tabs, reorder (drag on desktop, arrows everywhere), reset. */
import { h, icon, cx } from './dom';
import { T, tabLabel } from './state';
import { openSheet, rebuildSheet } from './sheet';
import { REGISTRY } from './registry';

export function openSettings() {
  let dragKey = null, warn = '';
  const move = (key, by) => {
    const keys = REGISTRY.orderedTabs().map((t) => t.key);
    const i = keys.indexOf(key), j = i + by;
    if (i < 0 || j < 0 || j >= keys.length) return;
    [keys[i], keys[j]] = [keys[j], keys[i]];
    REGISTRY.setTabOrder(keys);
  };
  const dropOn = (target) => {
    if (!dragKey || dragKey === target) return;
    const keys = REGISTRY.orderedTabs().map((t) => t.key).filter((k) => k !== dragKey);
    keys.splice(keys.indexOf(target), 0, dragKey);
    REGISTRY.setTabOrder(keys);
  };
  const build = () => {
    const hidden = new Set(REGISTRY.hiddenTabs());
    const tabs = REGISTRY.orderedTabs();
    return [
      h('p', { class: 'maphint', style: 'margin:0 0 8px' }, T('tabsHint')),
      h('ul', { class: 'tablist', 'aria-label': T('tabsSettings') }, tabs.map((t, i) => h('li', {
        class: cx('trow', hidden.has(t.key) && 'off'), draggable: 'true',
        ondragstart: (e) => { dragKey = t.key; e.dataTransfer && (e.dataTransfer.effectAllowed = 'move'); },
        ondragover: (e) => e.preventDefault(),
        ondrop: (e) => { e.preventDefault(); dropOn(t.key); dragKey = null; rebuildSheet(); },
      },
        h('label', { class: 'tchk' },
          h('input', { type: 'checkbox', checked: !hidden.has(t.key), onchange: (e) => { const ok = REGISTRY.setHidden(t.key, !e.target.checked); warn = ok ? '' : T('keepOneTab'); rebuildSheet(); } }),
          icon(t.icon), h('span', null, tabLabel(t)), t.custom ? h('small', null, ` · ${T('pluginTab')}`) : null),
        h('button', { class: 'navbtn sm', 'aria-label': `${T('moveUp')}: ${tabLabel(t)}`, disabled: i === 0, onclick: () => { move(t.key, -1); rebuildSheet(); } }, icon('up')),
        h('button', { class: 'navbtn sm', 'aria-label': `${T('moveDown')}: ${tabLabel(t)}`, disabled: i === tabs.length - 1, onclick: () => { move(t.key, 1); rebuildSheet(); } }, icon('down'))))),
      warn ? h('p', { class: 'bad-t', role: 'alert' }, warn) : null,
      h('button', { class: 'linkbtn', style: 'margin-top:10px', onclick: () => { REGISTRY.resetTabs(); warn = ''; rebuildSheet(); } }, T('resetDefaults')),
    ];
  };
  openSheet({ title: () => T('settings'), badge: () => T('tabsSettings'), build });
}
