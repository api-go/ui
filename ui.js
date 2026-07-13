(() => {
  // Updated by `npm run build`. Source files stay directly executable.
  const build = { version: 'mrjbct5d', files: {"frameworks/Bootstrap.js":"mrjbct5d","frameworks/State.js":"mrjbct5d","utilities/HTTP.js":"mrg6t8zm","utilities/MouseMover.js":"mrg6t8zm","utilities/VirtualScroll.js":"mrg6t8zn","components/base/API.js":"mrj8lfwz","components/base/AutoForm.js":"mrj10yku","components/base/Dialog.js":"mrh7tjfb","components/base/List.js":"mrge46xl","components/base/Modal.js":"mrj1zcg3","components/base/Nav.js":"mrj6haqp","components/base/Resizer.js":"mrghfzrh","components/base/Toast.js":"mrghiycy","components/data/DataGrid.js":"mrj8lxpb","components/form/ColorPicker.js":"mrgn837c","components/form/DatePicker.js":"mrgn837c","components/form/IconPicker.js":"mrgoatz5","components/form/TagsInput.js":"mrgn837b"} };
  const script = document.currentScript;
  if (!script || document.readyState !== 'loading') {
    throw new Error('ui.js must be loaded by a normal <script> while the document is parsing');
  }
  const requestedNames = (script?.getAttribute('components') || '')
    .split(',')
    .map(name => name.trim())
    .filter(Boolean);

  const modules = {
    HTTP: { path: 'utilities/HTTP.js' },
    VirtualScroll: { path: 'utilities/VirtualScroll.js' },
    MouseMover: { path: 'utilities/MouseMover.js' },
    API: { path: 'components/base/API.js', needs: ['Toast'] },
    AutoForm: { path: 'components/base/AutoForm.js', needs: ['Toast'] },
    List: { path: 'components/base/List.js', needs: ['VirtualScroll'] },
    Modal: { path: 'components/base/Modal.js' },
    Dialog: { path: 'components/base/Dialog.js', needs: ['Modal'] },
    Toast: { path: 'components/base/Toast.js' },
    Nav: { path: 'components/base/Nav.js' },
    Resizer: { path: 'components/base/Resizer.js' },
    DataGrid: { path: 'components/data/DataGrid.js', needs: ['AutoForm', 'Dialog', 'Resizer', 'DatePicker', 'ColorPicker', 'IconPicker', 'TagsInput'] },
    DatePicker: { path: 'components/form/DatePicker.js', needs: ['AutoForm'] },
    ColorPicker: { path: 'components/form/ColorPicker.js', needs: ['AutoForm'] },
    IconPicker: { path: 'components/form/IconPicker.js', needs: ['AutoForm'] },
    TagsInput: { path: 'components/form/TagsInput.js', needs: ['AutoForm'] }
  };

  const groups = {
    base: ['API', 'AutoForm', 'List', 'Modal', 'Dialog', 'Toast', 'Nav', 'Resizer'],
    form: ['DatePicker', 'ColorPicker', 'IconPicker', 'TagsInput'],
    data: ['DataGrid']
  };
  const qualified = Object.fromEntries(Object.entries(groups).flatMap(([group, names]) => names.map(name => [`${group}.${name}`, name])));
  const requested = requestedNames.flatMap(name => groups[name] || [qualified[name] || name]);

  if (!script.hasAttribute('components')) throw new Error('ui.js requires components="..."');

  const base = new URL('.', script.src);
  const minified = /(?:^|\/)ui\.min\.js$/.test(new URL(script.src).pathname);
  const sourceUrl = path => {
    const sourcePath = minified ? path.replace(/\.js$/, '.min.js') : path;
    const url = new URL(sourcePath, base);
    const version = build.files[path];
    if (version) url.searchParams.set('v', version);
    return url.href;
  };
  const writeScript = path => document.write(`<script src="${sourceUrl(path)}"><\/script>`);
  // Frameworks and utilities are always available to every component.
  if (!globalThis.Component) writeScript('frameworks/State.js');
  if (!globalThis.bootstrap) writeScript('frameworks/Bootstrap.js');
  ['HTTP', 'VirtualScroll', 'MouseMover']
    .forEach(name => writeScript(modules[name].path));
  const loaded = new Set(['HTTP', 'VirtualScroll', 'MouseMover'])
  const load = name => {
    if (loaded.has(name)) return
    loaded.add(name)
    const mod = modules[name]
    if (!mod) throw new Error(`Unknown UI component: ${name}`)
    ;(mod.needs || []).forEach(load)
    writeScript(mod.path)
  }
  requested.forEach(load)
})();
