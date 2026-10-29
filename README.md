# @apigo.cc/ui

[中文文档](README.zh-CN.md) | English

`@apigo.cc/ui` is the build-free UI package for the Apigo browser framework.

Pages load `ui.js` directly from a CDN and explicitly declare required public APIs:

```html
<script src="https://cdn.jsdelivr.net/npm/@apigo.cc/ui@1.0.10/ui.js" components="base,form"></script>
```

`ui.js` always loads the framework and core utilities. Specialized utilities and embedded libraries are resolved automatically from component dependencies. The `components` attribute accepts public component names and the `base`, `form`, `data`, and `editor` categories; both forms can be mixed.

Load `ui.js` in `<head>` as a normal script. Do not use `async`, `defer`, or `type="module"`: it writes the requested classic scripts into the parser stream so state can scan the complete DOM at `DOMContentLoaded` before first render.

`npm run build` does not create a `dist` directory. It builds the browser-ready CodeMirror core, on-demand language bundles, and the sanitized Markdown renderer, preserves the checked-in, verified framework snapshots in `frameworks/`, writes source-file modification-time cache versions into `ui.js`, and produces adjacent `.min.js` files. Loading `ui.min.js` automatically loads the matching minified framework, library, utility, and component files. The UI package version remains independent of its framework packages.

`MarkdownViewer` renders a Markdown string directly. `CodeEditor` supports JavaScript, JSON, YAML, Python, HTML, CSS, SQL, and Markdown; `.md` and `.html` documents can switch between source, split, and preview modes. HTML preview scripts are opt-in and run in a sandboxed iframe without same-origin permission.

For AI-assisted development, give the agent this single entry URL: [https://apigo.cc/web/ui/ai/llms.txt](https://apigo.cc/web/ui/ai/llms.txt). It is a task-oriented index: the agent reads it first, then opens only the linked framework, utility, and component documents required by the current task. The repository copy is [llms.txt](llms.txt).


Start with [llms.txt](llms.txt), choose a page type and open [the template gallery](templates/index.html). New layout and toolbar components inherit global ui-sm/ui-lg. AutoForm supports responsive whole-form and grouped columns. Ordinary builds retain framework snapshots so validated Hash/binding fixes cannot be silently replaced by an older sibling build. Use `npm run sync:frameworks` only when deliberately importing freshly validated sibling State/Bootstrap bundles. Run `npm test` for public YAML density contracts, `npm run test:legacy` for historical HTML cases, and use the in-app browser for interactive package acceptance. See [Component-Testing.md](Component-Testing.md).

PagedList provides lightweight list/card views, schema filters, selection slots and an independent Pagination connected through ListDataSource. Use ui-link for shared link buttons and underlined controls; ui-toolbar standardizes density-aware spacing. AutoForm validates the complete draft asynchronously and reveals field errors before saving.

See [UI design SOP](Interface-Design.md) and the three runnable systems in [templates](templates/index.html): admin layouts share business Views; mobile navigation adapts across bottom/rail/sidebar; desktop uses a resizable resource list and a narrow drawer. Theme declarations use static `dark light` meta and shared data-bs-theme CSS.
