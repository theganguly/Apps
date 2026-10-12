/** Registry smoke test (Node, in-memory storage): register / reorder / hide / unregister a dummy tab. */
// @ts-ignore — plain JS module
import { REGISTRY } from '../ui/registry.js';

let failures = 0;
const check = (n: string, c: boolean, x = '') => { if (c) console.log(`  ok  ${n}`); else { failures++; console.log(`FAIL  ${n} ${x}`); } };
const keys = () => REGISTRY.visibleTabs().map((t: any) => t.key);
const view = () => ({});

for (const k of ['a', 'b', 'c']) REGISTRY.registerTab({ key: k, strKey: 'tabToday', icon: 'sun', view });
check('built-ins registered in order', keys().join() === 'a,b,c');

let notified = 0; REGISTRY.onChange(() => { notified++; });
const dummy = REGISTRY.registerTab({ key: 'dummy', strGu: 'ડમી', strEn: 'Dummy', icon: 'puzzle', custom: true, view: () => 'dummy-view' });
check('dummy registered and listed last', keys().join() === 'a,b,c,dummy' && dummy.custom === true);
check('view reachable via REGISTRY.views', REGISTRY.views.dummy() === 'dummy-view');
check('registering notifies listeners', notified === 1);

REGISTRY.registerTab({ key: 'dummy', strGu: 'ડમી૨', strEn: 'Dummy2', view });
check('re-registering replaces, not duplicates', keys().filter((k: string) => k === 'dummy').length === 1 && REGISTRY.tabs.find((t: any) => t.key === 'dummy').strEn === 'Dummy2');

REGISTRY.setTabOrder(['dummy', 'c', 'b', 'a']);
check('setTabOrder reorders', keys().join() === 'dummy,c,b,a');
REGISTRY.setTabOrder(['c']);
check('partial order: listed first, rest by default order', keys().join() === 'c,a,b,dummy', keys().join());

check('hide a tab', REGISTRY.setHidden('b', true) === true && !keys().includes('b') && REGISTRY.hiddenTabs().includes('b'));
REGISTRY.setHidden('a', true); REGISTRY.setHidden('c', true);
check('cannot hide the last visible tab', REGISTRY.setHidden('dummy', true) === false && keys().join() === 'dummy');
REGISTRY.resetTabs();
check('resetTabs restores order and visibility', keys().join() === 'a,b,c,dummy' && REGISTRY.hiddenTabs().length === 0);

check('unregisterTab removes tab and view', REGISTRY.unregisterTab('dummy') === true && !keys().includes('dummy') && REGISTRY.views.dummy === undefined);
check('unregistering unknown key is a no-op', REGISTRY.unregisterTab('nope') === false);
let threw = false; try { REGISTRY.registerTab({ key: 'x' }); } catch { threw = true; }
check('registerTab validates its input', threw);
console.log(failures === 0 ? '\nEXTENSIBILITY TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
