# 山野生活 · 商城

商品浏览、购物车、地址、订单与商品管理；提交扣减库存，取消订单释放库存。

从 index.html 进入。右上角“外观设置”可切换本系统提供的布局、密度、链接外观和主题。布局只负责全局导航与滚动，通过既有View加载 blocks/content.html；10个业务View均为可编辑HTML。布局共用同一份View和commerce_state，业务内容不受详情schema限制。布局在本系统 layouts/ 中，header 和少量工具共用 ../../shared/。View 使用明确的静态 file 路径；不依赖动态 file 属性。

## 主要页面

- 商品：views/catalog.html
- 购物车：views/cart.html
- 订单：views/orders.html
- 地址：views/addresses.html
- 商品管理：views/management.html
- 商品详情：views/product.html
- 确认订单：views/checkout.html
- 订单详情：views/order-detail.html
- 编辑地址：views/address-edit.html
- 编辑商品：views/product-edit.html

## 数据与接入

使用虚构数据与显式本机保存，写入 LocalStorage.commerceTemplateData。Hash恢复页面、资源与已应用查询；未保存草稿不放URL。已保存数据只属于当前浏览器，新环境使用初始示例。切换布局保留草稿，离开编辑前确认；保存失败保留输入。接生产时替换本应用保存动作，授权、业务事务、上传、支付等由现有领域API负责。

模板无页面CSS，复用Bootstrap、ui-sm/ui-lg/ui-link、组件插槽和绑定。每个区域只有一个滚动所有者；小屏导航由AppShell/Nav处理，不另写抽屉。文本用master翻译标记，不另建词典。

通过同源HTTP(S)与 /ui 静态资源运行；不支持 file://。未更改State，不含假生产登录或支付。取用时先看本系统manifest，再取布局和需要的View；非业务状态逻辑不必重写。

虚构初始记录在 `data/fixtures.js`，业务动作在 `app.js`；依赖顺序和实际 Hash/存储字段见 manifest。
