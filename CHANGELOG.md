# Changelog

## 未发布

- **新增**: View 组件支持按需加载 HTML 片段、嵌套相对路径以及一次性脚本和样式初始化。

## [v1.0.3] - 2026-08-14

- **编辑器**: CodeEditor、Kanban、Mindmap 与 GraphEditor 默认不占用内部工具栏，通过统一的 `getTools()`、`runTool()` 和 `toolschange` API 交由宿主页面合并呈现。
- **修复**: 同步 State v1.0.26，条件分支内的组件重新挂载时会完整初始化，解决编辑器切换后偶发空白。
- **列表**: List 支持由数据字段动态选择图标；DataGrid 与 List 的排序交互和紧凑布局得到统一。

## [v1.0.2] - 2026-08-13

- **新增**: DataGrid 固定列、行排序、表单式行编辑、系统字段与响应式工具栏。
- **修复**: 水平滚动布局、字段宽度、拖拽反馈、布尔列交互和弹窗状态。
- **编辑器**: 增加 MarkdownViewer，并完善 CodeEditor Markdown/HTML 预览能力。

## [v1.0.1] - 2026-07-13

- **新增**:
  - DataGrid 支持数据 API 自动加载、安全 filter/sort 查询、服务端保存和高级系统字段模式。
  - AutoForm 支持数据库字段描述、只读 label 与 divider 类型。
  - API 根据请求 data 自动选择 POST，Nav 明确动作事件语义。
- **修复**:
  - Select 初始值、异步 DataGrid 数据绑定与 Modal 长内容滚动。
