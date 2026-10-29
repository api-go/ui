# 云间写作 · 桌面工作台模板

原 note-studio 单页示例的系统化版本：独立入口、一套资源分栏布局、共享 View 和明确的一次保存边界。原单页保留，不破坏已有参考链接。

## 布局与 View

| 布局 | 用途 | 组合 |
| --- | --- | --- |
| layouts/explorer.html | 资源浏览与持续编辑 | AppShell → SplitPane → 资源/内容 View；自带 Resizer |

blocks/content.html 加载 editor、tasks、history、guide View。资源 View 用 List 和 Hash 搜索；编辑 View 复用 CodeEditor 的 Markdown 编辑、分屏、预览及主题。布局只管外壳，业务内容保持可修改 HTML。

## 状态与保存

- Hash：desktopPage、desktopNote、desktopPane、desktopMode、desktopSearch、desktopRevision。刷新/复制恢复布局、资源、面板和模式；无效资源/快照有恢复入口。
- LocalStorage：desktopResourceWidth、desktopDensity、desktopLink、desktopDark 是偏好；desktopTemplateData 是明确保存后的本机工作区，包含全部笔记、待办及最近10次快照。
- desktop_state.notes/tasks 是唯一草稿。切换笔记、页面保留全部草稿；保存按钮及 Ctrl/⌘ S 共用 desktopSave 和 State.changes.DesktopWorkspace。
- 保存失败保留输入；历史“载入为草稿”需确认，再明确保存才替换持久值。放弃修改恢复最近保存值，离开确认未保存内容，刷新沿用 State 自带保护。
- 外观设置即时保存，独立于工作区草稿。统一继承 ui-sm/ui-lg/ui-link。

## 响应式及边界

资源侧栏在窄宿主由列表图标打开 Bootstrap 抽屉，选择后关闭；支持关闭按钮、Escape、焦点返回，保留同一列表与查询。桌面 Resizer 宽度持久保存。资源区不重复显示标题或解释性口号。编辑器窄屏分屏由 CodeEditor 重排。入口 html/body 与 View 具有完整高度链，各区域只有一个滚动所有者。List 支持方向键、Resizer 支持键盘调整，select/按钮保留原生焦点。

不连接文件系统、不运行用户代码、不伪装服务端成功。生产文档接现有 Editor API，权限与并发由所属服务负责。完整文件/依赖见 manifest.json，验收见 ../../ITERATION-REVIEW.md。同源 HTTP(S) 即可运行。
