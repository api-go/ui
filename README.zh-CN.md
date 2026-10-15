# @apigo.cc/ui

[English](README.md) | 中文

`@apigo.cc/ui` 是不需要生产构建的原生 JavaScript UI 组件库。页面使用一个 `ui.js` 入口，并且每个页面都显式写出使用的组件：

```html
<script src="https://cdn.jsdelivr.net/npm/@apigo.cc/ui@1.0.10/ui.js" components="base,form"></script>
```

`ui.js` 默认加载框架和兼容性核心 utilities；专用 utilities 与内嵌 libraries 会根据组件依赖自动加载。`components` 中只填写页面直接使用的公开组件名，例如 `components="List,Chart,Kanban"`；组件依赖会自动加载，不需要主动声明底层模块。

必须把脚本放在 `<head>`，并使用普通 `<script>`。不要使用 `async`、`defer` 或 `type="module"`，这样 state 才能在 DOMContentLoaded 前完成组件注册，并对完整页面执行首次扫描。

AI 辅助开发时，只需把统一入口 [https://apigo.cc/web/ui/ai/llms.txt](https://apigo.cc/web/ui/ai/llms.txt) 交给 AI。它会先读取这份按任务加载的索引，再只读取当前任务需要的 framework、utility 和 component YAML。仓库内入口文件为 [llms.txt](llms.txt)；文档与源码同目录，组件示例直接写在对应 YAML 中。

`npm run build` 不会生成 `dist`。它会构建 CodeMirror 浏览器核心、可按需加载的语言包和安全 Markdown 渲染器，保留 `frameworks/` 中经过验证的运行时快照，再把所有源码文件的最后修改时间缓存版本写入 `ui.js`，并在源码旁生成 `.min.js`。加载 `ui.min.js` 时，入口会自动改为加载对应的 framework、library、utility 和 component 的 `.min.js`。UI 包的版本独立于前置框架包。

`MarkdownViewer` 直接把 Markdown 字符串渲染为文档。`CodeEditor` 支持 JavaScript、JSON、YAML、Python、HTML、CSS、SQL 和 Markdown；`.md` 与 `.html` 文档可切换源码、分屏和预览模式。HTML 预览脚本需要显式开启，并在不具备同源权限的沙箱 iframe 中运行。


先读 [llms.txt](llms.txt)，选择界面类型，再打开[模板库](templates/index.html)。新增布局与工具栏组件继承 ui-sm/ui-lg；AutoForm 支持整体和分组响应式多列。普通构建保留已验证的框架快照，避免 Hash、绑定等修复被兄弟项目的旧产物覆盖。仅在主动导入已验证的 State/Bootstrap 产物时运行 `npm run sync:frameworks`。`npm test` 运行公开 YAML 密度契约，`npm run test:legacy` 保留历史 HTML 回归，并须使用内置浏览器交互验收。详见 [Component-Testing.md](Component-Testing.md)。
