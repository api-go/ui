# @apigo.cc/ui

[中文文档](README.zh-CN.md) | English

`@apigo.cc/ui` is the build-free UI package for the Apigo browser framework.

Pages load `ui.js` directly from a CDN and explicitly declare required public APIs:

```html
<script src="https://cdn.jsdelivr.net/npm/@apigo.cc/ui@1.0.9/ui.js" components="base,form"></script>
```

`ui.js` always loads the framework and core utilities. Specialized utilities and embedded libraries are resolved automatically from component dependencies. The `components` attribute accepts public component names and the `base`, `form`, `data`, and `editor` categories; both forms can be mixed.

Load `ui.js` in `<head>` as a normal script. Do not use `async`, `defer`, or `type="module"`: it writes the requested classic scripts into the parser stream so state can scan the complete DOM at `DOMContentLoaded` before first render.

`npm run build` does not create a `dist` directory. It builds the browser-ready CodeMirror core, on-demand language bundles, and the sanitized Markdown renderer, copies `../state/dist/state.js` and `../bootstrap/dist/bootstrap.js` into `frameworks/`, writes source-file modification-time cache versions into `ui.js`, and produces adjacent `.min.js` files. Loading `ui.min.js` automatically loads the matching minified framework, library, utility, and component files. The UI package version remains independent of its framework packages.

`MarkdownViewer` renders a Markdown string directly. `CodeEditor` supports JavaScript, JSON, YAML, Python, HTML, CSS, and Markdown; `.md` and `.html` documents can switch between source, split, and preview modes. HTML preview scripts are opt-in and run in a sandboxed iframe without same-origin permission.

For AI-assisted development, give the agent this single entry URL: [https://apigo.cc/web/ui/ai/llms.txt](https://apigo.cc/web/ui/ai/llms.txt). It is a task-oriented index: the agent reads it first, then opens only the linked framework, utility, and component documents required by the current task. The repository copy is [llms.txt](llms.txt).
