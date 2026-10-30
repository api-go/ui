# 从完整模板开发界面

## 组件与模板是两套复用层

| 复用层 | 适合封装什么 | 使用与扩展方式 | 存放与验收 |
| --- | --- | --- | --- |
| 组件 | 稳定的值/事件、选择、分页、校验、异步生命周期，或滚动/调整尺寸等稳定结构能力 | 绑定公开属性、事件和有限插槽；跨应用保持同一合同 | `/ui/components/`，YAML 合同、协议测试和视觉审核 |
| 页面模板 | 详情页、工作台、仪表盘、设置中心等整体信息结构和常用交互组合 | 复制 HTML 后自由改动区块、字段、操作、布局和数据绑定；不要求遵循一套页面 schema | `/ui/templates/`，目录清单、可运行 HTML、应用级浏览器和视觉审核 |
| 区块模板/组合范例 | 联系信息、时间线展示、指标区域、步骤页骨架等可选片段 | 从完整模板或 Patterns 示例取用并修改；需要状态机时另用组件 | Templates.md / Patterns；不注册组件名，不维护伪组件 API |

本模板库独立于组件目录，入口是 `/ui/templates/index.html`，机器可读清单是 `/ui/templates/manifest.json`。按任务和页面类型寻找相似模板，查看源码，再复制修改。模板自身不是运行时加载器或新框架，也不通过组件插槽限制可修改的位置。

新增模板记录用途、页面类型、数据/持久化边界和可修改点；纳入目录与浏览器回归。只有稳定能力确实需要复用时才抽组件，不能因为多个页面都出现“标签 + 值”就引入新抽象。AutoForm 等组件已有独立校验、绑定等行为价值，不因页面自由排版而废弃。

## 选择与取用

先打开 `/ui/templates/index.html`，按应用类型或场景关键词选择系统，再进入它的独立首页。清单包含后台、移动、桌面以及业务场景系统，附真实运行截图、布局数量、README 和 manifest；具体能力和验收范围以系统说明为准。总入口只做导航，不嵌入业务页面。

读取系统 README 和 manifest，定位最接近任务的布局与业务 View，复制修改后再按需读取 State、保存与所用组件合同。无需为了开始页面设计通读整个组件文档库。

## 已发布系统与布局

| 系统 | 布局版本 | 业务 View 与实际交互 |
| --- | --- | --- |
| 云间工作台 · 后台管理 | sidebar / topnav / mixed；布局、导航区块和内容都由已有 View 加载 | 概览、客户列表/详情/编辑、订单列表/详情、操作记录、个人资料、界面偏好、状态恢复、使用说明；另有不存在页面恢复 View |
| 云间随行 · 移动应用 | adaptive；<600 底栏、600–959 窄侧栏、960+ 侧栏，详情提供上级返回 | 直接引用后台同一组业务 View，不按布局复制客户页；更多页面集中设置与低频功能 |
| 云间写作 · 桌面工作台 | explorer；资源分栏与小屏列表抽屉 | List 资源浏览、CodeEditor 编辑/分屏/预览、多份草稿、待办、一次明确保存及本机快照恢复 |
| 进销存 inventory | sidebar / topnav | 商品、仓库、采购/销售/调拨/退货/盘点明细、草稿、过账、库存流水与报表；ItemCollection 直接绑定明细数组 |
| CRM crm | sidebar / topnav | 线索转客户、客户自由排版详情与跟进、商机阶段、报价编辑/状态/下载 |
| 商城 commerce | adaptive / topnav | 商品卡、详情、购物车数量、地址、确认订单、发货/收货/取消及管理；共用商品和订单数据 |
| OA office | sidebar / topnav | 待办、请假/报销/采购申请、意见、提交/通过/驳回/撤回、通讯录与费用汇总 |
| 服务台 service | sidebar / topnav | 工单筛选、指派、优先级、沟通记录、关闭重开、知识文章 |
| 预约 booking | sidebar / topnav | 按日期/资源查看议程、容量和时段冲突校验、调整/取消；不是月周日历引擎 |
| 项目 projects | sidebar / topnav | 任务与 Kanban 共用已保存数据，卡片插槽保留键盘编辑入口，显式保存、负责人、截止日期、活动 |
| 内容 content | sidebar / topnav | 文档查询、CodeEditor 的 Markdown 编辑/分屏/预览、收藏、发布/归档、文件信息；不冒充上传服务 |
| 组织账户 saas | sidebar / topnav | 成员邀请记录、角色配置、组织资料、账单与本机操作记录；前端不执行生产授权 |
| 分析 analytics | sidebar / topnav | 日期/渠道筛选、Chart 图表、销售/库存与明细导出，共用已应用范围 |
| 官网 website | topnav，自然文档滚动 | 产品首屏、功能、价格、Bootstrap FAQ、联系/登记及可刷新结果；不套后台固定高度外壳 |
| 通用页面 patterns | sidebar / topnav | 账户表单/恢复/验证码、个人资料、通知、搜索、文件下载/本地图片预览、403/404/错误/离线/维护/空状态 |

新增场景的布局均通过静态 `file="../blocks/content.html"` 复用本系统 View；不要假设 View 支持动态 `$file` 切换。共享 header/tools 只提供外观、导航接线、数据源到 Hash 的桥接和少量格式化，不是新的路由、表单或页面渲染引擎。State 事件表达式同步执行，异步应用动作返回 Promise；需要后续处理时用 `.then(...)` 或应用函数，不在事件表达式直接写顶层 await。

每套系统的 manifest 标明页面/资源/查询的具名 Hash、LocalStorage 示例快照、内存草稿、滚动所有者及组件依赖。复制链接只恢复路由和已应用条件，不携带本机新增记录。新上下文缺少记录时显示恢复入口，不宣称数据分享。未保存草稿不放 URL；浏览器后退离开编辑时保留草稿并提供“继续编辑”。不同布局共用草稿，确认放弃后才初始化其他编辑内容。

后台另包含分步创建（基本资料→合作信息→核对保存）、客户 JSON 导入（文件→映射→逐行校验修正→确认）、实际文件导出及任务结果。步骤页继续是可修改 View；通用步骤前进校验/回退保值可选用 StepForm，重复明细使用 ItemCollection + AutoForm。patterns 同时保留直接编辑资料和独立 onboarding 向导。FileUpload 提供上传生命周期，patterns/files 的本地接收器明确只在页面内存保留原文件并支持下载核对，不冒充服务器上传。CSV/Excel 解析接现有 Table 服务，生产传输与进度须由实际 API 提供。不能用计时器伪造上传或后台任务；同步本机操作明确展示为已完成结果。

导入文件及修正草稿不进入 Hash，缺少内存草稿的复制/刷新地址回到文件选择；跨布局保留同一草稿。导出记录保存生成时的快照，再次下载不悄悄重查。批量结果区分完成、跳过和失败；记录不存在时提供恢复入口。历史快照先载入草稿，再明确保存，不绕过保存边界。

后台系统的三个布局共同引用 `systems/admin/blocks/content.html`，这里挂载同一套 `views/` 文件；没有三份客户页。布局切换重建外壳但保留系统状态、草稿和数据源；资源路由及查询通过具名 Hash 字段恢复。编辑保存到明确的本地示例存储，真实服务接入点在 app.js。

客户工作台 `views/customers/workspace.html` 用 SplitPane + Pane 嵌入同一份 list.html 和 detail.html，自动复用 Resizer；不手写分栏或重复加分隔器。宽度绑定 LocalStorage，记录选择、窄屏面板和列表/卡片模式绑定 Hash。卡片必须按实际宿主宽度排布，不能按整个窗口猜测分栏空间。通过分页 settings 插槽扩展展示设置，不复制分页或查询能力。

## 从成熟模块继承能力

开发工作台时可对照 master 的 `www/admin/views/Table.html` 盘点能力：具名资源 Hash、列表选择、搜索排序、持久宽度、移动端导航、统一草稿/保存、条件动作和加载恢复。它是能力参考，不是绕过当前组件合同的代码范本。新模板优先采用 SplitPane/Pane/List/PagedList 的公开绑定与插槽，不复制旧模块的私有 DOM、内部状态或业务存储实现。SQL 分析、导入/导出、备份恢复等要按应用的真实领域 API 接入，不能在纯前端模板伪造生产能力。

验收必须包含复制当前链接到一个全新浏览器上下文：恢复页面、资源、已应用查询/排序/页码、呈现模式和当前窄屏面板；另验证刷新、前进/后退、非法资源及跨布局。分栏宽度等个人偏好留在 LocalStorage，不要求复制链接传播。请求状态、临时选择和未保存字段不为“可分享”而塞进 Hash。Hash 只描述页面，不复制数据或赋予访问权限。

所有界面固定文案（含条件分支、错误、提示、可访问名称及选项标签）使用 `{#...#}`。master 已负责自动翻译及生成翻译文件，模板不另建词典或翻译服务。业务记录值、稳定 ID、路径和枚举身份不因翻译而改写；需要本地化的显示标签与实际值分开。

目录：系统 `index.html` 负责依赖和初始化，`layouts/` 负责外壳，`views/` 是自由编辑 HTML，`blocks/` 是应用区块，`data/fixtures.js` 是虚构数据，`manifest.json` 列出文件、交互和依赖。View 是片段，不能双击当完整应用运行。需要同源静态 HTTP(S) 服务，不需要业务后端。静态资源路径 /ui 应由宿主正确映射。

全局密度与工具栏参考 `/ui/examples/density.html`：html/body 的 ui-sm/ui-lg 一处切换；显式 BS 尺寸保持优先；FilterBar、ActionBar、RequestState 与虚拟列表/表格一起运行。页面同样不需要 CSS。

## 保留的单页组合参考

以下六个原有示例保留作能力参考，不作为系统卡片；写作与内容另有完整系统，可按所需交互选择。

| 模板 | 类型 | 直接参考 |
| --- | --- | --- |
| 客户详情 | 自然滚动页面 | `/ui/templates/customer-detail.html`：普通 section/dl + Bootstrap 响应式列 + State 直接绑定；任意位置可插入业务内容，应用自行定义邮件和关注动作，无 DetailView 组件或字段 schema |
| 客户工作台 | 管理工作台 | `/ui/templates/customer-workspace.html`：Hash 搜索、状态、资源选择、详情标签；SplitPane 自动 Resizer；LocalStorage 关注偏好 |
| 设置中心 | 管理工作台 | `/ui/templates/settings-console.html`：AutoForm 整体两列、分组两列/三列、通栏字段；Hash 页面切换共享同一草稿；统一保存、撤销和错误恢复 |
| 写作工作室 | 交互应用 | `/ui/templates/note-studio.html`：List、CodeEditor、Hash 编辑/分屏/预览；跨笔记保留草稿、统一保存、浏览器刷新保护 |
| 内容精选 | 自然滚动页面 | `/ui/templates/content-catalog.html`：Bootstrap 响应式卡片；Hash 分类、搜索、排序和详情；LocalStorage 收藏 |
| 分页数据列表 | 管理工作台 | `/ui/templates/records-table.html`：AppShell + Pane + PagedList；列表内部滚动、固定工具栏与分页；数据定义多条件筛选、独立排序菜单、可选表头与底部选择操作插槽；列表/卡片共用查询与 Pagination；灰色宿主控制区与组件区分开 |

这些 HTML 不包含 `<style>`、`style=` 或应用专用样式表。尺寸、滚动与响应式行为由公共组件承担，页面表达使用 Bootstrap 类。框架组件内部仍拥有必要 CSS；不要把内部布局规则复制回页面。

模板使用同源 `/ui` 资产，依赖完整列在 `<head>`。下载后仍需由提供这些资产的主机承载；不是包含框架资源的离线单文件包。模板数据和浏览器持久化边界有明确说明，没有假 API、假保存或支付行为。

## 多列表单的最小表达

```html
<AutoForm columns="2" $.state.data="page_state.draft" $.state.schema="formSchema"></AutoForm>
```

```javascript
const formSchema = [
  {name:'name',label:'姓名',type:'text'},
  {name:'email',label:'邮箱',type:'email'},
  {type:'group',label:'地址',columns:2,items:[
    {name:'city',label:'城市',type:'text'},
    {name:'postal',label:'邮编',type:'text'},
    {name:'address',label:'详细地址',type:'textarea',colspan:'full'}
  ]}
]
```

`columns` 是期望列数，支持 1–4；实际列数根据表单所在区域宽度自动降低。`$.state.columns` 可以响应状态变化。group 只组织布局，不创建嵌套数据或额外提交入口。`colspan` 按局部列数计算。详情见 AutoForm.yaml。

## 改造成业务应用

1. 复制最接近任务的模板，按业务自由增删、移动区域，替换数据、字段和动作。可以在联系信息旁加入附件、在金额后加入订单列表，无须给共享组件申请新的 slot。模板内若使用 AutoForm 等现有组件，仍遵循其合同，不修改其内部 DOM。
2. Hash 只存可恢复的页面、资源、筛选和视图身份；不要把 editable draft 放进 Hash。宽度、收藏等持久偏好有独立 LocalStorage 字段。
3. 每个页面保留一个 module_state；一个独立保存边界对应一份草稿和一个稳定 dirty source。切换同一保存边界内的页面可以保留所有编辑；切换不同资源则使用 List/Nav 的 changebind 或文档化确认协议。
4. 模板的设置和笔记保存到浏览器。业务数据接入领域 API 时，替换保存适配器，等待服务器确认后清除 dirty；补 loading、error/retry、并发版本冲突与权限失败。不要把 LocalStorage 当作业务数据库。
5. 条件隐藏的字段不会经过原生 DOM 校验。业务跨页约束仍须由保存适配器和服务器验证；设置模板展示了隐藏分组必填数据的业务检查。
6. 验证宽窄屏、深浅主题、长内容、键盘、刷新、前进后退、保存失败与恢复。模板必须通过自己的应用级浏览器测试；不能仅凭截图判定可用。

## 下一轮能力顺序

1. AutoForm 已提供 validator 完整草稿同步/异步校验、setErrors 服务端字段错误和 revealfield 隐藏字段恢复协议；动态重复字段与步骤表单在此基础上跟进。服务器仍承担业务校验。
2. 数据管理组合：基于已有 FilterBar、ActionBar、RequestState，继续贯通分页、排序、列配置、批量动作和请求取消，复用领域 API 与 DataGrid，避免重造数据层。
3. 状态与恢复：统一 request-state 呈现、保存冲突与草稿恢复；自动保存必须解决并发写入和错误恢复后再开放。
4. 模板扩充：数据表管理、步骤任务、概览分析；每个模板都要求零页面 CSS、可运行数据边界及完整交互测试。
5. 固定模型和任务做独立生成对比，记录成功率、返工次数、文档读取成本和视觉评分，依据结果迭代，不预先宣称全面超过其他框架。
