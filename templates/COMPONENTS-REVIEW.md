# 高复用组件与模板消费者验收 · 2026-10-30

本轮是在既有 15 个系统之上完成高复用能力批次。新增独立 onboarding View 后，12 个扩展系统共有 90 个业务 View。布局仍只负责外壳并复用同一套 View；没有详情 schema、业务页面组件或新的状态/查询引擎。

## 已完成能力

| 能力 | 实现与消费者 | 边界 |
| --- | --- | --- |
| ResourcePicker | Modal + PagedList，单/多值、跨页待选、确认/取消、异步验证和 content/item/selection 插槽；库存批量商品、CRM 报价客户 | 宿主拥有数据源、资格验证与最终保存，取消不脏数据 |
| TreeSelect / Cascader | List + ResourcePicker，树或单层级联、独立父/叶选择、派生路径、懒加载重试/取消、键盘；库存分类、OA 部门 | 不做隐式父子联选或虚拟全球目录；沿用既有 List 设计 |
| 重复明细 | 增强 ItemCollection，稳定行 ID 的字段错误、定位、原生/AutoForm 校验、宿主异步校验和过期结果拦截；库存明细同一数组草稿 | 未新增 RepeatFields 包装层；统一保存与库存规则仍属业务 |
| FileUpload | 原生选择/拖放、并发队列、失败/重试、取消、附件回显、实测可选进度；patterns/files 本地接收器 | 示例读取原始字节并可下载核对，但只留在页面内存；不冒充服务器上传。生产替换 upload 回调，存储/权限仍走资源 API |
| ImageViewer | 原生加载/错误/重试、图片组、缩放/拖动、键盘和关闭焦点；商城商品、patterns 图片预览 | 原生 `$.src` 保留 Image 生命周期，不依赖装饰 SVG 的自动内联；没有改 State |
| 日期时间 | DatePicker 增加 native time/datetime-local/month/week、min/max/step 和范围；预约编辑 | 保留本地时间字符串，不做隐式 UTC 转换；原有 AutoForm rangeEnd 保留 |
| StepForm | 自由 step/actions 插槽、保留面板、前进校验、回退/取消/异步恢复；patterns/onboarding | 简单 profile 保持直接表单；各步共用同一份草稿和一次宿主保存 |
| 查询工具 | 复验 PagedList 多条件 filterfields、FilterBar 查询草稿和 Hash；CRM/库存/报表消费者 | 当前没有新的公共行为需要第二个查询组件；保存查询与高级偏好独立规划 |
| Calendar | 月格、周/日议程、日期/范围/事件协议、移动呈现；预约日程日期/模式直接绑定 Hash | 容量/冲突仍在预约动作；资源时间网格、拖排、周期/跨时区排班不是本轮承诺 |

## 这轮实际修复的问题

- ItemCollection/Kanban 监听了不存在的内部根，原生 change 可能被当成整体数组/文档变更；改为拥有者宿主隔离，不拦截目标控件的绑定处理。
- Modal 缺少可聚焦入口，打开动画期间 Escape 可能失效；补原生焦点入口与待关闭处理，并在卸载时完成 Bootstrap 生命周期，避免遮罩和 body 锁残留。
- Dialog 的 Escape 与 Bootstrap static-backdrop 监听冲突，销毁后会遗留动画回调；由 Dialog 在 capture 阶段统一决定返回值，再走 Modal 关闭。真实逐例与错误采集已复验。
- 选择器已选项限高滚动；树选择只保留一个展开入口，父节点不展示无意义的禁用单选框，当前值打开即展开路径，行文字可以选择。修复嵌套组件尚未初始化时过早访问 Modal 的错误，增加真实 OA 触发回归。
- 手机日历两位日期与事件标记不换行；图片计数移入标题，底部保留导航/缩放组；固定 ui-lg 密度不靠缩小按钮补布局。
- 文件页把附件选择与图片预览合并为同一份附件数据和一个原生选择入口；不再同时出现两个相似的文件选择器，开发接入说明移到 README。
- 独立 `../web/ui` 的 List 修复空摘要占位、选中触发虚拟窗口重置、首次恢复默认字段；树恢复夹具改用 `$.state={...}` 保留大小写键。保留该包原有树扩展能力，没有整包覆盖或改 State。

这些经验已写入 canonical Interface-Design.md、Templates.md、组件合同及 UI-TODO/UI-COVERAGE。混合大小写 state 键使用对象状态绑定或 `$bind`，不修改底层属性处理规则。

## 验收证据

- 业务：最终 `/tmp/round-business-final.log` 全部 73 项通过，包含 53 项原系统场景、11 项 RemoteSelect/导航消费者、8 项本轮新消费者及 Graph。覆盖批量商品确认/取消/保存恢复、分类保存、分步回退/刷新、原字节下载/移除、同一附件图片预览、日历 Hash/事件导航和图片键盘/焦点。此前 terminal 回放发现 CRM 报价标签闭合错误，修复后单例及完整批次都重新通过；不把那次 71/72 记为通过。
- 公共协议合并及逐例：`/tmp/round-protocol.log`（ItemCollection/Kanban/List/ResourcePicker 等）、`/tmp/new-controls-protocol.log`、`/tmp/round-final-protocol.log` 的各组件终态及后续修复复验；以 `/tmp/dialog-tree-final.log` 的 16 项全部通过、`/tmp/tree-trigger-final.log` 的 7 项全部通过、`/tmp/list-final.log` 中 List 已通过部分为最终替代证据。早期 Modal 超时、Dialog 冲突和 TreeSelect 密度失败不计通过，修复后分别重新跑到终态。
- 密度：1280/390 × ui-sm/ui-lg，含反向切换和原生控件几何。新能力与 List/PagedList/Kanban 等通过 `/tmp/media-date-second.log`、`/tmp/new-density2.log`；最终 Modal/ImageViewer/Calendar/List 的通过项及修复后的 Dialog/FileUpload/TreeSelect 由后续日志覆盖。额外检查 AutoForm/CardGrid/GraphEditor，见 `/tmp/modal-consumers-terminal.log`。不把重跑数量相加。
- 外观：六种消费者 × 1280/390 × default/sm/lg × 普通/ui-link × 浅/深，共 144 张截图，位于 `/tmp/ui-round-20261030`；`/tmp/round-terminal.log` 全部 8 项通过，包含最终 TreeSelect 密度、OA/分类真实任务和两组 72 状态捕获。已逐组比较并查看原尺寸，重点检查对齐/间距、主题层级、触发含义、可点区域、手机工具收缩和保存/取消边界。几何与截图数量不是无障碍认证。
- 内置浏览器：实际完成 OA 打开当前路径→改选销售部→Escape→仍为产品部，390px 截图在 `assets/components-tree-mobile-native.png`；独立 List 全部 31 个用例及原先失败的 6/19/28 三例分别通过，结果在 `/tmp/ui-round-standalone-list-{result,cases}.json`。
- 静态：合同/镜像/模板/密度源检查 9 项通过；源语法和影响范围 diff whitespace 检查通过。State SHA-256 仍是 `551d4f6ab76e8ddd46cf6aebde3c68179ecfcec6978f2be2467bb1c2406bcd98`。

最终补验：`/tmp/crm-step-terminal.log` 7 项通过，包含未知步骤 Hash 回退、StepForm 合并/逐例及四组密度；`/tmp/modal-consumers-terminal.log` 12 项通过（AutoForm/CardGrid/GraphEditor）；文件页合并后的任务与完整外观矩阵在 `/tmp/file-terminal.log` 4 项全部通过。Calendar 的零秒/零小数午夜结束边界另有契约回归；修正检查选择器误包含测试导航的问题后，`/tmp/calendar-end-final.log` 四组密度、合并/逐例及实际预约消费者共 6 项全部通过。当前本轮没有未修复的已确认问题或待人类决策项。

Graph 之前的 .2 后端阻断本次完整消费者已通过，不再作为未解决项。没有后端改动、构建或重启 master；DocDB 合同通过运行中的 dev 同步并检查同步日志。`test-impact.py` 的混合工作区结果含其他任务变更，本报告声明本轮 UI 影响范围，不声明全 Master 发布门禁。

## 后续边界

本轮不发布、提交或整包反向同步；只有独立 List 的两文件定点修复。移动专项（通用底部弹层、加载更多/下拉刷新、滑动操作）、原生小程序平台、保存查询、高级排班与媒体裁剪仍在分开的 roadmap，不阻塞本轮已选能力。生产文件接口由具体应用提供，本地示例不发送业务文件。没有新增需要人类决策的事项。
