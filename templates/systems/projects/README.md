# 云间项目协作

列表与看板共用任务，复用 Kanban 的编辑、拖动和保存，并保留负责人、截止日期与活动。

从 index.html 进入。右上角“外观设置”可切换本系统提供的布局、密度、链接外观和主题。布局只负责全局导航与滚动，通过既有View加载 blocks/content.html；7个业务View均为可编辑HTML。布局共用同一份View和projects_state，业务内容不受详情schema限制。布局在本系统 layouts/ 中，header 和少量工具共用 ../../shared/。View 使用明确的静态 file 路径；不依赖动态 file 属性。

## 主要页面

- 项目概览：views/overview.html
- 看板：views/board.html
- 任务：views/tasks.html
- 团队：views/team.html
- 活动：views/history.html
- 任务详情：views/detail.html
- 编辑任务：views/editor.html

## 数据与接入

任务编辑的协作成员复用 RemoteSelect multiple，直接绑定 `projects_state.draft.collaborators` 的成员 ID 数组；搜索不修改保存值或 dirty 状态，选择/移除后随整份任务保存。`projectsMemberLookup` 是有界本机示例适配器，可替换为调用已有授权 API 的异步函数；按 values 回显名称、按 query 搜索，遵守 limit/signal。负责人只有四个固定选项，继续使用原生 select。

使用虚构数据与显式本机保存，写入 LocalStorage.projectsTemplateData。Hash恢复页面、资源与已应用查询；未保存草稿不放URL。已保存数据只属于当前浏览器，新环境使用初始示例。切换布局保留草稿，离开编辑前确认；保存失败保留输入。接生产时替换本应用保存动作，授权、业务事务、上传、支付等由现有领域API负责。

模板无页面CSS，复用Bootstrap、ui-sm/ui-lg/ui-link、组件插槽和绑定。每个区域只有一个滚动所有者；小屏导航由AppShell/Nav处理，不另写抽屉。文本用master翻译标记，不另建词典。

通过同源HTTP(S)与 /ui 静态资源运行；不支持 file://。未更改State，不含假生产登录或支付。取用时先看本系统manifest，再取布局和需要的View；非业务状态逻辑不必重写。

虚构初始记录在 `data/fixtures.js`，业务动作在 `app.js`；依赖顺序和实际 Hash/存储字段见 manifest。
