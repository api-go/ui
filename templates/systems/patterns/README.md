# 云间账户与通用页面

登录注册恢复与验证码、个人资料、消息、跨内容搜索、文件预览及常见错误状态。

从 index.html 进入。右上角“外观设置”可切换本系统提供的布局、密度、链接外观和主题。布局只负责全局导航与滚动，通过既有View加载 blocks/content.html；10个业务View均为可编辑HTML。布局共用同一份View和patterns_state，业务内容不受详情schema限制。布局在本系统 layouts/ 中，header 和少量工具共用 ../../shared/。View 使用明确的静态 file 路径；不依赖动态 file 属性。

## 主要页面

- 个人资料：views/profile.html
- 账户入口：views/login.html
- 消息：views/notifications.html
- 全局搜索：views/search.html
- 文件：views/files.html
- 页面状态：views/statuses.html
- 创建账户示例：views/register.html
- 账户恢复：views/recovery.html
- 验证步骤：views/verify.html
- 文件详情：views/file.html
- 可选资料设置向导：views/onboarding.html（StepForm + 同一份 profile 草稿；普通资料页仍直接编辑）

## 数据与接入

使用虚构数据与显式本机保存，写入 LocalStorage.patternsTemplateData。Hash恢复页面、资源与已应用查询；未保存草稿不放URL。已保存数据只属于当前浏览器，新环境使用初始示例。切换布局保留草稿，离开编辑前确认；保存失败保留输入。接生产时替换本应用保存动作，授权、业务事务、上传、支付等由现有领域API负责。

模板无页面CSS，复用Bootstrap、ui-sm/ui-lg/ui-link、组件插槽和绑定。每个区域只有一个滚动所有者；小屏导航由AppShell/Nav处理，不另写抽屉。文本用master翻译标记，不另建词典。

通过同源HTTP(S)与 /ui 静态资源运行；不支持 file://。未更改State，不含假生产登录或支付。取用时先看本系统manifest，再取布局和需要的View；非业务状态逻辑不必重写。

虚构初始记录在 `data/fixtures.js`，业务动作在 `app.js`；依赖顺序和实际 Hash/存储字段见 manifest。

files View 同时展示 FileUpload 本地接收器和 ImageViewer。本地接收器读取原始字节、保留 ObjectURL 并可下载核对；移除会释放 URL，刷新清空，不发送到服务器。生产项目只替换 upload(file,{signal,onProgress}) 适配器，保留组件队列和同一附件字段绑定。onProgress 只能报告实测进度，HTTP fetch 适配器没有字节进度时保持不确定状态。
