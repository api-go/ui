# UI 能力覆盖与场景扩展规划

盘点日期：2026-10-29。下列框架矩阵仍是研究与待办，不是全面能力对齐声明；本次模板扩充单独记录。基础为 Bootstrap + State + 公共组件；不引入另一套渲染框架，不修改 State。

## 对标对象与达标含义

先补框架能力覆盖，再用真实场景扩展模板；每项公共能力同时有一个可交互组合用例，不能只有孤立控件演示。

| 官方参考 | 主要比较内容 | 来源 |
| --- | --- | --- |
| Ant Design | 通用、布局、导航、录入、展示、反馈各类基础能力 | https://ant.design/components/overview/ |
| Element Plus | 管理端表单、选择器、表格、树、时间、上传与反馈 | https://element-plus.org/en-US/component/overview.html |
| ProComponents | 查询表单、分步/弹窗/抽屉表单、可编辑表格等应用组合 | https://procomponents.ant.design/en-US/components/form/ 、https://procomponents.ant.design/en-US/components/table/ |
| Vant | 面向触摸的弹层、选择、列表加载、手势与交易界面 | https://github.com/youzan/vant |
| Vant Weapp / TDesign MiniProgram | 小程序的界面组织、触摸和平台交互边界 | https://github.com/youzan/vant-weapp 、https://github.com/Tencent/tdesign-miniprogram |

这是官方能力目录和本地合同的对照，不是对全部框架做过运行验收后的质量排名。采用相同名称不等于对齐；没有同名组件也不等于能力缺失。

每个参考项必须有明确去向：**已覆盖 / 已有但需增强 / Bootstrap或原生组合 / 待新增公共行为 / 模板或区块 / 平台适配 / 后置专项**。Bootstrap 组合也必须有绑定、交互与响应式示例才能计为项目可用。未验收条目不计完成，不用组件数量或截图数量宣称对齐。

## 当前真实覆盖

- 模板扩充前为 admin、mobile、desktop，共5个布局；后台18个业务 View。当前新增 inventory、crm、commerce、office、service、booking、projects、content、saas、analytics、website、patterns 十二个场景系统、89个独立业务 View。各系统复用自己的 View，mobile 仍直接复用后台 View；六个旧单页参考保留。模板验收不能替代下方组件高级能力验收。
- 现有优势：AppShell/SplitPane/Resizer、具名Hash、List树和虚拟窗口、DataGrid、PagedList/Pagination、AutoForm、Chart、Kanban、代码/Markdown编辑及图形编辑。
- RemoteSelect承诺有界远程单/多值实体选择及ID标签恢复；TagsInput仍是自由文本。DatePicker覆盖原生 date/time/datetime-local/month/week、界限和范围，不承诺跨时区转换、快捷禁用区间或排班规则。
- AutoForm有分组列、条件字段、完整草稿异步校验和字段错误恢复；ItemCollection新增稳定行ID字段错误、校验和定位，并保留数组增删排序。进销存商品明细、原生约束、合计和统一保存已验证；复杂可编辑数据表仍使用DataGrid。
- Dialog/Modal、Toast、RequestState可复用；SidePanel是保留草稿的非模态资源工作区，不能直接等同于通用模态底部弹层。
- 已有导入是本地JSON选择/映射/修正，导出是真实JSON下载；不能计作上传队列、后台异步任务、Excel引擎或生产库存/交易。

模板目录另外对照 [Tabler 官方示例](https://preview.tabler.io/)、[CoreUI Bootstrap 官方示例](https://coreui.io/demos/bootstrap/5.3/free/) 和 [Ant Design Pro 官方示例](https://preview.pro.ant.design/) 的页面家族：账户/验证/恢复、个人资料、通知、搜索、文件、错误/维护/空状态、账单、价格/FAQ/官网、列表/详情/编辑、任务/看板、图表/报表以及业务流程。没有把图标、排版、单控件测试页重复计为业务模板，也没有声称与这些持续更新项目的数量或全部高级交互完全相等。

2026-10-30 高复用批次补齐 RemoteSelect、ResourcePicker、TreeSelect/Cascader、FileUpload 队列、ImageViewer、StepForm 和 Calendar 基础浏览；日期时间扩展 DatePicker，逐行错误/校验扩展 ItemCollection。它们都有独立协议和业务模板消费者，详见 `/ui/templates/COMPONENTS-REVIEW.md`。大目录虚拟选择、生产上传适配、资源时间网格/周期排班、通用移动底部选择及原生小程序仍是各自能力，不能因为名称相近计为完整覆盖。

## 桌面与通用框架覆盖矩阵

以下覆盖参考目录中的能力家族；同一行并不承诺所有高级选项已对齐。后续实现时拆出逐项变体和验收用例。

| 参考能力 | 当前归属/状态 | 补齐内容与表达方式 |
| --- | --- | --- |
| Button、Icon、Typography、Text、Link | Bootstrap/原生组合 | 建立可取用用例：图文、图标独立、忙碌、禁用、长标签和可访问名称；不再造基础按钮 |
| Flex、Grid、Space、Divider、Container | Bootstrap组合 | 用原生类、插槽与容器宽度示例覆盖；不为Row/Space增加包装层 |
| Layout、Splitter | AppShell/SplitPane/Resizer已有 | 保留分栏、抽屉、宽度持久化与嵌套验收；不是继续堆布局版本 |
| Masonry、BorderBeam | 未覆盖的专项 | 瀑布流可由内容/图库场景验证后补；装饰光效后置，不阻塞基础任务 |
| Menu、Dropdown、Sidebar、Tabbar | Nav与Bootstrap部分覆盖 | 补长菜单、分组、权限结果显示、窄容器与同源路由组合，不在浏览器执行授权 |
| Breadcrumb、Tabs、Segmented | Bootstrap外观可组合；行为未形成统一约定 | 数据驱动路径/活动项，键盘、关闭标签、Hash恢复；是否抽组件由行为复用决定 |
| Steps | StepForm + 可编辑步骤 View | 已覆盖前进校验、回退保值和取消/失败恢复；业务进度、最终保存仍由宿主拥有 |
| Anchor、Affix、BackTop、FloatButton | 原生/Bootstrap部分可组合 | 需要滚动定位、遮挡避让、触摸及焦点用例；仅fixed类不算完整行为 |
| Input、Checkbox、Radio、Switch、Slider | 原生+Bootstrap+AutoForm | 补完整用例与校验，沿用绑定，不重复封装原生控件 |
| InputNumber / Stepper | 原生number只覆盖基础 | 缺步进、上下限、精度和移动操作的统一行为；金额最终规则由业务API负责 |
| Form | AutoForm已有 | 保留跨字段/异步/服务端校验；补条件组、弹窗/抽屉承载、移动操作示例 |
| AutoComplete、Select、Virtualized Select | 原生select与RemoteSelect有界单/多选已覆盖 | 已验收ID/label恢复、清空、禁用、异步竞态和键盘；虚拟大集合/自由输入建议仍需独立合同，不能把30条有界结果当成完整虚拟化 |
| Tree、Virtualized Tree | List部分覆盖 | 有树/懒加载/虚拟列表；合同明确树模式尚不支持方向键导航，不能宣称完整Tree交互对齐 |
| TreeSelect、Cascader | TreeSelect 已覆盖有界树/层级选择 | List/ResourcePicker 组合，懒加载、派生路径、独立父/叶规则、清空和键盘；不承诺虚拟全球目录或隐式父子联选 |
| Transfer、ResourcePicker | ResourcePicker 已有 | Modal/PagedList、跨页待选区、搜索、不可用项、取消不回写；左右穿梭呈现仍是独立变体 |
| InputTag | TagsInput已有 | 和实体多选区分；补两者对照用例，不能用自由文本冒充商品/人员ID |
| DatePicker、DateTimePicker、TimePicker、TimeSelect | 日期基础已有；高级能力缺 | 单时间/区间、粒度、快捷范围、禁用区间、格式与时区边界；按合同扩展而非改State |
| ColorPicker / Panel | ColorPicker部分覆盖 | 盘点alpha、格式和面板使用需求；未验证选项不计已支持 |
| Mentions、Rate、InputOTP | 缺公共能力/用例 | 提及候选及键盘、评分值/只读、验证码粘贴/输入；认证和验证码校验仍由服务负责 |
| Upload | FileUpload 已有公共生命周期 | 原生选择/拖放、并发队列、附件、错误、取消/重试；进度仅来自真实适配器。现有文件服务仍负责生产传输、权限与资源删除 |
| RepeatFields / EditableProTable | ItemCollection、AutoForm、DataGrid有可复用基础 | 单个数组草稿、稳定行ID、行内字段校验、增删排序、统一保存；表格/卡片是呈现选项 |
| Table、Virtualized Table | DataGrid已有；PagedList支持轻量分页 | 不再造第三套数据表。补按任务验收的固定列/列设置/多选/编辑/服务端查询组合，缺什么按已有合同扩展 |
| ProTable / ProList / QueryFilter | PagedList、FilterBar、ActionBar及数据源部分覆盖 | 统一多条件查询、折叠字段、已应用条件、保存查询/呈现偏好；宿主仍拥有查询与请求 |
| Avatar、Badge、Tag、Card、Statistic | Bootstrap/区块模板 | 头像回退、徽标、指标与卡片无需一概注册组件；补真实数据/插槽示例 |
| Descriptions / ProDescriptions、Timeline | 可编辑View/区块 | 详情不做字段schema组件；联系信息、订单摘要、进度时间线自由HTML组合 |
| Image、ImageViewer | ImageViewer 已有 | 原生加载/失败/重试、图片组、缩放/拖动、键盘与焦点返回；裁剪/标注为后续变体 |
| Carousel | Bootstrap运行时已有 | 补数据绑定、懒加载、触摸、暂停及可访问用例；不重复写轮播引擎 |
| Collapse | Bootstrap运行时已有 | 补数据驱动折叠组与受控展开、键盘/焦点用例 |
| Calendar | 基础月/周/日浏览已有 | 月格、周/日议程、事件选择/范围、键盘和手机呈现；冲突/容量仍是预约模板业务规则。资源时间网格、拖排、周期规则、跨时区日历独立规划 |
| QRCode、CountDown、Copy | 待补通用显示/交互 | 优先成熟小依赖或原生API；与扫码识别、支付执行、服务器时间权威分开 |
| Tooltip、Popover | Bootstrap运行时已有 | 补声明式初始化/销毁及slot、键盘和触摸用例，不能只给hover示例 |
| Modal、Drawer | Modal/资源SidePanel/布局抽屉部分覆盖 | 通用模态抽屉与底部弹层需补一致开闭/返回结果/焦点协议，复用Bootstrap能力 |
| Alert、Message、Notification、Spin | Bootstrap、Toast、RequestState部分覆盖 | 区分即时消息与持久通知中心；后者为应用View，不是Toast变体 |
| Popconfirm | Dialog.confirm已覆盖模态确认 | 就地确认若确有复用再扩展；保留取消、焦点与异步失败行为 |
| Progress、Skeleton | Bootstrap进度/占位外观可用 | 补状态绑定、真实进度适配和骨架区块；不得用计时器伪造上传/后台任务 |
| Empty、Result | RequestState与状态View部分覆盖 | 补成功、无权限、离线、未找到、无数据、无查询结果的可用恢复入口 |
| Tour、Watermark | 未覆盖专项 | 新手引导需定位/跨步/焦点；水印不能当安全边界。基础任务后补 |
| ConfigProvider、App、Util | Bootstrap/State/翻译机制及utilities已有 | 补统一密度/主题/错误承载组合；不再建全局状态、翻译或配置引擎 |
| Chart、Kanban、编辑器、关系图 | 已有公共能力 | 补分析、项目和内容系统中的实际模板，避免已有组件无人示范 |

## 移动与小程序风格的额外基线

对照Vant的官方ActionSheet、Picker、PullRefresh、List、SwipeCell、AddressEdit、SubmitBar用例。移动端适配不止是把桌面列变成一列。

| 能力 | 当前缺口/计划 |
| --- | --- |
| Popup / ActionSheet / Picker | 通用底部模态层、确认/取消、单列/联动选择、键盘/返回与安全区；复用已有弹层底座 |
| PullRefresh / LoadMore | 刷新和加载更多的独立状态、失败重试、结束、取消和保留位置；不等同于虚拟窗口加载 |
| SwipeCell | 滑出动作、滚动手势冲突、取消确认与键盘替代入口 |
| Search / DropdownFilter / IndexBar | 触摸筛选面板、搜索建议/历史、分类/索引定位；复用选择器和查询状态 |
| NavBar / Tabbar / Safe area | Nav自适应已有；补软键盘、屏幕安全区、嵌套返回、滚动恢复与固定提交区用例 |
| Cell / Grid / Skeleton / Empty | 先提供Bootstrap区块和绑定模板；交互成熟后再抽稳定组件 |
| Quantity / Rating / CountDown | 复用通用值组件，补触摸目标与禁用边界，不做移动专属的重复API |
| Address / SKU / 商品卡 / Coupon / SubmitBar | 默认属于电商View/区块；基础依赖是级联选择、数量、图片、选择与固定操作区。业务规则自由编排 |
| 扫码、相机、定位、分享、支付、原生登录 | 平台适配项。当前HTML/DOM/State可做H5或小程序web-view，不代表直接支持原生WXML或其他原生运行时；另列桥接/适配合同与真机验收 |

## 场景覆盖规划

这些是建议扩展范围，不是已发布入口。场景可在既有系统内增加共享View/导航配置；只有独立任务和信息架构确有价值时才成为新系统。不会为每个行业复制一套后台外壳。

| 场景 | 至少能跑通的用户路径 | 主要新增依赖 | 当前状态 |
| --- | --- | --- | --- |
| CRM / 销售 | 线索→分配→跟进→客户→商机阶段→报价/合同→回款状态 | 实体选择、明细编辑、附件、日历；Kanban可复用 | 仅客户/订单/基础记录已覆盖，完整CRM待补 |
| 进销存 / ERP | 商品SKU→采购明细→收货入库→销售出库→调拨/盘点→退货→库存流水 | 重复明细、人员/仓库/商品选择、上传、打印模板 | 待补 |
| 电商管理 | 分类/规格/商品→上下架→订单处理→发货→售后→活动配置 | 级联、图片附件、SKU编辑区块、批量任务 | 待补；现有普通订单不算电商管理闭环 |
| 商城H5 / APP风格 | 首页→分类搜索→商品详情/SKU→购物车→地址→结算→订单/售后 | 移动弹层、数量、图片、固定操作区、加载更多 | 待补；支付仅接真实适配或标明未接入 |
| OA / 人事 / 审批 | 组织/人员→申请单→提交→审批/退回→通知→历史 | 树/实体选择、重复字段、附件、步骤/时间线 | 待补；权限由服务端强制 |
| 项目 / 工单 / 外勤 | 项目→看板/任务→指派→处理/附件→结果→报表；手机处理同一任务 | Kanban已有；补选择、上传、移动操作 | 部分底层可用，场景模板待补 |
| 预约 / 排班 / 服务 | 服务/资源→日历选时段→预约→改期/取消→执行/核销 | 日期时间、Calendar、资源选择、平台扫码适配 | 待补 |
| 内容 / CMS / 知识库 | 分类→编辑→素材→预览→发布状态→搜索/阅读/收藏 | 编辑器已有；补图片附件、搜索与内容布局 | 仅内容单页、笔记工作台，不算CMS系统 |
| SaaS / 组织管理 | 工作区切换→成员/邀请→角色权限矩阵→设置→审计 | 树/实体选择、批量操作、可恢复设置表单 | 待补；身份/授权不在前端模拟为生产能力 |
| 费用 / 应收应付 / 对账 | 明细单据→附件→校验→审批→状态/对账→打印导出 | 重复明细、附件、筛选、打印 | 待补；金额及财务规则由业务所有者负责 |
| BI / 运营分析 | 指标→筛选→图表联动→下钻→数据列表→保存视图/导出 | Chart/DataGrid已有；补查询组合和分析模板 | 当前仅指标概览 |
| 官网 / 门户 / 活动报名 | 首页→内容/产品→搜索→表单→确认/结果→个人记录 | 自然滚动布局、表单、图片与内容区块 | 待补完整系统 |

通用View库同时覆盖：标准/卡片/树表/分栏/看板列表，详情/主从单据，分组/弹窗/抽屉/分步/重复明细表单，登录/账号恢复展示，通知/搜索/文件库/个人中心，加载/空/错误/成功/无权限/离线。不同布局引用同一View；字段、动作和业务段落可直接改HTML。

## 建议执行顺序与验收门槛

1. **基线登记与既有问题**：按参考能力逐项落实去向、用例和缺口；修正已记录的独立包List失败，先诊断组件/测试边界，State仍须先沟通。不得把原生控件或未验证高级选项直接标为完整对齐。
2. **高复用能力第一批**：Select/RemoteSelect增强→ResourcePicker与TreeSelect/Cascader→RepeatFields→FileUpload/ImageViewer→日期时间→统一Tabs/步骤/表单承载组合。每项先通过真实最小任务，再验收公共合同。
3. **移动能力基线**：通用底部弹层/ActionSheet/Picker→LoadMore/PullRefresh→SwipeCell→安全区/软键盘/返回恢复；同时做可操作的商品选择/服务预约组合用例。
4. **其余框架覆盖**：查询/保存视图、Calendar、Mentions/Rate/OTP、图片裁剪/二维码、Tour等，逐项完成或保留明确缺口，不能用“其他”藏掉未实现项。
5. **场景系统第一批**：优先进销存完整单据和CRM销售闭环，再做商城H5+电商管理共享商品/订单View；这些是检验明细、选择、附件、移动能力的高价值组合。随后OA/工单/预约、CMS/SaaS/BI、门户等。

“框架基线完成”要求所有选定参考项有可核对处置和用例，通用关键缺口没有未说明空白；“场景完成”要求端到端操作路径通过。二者分别记录，不能互相代替。

每个能力/模板的关闭证据包括：直接绑定同一数据源、必要slots、完整值与事件合同、错误/忙碌/禁用、键盘/触摸、长数据、大/小宿主、default/ui-sm/ui-lg、普通/ui-link、浅/深、Hash刷新/复制/历史、草稿/取消/统一保存、无新增控制台异常。现有能力的复用也须实际验证；发现State缺陷保留证据并先沟通，不修改或在模板中绕过。

此盘点仅更新规划，不新增依赖、实现组件、创建空系统入口或提交发布。
