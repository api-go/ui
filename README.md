# @apigo.cc/ui

[中文文档](README.zh-CN.md) | English

`@apigo.cc/ui` is the build-free UI package for the Apigo browser framework.

Pages load `ui.js` directly from a CDN and explicitly declare required public APIs:

```html
<script src="https://cdn.jsdelivr.net/npm/@apigo.cc/ui@1.0.1/ui.js" components="base,form"></script>
```

`ui.js` always loads every file in `frameworks/` and `utilities/`. The `components` attribute accepts public component names and the `base` and `form` categories; both forms can be mixed.

Load `ui.js` in `<head>` as a normal script. Do not use `async`, `defer`, or `type="module"`: it writes the requested classic scripts into the parser stream so state can scan the complete DOM at `DOMContentLoaded` before first render.

`npm run build` does not bundle source files or create a `dist` directory. It first copies `../state/dist/state.js` and `../bootstrap/dist/bootstrap.js` into `frameworks/`, then writes their source-file modification-time cache versions into `ui.js` and produces adjacent `.min.js` files. Loading `ui.min.js` automatically loads the matching minified framework, utility, and component files. The UI package version remains independent of its framework packages.

For AI-oriented API documentation, start with [AI.yaml](AI.yaml).
