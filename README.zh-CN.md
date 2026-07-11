# @apigo.cc/ui

[English](README.md) | 中文

`@apigo.cc/ui` 是不需要生产构建的原生 JavaScript UI 组件库。页面使用一个 `ui.js` 入口，并且每个页面都显式写出使用的组件：

```html
<script src="https://cdn.jsdelivr.net/npm/@apigo.cc/ui@1.0.0/ui.js" components="API,AutoForm,List,DataTable"></script>
```

`ui.js` 默认加载 `frameworks/` 和底层 `utilities/`。`components` 中只填写页面直接使用的公开组件名，例如 `components="List,AutoForm,Resizer"`；组件依赖会自动加载，不需要填写 state、bootstrap、HTTP、VirtualScroll 或 MouseMover。

必须把脚本放在 `<head>`，并使用普通 `<script>`。不要使用 `async`、`defer` 或 `type="module"`，这样 state 才能在 DOMContentLoaded 前完成组件注册，并对完整页面执行首次扫描。

AI 使用说明从 [AI.yaml](AI.yaml) 开始；文档与源码同目录，组件示例直接写在对应 YAML 中。

`npm run build` 不会打包源码，也不会生成 `dist`。它会更新发布版本、把各源码文件的修改时间版本写入 `ui.js`，并在源码旁生成 `.min.js`。加载 `ui.min.js` 时，入口会自动改为加载对应的 framework、utility 和 component 的 `.min.js`。
