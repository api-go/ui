# 云间经营分析

从 index.html 进入。右上角“外观设置”切换侧栏/顶部布局、密度、链接外观与主题。两种布局共用四个 View：overview、sales、inventory、report。

## 数据流

`data/fixtures.js` 提供 30 天的虚构日数据，`analytics_state.rows` 是只读快照，没有业务数据保存动作，也不写 analyticsTemplateData。`app.js` 从同一已应用日期/渠道范围派生指标、Chart 配置、汇总和明细；下载的 JSON 使用同一范围。

日期输入与渠道选择先留在控件草稿，点击查询后进入 analyticsFrom / analyticsTo / analyticsChannel Hash；analyticsPage / analyticsLayout 恢复页面和布局。复制链接到新浏览器可恢复相同只读报表。密度、主题、链接外观及侧栏宽度是浏览器偏好，实际字段见 manifest。

## 取用

先取需要的 View、app.js 中的筛选/派生与导出动作，再按 manifest 加载依赖。Chart 使用原生 Chart.js 配置；布局由 AppShell/Nav/View 组合，页面使用 Bootstrap 类，没有页面 CSS 或新图表映射引擎。接真实业务时由原有分析/查询 API 提供数据，不在浏览器重新实现数据库或权限。

通过同源 HTTP(S) 与 /ui 静态资产预览。需要更改布局时修改 layouts；业务区块仍是普通可编辑 HTML。
