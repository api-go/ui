# 云间协作 · 官网

自然滚动的产品官网、功能、价格、FAQ、联系与登记结果，区别于后台固定工作区。

从 index.html 进入。右上角“外观设置”可切换本系统提供的布局、密度、链接外观和主题。布局只负责全局导航与滚动，通过既有View加载 blocks/content.html；7个业务View均为可编辑HTML。布局共用同一份View和website_state，业务内容不受详情schema限制。布局在本系统 layouts/ 中，header 和少量工具共用 ../../shared/。View 使用明确的静态 file 路径；不依赖动态 file 属性。

## 主要页面

- 首页：views/home.html
- 功能：views/features.html
- 方案：views/pricing.html
- 常见问题：views/faq.html
- 联系我们：views/contact.html
- 体验登记：views/signup.html
- 申请记录：views/result.html

## 数据与接入

使用虚构数据与显式本机保存，写入 LocalStorage.websiteTemplateData。Hash恢复页面、资源与已应用查询；未保存草稿不放URL。已保存数据只属于当前浏览器，新环境使用初始示例。切换布局保留草稿，离开编辑前确认；保存失败保留输入。接生产时替换本应用保存动作，授权、业务事务、上传、支付等由现有领域API负责。

模板无页面CSS，复用Bootstrap、ui-sm/ui-lg/ui-link、组件插槽和绑定。每个区域只有一个滚动所有者；小屏导航由AppShell/Nav处理，不另写抽屉。文本用master翻译标记，不另建词典。

通过同源HTTP(S)与 /ui 静态资源运行；不支持 file://。未更改State，不含假生产登录或支付。取用时先看本系统manifest，再取布局和需要的View；非业务状态逻辑不必重写。
