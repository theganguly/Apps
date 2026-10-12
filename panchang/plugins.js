/**
 * Plugin hook. Anything pushed onto window.PanchangPlugins before boot (or registered later with
 * window.__panchang.registerPlugin) becomes a tab.
 *
 *   plugin = { key, strGu, strEn, icon, mount(el, ctx), order? }
 *
 * To ship a plugin inside the single-file build, add it below and run ./build.sh.
 * The bundled list is intentionally empty.
 */
window.PanchangPlugins = window.PanchangPlugins || [];

// Example (uncomment to try):
// window.PanchangPlugins.push({
//   key: 'hello', strGu: 'નમસ્તે', strEn: 'Hello', icon: 'star',
//   mount(el, ctx) { el.textContent = ctx.state.lang === 'gu' ? 'નમસ્તે!' : 'Hello!'; },
// });
