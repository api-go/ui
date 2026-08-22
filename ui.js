(() => {
  // Updated by `npm run build`. Source files stay directly executable.
  const build = { version: 'mt487rls', files: {"frameworks/Bootstrap.js":"mt487rls","frameworks/State.js":"mt487rlr","libraries/ChartJS.js":"mt1ous60","libraries/CodeMirror.js":"mt487rfu","libraries/CodeMirrorCSS.js":"mt487rjz","libraries/CodeMirrorHTML.js":"mt487rkm","libraries/CodeMirrorJSON.js":"mt487rjz","libraries/CodeMirrorJavaScript.js":"mt487rjz","libraries/CodeMirrorMarkdown.js":"mt487rlr","libraries/CodeMirrorPython.js":"mt487rjz","libraries/CodeMirrorYAML.js":"mt487rjz","libraries/Markdown.js":"mt487rjy","libraries/SortableJS.js":"mt1ous60","utilities/Disposer.js":"mt1ous60","utilities/Editor.js":"mt1ous60","utilities/GraphCanvas.js":"mt1ous60","utilities/GraphDocument.js":"mt1ous60","utilities/HTTP.js":"mt1ous60","utilities/MouseMover.js":"mt1ous60","utilities/SortableAPI.js":"mt1ous60","utilities/VirtualScroll.js":"mt1ous60","components/base/API.js":"mt1ous60","components/base/AutoForm.js":"mt487qul","components/base/Dialog.js":"mt1ous60","components/base/List.js":"mt487quo","components/base/Modal.js":"mt1ous60","components/base/Nav.js":"mt1ous60","components/base/Resizer.js":"mt1ous60","components/base/Toast.js":"mt1ous60","components/base/View.js":"mt1ous60","components/data/Chart.js":"mt1ous60","components/data/DataGrid.js":"mt1ous60","components/editor/CodeEditor.js":"mt487quv","components/editor/DataGrid.js":"mt1ous60","components/editor/GraphEditor.js":"mt1ous60","components/editor/Kanban.js":"mt1ous60","components/editor/MarkdownViewer.js":"mt1ous60","components/editor/Mindmap.js":"mt1ous60","components/editor/Resizer.js":"mt1ous60","components/form/ColorPicker.js":"mt1ous60","components/form/DatePicker.js":"mt1ous60","components/form/IconPicker.js":"mt1ous60","components/form/TagsInput.js":"mt1ous60"} };
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
    Markdown: { path: 'libraries/Markdown.js' },
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
    View: { path: 'components/base/View.js' },
    DataGrid: { path: 'components/data/DataGrid.js', needs: ['AutoForm', 'Dialog', 'Resizer', 'DatePicker', 'ColorPicker', 'IconPicker', 'TagsInput'] },
    Chart: { path: 'components/data/Chart.js', needs: ['ChartJS', 'Disposer'] },
    Kanban: { path: 'components/editor/Kanban.js', needs: ['Editor', 'SortableAPI', 'Disposer', 'AutoForm', 'Modal', 'Dialog'] },
    Mindmap: { path: 'components/editor/Mindmap.js', needs: ['Editor', 'GraphDocument', 'GraphCanvas', 'Disposer', 'AutoForm', 'Modal', 'Dialog'] },
    GraphEditor: { path: 'components/editor/GraphEditor.js', needs: ['Editor', 'GraphDocument', 'GraphCanvas', 'Disposer', 'AutoForm', 'Modal', 'Dialog'] },
    CodeEditor: { path: 'components/editor/CodeEditor.js', needs: ['CodeMirror', 'Editor', 'Disposer', 'AutoForm'] },
    MarkdownViewer: { path: 'components/editor/MarkdownViewer.js', needs: ['Markdown', 'Disposer'] },
    DatePicker: { path: 'components/form/DatePicker.js', needs: ['AutoForm'] },
    ColorPicker: { path: 'components/form/ColorPicker.js', needs: ['AutoForm'] },
    IconPicker: { path: 'components/form/IconPicker.js', needs: ['AutoForm'] },
    TagsInput: { path: 'components/form/TagsInput.js', needs: ['AutoForm'] }
  };

  const groups = {
    base: ['API', 'AutoForm', 'List', 'Modal', 'Dialog', 'Toast', 'Nav', 'Resizer', 'View'],
    form: ['DatePicker', 'ColorPicker', 'IconPicker', 'TagsInput'],
    data: ['DataGrid', 'Chart'],
    editor: ['Kanban', 'Mindmap', 'GraphEditor', 'CodeEditor', 'MarkdownViewer']
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
  const loadingAssets = new Map();
  const loadAsset = path => {
    if (loadingAssets.has(path)) return loadingAssets.get(path);
    const task = new Promise((resolve, reject) => {
      const asset = document.createElement('script');
      asset.src = sourceUrl(path);
      asset.onload = () => resolve(asset);
      asset.onerror = () => reject(new Error(`Failed to load UI asset: ${path}`));
      document.head.appendChild(asset);
    }).catch(error => { loadingAssets.delete(path); throw error; });
    loadingAssets.set(path, task);
    return task;
  };
  globalThis.__ApigoUIRuntime = { sourceUrl, loadAsset };
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
