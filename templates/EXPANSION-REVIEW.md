# 模板扩充验收 · 2026-10-29

本批交付 12 个新增场景系统、89 个独立业务 View，连同原有后台/移动/桌面系统共 15 个目录入口。入口在 `/ui/templates/index.html`；选择与最小取用路径在 README。State 文件 SHA-256 保持 `551d4f6ab76e8ddd46cf6aebde3c68179ecfcec6978f2be2467bb1c2406bcd98`。

## 场景与业务闭环

| 系统 | View 数 | 已验证的主要任务 |
| --- | ---: | --- |
| inventory | 9 | 商品明细、草稿、采购/销售/调拨/退货/盘点；过账联动库存与流水，库存不足保留草稿，重复提交保护，零盘点与空输入区分 |
| crm | 11 | 线索转客户、客户编辑、跟进、商机阶段、报价保存/发送标记/接受与下载 |
| commerce | 10 | 商品浏览、购物车数量、地址、确认订单、模拟发货/收货/取消；取消释放库存，失败重试不重复提交 |
| office | 6 | 请假/报销/采购申请、意见、驳回、修改、重新提交、通过/撤回、流程记录与费用汇总 |
| service | 6 | 工单筛选、指派、优先级、回复、解决/关闭/重开与知识文章 |
| booking | 5 | 日期/资源议程、容量与时段冲突校验、调整/取消、记录刷新 |
| projects | 7 | 任务编辑与 Kanban 共用已保存数据；卡片插槽、键盘编辑、统一保存与活动记录 |
| content | 6 | Markdown 编辑/预览、Ctrl/⌘ S、失败保留、收藏、发布/归档和文件信息记录 |
| saas | 8 | 邀请记录、重复邮箱检查、角色配置、最后一位管理员保护、组织资料、账单与本机操作记录 |
| analytics | 4 | 日期/渠道统一驱动指标、Chart、表格与导出；复制链接到新上下文恢复范围 |
| website | 7 | 自然文档滚动、官网/功能/价格/FAQ、登记与结果；方案意图进 Hash，确认放弃清空草稿 |
| patterns | 10 | 账户/恢复/验证码表单、个人资料、未读通知、跨内容搜索、文件下载/图片预览、六类页面状态 |

布局通过已有 View 加载同一份业务内容。新增系统使用侧栏/顶部导航，商城还使用 adaptive；官网使用自然文档流。布局版本是可取用的导航组合，不把重复外壳数量当作设计丰富度。数据为有界虚构记录，列表包含分页/筛选实例；缺数据时提供可操作空状态。

## 组件与 SOP 改善

- ItemCollection：公开 `newItem` 连接组件自己的 NewState；成功添加后模型与原生控件一同清空，对象字段不显示 undefined，取消仍保留输入。组件创建的对象行保持响应式，字段修改立即驱动合计；调用方提供的行保留原所有权。内部原生/拖拽事件不再冒充公开数组事件，保留原 API 与数组变更边界。
- Kanban：工具栏复用 ui-toolbar；背景、边框、定位使用 Bootstrap 类；装饰图标退出可访问名称；默认标题及模板 card 插槽提供原生键盘编辑入口；列宽跟随统一字体 token。隔离内部原生/Sortable change，修复真实拖动时空 detail 被误作整板数据的问题，保留公开数据与保存协议。
- 模板：所有页面使用 Bootstrap 类，没有页面 CSS/style；保留根级 ui-sm/ui-lg/ui-link 和主题机制。固定选项的身份值与可翻译标签分开，缩小为图标的搜索按钮保留名称。
- 视觉复核修正：窄表格逐字换行、卡片按钮折行、重复返回、顶部低频设置挤占导航、320px 大文字下辅助按钮出界、查询按钮可访问名称不匹配。
- 路由/草稿复核修正：看板未保存数据独立于已保存集合；同页切换资源时保留原草稿并提供继续入口；默认空查询不污染 URL；已应用搜索/筛选/页码可复制恢复。源文件为静态 View 路径，不依赖动态 `$file`。
- Interface-Design.md 已补充可读表格、真实控件裁切、低频设置收缩、数组添加后可见输入/派生值、异步重复提交，以及复合组件内部事件与真实拖拽的验收条件。

## 验收证据

环境：人类持有的 `.2`，`http://127.0.0.1:802`。未启动第二个 master、未构建/重启、未修改 State、未提交或反向同步。

| 检查 | 结果 |
| --- | --- |
| `template-systems` + `ui-templates.spec.ts` + `editor-resizer-components.spec.ts` | 108 项通过，覆盖既有系统、六个独立范例和组件合并/逐用例协议 |
| 新系统最终 `expansion.spec.ts` | 53 项通过，含 178 次页面/宽度加载、全部新布局、业务链、失败/重试、取消、复制 Hash、聚焦后退、同页资源切换、键盘保存、零盘点边界及看板/明细真实指针拖拽 |
| ItemCollection/Kanban `component-density.spec.ts` | 8 组通过：各自在 1280/390 下 sm/lg，含密度切换和控件几何 |
| 现有消费者 | DocEditor 协议、Account/Apps/Settings 页面与 Global Export 的 ItemCollection + TargetPicker 组合通过；Export 测试的独立 Table 夹具由测试清理 |
| 静态合同/密度检查 | 9 项通过：canonical mirror、依赖、JS、静态 View 路径、独立草稿、无页面 CSS 等 |
| 页面截图 | 89 View × 1280/390 共 178 张，按系统复查；详情成功状态另外由业务操作与复杂页面矩阵覆盖 |
| 独立外观组合 | 12 系统首页 288 张，加 8 类复杂 View 192 张；默认/sm/lg × 普通/ui-link × 浅/深 × 1280/390，几何扫描无溢出/裁切发现；截图复查表格/表单/看板/编辑器/结算/图表 |
| 更窄与放大文字 | 全部新系统在 320/390、lg、200% 根文字下顶部操作可达；这是文字放大与重排检查，不冒充系统浏览器缩放或完整无障碍认证 |
| 内置浏览器 | 实际添加/保存库存明细、窄屏商城、官网 More→FAQ、深色/lg/ui-link 与默认外观；已恢复默认外观和临时视口。实际截图：`assets/expansion-native.png` |

测试数量有重跑和交集，不能相加作为覆盖分数。完整 108 项检查后补充的六个用例包含在最终 53 项复验中。最终组件修复后，新系统、两组件协议、密度与既有消费者合并复验 72 项通过；目录单独 1 项通过，包含类型选项唯一和筛选恢复。UI 验收重点是能完成任务、读得懂、能恢复；没有将截图数量当作质量结论。

Playwright tracing 会向 CodeEditor 隐藏的 sandboxed about:blank iframe 探测脚本，产生一条可复现的浏览器安全拒绝消息；无 tracing 的 Chromium 和内置浏览器不产生该消息。测试只排除这条精确工具噪声，保留其他 console/page 错误断言，没有放宽 iframe sandbox。

执行示例：

```sh
MASTER_BASE_URL=http://127.0.0.1:802 PLAYWRIGHT_OUTPUT_DIR=/tmp/template-final-tests PLAYWRIGHT_HTML_OUTPUT_DIR=/tmp/template-final-html ./node_modules/.bin/playwright test tests/template-systems tests/ui-templates.spec.ts tests/editor-resizer-components.spec.ts
MASTER_BASE_URL=http://127.0.0.1:802 PLAYWRIGHT_OUTPUT_DIR=/tmp/template-verified-expansion PLAYWRIGHT_HTML_OUTPUT_DIR=/tmp/template-verified-expansion-html ./node_modules/.bin/playwright test tests/template-systems/expansion.spec.ts
MASTER_BASE_URL=http://127.0.0.1:802 PLAYWRIGHT_OUTPUT_DIR=/tmp/template-final-density PLAYWRIGHT_HTML_OUTPUT_DIR=/tmp/template-final-density-html ./node_modules/.bin/playwright test tests/component-density.spec.ts --grep 'Kanban|ItemCollection'
```

工作目录为 `TESTS/e2e/playwright`。同时运行的检查使用独立输出目录。静态检查从 master 运行 `node --test TESTS/frontend/ui-contracts.test.mjs TESTS/frontend/density-contracts.test.mjs`。

当前工作区另有其他任务的 Go、Sites、Round/训练和测试变更，混合的 `test-impact --base HEAD` 会保守选择全 Master。本报告仅声明本批前端路径及其消费者的验收，不代替这些并行任务的后端或全项目发布验证。相关源文件和预先存在的截图变更保持原状。

## 覆盖边界与后续变体

对照的是 [Tabler 官方示例](https://preview.tabler.io/)、[CoreUI Bootstrap 示例](https://coreui.io/demos/bootstrap/5.3/free/) 和 [Ant Design Pro](https://preview.pro.ant.design/) 的常见页面家族与实际任务。没有用控件测试页补凑业务 View，也没有宣称对持续更新项目的全部数量/功能完成认证。

已覆盖列表/详情/编辑、仪表盘、任务/看板、文档、组织/账单、账户/验证/恢复、通知/搜索/文件、错误/维护/空状态、官网/价格/FAQ与多类业务流程。以下仍在 UI-COVERAGE/UI-TODO 中：真实上传队列/取消/进度、通用实体多选/树选、交互月周日历、通用移动底部选择/手势、原生小程序适配，以及更深的行业和复杂报表变体。

本机库存、订单、审批、邀请和账户表单都不承担生产事务或授权。文件信息记录不冒充上传，验证码不发送短信，商城不付款。真实项目沿既有领域 API 接入；这些边界保留在系统 README/manifest 中。
