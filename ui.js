(() => {
  // Updated by `npm run build`. Source files stay directly executable.
  const build = { version: '1.0.0', files: {"frameworks/Bootstrap.js":"mrgoatzb","frameworks/State.js":"mrgokg8d","utilities/HTTP.js":"mrg6t8zm","utilities/MouseMover.js":"mrg6t8zm","utilities/VirtualScroll.js":"mrg6t8zn","components/API.js":"mrggjm8m","components/AutoForm.js":"mrgoatz5","components/Dialog.js":"mrggjm8m","components/List.js":"mrge46xl","components/Modal.js":"mrg6uq6a","components/Nav.js":"mrg6uq7g","components/Resizer.js":"mrghfzrh","components/Toast.js":"mrghiycy","components/form/ColorPicker.js":"mrgn837c","components/form/DatePicker.js":"mrgn837c","components/form/IconPicker.js":"mrgoatz5","components/form/TagsInput.js":"mrgn837b"} };
  const script = document.currentScript;
  if (!script || document.readyState !== 'loading') {
    throw new Error('ui.js must be loaded by a normal <script> while the document is parsing');
  }
  const requested = (script?.getAttribute('components') || '')
    .split(',')
    .map(name => name.trim())
    .filter(Boolean);

  const modules = {
    HTTP: { path: 'utilities/HTTP.js' },
    VirtualScroll: { path: 'utilities/VirtualScroll.js' },
    MouseMover: { path: 'utilities/MouseMover.js' },
    API: { path: 'components/API.js', needs: ['Toast'] },
    AutoForm: { path: 'components/AutoForm.js', needs: ['Toast'] },
    List: { path: 'components/List.js', needs: ['VirtualScroll'] },
    Modal: { path: 'components/Modal.js' },
    Dialog: { path: 'components/Dialog.js', needs: ['Modal'] },
    Toast: { path: 'components/Toast.js' },
    Nav: { path: 'components/Nav.js' },
    Resizer: { path: 'components/Resizer.js' },
    DatePicker: { path: 'components/form/DatePicker.js', needs: ['AutoForm'] },
    ColorPicker: { path: 'components/form/ColorPicker.js', needs: ['AutoForm'] },
    IconPicker: { path: 'components/form/IconPicker.js', needs: ['AutoForm'] },
    TagsInput: { path: 'components/form/TagsInput.js', needs: ['AutoForm'] }
  };

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
    const mod = modules[name] || { path: 'components/' + name.split('.').join('/') + '.js' }
    ;(mod.needs || []).forEach(load)
    writeScript(mod.path)
  }
  requested.forEach(load)
})();
