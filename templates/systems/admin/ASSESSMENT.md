# 后台管理模板：首轮交付与验收

2026-10-29。范围是已批准目录下的后台管理系统；其他模板族继续保留在 UI-TODO，未当作已交付能力。

## 验收结论修正

后续视觉复审已执行，当前结论、实际修复、独立组合证据及待确认的语言策略见 [VISUAL-REVIEW.md](VISUAL-REVIEW.md)。下文“未完成”是发现旧验收不足时的历史记录，不能作为当前执行状态。

本记录下方的浏览器数量是功能/呈现回归结果，不代表新版 Interface-Design.md 的完整视觉与可用性验收。此前矩阵代码把链接外观与 dark 使用同一变量，缺少浅色 ui-link 和深色普通的独立组合；默认密度也未纳入该矩阵。已保存截图不等于全部已人工审查，且未记录实际对比度测量、逐 View/逐维度结论和任务决策负担。此前“视觉通过”的概括过宽，现撤回该概括；已验证的交互和静态结果仍保留。

按新标准，后台系统的完整视觉验收状态为**未完成**。后续须补齐默认/sm/lg × 普通/ui-link × 明暗 × 桌面/手机的独立覆盖，对各类 View、弹层和状态逐项审查，测实际对比度与目标尺寸，走完代表任务，修复并复验后才能更新结论。此处不以 SOP 文档更新冒充该验收已执行。

当前增加客户工作台后，目录包含十三个 View，最新路由/分栏/翻译结论见 VISUAL-REVIEW.md 末节及 README。下述十二个 View 的描述是首轮交付快照。

## 设计与实现

入口 `/ui/templates/index.html` 只导航到独立系统。admin 有侧栏、顶部、混合三种布局；全部通过 `blocks/content.html` 挂载同一套十二个 View（十一种正常页面与一个未知路由恢复页）。业务 View 不重复加载脚本，不含 html/body，不拥有全局导航。布局拥有外壳和滚动区域，列表内部滚动，详情/表单在内容区域滚动。

页面覆盖概览、客户列表/详情/编辑、订单列表/详情、个人资料、界面偏好、操作记录、状态恢复、使用说明。客户支持搜索、多条件筛选、排序、分页、选择、批量跟进、新建、校验、编辑、关注和关联订单；订单支持推进、完成和取消确认。设置可保存/撤销；状态页可演示加载、空结果、失败重试、保存失败与重置。

使用 Bootstrap class，无新增页面 CSS 或 style 属性。复用 AppShell、Pane、Nav、PageHeader、PagedList、Pagination、AutoForm、Dialog、RequestState 等能力；布局/业务动作使用已有插槽，字段直接绑定一个应用 State，列表复用 ListDataSource。详情是可编辑 HTML 模板，没有重建 DetailView 组件或业务 schema 引擎。本轮未发现必须补充的共享组件。

虚构数据保存在当前 origin 的 LocalStorage.adminTemplateData；主题另存 adminTemplateDark。写入成功后才更新已保存快照；失败保留草稿。布局切换保留同一草稿，导航放弃需确认，浏览器返回可继续编辑；Hash 保存页面和列表查询。没有业务后端、身份/权限或支付模拟，也没有正式服务器保存的验收结论。

## 验收结果

- 23 个浏览器场景通过：新增 admin 13 个、现有模板 8 个、客户详情 2 个。最终执行 admin + ui-templates 为 21 passed (55.4s)，customer-detail 为 2 passed (3.4s)。
- 三布局 × 桌面/390px 手机完整操作；三布局的 sm/lg、明暗、普通/ui-link 组合与 200% 字号检查。验证内部滚动时底栏固定、表头/数据列对齐、无横向溢出、标题未裁切。
- 校验、创建/编辑保存重载、筛选恢复/浏览器返回、跨布局草稿、批量动作、取消确认、未知记录、真实 View 请求失败及公开 load() 重试、模拟保存失败保留草稿、重置均有行为断言。
- 7 个静态合同/密度检查通过；业务覆盖清单 14 个模块映射验证通过；相关变更 diff whitespace 检查通过。
- 原生应用内浏览器实际操作、布局切换及截图复核通过，最终普通页面 console error 为空。强制网络失败用例会产生 View 预期错误日志，不能与正常页面混淆。
- 另用临时 Python 静态 HTTP 服务映射 www，实际新建客户并保存到详情，console error 为空：不依赖 Master 的 HTML 转换或业务 API。临时服务已关闭。多文件 View 仍需同源 HTTP(S)，不支持 file:// 双击。
- State.js SHA-256 对照实施前结果一致。本轮没有改 State、共享组件或框架，没有提交、构建、发布或重启 Master。未执行整个 Master 的 Go 发布测试；工作区同时存在其他任务改动，未将其计入本轮交付。

复现：在 TESTS/e2e/playwright 运行 MASTER_BASE_URL=http://127.0.0.1:802 npx playwright test tests/template-systems/admin.spec.ts tests/ui-templates.spec.ts tests/customer-detail.spec.ts。在仓库根目录运行 node --test TESTS/frontend/ui-contracts.test.mjs TESTS/frontend/density-contracts.test.mjs 与 node TESTS/validate-business-coverage.mjs。

最终本机证据（临时路径，不是模板运行依赖）：`/tmp/admin-delivery.log`、`/tmp/admin-customer-final.log`、`/tmp/admin-delivery-report/`、`/tmp/admin-delivery/`、`/tmp/admin-delivery-desktop.png`。矩阵截图由测试保存。

## 自审发现与修正

| 问题 | 修正/约束 |
| --- | --- |
| 一套大页面不足以作为不同布局的参考 | 拆出三布局和同一组业务 Views；静态与运行测试检查复用关系 |
| 旧目录把独立页面误当作模板系统 | 首页只列可运行 admin；五个未来模板族标为待建设，无空链接 |
| 手机列表行堆叠而表头仍为三列 | 表头与行使用匹配列结构；新增列 x 位置断言 |
| 手机辅助目录按钮额外占一行 | 小屏保留图标和可访问名称，辅助布局文字隐藏 |
| 只有无溢出断言不能判定视觉合理 | 逐张审核代表性截图，检查空间分组、间距、列位与主要动作 |
| View 网络失败没有业务恢复入口 | 应用入口提供失败提示，通过公开 View.load() 重试；不改引擎 |
| 路由/布局变化可能丢失或复活旧草稿 | 单草稿所有权、明确放弃确认、返回继续编辑、保存失败保留；补回归 |
| 查询及本机保存边界不明确 | Hash 保存查询，LocalStorage 保存显式演示快照，README/页面说明数据边界 |

现行 Interface-Design.md 已明确截图与几何检查的区别，因此未为单一页面另建一套设计规则；本轮用列对齐回归落实该规则。

## 后续与待决项

1. mobile、desktop、content、website、commerce 系统尚未实施；六个旧独立示例保留为参考，迁移时复用其实际业务内容，不能声称它们已模块化。
2. 现有组件足以完成当前后台；RepeatFields、上传、RemoteSelect 等组件仍在 UI-TODO，待相应模板出现真实需求再提取，不因清单存在就预建。
3. 生产项目需替换 fixtures 和本机保存为真实 API，并落实真实鉴权/并发/服务端校验。模板不承诺这些能力。
4. 之前撤回的 DetailView 实验有两个旧 DocDB 文档待显式清理：`/_system/AI/Development/Frontend/DetailView.yaml`、`/_system/AI/Development/Frontend/DetailView.test.yaml`。本轮只记录，未擅自删库。
5. 当前无阻塞交付的待确认事项。没有扩大到 State 或其他底层框架调整。
