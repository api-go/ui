# 从完整模板开发界面

先打开 `./templates/index.html`，再读取最接近任务的 HTML。模板是可运行的起点；SOP、State 和实际使用的组件合同用于确认协议，不要求预读无关组件。

全局密度与工具栏参考 `./examples/density.html`：html/body 的 ui-sm/ui-lg 一处切换；显式 BS 尺寸保持优先；FilterBar、ActionBar、RequestState 与虚拟列表/表格一起运行。页面同样不需要 CSS。

## 选择模板

| 模板 | 类型 | 直接参考 |
| --- | --- | --- |
| 客户工作台 | 管理工作台 | `./templates/customer-workspace.html`：Hash 搜索、状态、资源选择、详情标签；SplitPane 自动 Resizer；LocalStorage 关注偏好 |
| 设置中心 | 管理工作台 | `./templates/settings-console.html`：AutoForm 整体两列、分组两列/三列、通栏字段；Hash 页面切换共享同一草稿；统一保存、撤销和错误恢复 |
| 写作工作室 | 交互应用 | `./templates/note-studio.html`：List、CodeEditor、Hash 编辑/分屏/预览；跨笔记保留草稿、统一保存、浏览器刷新保护 |
| 内容精选 | 自然滚动页面 | `./templates/content-catalog.html`：Bootstrap 响应式卡片；Hash 分类、搜索、排序和详情；LocalStorage 收藏 |
| 分页数据列表 | 管理工作台 | `./templates/records-table.html`：AppShell + Pane + PagedList；列表内部滚动、固定工具栏与分页；数据定义多条件筛选、独立排序菜单、可选表头与底部选择操作插槽；列表/卡片共用查询与 Pagination；灰色宿主控制区与组件区分开 |

这些 HTML 不包含 `<style>`、`style=` 或应用专用样式表。尺寸、滚动与响应式行为由公共组件承担，页面表达使用 Bootstrap 类。框架组件内部仍拥有必要 CSS；不要把内部布局规则复制回页面。

模板使用同源 `/ui` 资产，依赖完整列在 `<head>`。下载后仍需由提供这些资产的主机承载；不是包含框架资源的离线单文件包。模板数据和浏览器持久化边界有明确说明，没有假 API、假保存或支付行为。

## 多列表单的最小表达

```html
<AutoForm columns="2" $.state.data="page_state.draft" $.state.schema="formSchema"></AutoForm>
```

```javascript
const formSchema = [
  {name:'name',label:'姓名',type:'text'},
  {name:'email',label:'邮箱',type:'email'},
  {type:'group',label:'地址',columns:2,items:[
    {name:'city',label:'城市',type:'text'},
    {name:'postal',label:'邮编',type:'text'},
    {name:'address',label:'详细地址',type:'textarea',colspan:'full'}
  ]}
]
```

`columns` 是期望列数，支持 1–4；实际列数根据表单所在区域宽度自动降低。`$.state.columns` 可以响应状态变化。group 只组织布局，不创建嵌套数据或额外提交入口。`colspan` 按局部列数计算。详情见 AutoForm.yaml。

## 改造成业务应用

1. 保留最接近任务的结构，删掉无关功能。替换业务名、数据与 schema，不先修改组件内部布局。
2. Hash 只存可恢复的页面、资源、筛选和视图身份；不要把 editable draft 放进 Hash。宽度、收藏等持久偏好有独立 LocalStorage 字段。
3. 每个页面保留一个 module_state；一个独立保存边界对应一份草稿和一个稳定 dirty source。切换同一保存边界内的页面可以保留所有编辑；切换不同资源则使用 List/Nav 的 changebind 或文档化确认协议。
4. 模板的设置和笔记保存到浏览器。业务数据接入领域 API 时，替换保存适配器，等待服务器确认后清除 dirty；补 loading、error/retry、并发版本冲突与权限失败。不要把 LocalStorage 当作业务数据库。
5. 条件隐藏的字段不会经过原生 DOM 校验。业务跨页约束仍须由保存适配器和服务器验证；设置模板展示了隐藏分组必填数据的业务检查。
6. 验证宽窄屏、深浅主题、长内容、键盘、刷新、前进后退、保存失败与恢复。模板必须通过自己的应用级浏览器测试；不能仅凭截图判定可用。

## 下一轮能力顺序

1. AutoForm 已提供 validator 完整草稿同步/异步校验、setErrors 服务端字段错误和 revealfield 隐藏字段恢复协议；动态重复字段与步骤表单在此基础上跟进。服务器仍承担业务校验。
2. 数据管理组合：基于已有 FilterBar、ActionBar、RequestState，继续贯通分页、排序、列配置、批量动作和请求取消，复用领域 API 与 DataGrid，避免重造数据层。
3. 状态与恢复：统一 request-state 呈现、保存冲突与草稿恢复；自动保存必须解决并发写入和错误恢复后再开放。
4. 模板扩充：数据表管理、步骤任务、概览分析；每个模板都要求零页面 CSS、可运行数据边界及完整交互测试。
5. 固定模型和任务做独立生成对比，记录成功率、返工次数、文档读取成本和视觉评分，依据结果迭代，不预先宣称全面超过其他框架。
