# 应用模板库

打开 `index.html` 按场景选系统，进入独立首页后体验导航和业务流程。新增系统右上角“外观设置”集中提供布局、密度、链接外观和主题。目录只导航；每个系统使用普通 HTML/JS、既有 View 和组件。详情、表单和业务区块都可自由修改，不受页面 schema 限制。

## 先找接近的任务

| 任务 | 系统 | 优先取用的 View / 能力 |
| --- | --- | --- |
| 通用后台、客户/订单、多步骤创建、导入导出 | `admin` | 三种布局；`views/customers/`、`views/orders/`、创建/导入/导出与结果页 |
| 同一业务在手机、平板、桌面运行 | `mobile` | 自适应底栏/窄侧栏/侧栏；直接引用后台业务 View |
| 多文档工作台、资源分栏、多份草稿 | `desktop` | explorer 布局、CodeEditor、待办、统一保存与历史恢复 |
| 采购、销售、仓库与库存 | `inventory` | `editor` 的 ItemCollection 明细；`detail` 过账；`movements` 流水与 `report` |
| 线索、客户跟进、商机与报价 | `crm` | `leads` 转客户；`customer` 跟进；`pipeline` 阶段；`quote` 报价 |
| 电商 APP / H5、商品与订单管理 | `commerce` | adaptive/topnav 共用 catalog/product/cart/checkout/orders/address/management |
| OA、请假、报销、采购审批 | `office` | inbox/requests/editor/detail；审批意见、状态与流程记录 |
| 客服、工单、内部支持 | `service` | tickets/detail；指派、优先级、回复、解决/关闭/重开；knowledge/article |
| 会议室、设备、服务预约 | `booking` | calendar 的资源议程；editor 的容量/冲突校验；调整/取消与记录 |
| 项目协作、任务与看板 | `projects` | tasks/detail/editor 与 board 共用已保存任务；Kanban 原生操作和 card 插槽 |
| CMS、知识库、文档工作区 | `content` | library/editor/article/collections/publishing/assets；复用 CodeEditor |
| SaaS 团队、组织、成员、账单 | `saas` | members/roles/preferences/billing/invoice/audit；角色配置与管理员保护 |
| 经营看板、日期筛选、分析导出 | `analytics` | overview/sales/inventory/report；同一范围驱动 Chart、明细与下载 |
| 产品官网、价格、FAQ、登记 | `website` | 自然文档滚动；home/features/pricing/faq/contact/signup/result |
| 账户、个人中心、通知、搜索、文件、错误页 | `patterns` | login/register/recovery/verify/profile/notifications/search/files/file/statuses |

系统目录统一为 `index.html`、`manifest.json`、`app.js`、`layouts/`、`views/`、`blocks/`、按需的 `data/fixtures.js` 与 `assets/`。同一系统的不同布局引用同一份业务 View；布局只管导航、区域和滚动。`shared/` 仅共用 header 和少量模板工具，不是路由或页面渲染框架。

## AI 的最短取用路径

1. 从上表选择系统，打开具体任务试一次，观察正常、取消和失败状态。
2. 阅读该系统 manifest 和 README，定位所需布局、View、具名 Hash、数据/草稿及保存函数。复制最小可用的一组文件。
3. 删除无关菜单和字段，直接调整 View 的 HTML/Bootstrap 类与绑定。按需读取所用组件 YAML、State 和保存/权限合同，不通读整个文档库。
4. 用真实领域 API 替换应用保存动作和示例数据；不要在前端复制认证、授权、库存事务、文件存储等服务能力。
5. 验收目标任务、复制链接、刷新/后退、取消/失败重试，以及桌面/手机、默认/sm/lg、普通/ui-link、浅色/深色。

## 复用边界

- 组件拥有稳定值/事件、插槽、交互及生命周期；View 拥有业务排版。使用 ItemCollection、PagedList/Pagination、Kanban、CodeEditor、Chart、AppShell/SplitPane/Pane 等已有能力，不用详情 schema 或新存储框架压缩 HTML。
- 新场景使用 Bootstrap 类，没有页面 CSS 或 `style=`。密度和外观从根级继承；原生输入/select 与按钮保留默认语义。
- 固定工作区由 AppShell 管 viewport、导航抽屉和 Resizer；各 Pane/列表/编辑器拥有自己的滚动。官网使用自然文档滚动。窄表格在 table-responsive 内横向滚动，不能把名称挤成逐字换行。
- Hash 只记录具名页面/资源/已应用条件、显示模式等可恢复状态；默认空查询省略。草稿留内存，个人宽度/外观留 LocalStorage。复制链接不会复制本机新增记录或授予权限。
- 保存是显式的本机虚构数据快照；失败保留输入。未保存草稿跨布局保留，后退离开编辑可继续；确认放弃后才清除。业务状态只在成功保存后进入已保存集合。
- 所有固定界面文字使用 `{#...#}`，master 自动翻译；没有另建语言词典。选项 value/ID 与可翻译 label 分开。

## 运行与证据

需要同源 HTTP(S) 静态服务，映射 `/ui` 资源即可；不依赖服务端 HTML 或业务 API，也不支持 `file://` 双击预览。系统入口只加载一次依赖，View 片段不再包含 html/body/script。View 使用明确的静态 file 路径，不假设动态 `$file`。

现有 12 个扩展场景系统、90 个独立业务 View（含独立资料设置向导），连同原有系统共 15 个导航入口。模板扩展证据见 [EXPANSION-REVIEW.md](EXPANSION-REVIEW.md)，后续组件及消费者验收见 [COMPONENTS-REVIEW.md](COMPONENTS-REVIEW.md)。数量不是质量结论，也不等于对所有框架高级能力达成一致。

六个早期独立页面仍保留作参考：customer-workspace、customer-detail、settings-console、records-table、note-studio、content-catalog，不重复计为独立系统。

当前包含上传队列、媒体预览、月周日浏览、确认式实体/树选择与可选分步向导。上传生产适配、复杂排班、专项移动交互及原生小程序平台仍各自规划。账户表单不创建认证会话；商城不发生付款；成员/审批只是流程示例，生产授权由对应服务负责。
