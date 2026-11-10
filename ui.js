(() => {
  // Updated by `npm run build`. Source files stay directly executable.
  const build = { version: 'mwarzy4h', files: {"frameworks/Bootstrap.js":"mwapf28l","frameworks/State.js":"mv92v8qg","libraries/ChartJS.js":"mrpzd5nk","libraries/CodeMirror.js":"mwarzxxm","libraries/CodeMirrorCPP.js":"mwarzy0w","libraries/CodeMirrorCSS.js":"mwarzy0w","libraries/CodeMirrorGo.js":"mwarzy35","libraries/CodeMirrorHTML.js":"mwarzy3s","libraries/CodeMirrorJSON.js":"mwarzy0w","libraries/CodeMirrorJava.js":"mwarzy0w","libraries/CodeMirrorJavaScript.js":"mwarzy0w","libraries/CodeMirrorMarkdown.js":"mwarzy4h","libraries/CodeMirrorPlain.js":"mwarzxxz","libraries/CodeMirrorPython.js":"mwarzy0w","libraries/CodeMirrorRust.js":"mwarzy0w","libraries/CodeMirrorSQL.js":"mwarzxyy","libraries/CodeMirrorShell.js":"mwarzxyy","libraries/CodeMirrorTypeScript.js":"mwarzy0w","libraries/CodeMirrorXML.js":"mwarzy35","libraries/CodeMirrorYAML.js":"mwarzy0w","libraries/Markdown.js":"mwarzy37","libraries/SortableJS.js":"mrpzd5nk","utilities/Disposer.js":"mv92v8qg","utilities/DrawerFrame.js":"mvulanoo","utilities/Editor.js":"mv92v8qg","utilities/GraphCanvas.js":"mv92v8qg","utilities/GraphDocument.js":"mv92v8qg","utilities/HTTP.js":"mv92v8qg","utilities/ListDataSource.js":"mvrz6qeo","utilities/MouseMover.js":"mv92v8qg","utilities/SortableAPI.js":"mv92v8qg","utilities/UUID.js":"mv92v8qg","utilities/VirtualScroll.js":"mv92v8qg","components/base/API.js":"mv92v8qg","components/base/ActionBar.js":"mv92v8qg","components/base/ActionSheet.js":"mvulanoo","components/base/AppShell.js":"mvtah4o8","components/base/AutoForm.js":"mvrz6qeo","components/base/Dialog.js":"mvualzow","components/base/Drawer.js":"mvulanoo","components/base/FilterBar.js":"mv92v8qg","components/base/ItemCollection.js":"mvualzow","components/base/List.js":"mvualzow","components/base/Modal.js":"mvualzow","components/base/Nav.js":"mvualzow","components/base/PageHeader.js":"mv92v8qg","components/base/Pagination.js":"mvtayq5s","components/base/Pane.js":"mv92v8qg","components/base/RequestState.js":"mv92v8qg","components/base/Resizer.js":"mv92v8qg","components/base/SidePanel.js":"mv92v8qg","components/base/SplitPane.js":"mvtb3edc","components/base/Toast.js":"mv92v8qg","components/base/View.js":"mv92v8qg","components/data/Calendar.js":"mvualzow","components/data/CardGrid.js":"mv92v8qg","components/data/Chart.js":"mv92v8qg","components/data/DataGrid.js":"mv92v8qg","components/data/ImageViewer.js":"mvualzow","components/data/PagedList.js":"mvt04j3c","components/editor/CodeEditor.js":"mv92v8qg","components/editor/GraphEditor.js":"mv92v8qg","components/editor/Kanban.js":"mvualzow","components/editor/MarkdownViewer.js":"mv92v8qg","components/editor/Mindmap.js":"mv92v8qg","components/editor/Resizer.js":"mt1jtr6w","components/form/ColorPicker.js":"mv92v8qg","components/form/DatePicker.js":"mvualzow","components/form/FileUpload.js":"mvualzow","components/form/IconPicker.js":"mv92v8qg","components/form/RemoteSelect.js":"mvualzow","components/form/ResourcePicker.js":"mvualzow","components/form/StepForm.js":"mvualzow","components/form/TagsInput.js":"mv92v8qg","components/form/TreeSelect.js":"mvualzow"} };
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
    DrawerFrame: { path: 'utilities/DrawerFrame.js' },
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
    Drawer: { path: 'components/base/Drawer.js', needs: ['UUID','Disposer','DrawerFrame'] },
    ActionSheet: { path: 'components/base/ActionSheet.js', needs: ['Drawer'] },
    Dialog: { path: 'components/base/Dialog.js', needs: ['Modal'] },
    FilterBar: { path: 'components/base/FilterBar.js' },
    ItemCollection: { path: 'components/base/ItemCollection.js', needs: ['SortableAPI','Disposer'] },
    List: { path: 'components/base/List.js', needs: ['VirtualScroll','Dialog','Disposer'] },
    Modal: { path: 'components/base/Modal.js', needs: ['Disposer'] },
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
    ResourcePicker: { path: 'components/form/ResourcePicker.js', needs: ["Modal", "PagedList", "Disposer"] },
    TreeSelect: { path: 'components/form/TreeSelect.js', needs: ["List", "ResourcePicker", "Disposer"] },
    FileUpload: { path: 'components/form/FileUpload.js', needs: ["Disposer"] },
    StepForm: { path: 'components/form/StepForm.js', needs: ["Disposer"] },
    ImageViewer: { path: 'components/data/ImageViewer.js', needs: ["Modal", "Disposer"] },
    Calendar: { path: 'components/data/Calendar.js', needs: [] },
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
    "StepForm",
    "FileUpload",
    "TreeSelect",
    "ResourcePicker",
    "ColorPicker",
    "DatePicker",
    "IconPicker",
    "RemoteSelect",
    "TagsInput"
  ],
  "data": [
    "Calendar",
    "ImageViewer",
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
