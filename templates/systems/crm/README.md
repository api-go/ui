# 云间客户关系

线索转客户、跟进记录、商机阶段与报价，复用同一组详情和编辑 View。

从 index.html 进入。右上角“外观设置”可切换本系统提供的布局、密度、链接外观和主题。布局只负责全局导航与滚动，通过既有View加载 blocks/content.html；11个业务View均为可编辑HTML。布局共用同一份View和crm_state，业务内容不受详情schema限制。布局在本系统 layouts/ 中，header 和少量工具共用 ../../shared/。View 使用明确的静态 file 路径；不依赖动态 file 属性。

## 主要页面

- 销售工作台：views/overview.html
- 线索：views/leads.html
- 客户：views/customers.html
- 销售漏斗：views/pipeline.html
- 报价：views/quotes.html
- 客户详情：views/customer.html
- 编辑客户：views/customer-edit.html
- 商机详情：views/opportunity.html
- 编辑商机：views/opportunity-edit.html
- 创建报价：views/quote-edit.html
- 报价详情：views/quote.html

## 数据与接入

商机编辑的客户字段复用 RemoteSelect，直接绑定 `crm_state.draft.customerId`。`crmCustomerLookup` 以 values 回显客户名称、以 query 搜索并限制返回数量；示例只查询本机虚构记录。生产接入用同一 load 协议调用现有授权 API，保存仍由商机动作负责。搜索文本不写入 Hash，也不另存一份客户选择值。

使用虚构数据与显式本机保存，写入 LocalStorage.crmTemplateData。Hash恢复页面、资源与已应用查询；未保存草稿不放URL。已保存数据只属于当前浏览器，新环境使用初始示例。切换布局保留草稿，离开编辑前确认；保存失败保留输入。接生产时替换本应用保存动作，授权、业务事务、上传、支付等由现有领域API负责。

模板无页面CSS，复用Bootstrap、ui-sm/ui-lg/ui-link、组件插槽和绑定。每个区域只有一个滚动所有者；小屏导航由AppShell/Nav处理，不另写抽屉。文本用master翻译标记，不另建词典。

通过同源HTTP(S)与 /ui 静态资源运行；不支持 file://。未更改State，不含假生产登录或支付。取用时先看本系统manifest，再取布局和需要的View；非业务状态逻辑不必重写。

虚构初始记录在 `data/fixtures.js`，业务动作在 `app.js`；依赖顺序和实际 Hash/存储字段见 manifest。
