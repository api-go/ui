(() => {
  // Updated by `npm run build`. Source files stay directly executable.
  const build = { version: 'mrr2a9yk', files: {"frameworks/Bootstrap.js":"mrr2a9yk","frameworks/State.js":"mrr2a9yk","libraries/ChartJS.js":"mrpzd5sa","libraries/CodeMirror.js":"mrr2a9wt","libraries/CodeMirrorCSS.js":"mrr2a9xz","libraries/CodeMirrorHTML.js":"mrr2a9yj","libraries/CodeMirrorJSON.js":"mrr2a9xz","libraries/CodeMirrorJavaScript.js":"mrr2a9xz","libraries/CodeMirrorPython.js":"mrr2a9y0","libraries/CodeMirrorYAML.js":"mrr2a9xz","libraries/SortableJS.js":"mrpzd5sd","utilities/Disposer.js":"mrq2ulte","utilities/Editor.js":"mrq6k3ck","utilities/GraphCanvas.js":"mrq29nba","utilities/GraphDocument.js":"mrq07eih","utilities/HTTP.js":"mrg6t8zm","utilities/MouseMover.js":"mrg6t8zm","utilities/SortableAPI.js":"mrpzifgt","utilities/VirtualScroll.js":"mrg6t8zn","components/base/API.js":"mrj8lfwz","components/base/AutoForm.js":"mrj10yku","components/base/Dialog.js":"mrq52jn2","components/base/List.js":"mrge46xl","components/base/Modal.js":"mrj1zcg3","components/base/Nav.js":"mrj6haqp","components/base/Resizer.js":"mrghfzrh","components/base/Toast.js":"mrghiycy","components/data/Chart.js":"mrq2ulte","components/data/DataGrid.js":"mrj8lxpb","components/editor/CodeEditor.js":"mrr2a0tc","components/editor/GraphEditor.js":"mrq583td","components/editor/Kanban.js":"mrq583td","components/editor/Mindmap.js":"mrq583td","components/form/ColorPicker.js":"mrgn837c","components/form/DatePicker.js":"mrgn837c","components/form/IconPicker.js":"mrgoatz5","components/form/TagsInput.js":"mrgn837b"} };
  const script = document.currentScript;
  if (!script || document.readyState !== 'loading') {
    throw new Error('ui.js must be loaded by a normal <script> while the document is parsing');
  }
  const requestedNames = (script?.getAttribute('components') || '')
    .split(',')
    .map(name => name.trim())
    .filter(Boolean);

  const modules = {
    ChartJS: { path: 'libraries/ChartJS.js' },
    SortableJS: { path: 'libraries/SortableJS.js' },
    CodeMirror: { path: 'libraries/CodeMirror.js' },
    HTTP: { path: 'utilities/HTTP.js' },
    VirtualScroll: { path: 'utilities/VirtualScroll.js' },
    MouseMover: { path: 'utilities/MouseMover.js' },
    Disposer: { path: 'utilities/Disposer.js' },
    Editor: { path: 'utilities/Editor.js', needs: ['HTTP'] },
    SortableAPI: { path: 'utilities/SortableAPI.js', needs: ['SortableJS'] },
    GraphDocument: { path: 'utilities/GraphDocument.js' },
    GraphCanvas: { path: 'utilities/GraphCanvas.js' },
    API: { path: 'components/base/API.js', needs: ['Toast'] },
    AutoForm: { path: 'components/base/AutoForm.js', needs: ['Toast'] },
    List: { path: 'components/base/List.js', needs: ['VirtualScroll'] },
    Modal: { path: 'components/base/Modal.js' },
    Dialog: { path: 'components/base/Dialog.js', needs: ['Modal'] },
    Toast: { path: 'components/base/Toast.js' },
    Nav: { path: 'components/base/Nav.js' },
    Resizer: { path: 'components/base/Resizer.js' },
    DataGrid: { path: 'components/data/DataGrid.js', needs: ['AutoForm', 'Dialog', 'Resizer', 'DatePicker', 'ColorPicker', 'IconPicker', 'TagsInput'] },
    Chart: { path: 'components/data/Chart.js', needs: ['ChartJS', 'Disposer'] },
    Kanban: { path: 'components/editor/Kanban.js', needs: ['Editor', 'SortableAPI', 'Disposer', 'AutoForm', 'Modal', 'Dialog'] },
    Mindmap: { path: 'components/editor/Mindmap.js', needs: ['Editor', 'GraphDocument', 'GraphCanvas', 'Disposer', 'AutoForm', 'Modal', 'Dialog'] },
    GraphEditor: { path: 'components/editor/GraphEditor.js', needs: ['Editor', 'GraphDocument', 'GraphCanvas', 'Disposer', 'AutoForm', 'Modal', 'Dialog'] },
    CodeEditor: { path: 'components/editor/CodeEditor.js', needs: ['CodeMirror', 'Editor', 'Disposer', 'AutoForm'] },
    DatePicker: { path: 'components/form/DatePicker.js', needs: ['AutoForm'] },
    ColorPicker: { path: 'components/form/ColorPicker.js', needs: ['AutoForm'] },
    IconPicker: { path: 'components/form/IconPicker.js', needs: ['AutoForm'] },
    TagsInput: { path: 'components/form/TagsInput.js', needs: ['AutoForm'] }
  };

  const groups = {
    base: ['API', 'AutoForm', 'List', 'Modal', 'Dialog', 'Toast', 'Nav', 'Resizer'],
    form: ['DatePicker', 'ColorPicker', 'IconPicker', 'TagsInput'],
    data: ['DataGrid', 'Chart'],
    editor: ['Kanban', 'Mindmap', 'GraphEditor', 'CodeEditor']
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
  // Frameworks and compatibility utilities are unconditional; specialized dependencies are resolved below.
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
