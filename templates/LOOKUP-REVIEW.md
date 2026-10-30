# 官网导航与实体选择验收 · 2026-10-30

## 本批范围

官网当前导航使用 `bg-transparent text-body-emphasis` 和 Nav 原有加粗/aria-current，浅色是黑色强调文字，深色随 Bootstrap 主题变浅。Nav 去掉选中背景/文字的强制优先级，使已有 item.class 能覆盖默认外观；溢出菜单也沿用 item.class。其他系统仍保留原中性选中面，没有新增页面 CSS 或另造导航。

RemoteSelect 沿用已有字符串值与 api/action/params POST 查询，扩展 multiple 字符串 ID 数组、异步 load 适配器、名称恢复、去重/移除、禁用/必选、键盘与 IME、错误重试、取消及过期响应隔离。输入绑定同一份 query，选择后真实可见输入清空；搜索输入标记 data-no-changebind，公开选择事件才修改持久草稿。宿主提供的 HTTP 只加载一次，未修改 HTTP、State 或其他非 UI 机制。

CRM 商机客户绑定 customerId；项目协作成员绑定 collaborators ID 数组，随任务一起保存/失败重试/刷新。示例 load 查询有界虚构记录，真实项目可接既有授权 API。AutoForm 通过公开 setting.load/label/multiple 组合两种值；兼容其初始化后提供设置的顺序，没有更改 AutoForm 实现。

CSS 仅两条组件规则：宿主最小宽度，以及结果滚动区的视口相关高度/长文字换行。所有其余结构、间距、边框、颜色、菜单与按钮复用 Bootstrap；不加入新的尺寸/主题系统。

## 证据

- 最终业务复验：`/tmp/lookup-stable-templates.log` 中 53 项原扩展系统检查通过。最终 Nav 中性面修正后，`/tmp/lookup-final-matrix.log` 全部 11 项通过，包含业务保存/恢复、搜索不脏/卸载取消及全部 72 个外观组合；此前错误的任务页标题断言已修正。
- 组件/消费者：`/tmp/lookup-remove-final.log` 的 10 项通过，包含 RemoteSelect 全部 15 个协议用例合并和逐例、RemoteSelect/AutoForm 的 sm/lg × 1280/390 几何，以及 AutoForm 30 个用例在桌面/手机的组合运行。删除未知 ID 不产生多余变更也有回归断言。
- Nav：`/tmp/lookup-nav-terminal.log` 有 19 项通过，包含 Nav/SplitPane/AppShell 合并与逐例、溢出选择、断点、动画卸载和现有导航矩阵。第一项 lg/1280 在 DocDB 自动同步前读到了旧颜色字符串断言（trace 的 HTML 已核对）；同步后由 `/tmp/lookup-nav-lg-final.log` 单独复验通过，四组密度几何均已覆盖。新增 Bootstrap 工具类覆盖与默认侧栏中性面断言；颜色比较按数值避免 CSS 字符串空格差异。
- 静态：合同/镜像/密度/模板源检查 9 项通过；受影响路径 diff whitespace 检查通过。State SHA-256 仍为 `551d4f6ab76e8ddd46cf6aebde3c68179ecfcec6978f2be2467bb1c2406bcd98`。
- 视觉：官网、CRM 编辑、项目编辑各有 1280/390 × default/sm/lg × 普通/ui-link × 浅/深的 24 张截图，共 72 张。已按三张比较图审核，并查看原尺寸/内置浏览器实际界面；官网导航无色块，工作台保留中性选择面，字段/动作对齐，菜单未挤宽页面。最终图在 `/tmp/lookup-final-matrix`，比较图为 `/tmp/lookup-{website,crm,projects}-final-sheet.jpg`。
- 内置浏览器实际完成搜索周宁→选择→保存，再刷新回显→搜索陈晨→Enter→输入清空→Escape→保存→详情显示两人；期间一次服务重启引起的 View 加载失败通过真实重试恢复。官网最终截图是 `assets/website-navigation-native.png`。

检查的是可读性、对齐、明确当前项、选择/清除的可发现性、键盘退出、失败不丢数据与真实保存。没有把截图数量或几何通过当作 WCAG/用户研究认证。测试数量有交集，不相加。

## 外部阻断与后续

现有 Graph 完整集成两次在进入选择控件前被后端阻断：首次创建图谱缺少 SaveWorkspace；外部 runtime 重启后，saveNode 返回 nil pointer。测试 finally 已执行其独立夹具清理请求。本批没有修改 Graph 后端、启动第二个服务或重启 master；该业务路径不能声明通过。AutoForm 消费者及既有 POST 形状通过独立可执行用例验证。阻断的后端问题与归属已进入 UI-TODO。

最终验收途中另一次 `.2` 重启造成连接拒绝（delivery-* 日志），已在服务恢复后重跑 stable-*，没有用重试或忽略错误把那次中断计为通过。混合工作区还包含其他任务的后端变化，test-impact 结果在 `/tmp/lookup-impact.log`；本报告只声明本批 UI 的影响范围，不声明全 Master 后端发布通过。

下一项为确认式 ResourcePicker，取消不回写宿主，复用 Modal/PagedList。树/级联、大目录虚拟化、真实上传与复杂日历仍是后续独立能力；本次有界搜索不替代这些能力。未提交、未反向同步，不需要构建或重启。
