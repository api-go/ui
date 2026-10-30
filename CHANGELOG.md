# Changelog

## Unreleased — 2026-10-30

- 新增交互式场景模板与 ResourcePicker、TreeSelect、FileUpload、ImageViewer、StepForm、Calendar。
- 增强日期时间及重复明细校验，修复 Modal/Dialog 焦点与取消、List 虚拟窗口及空摘要行为。
- 同步应用层 UI SOP、覆盖矩阵和下一轮移动交互计划；保留 State 和既有树能力。
- 本次仅本地 Git 提交，不打 tag、不发布 npm、不推送、不升级独立 loader。

## Unreleased — 2026-10-29

- 新增后台、移动和桌面系统模板，布局共享业务 View、Hash 导航和保存边界；详情保留为可编辑模板。
- Nav 支持水平溢出与横纵/rail/bar；AppShell 复用 SplitPane 抽屉和 Resizer，保留宽度与焦点。
- 同步应用层 UI 设计 SOP、视觉验收及组件协议；静态 dark light meta + data-bs-theme CSS，无动态 meta。
- State、loader 包和发布版本保持不变；本次仅提交源码与浏览器构建产物。

## Unreleased — 2026-10-28

- 新增独立 Pagination、轻量 PagedList 与共享 ListDataSource，覆盖筛选、排序、卡片、选择插槽和响应式分页。
- 同步 Bootstrap ui-link / ui-toolbar、AutoForm 完整草稿校验及可运行模板、契约和测试。
- 保持 State 快照不变；登记新组件依赖并生成浏览器构建产物。

## [v1.0.10] - 2026-10-15

- 新增 AppShell、SplitPane、Pane、PageHeader、FilterBar、ActionBar、RequestState、ItemCollection、SidePanel、RemoteSelect 和 CardGrid 等组合能力。
- AutoForm 整体/局部响应式多列；全局密度、内部滚动、Hash 状态与组件生命周期修复。
- 反写 master 中已验证的通用组件、工具及运行时快照，提供三类界面规范、无页面 CSS 模板及独立 YAML 契约测试。
- 构建保留显式版本化框架快照，避免用旧兄弟产物覆盖修复；更新依赖加载表和可移植模板路径。

## [v1.0.9] - 2026-08-25

- **组件**: 完善 Nav、DataGrid、TagsInput、IconPicker 与图形编辑器交互细节。
- **编辑器**: 更新 CodeEditor、Markdown 与 CodeMirror 浏览器构建产物。
- **多语言**: 构建时自动提取静态翻译文本并发布 `lang.txt`。
- **开发流程**: AI 页面验收统一使用 Codex 内置浏览器。

## [v1.0.7] - 2026-08-22

- **弹窗**: Modal 未指定语义类型时使用中性边框和正文标题色，指定类型时继续显示对应强调色。
- **数据表格**: 扩大复杂字段与代码字段的浮层编辑空间，统一编辑浮层边框，并为字段和行编辑弹窗提供更宽的响应式布局。

## [v1.0.6] - 2026-08-22

- **表单**: AutoForm 嵌入 CodeEditor 时允许通过字段设置显式关闭紧凑工具栏。

- **列表**: 主标题保持自然宽度并最多占 75%，副标题至少占 25% 且填充剩余空间，窄面板下仍保持合理比例。

- **编辑器**: CodeEditor 在异步识别到可预览语言后重新发布工具状态，宿主工具栏可立即显示源码、双向分割和预览按钮；紧凑工具栏以 Pretty 图标提示呈现，并统一无边框视图组和全屏图标视觉尺寸。

## [v1.0.5] - 2026-08-18

- **列表**: 优化紧凑样式、树形间距、摘要透明度与批量折叠能力。
- **弹窗**: 增加声明式尺寸属性，支持页面配置对话框和正文高度。
- **编辑器**: 修正语言模块就绪状态，确保格式化等工具在语言加载后执行。
- **主题**: 完善链接按钮主题色变量与 Bootstrap `btn-link` 状态样式。

## [v1.0.4] - 2026-08-17

- **新增**: View 组件支持按需加载 HTML 片段、嵌套相对路径以及一次性脚本和样式初始化。
- **框架**: 同步 State 响应式 `Cookie`/`Lang` 与异步 translator 能力。
- **修复**: View 在 `$if` 分支重入并创建新组件实例时，按绝对文件 URL 复用片段响应，并防止内联或外部脚本重复执行。
- **导航**: Nav 下拉菜单中的 `noselect` 按钮与顶层按钮保持一致，触发 `nav` 事件但不改变当前选中页。
- **修复**: 同步 State 嵌套控件事件隔离，子控件的 `change` 不再误写父级 `$bind`。
- **列表**: List 树增加 `collapseAll()` 与 `expandAll()`，宿主工具栏可统一折叠或展开全部层级。
- **编辑器**: CodeEditor 增加实例级自动换行，自动跟随 Bootstrap 深浅主题，并修复固定高度布局下编辑区滚动。
- **网络**: HTTP utility 支持 `responseType: stream`，直接返回 `ReadableStream` 而不预先缓冲正文。
- **主题**: 同步 Bootstrap outline 语义色运行时配置。

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
