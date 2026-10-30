# 本轮提交与反向同步 · 2026-10-30

提交范围：本轮组件、交互式模板、公开合同、应用层 UI SOP、对应回归和下一轮计划。保留 master 中其他任务的后端/Agent/Graph 改动及已有移动端预览图；不打 tag、不推送、不发布 npm，不升级独立 loader 包。

反向同步到 `../web/ui`，模板资源转换为包内相对引用，更新 ui.js 的新组件注册和依赖后构建。List 使用三方合并，保留独立包的 default-expand-depth、reveal-selected、expandmatches、expand-on-select 与全部原有测试，只合入新增 API/修复。该包仍使用原来的 State 快照，不以 master 的快照覆盖它。

验证：独立包 `npm run build` 通过（51 份合同、40 个公开组件、72 个模块）；`npm test` 的 160/160 组件密度合同通过。内置浏览器在独立包实际打开 OA 部门选择、改选、Escape 取消，原部门保留且控制台无相关错误。master 的合同/镜像检查通过；本轮上一阶段的 73 项业务回归及 144 个外观组合记录见 COMPONENTS-REVIEW.md。

当前混合工作区重新执行 master 全局静态检查为 8/9：未纳入本次提交的 `www/admin/factorization.html:33` 新增固定小号样式导致全局密度扫描失败。该页面属于其他既有工作，本次未改动，也没有将失败记为通过。已提交 UI 包的独立完整合同检查通过。

State 校验：master State.js 保持 `551d4f6ab76e8ddd46cf6aebde3c68179ecfcec6978f2be2467bb1c2406bcd98`；独立包 State.js/State.min.js 与同步前逐字节相同。未修改 State 源码、文档或独立包。

下一轮按 NEXT-ROUND.md 推进移动交互基础能力；本次仅保存计划，不把计划中的能力计为已经实现。
