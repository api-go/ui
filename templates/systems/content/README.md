# 云间知识与内容

文档检索、Markdown 编辑预览、收藏、发布归档和素材信息；复用 CodeEditor 而非新造编辑器。

从 index.html 进入。右上角“外观设置”可切换本系统提供的布局、密度、链接外观和主题。布局只负责全局导航与滚动，通过既有View加载 blocks/content.html；6个业务View均为可编辑HTML。布局共用同一份View和content_state，业务内容不受详情schema限制。布局在本系统 layouts/ 中，header 和少量工具共用 ../../shared/。View 使用明确的静态 file 路径；不依赖动态 file 属性。

## 主要页面

- 文档：views/library.html
- 收藏：views/collections.html
- 发布管理：views/publishing.html
- 素材：views/assets.html
- 阅读文档：views/article.html
- 编辑文档：views/editor.html

## 数据与接入

使用虚构数据与显式本机保存，写入 LocalStorage.contentTemplateData。Hash恢复页面、资源与已应用查询；未保存草稿不放URL。已保存数据只属于当前浏览器，新环境使用初始示例。切换布局保留草稿，离开编辑前确认；保存失败保留输入。接生产时替换本应用保存动作，授权、业务事务、上传、支付等由现有领域API负责。

模板无页面CSS，复用Bootstrap、ui-sm/ui-lg/ui-link、组件插槽和绑定。每个区域只有一个滚动所有者；小屏导航由AppShell/Nav处理，不另写抽屉。文本用master翻译标记，不另建词典。

通过同源HTTP(S)与 /ui 静态资源运行；不支持 file://。未更改State，不含假生产登录或支付。取用时先看本系统manifest，再取布局和需要的View；非业务状态逻辑不必重写。

虚构初始记录在 `data/fixtures.js`，业务动作在 `app.js`；依赖顺序和实际 Hash/存储字段见 manifest。

编辑器的 Ctrl/⌘ S 与“保存文档”共用应用保存动作，失败保留草稿；阅读模式不进入文档传输 API。
