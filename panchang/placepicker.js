/* Place picker sheet: search, saved places, manual lat/lon, geolocation, offline map. */
import { h, icon, cx, setKids } from './dom';
import { S, T, L, setPlace, place, placeName, fd, hooks } from './state';
import { openSheet, closeSheet } from './sheet';
import { MapPicker } from './map';
import { builtinPlaces, userPlaces, addPlace, updatePlace, deletePlace, isBuiltin, newPlaceId, validCoords, searchPlaces } from '../lib/places';

export function openPlacePicker() {
  const f = { q: '', editId: null, name: '', lat: '', lon: '', msg: '', msgBad: false };
  let listBox, formMsg, mapApi, latIn, lonIn, nameIn, saveBtn, delArmed = null;

  const pickFromMap = (la, lo) => { f.lat = String(la); f.lon = String(lo); if (latIn) { latIn.value = f.lat; lonIn.value = f.lon; } };
  const num = (s) => (s === '' || s === null ? NaN : Number(s));
  const setMsg = (txt, bad) => { f.msg = txt; f.msgBad = !!bad; if (formMsg) { formMsg.textContent = txt; formMsg.className = 'formmsg ' + (bad ? 'bad-t' : 'good-t'); } };
  const syncMap = () => { const la = num(f.lat), lo = num(f.lon); if (validCoords(la, lo) && mapApi) mapApi.setPoint(la, lo); };

  function row(p) {
    const sel = p.id === S.placeId, mine = !isBuiltin(p.id);
    return h('div', { class: cx('prow', sel && 'sel') },
      h('button', { class: 'pmain', onclick: () => { setPlace(p.id); closeSheet(); } },
        icon('pin'), h('span', { class: 'pn' }, placeName(p)), h('small', null, `${fd(p.lat.toFixed(4))}, ${fd(p.lon.toFixed(4))}`), sel ? h('span', { class: 'chip good' }, T('selectedPlace')) : null),
      mine ? h('button', { class: 'navbtn sm', 'aria-label': T('edit'), title: T('edit'), onclick: () => startEdit(p) }, icon('edit')) : null,
      mine ? (delArmed === p.id
        ? h('button', { class: 'navbtn sm danger', 'aria-label': T('confirmDelete'), title: T('confirmDelete'), onclick: () => { deletePlace(p.id); if (S.placeId === p.id) setPlace(builtinPlaces()[0].id); delArmed = null; renderList(); } }, T('delete'))
        : h('button', { class: 'navbtn sm', 'aria-label': T('delete'), title: T('delete'), onclick: () => { delArmed = p.id; renderList(); } }, icon('trash'))) : null);
  }
  function renderList() {
    const mine = searchPlaces(userPlaces(), f.q), built = searchPlaces(builtinPlaces(), f.q);
    setKids(listBox,
      mine.length ? h('div', { class: 'plabel' }, T('myPlaces')) : null, mine.map(row),
      built.length ? h('div', { class: 'plabel' }, T('builtinPlaces')) : null, built.map(row),
      !mine.length && !built.length ? h('p', { class: 'empty-note' }, T('noPlaces')) : null);
  }
  function startEdit(p) {
    f.editId = p.id; f.name = placeName(p); f.lat = String(p.lat); f.lon = String(p.lon);
    nameIn.value = f.name; latIn.value = f.lat; lonIn.value = f.lon; saveBtn.textContent = T('updatePlace');
    syncMap(); setMsg('', false); nameIn.focus();
  }
  function save() {
    const la = num(f.lat), lo = num(f.lon);
    if (!validCoords(la, lo)) return setMsg(T('invalidCoords'), true);
    const name = f.name.trim();
    if (!name) return setMsg(T('nameRequired'), true);
    let id = f.editId;
    if (id) updatePlace(id, { nameGu: name, nameEn: name, lat: la, lon: lo });
    else { id = newPlaceId(); addPlace({ id, nameGu: name, nameEn: name, lat: la, lon: lo, tzHours: 5.5 }); }
    setPlace(id); closeSheet();
  }
  function locate() {
    if (!navigator.geolocation) return setMsg(T('geoDenied'), true);
    setMsg(T('locating'), false);
    navigator.geolocation.getCurrentPosition((pos) => {
      pickFromMap(Math.round(pos.coords.latitude * 1e6) / 1e6, Math.round(pos.coords.longitude * 1e6) / 1e6);
      syncMap(); setMsg(T('geoNeedName'), false); nameIn.focus();
    }, () => setMsg(T('geoDenied'), true), { timeout: 10000, maximumAge: 60000 });
  }

  const build = () => {
    const cur = place();
    if (!f.lat && !f.lon) { f.lat = String(cur.lat); f.lon = String(cur.lon); }
    listBox = h('div', { class: 'plist' });
    formMsg = h('div', { class: cx('formmsg', f.msgBad ? 'bad-t' : 'good-t'), role: 'status' }, f.msg);
    nameIn = h('input', { class: 'inp', type: 'text', value: f.name, maxlength: 60, 'aria-label': T('placeName'), oninput: (e) => { f.name = e.target.value; } });
    latIn = h('input', { class: 'inp', type: 'number', step: '0.000001', min: -90, max: 90, value: f.lat, inputmode: 'decimal', 'aria-label': T('latitude'), oninput: (e) => { f.lat = e.target.value; syncMap(); } });
    lonIn = h('input', { class: 'inp', type: 'number', step: '0.000001', min: -180, max: 180, value: f.lon, inputmode: 'decimal', 'aria-label': T('longitude'), oninput: (e) => { f.lon = e.target.value; syncMap(); } });
    saveBtn = h('button', { class: 'castbtn', onclick: save }, f.editId ? T('updatePlace') : T('savePlace'));
    mapApi = MapPicker({ lat: num(f.lat), lon: num(f.lon), cities: builtinPlaces(), onPick: pickFromMap });
    renderList();
    return [
      h('div', { class: 'psearch' }, icon('search'),
        h('input', { class: 'inp', type: 'search', placeholder: T('searchPlace'), 'aria-label': T('searchPlace'), value: f.q, oninput: (e) => { f.q = e.target.value; renderList(); } })),
      listBox,
      h('div', { class: 'plabel', style: 'margin-top:14px' }, f.editId ? T('edit') : T('newPlace')),
      h('button', { class: 'linkbtn locbtn', onclick: locate }, icon('crosshair'), T('useMyLocation')),
      h('div', { class: 'form3 pform' },
        h('div', null, h('label', { class: 'lbl' }, T('latitude')), latIn),
        h('div', null, h('label', { class: 'lbl' }, T('longitude')), lonIn),
        h('div', null, h('label', { class: 'lbl' }, T('placeName')), nameIn)),
      mapApi.el, formMsg, saveBtn,
      f.editId ? h('button', { class: 'linkbtn', onclick: () => { f.editId = null; f.name = ''; nameIn.value = ''; saveBtn.textContent = T('savePlace'); } }, T('cancel')) : null,
      h('p', { class: 'maphint' }, T('istNote')),
    ];
  };
  openSheet({ title: () => T('place'), build, wide: true });
}
