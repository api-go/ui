(() => {
  // Updated by `npm run build`. Source files stay directly executable.
  const build = { version: 'mvtbwh5y', files: {"frameworks/Bootstrap.js":"mvtbklv0","frameworks/State.js":"mv92v90i","libraries/ChartJS.js":"mrpzd5nk","libraries/CodeMirror.js":"mvtbwgz9","libraries/CodeMirrorCPP.js":"mvtbwh2e","libraries/CodeMirrorCSS.js":"mvtbwh4k","libraries/CodeMirrorGo.js":"mvtbwh2e","libraries/CodeMirrorHTML.js":"mvtbwh58","libraries/CodeMirrorJSON.js":"mvtbwh2d","libraries/CodeMirrorJava.js":"mvtbwh4k","libraries/CodeMirrorJavaScript.js":"mvtbwh2e","libraries/CodeMirrorMarkdown.js":"mvtbwh5y","libraries/CodeMirrorPlain.js":"mvtbwgzl","libraries/CodeMirrorPython.js":"mvtbwh4k","libraries/CodeMirrorRust.js":"mvtbwh4k","libraries/CodeMirrorSQL.js":"mvtbwh0i","libraries/CodeMirrorShell.js":"mvtbwh0i","libraries/CodeMirrorTypeScript.js":"mvtbwh2f","libraries/CodeMirrorXML.js":"mvtbwh2e","libraries/CodeMirrorYAML.js":"mvtbwh2e","libraries/Markdown.js":"mvtbwh4l","libraries/SortableJS.js":"mrpzd5nk","utilities/Disposer.js":"mv92v90c","utilities/Editor.js":"mv92v90d","utilities/GraphCanvas.js":"mv92v90d","utilities/GraphDocument.js":"mv92v90d","utilities/HTTP.js":"mv92v90e","utilities/ListDataSource.js":"mvrz6r0d","utilities/MouseMover.js":"mv92v90e","utilities/SortableAPI.js":"mv92v90e","utilities/UUID.js":"mv92v90e","utilities/VirtualScroll.js":"mv92v90e","components/base/API.js":"mv92v8zx","components/base/ActionBar.js":"mv92v8zy","components/base/AppShell.js":"mvtah4q7","components/base/AutoForm.js":"mvrz6qy6","components/base/Dialog.js":"mv92v8zz","components/base/FilterBar.js":"mv92v900","components/base/ItemCollection.js":"mv92v900","components/base/List.js":"mv9ar9ds","components/base/Modal.js":"mv92v901","components/base/Nav.js":"mvtbwgdj","components/base/PageHeader.js":"mv92v902","components/base/Pagination.js":"mvtayqbd","components/base/Pane.js":"mv92v902","components/base/RequestState.js":"mv92v902","components/base/Resizer.js":"mv92v903","components/base/SidePanel.js":"mv92v903","components/base/SplitPane.js":"mvtb3eey","components/base/Toast.js":"mv92v904","components/base/View.js":"mv92v905","components/data/CardGrid.js":"mv92v905","components/data/Chart.js":"mv92v906","components/data/DataGrid.js":"mv92v907","components/data/PagedList.js":"mvt04ji6","components/editor/CodeEditor.js":"mv92v908","components/editor/GraphEditor.js":"mv92v908","components/editor/Kanban.js":"mv92v909","components/editor/MarkdownViewer.js":"mv92v909","components/editor/Mindmap.js":"mv92v90a","components/editor/Resizer.js":"mt1jtr6w","components/form/ColorPicker.js":"mv92v90a","components/form/DatePicker.js":"mv92v90b","components/form/IconPicker.js":"mv92v90b","components/form/RemoteSelect.js":"mv92v90c","components/form/TagsInput.js":"mv92v90c"} };
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
    ListDataSource: { path: 'utilities/ListDataSource.js' },
    Disposer: { path: 'utilities/Disposer.js' },
    Editor: { path: 'utilities/Editor.js', needs: ['HTTP'] },
    GraphCanvas: { path: 'utilities/GraphCanvas.js' },
    GraphDocument: { path: 'utilities/GraphDocument.js' },
    HTTP: { path: 'utilities/HTTP.js' },
    SortableAPI: { path: 'utilities/SortableAPI.js', needs: ['SortableJS'] },
    UUID: { path: 'utilities/UUID.js' },
    VirtualScroll: { path: 'utilities/VirtualScroll.js' },
    API: { path: 'components/base/API.js', needs: ['Toast'] },
    ActionBar: { path: 'components/base/ActionBar.js' },
    AppShell: { path: 'components/base/AppShell.js', needs: ['Disposer','SplitPane'] },
    AutoForm: { path: 'components/base/AutoForm.js', needs: ['Toast','UUID','Disposer'] },
    Dialog: { path: 'components/base/Dialog.js', needs: ['Modal'] },
    FilterBar: { path: 'components/base/FilterBar.js' },
    ItemCollection: { path: 'components/base/ItemCollection.js', needs: ['SortableAPI'] },
    List: { path: 'components/base/List.js', needs: ['VirtualScroll','Dialog','Disposer'] },
    Modal: { path: 'components/base/Modal.js' },
    Nav: { path: 'components/base/Nav.js', needs: ['Dialog','Disposer'] },
    PageHeader: { path: 'components/base/PageHeader.js' },
    Pagination: { path: 'components/base/Pagination.js', needs: ['Disposer'] },
    Pane: { path: 'components/base/Pane.js' },
    RequestState: { path: 'components/base/RequestState.js' },
    MouseMover: { path: 'utilities/MouseMover.js' },
    Resizer: { path: 'components/base/Resizer.js', needs: ['MouseMover'] },
    SidePanel: { path: 'components/base/SidePanel.js', needs: ['UUID','Disposer'] },
    SplitPane: { path: 'components/base/SplitPane.js', needs: ['Resizer','Disposer','UUID'] },
    Toast: { path: 'components/base/Toast.js', needs: ['Disposer'] },
    View: { path: 'components/base/View.js' },
    PagedList: { path: 'components/data/PagedList.js', needs: ['ListDataSource','Pagination','RequestState','Disposer'] },
    CardGrid: { path: 'components/data/CardGrid.js', needs: ['AutoForm','Modal','Dialog','RemoteSelect'] },
    Chart: { path: 'components/data/Chart.js', needs: ['ChartJS','Disposer'] },
    DBTypeInput: { path: 'components/data/DataGrid.js', needs: ['DataGrid'] },
    DataGrid: { path: 'components/data/DataGrid.js', needs: ['VirtualScroll','AutoForm','Dialog','Resizer','DatePicker','ColorPicker','IconPicker','TagsInput'] },
    CodeEditor: { path: 'components/editor/CodeEditor.js', needs: ['CodeMirror','Editor','Disposer','AutoForm'] },
    GraphEditor: { path: 'components/editor/GraphEditor.js', needs: ['MouseMover','Editor','GraphDocument','GraphCanvas','Disposer','AutoForm','Modal','Dialog'] },
    Kanban: { path: 'components/editor/Kanban.js', needs: ['Editor','SortableAPI','Disposer','AutoForm','Modal','Dialog'] },
    MarkdownViewer: { path: 'components/editor/MarkdownViewer.js', needs: ['Markdown','Disposer'] },
    Mindmap: { path: 'components/editor/Mindmap.js', needs: ['MouseMover','Editor','GraphDocument','GraphCanvas','Disposer','AutoForm','Modal','Dialog'] },
    ColorPicker: { path: 'components/form/ColorPicker.js', needs: ['AutoForm'] },
    DatePicker: { path: 'components/form/DatePicker.js', needs: ['AutoForm'] },
    IconPicker: { path: 'components/form/IconPicker.js', needs: ['AutoForm'] },
    RemoteSelect: { path: 'components/form/RemoteSelect.js', needs: ['HTTP','Toast','Disposer'] },
    TagsInput: { path: 'components/form/TagsInput.js', needs: ['AutoForm'] }
  };

  const groups = {
  "base": [
    "API",
    "ActionBar",
    "AppShell",
    "AutoForm",
    "Dialog",
    "FilterBar",
    "ItemCollection",
    "List",
    "Modal",
    "Nav",
    "PageHeader",
    "Pagination",
    "Pane",
    "RequestState",
    "Resizer",
    "SidePanel",
    "SplitPane",
    "Toast",
    "View"
  ],
  "form": [
    "ColorPicker",
    "DatePicker",
    "IconPicker",
    "RemoteSelect",
    "TagsInput"
  ],
  "data": [
    "PagedList",
    "CardGrid",
    "Chart",
    "DBTypeInput",
    "DataGrid"
  ],
  "editor": [
    "CodeEditor",
    "GraphEditor",
    "Kanban",
    "MarkdownViewer",
    "Mindmap"
  ]
};
  const qualified = Object.fromEntries(Object.entries(groups).flatMap(([group, names]) => names.map(name => [`${group}.${name}`, name])));
  const requested = requestedNames.flatMap(name => groups[name] || [qualified[name] || name]);

  if (!script.hasAttribute('components')) throw new Error('ui.js requires components="..."');

  const base = new URL('.', script.src);
  const autoVersion = new URL(script.src).searchParams.get('autoversion') === '1';
  const minified = /(?:^|\/)ui\.min\.js$/.test(new URL(script.src).pathname);
  const sourceUrl = path => {
    const sourcePath = minified ? path.replace(/\.js$/, '.min.js') : path;
    const url = new URL(sourcePath, base);
    const version = build.files[path];
    if (version && !autoVersion) url.searchParams.set('v', version);
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
  const written = new Set();
  const writeScript = path => { if(written.has(path))return;written.add(path);document.write(`<script src="${sourceUrl(path)}"><\/script>`); };
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
