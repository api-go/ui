> 当前结论以文末“导航与分栏复核修正”为准。此前截图数量及整体通过判断属于历史记录，已被用户复核指出的问题推翻，不能作为当前布局质量证明。

# 后台流程、移动与桌面模板迭代验收

范围：用户确认的六项计划——后台业务闭环、按需求复用、状态恢复、移动模板、桌面模板及入口选型。沿用已有前端框架；未修改 State，未新增页面 CSS，未提交、发布、构建或重启 Master。

## 实现与设计判断

| 任务 | 组合及状态 | 布局、主动作与收缩策略 |
| --- | --- | --- |
| 分步创建 | AutoForm + 同一 customerDraft，步骤在 Hash，最终一次保存 | 当前步骤/内容/动作分区，正文滚动；普通新建保持直接表单，分步流程是独立可选示例 |
| 客户导入 | 原生 file + JSON.parse → 映射 select → 一份 NewState 行草稿 → 校验修正 → 最终提交 | 不用重型 DataGrid；有限枚举用 select，错误可定位，行可跳过；步骤换行，主动作固定，手机表单单列 |
| 导出与结果 | 当前页/全部、字段选择、Blob JSON 下载；最近30次本机快照结果 | 不展示伪队列或进度；结果明确完成/跳过/失败，导出可再次下载生成时快照 |
| 移动应用 | bottom/stack 两布局共用后台实际 View、状态及数据源 | 四个根导航，低频功能集中“更多”；逐层详情隐藏底栏并可返回；业务列表自己分页/滚动 |
| 桌面工作台 | explorer/focus 共用编辑、待办、历史和指南；List/CodeEditor/SplitPane | 资源与正文独立滚动；自动 Resizer；窄屏保留面板；多份草稿切换不丢，一次保存所有笔记及待办 |
| 模板入口 | 3系统/7布局，关键词、类型、真实截图和源文件清单 | 只做导航，不嵌入预览应用；搜索/类型在 Hash，空结果可恢复 |

模板保持 ordinary HTML/Bootstrap/State，可自由移动业务区块。布局不包含业务字段。移动端直接引用 admin 文件；桌面从既有 note-studio 提炼 View，保留原单页链接。没有新增 schema 页面引擎、router 或 loader。

当前没有必须新增的共享组件：步骤页是两种不同业务流程，原生导航足够；文件选择没有真实传输队列。没有为“组件数量”增加 StepForm/FileUpload 外壳。需要真实上传、取消/重试/进度或复杂跨场景步骤生命周期时再补稳定组件及合同；生产 CSV/Excel、Editor、权限及任务调度由现有领域 API 负责。

## 恢复与保存边界

Hash 恢复页面、资源、已应用查询、排序、页码、模式、面板及任务/快照编号。LocalStorage 保存布局/外观偏好和明确保存的演示记录。未保存字段、文件内容、临时勾选不进入 URL。

创建/导入的复制地址缺少草稿时回到第一步，不能凭 URL 越过验证。导入返回映射后，映射不变保留行内修正；修改映射须确认重建。保存失败保留草稿，成功后不会因结果日志存储失败而重复写入客户。任务或快照只存在本机，其他上下文打开编号时显示恢复入口，不声称链接复制了数据或权限。

桌面笔记及待办共用 DesktopWorkspace 修改源，按钮与 Ctrl/⌘ S 使用同一保存函数；切换资源、页面、布局保留草稿。快照载入先确认，再成为未保存草稿。放弃恢复最近保存值；离开及刷新遵循修改保护。

## 本轮发现并修复

- 桌面从单页拆成 View 时漏掉 HTTP/View 依赖及 html 高度链，导致编辑区域高度为零。补齐入口；静态断言依赖/高度链，浏览器检查编辑区实际高度并真实编辑。
- 默认原生 select 在缺少持久值时没有选中标签。布局/页面初始化和外观默认值已明确；无选择与无效资源的提示区分。
- 创建步骤在数据补齐时由派生回退突然跳到 URL 的旧步骤。改为在路由恢复时显式规范非法阶段，用户输入不再隐式推进。
- Pane 工具区叠加宿主 ui-toolbar padding，造成双层边距。移除内部重复 padding，使用组件已有区域空间。
- 城市/状态不能让用户猜枚举文字。改用原生 select；保留导入文件无效原值和对应错误，以便修正。
- 立即截屏会采到延迟绑定和 Bootstrap 颜色过渡尚未稳定的字段/步骤。采证等待真实值、当前步骤样式、主题及编辑区几何，截图快进有限动画；不以过渡帧判断设计。
- Dialog 在显示动画完成前接收到测试 Escape，导致测试未取消。测试等待实际焦点进入弹窗并确认消失，再继续动作。
- 桌面 View 读取失败补充公开 load 重试，保留其他已挂载草稿；不靠整页刷新解决读取错误。
- 导出范围的长选项在 lg 手机下被截断：缩短为“当前列表页/全部客户”，筛选排序说明移到控件外。
- 桌面专注布局首次打开的工作页面 select 曾显示空白：显示值改用规范化路由 helper，用户选择仍直接写 Hash；增加初始值断言，无 State 修改。
- 历史恢复动作原在10条记录之后，手机需额外滚动：移到固定页首，选择快照后立即可操作，确认及草稿/保存边界不变。

## 验收覆盖与证据

最终本地前端影响集：68个独立浏览器场景通过（既有43 + 新增25），8个静态合同/密度检查通过，14模块覆盖映射通过，diff检查通过，State.js与实施前SHA-256一致。浏览器测试位于 TESTS/e2e/playwright/tests/template-systems/iteration.spec.ts，并回归 admin.spec.ts、ui-templates.spec.ts、ui-appearance.spec.ts；静态检查覆盖依赖、源码路径、复用、无页面 CSS、密度及合同一致性。没有执行或声称通过与本轮无关的 Master Go 全量发布门禁。

合并日志 /tmp/template-iteration-verified.log 为67 passed；新增View重试及控件调整后，新增场景完整回归 /tmp/template-iteration-closed.log 为25 passed，历史动作位置最后调整后的相关及布局复验 /tmp/template-history-final.log 为6 passed，导出复验 /tmp/template-export-final.log 为1 passed。重复执行不累计成独立场景。早期缺依赖/高度及测试时机、旧目录数量预期失败已修复；其失败日志不计为通过。

每个新布局在1280/390宽度覆盖默认/sm/lg × 普通/ui-link × 明暗12组合。新增独特结构另采证：导入文件/映射/错误修正/确认，创建三步，导出、任务列表/结果，桌面待办/历史/指南。已有后台 View 沿用同一实现并执行完整相关回归。另验证320px和200%文字重排；这些不等于原生浏览器缩放。

视觉复核已完成：34张12组合对照图，共408个新页面/布局呈现，逐组比较常态、错误、选择、禁用及真实控件；原尺寸另查看IAB桌面、手机及代表性表单。基础矩阵 /tmp/template-iteration-settled/，后续控件/导出更新证据 /tmp/template-iteration-closed/，历史动作最终证据 /tmp/template-history-final/，对照图 /tmp/template-iteration-final-sheets/。更新后受影响的选项、顶部选择和历史动作重新采证及复核。布局间距、信息层级、主题、主要内容空间、动作可达性通过本次专家自审；无已知阻塞/主要视觉问题，不把该结论等同于用户研究或完整可访问性合规。

另使用独立临时静态HTTP服务（不是另一个Master）实际打开三套入口，标题/正文正确、无翻译标记泄露、无页面脚本错误，桌面编辑器可见；已关闭该临时服务。证实这些本机示例不依赖Master业务接口才能加载。

IAB 实际操作：1280×960 键盘编辑、⌘S、刷新读回，原生外观菜单 lg/link/dark、Escape及焦点返回，390×844分屏；移动搜索Enter、刷新Hash恢复。临时视口已复原，总入口标签保留。原生截图在 /tmp/template-iteration-native/。原生缩放快捷键未改变页面比例，未将其报告为缩放通过；未进行正式读屏或完整 WCAG 合规评估。

文案使用 master 的翻译标记机制，未建立词典。测试仅修改本机虚构示例，不清理用户数据。后续 content/website/commerce、真正上传队列及正式辅助技术验收仍为另行范围；没有伪入口。


## 导航与分栏复核修正（2026-10-29）

此前验收偏重截图矩阵、几何和协议覆盖，漏掉了重复信息、布局版本的实际价值、导航是否便捷等应用层判断。用户指出的问题成立。本轮按责任层修正，而非增加页面 CSS 或修改 State。

| 用户反馈 | 当前处理 | 所属层 |
| --- | --- | --- |
| 强制深色下希望浅色 | 入口静态 dark light meta；共享 CSS 根据 data-bs-theme 声明 only light / dark，无动态 meta。Chromium WebContentsForceDark 开关对照截图一致；CDP 强制重绘及任意扩展不保证服从作者提示 | Bootstrap 集成与入口 |
| 资源区标题重复 | 删除“资源库/切换笔记保留所有草稿”，只留搜索和资源列表 | 桌面资源 View |
| 专注布局价值小 | 删除 focus；保留已有 CodeEditor 编辑/分屏/预览能力 | 桌面模板清单/布局 |
| 小屏列表缺统一入口 | SplitPane 使用列表图标打开同一份 Bootstrap offcanvas；选择、关闭按钮、Escape、焦点与生命周期统一 | SplitPane；AppShell 复用 |
| 侧栏不 fill、有背景、不能调宽 | Nav 透明并填满宿主；AppShell 内部 SplitPane/Resizer，宽度绑定 LocalStorage；客户分栏仍共用 SplitPane | Nav/AppShell |
| 顶部双行与重复菜单 | 单行；按真实宿主可用宽度测量，尾部放更多；横纵/rail/bar 共用 list/value/nav 数据和事件。取消页面重复的移动菜单 | Nav/后台 header |
| 移动逐层差异模糊 | 合并 bottom/stack 成 adaptive：<600 底栏、600–959 rail、960+侧栏；移动同一个 Nav 节点。详情属于业务层级，窄屏隐藏底栏；列表→详情→编辑按路由层级返回，复制/刷新仍能计算上一级 | AppShell/移动模板 |

当前目录为3系统5布局：admin3、mobile1、desktop1；README、manifest、总入口、AI取用文档和 TODO 同步。移除的版本不作为已发布数量。18个后台业务 View 继续由不同外壳复用，Hash、草稿和本机保存边界沿用原机制。

回归中修复：重复未变化状态写入使抽屉任务被连续推迟；抽屉开闭动画与快速再次打开竞争；动画中销毁提前 dispose；打开动画期间键盘焦点未进入抽屉；隐藏返回入口时曾误将条件加在详情 View 上，已改正并以真实正文保存/刷新回归验证。原生验收另发现分页数字按钮的可访问名称被写成字面 null，已改为数字标签并加协议断言。旧测试同步从 Browse/Detail、focus/bottom/stack 迁移到列表抽屉与 adaptive；视觉标准不以旧布局/截图数量为目标。

验收标准新增否决表，见 canonical `Doc/_system/AI/Development/Frontend/Interface-Design.md`。依据 Bootstrap 结构与状态，借鉴 Ant Design 水平菜单溢出与 Android 自适应导航的布局原则；没有引入这些框架的运行时。规范要求先看区域是否必要、选择是否容易和操作是否可达，再看间距/颜色/尺寸。

视觉检查：1280/390 下默认/sm/lg × 普通/ui-link × 浅/深，检查五种外壳及桌面列表抽屉。截图逐结构对比层级、边距、透明导航、单行顶部、列表空间、原生控件与固定分页；代表图以原尺寸复核。补充320/760、599/600、959/960断点、更多菜单及开闭中切页/调整宽度/销毁。联系单 `/tmp/navigation-review-sheets/`；实际原生浏览器截图 `/tmp/navigation-native/`。原生IAB验证更多导航、侧栏打开与选择关闭、资源抽屉显式关闭与焦点返回、移动底栏/rail/侧栏、侧栏拖动240→288及刷新保留。原生首次 Escape 验证未关闭，进一步定位为抽屉打开动画开始时焦点尚未进入；SplitPane 现立即将焦点移入抽屉，避免首个 Escape 丢失。修复后原生再次验证 Hash 回到 main、抽屉关闭、焦点返回列表图标；Playwright 同时覆盖该路径。

未修改 State.js（实施前后 SHA-256 一致），未重启人持有的 Master、未 build/提交/推送。canonical 文档由开发同步机制进入 DocDB，公开镜像通过 sync-ui-contracts.mjs 同步。未执行或声称通过无关的 Go 全量发布门禁。后续内容/网站/交易系统仍在 TODO，不能凭本轮结果宣称所有前端场景均已覆盖。


最终验证记录（修复后的相关复验覆盖原失败项，不累计重复运行）：

| 范围 | 结果与日志 |
| --- | --- |
| 导航/分栏协议、密度、交互、主题及外观矩阵 | `/tmp/nav-recheck-navigation.log` 27 passed；最终打开焦点/Escape修正相关 `/tmp/nav-docs-escape.log` 5 passed；快速再开/销毁 `/tmp/nav-transition-final.log` 3 passed |
| 后台18 View 与3布局 | `/tmp/nav-admin-complete.log` 26 passed、1旧测试错误；旧测试刷新后又点击已恢复打开的抽屉导致关闭，已修正，三个布局手机分栏重跑 `/tmp/nav-workspace-small.log` 3 passed。顶部密度变化后溢出重排的测试等待修正 `/tmp/nav-recheck-top.log` 1 passed |
| 移动/桌面/导入导出及目录 | `/tmp/nav-final-iteration.log` 19 passed、2移动详情失败；正文加载条件误改已修复，`/tmp/nav-mobile-fixed.log` 2 passed，最终层级返回/保存/复制 `/tmp/nav-mobile-hierarchy.log` 3 passed；目录与实际预览截图 `/tmp/nav-docs-gallery.log` 中相关3项 passed |
| 保留单页/统一外观 | `/tmp/nav-final-appearance.log` 18 passed；最终页码可访问名称和Nav协议 `/tmp/nav-final-accessible.log` 2 passed |
| 文档组合范例 | `/tmp/nav-layout-docs-final.log` 12 passed、1失败；内部分栏改为组合后修正旧测试的唯一元素假设，首个Escape焦点缺陷随后修复，`/tmp/nav-docs-escape.log` 中 AdminWorkspace documented page 通过 |
| 静态与边界 | 8个合同/密度静态检查、14模块覆盖映射、git diff --check通过；State.js SHA-256与实施前一致 |

仍需明确的支持边界：作者 color-scheme 无法保证约束强制重绘扩展；未做正式读屏或完整WCAG合规审计。本轮没有需要用户决定才能继续的设计阻塞。后续模板系统的业务与结构仍须各自验收，不继承一个“全部UI都通过”的笼统结论。

提交前主题方案简化：按用户要求保留静态 `dark light` meta，删除 Bootstrap 中创建/修改 meta 和行内 color-scheme 的逻辑，改由两条公共 CSS 读取现有 data-bs-theme。浅色仍通过 only light 提示退出自动深色；meta 在来回切换中保持不变。

提交验证补充：静态 meta/CSS 和 Nav 菜单稳定顺序的最终回归 `/tmp/ui-submit-final.log` 6 passed；静态检查8项通过。反向同步 `/Users/star/Case2/web/ui`，保留其 State 快照和版本号，按包目录修正资源/合同相对路径并登记新依赖，npm run build通过。独立包全量密度合约132/136，4项为原有List失败；在HEAD原始快照上复现相同3类失败（空summary间距、虚拟窗口、选中祖先展开），不是本轮引入，未修改List或State。最终受影响的Nav/AppShell/SplitPane/Pagination/PagedList 20/20通过。IAB实际验证包内明暗切换、宽窄More顺序/跳转，以及ui.min.js自动依赖与Hash导航。仅源码提交，未打tag、推送或npm发布。
