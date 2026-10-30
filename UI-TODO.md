# UI reuse roadmap: components and templates

## Next iteration plan

Mobile interaction baseline is next: Bootstrap Offcanvas based modal sheets/action results, then load-more/refresh using the existing data source, then swipe actions and navigation/scroll/keyboard recovery. Start from real commerce/booking/service consumers, keep shared Views and State unchanged. Detailed execution and acceptance are in `/ui/templates/NEXT-ROUND.md`; this is a plan, not a claim that mobile specialty capabilities are already complete.

## Continued component/template work, 2026-10-30

- [x] Website navigation uses transparent Bootstrap utilities and bold theme-aware current text, including overflow destinations; no yellow selection surface or page CSS.
- [x] RemoteSelect bounded single/multiple entity search, stable scalar/array binding, selected-label resolution, keyboard/IME, disabled/required, persistent retry, stale-response cancellation and disposal. Keep tree/lazy/large virtual directories separate.
- [x] Real consumers: CRM opportunity customer selection and project task collaborators; one draft/save boundary, failure/retry, refresh and names restored from IDs. AutoForm custom settings compose scalar and array selectors.
- [x] ResourcePicker, TreeSelect/Cascader, FileUpload, ImageViewer, StepForm and Calendar now have executable contracts and real template consumers. DatePicker supports native time/datetime/month/week; repeated row validation extends ItemCollection instead of adding a parallel model. See `/ui/templates/COMPONENTS-REVIEW.md` for this round's final evidence and boundaries.
- [x] Existing Graph integration rechecked on .2: graph.spec.ts now passes the complete graph/node/edge management consumer. The earlier backend failures remain historical evidence in LOOKUP-REVIEW; no backend or State workaround was added.

## Authorized template expansion delivered, 2026-10-29

The user authorized autonomous implementation against mature open-source template collections, with State unchanged. Compare template families and complete tasks, not just component names or page counts. Reference families: Tabler's official preview, CoreUI Bootstrap demo and Ant Design Pro. This batch adds explicit editable Views; it does not introduce a page schema, renderer or new state framework.

- [x] Implement initial independent systems: inventory, CRM, commerce, OA, service desk, resource booking, project collaboration, content, organization/accounts, analytics, website and common account/utility pages.
- [x] Preserve static View paths, shared business Views across each system's layouts, Bootstrap classes, translation markers and browser-local fixture boundaries.
- [x] Complete business lifecycle acceptance, failure/retry and discard recovery, stock/booking constraints, shared list/detail/summary consistency and copied Hash restoration.
- [x] Review every View at desktop/mobile sizes and independent default/sm/lg × ordinary/ui-link × light/dark combinations; fix actual visual/interaction defects.
- [x] Publish catalog entries with real previews and AI selection recipes, then update coverage evidence and remaining variants honestly.
- [x] Run affected template/component protocols, density geometry and consumer checks; verify State hash and preserve unrelated work. No automatic commit or reverse sync in this batch.

Result: 15 system entries including 12 new systems and 89 new business Views. 108 combined browser cases passed earlier; after the final component fixes, 72 cases passed including all 53 expansion cases, component protocols/density and existing consumers. The catalog filter gate also passed. ItemCollection/Kanban passed 8 density geometry cases and combined/individual protocols. All 89 Views were inspected at 1280/390; 480 homepage/complex-view appearance captures cover all 12 independent density/link/theme combinations. 320/390 enlarged-text header checks and native in-app browser tasks also pass. Full evidence, the exact scope and remaining advanced variants are in `/ui/templates/EXPANSION-REVIEW.md`. The browser counts overlap and are not additive.

Richness target: cover common business and utility tasks with runnable examples. Numerical parity with an evolving external collection is not a claim of feature parity. Advanced scheduling, true upload transport, production authentication/payment and native mini-program adapters retain their separate ownership and acceptance requirements.

## Framework coverage research baseline (2026-10-29)

The initial research compares mature UI frameworks and records component gaps in [UI-COVERAGE.md](UI-COVERAGE.md). The subsequently authorized template batch above supplies runnable consumers using existing capabilities; broad component variants and native mini-program support remain separately tracked. Do not block useful templates on implementing every possible component, or count a template as proof of every advanced component variant.

- [x] Inventory current contracts and published systems; compare official Ant Design, Element Plus, ProComponents, Vant and mini-program reference families.
- [x] Classify each capability family: existing, partial, native/Bootstrap composition, new public behavior, editable View/block, platform adapter or later specialty.
- [ ] Expand the family matrix into per-capability variants and runnable acceptance cases; do not equate shared names with feature parity.
- [x] Standalone List baseline diagnosed and repaired in ../web/ui only: summary spacer, selection-triggered virtual-window reset, initialized default field names; correct the initial mixed-case state binding fixture. In-app browser: 31 combined cases and all three formerly failing cases independently pass. No State change or bulk reverse sync.
- [x] First shared-capability batch: bounded searchable single/multi Select, confirmed resource/tree/cascade selection, repeated detail row validation, host-adapted upload queue/image preview, native date/time and retained step composition. Advanced variants stay in UI-COVERAGE.
- [ ] Mobile baseline: modal bottom sheets/actions/pickers, load-more/pull-refresh, swipe actions, safe area/keyboard/back and scroll restoration. Preserve existing responsive Nav.
- [ ] Remaining framework coverage: advanced query/view preferences, scheduling calendar, mentions/rating/OTP, media extras and onboarding; each retains its own acceptance entry.
- [x] First scenario batch: inventory purchase/stock/sale documents; CRM lead/opportunity/quote follow-up; commerce storefront and management using shared business Views.
- [x] Common scene systems: OA approval, projects, service desk, booking, CMS, SaaS, BI, website/contact and account/utility pages are runnable. HR/payroll, field-service device workflows and financial reconciliation remain distinct future variants, not claims made by these templates.
- [ ] Explicit platform track: H5/web-view patterns first; native mini-program runtime/scan/location/share/login/payment need separately scoped adapters and device acceptance.

Every batch follows Interface-Design.md. Details/SKU/address/approval layouts remain editable Views by default; stable value/event/lifecycle behaviors become components. No new page-schema engine, global state store or duplicated layout implementations.

Delivery baseline, 2026-10-29. After the admin delivery, the user authorized the next six-part iteration: business workflows, evidence-driven reuse, recovery boundaries, mobile, desktop and catalog selection. Admin/mobile/desktop are now implemented; content/website/commerce and the unproven component backlog remain future directions. Preserve State and unrelated work. Follow Templates.md and Interface-Design.md.

## Approved template architecture

The user confirmed this architecture and authorized the admin implementation. Data Detail remains an editable View/page template, not a shared schema-rendering component. Existing primitive layout components remain useful inside layout templates.

| Layer | Responsibility | Must stay separate |
| --- | --- | --- |
| Components | Stable values/events, interaction state/lifecycle, scrolling/resizing; existing Bootstrap/State integration | No application page schema or arbitrary business placement |
| Layout templates | Navigation placement, global header/footer, content regions, responsive pane selection and scroll ownership | No customer/order fields, business data loading or page-specific actions |
| View templates | Editable business content, field/section placement, State bindings and page actions; compose existing components | No html/body or viewport shell, duplicate framework loading or global navigation |
| Block examples | Optional small HTML sections such as contact details, metrics and timeline nodes | Not automatically a registered component or mandatory runtime module |
| Interactive demo systems | Curated layouts + shared Views + explicit local fixture state + routes and navigation | Not a new renderer, builder DSL or simulated production backend |
| AI catalog | Purpose, layout/View/block role, files/dependencies, compatible host/scroll profile, interactions and preview/source references | Catalog entries describe ordinary files; they do not define another UI schema |

The earlier root-level layouts/views/demos proposal is superseded by system-oriented packaging: the gallery opens an independent system entry, which loads its layout and business content through View. Each system has its own layouts/, views/, blocks/, data/ and assets/. Multiple layouts in a system reuse the same business View files. A layout owns chrome and scroll regions; Views own business content. Existing framework/component assets remain shared under /ui. No new rendering DSL, router or general loader is planned.

### Approved directory structure

```text
www/ui/
  components/                       # stable public capabilities
  templates/
    index.html                      # system navigation only
    manifest.json                   # system catalog, not UI schema
    README.md                       # AI: select system -> layout -> View
    systems/
      admin/
        index.html                  # independent entry; loads layout via View
        manifest.json               # layout/page files, dependencies and boundaries
        app.js                      # system navigation/state initialization
        layouts/
          sidebar.html
          topnav.html
          mixed.html
        views/
          home.html
          customers/list.html
          customers/detail.html
          customers/edit.html
          orders/list.html
          orders/detail.html
          settings/profile.html
          settings/preferences.html
          states/empty.html
          states/error.html
        blocks/                     # application HTML fragments, not components
        data/fixtures.js             # explicit local demo data/actions
        assets/                     # only system-specific static assets
      mobile/                       # same per-system organization
      desktop/
      content/
      website/
      commerce/
TESTS/e2e/playwright/tests/template-systems/  # application-level scenarios
```

The root is a catalog, not the shell of all systems. Each system index loads framework/component dependencies once, initializes system-owned state, and mounts its selected layout through View. Layout fragments mount business Views using the existing View contract. A page View has no html/body, repeated framework scripts or independent viewport shell. Assets/blocks/data directories are added only when files are actually needed, not as empty scaffolding. No central business-View registry is introduced; independence is per system. Shared component behavior remains in /ui/components rather than copied between systems.

### Initial system coverage

| System | Layout versions | Required interactive examples |
| --- | --- | --- |
| admin | side navigation, top navigation, mixed navigation | home/dashboard, customer list/detail/edit, order list/detail, settings, history, recoverable states |
| mobile | bottom navigation, drill-down/detail stack | home, search/list, detail, form, notifications, personal center; touch-oriented navigation |
| desktop | multi-pane, editor/workbench | resource browser, editor/preview, tabbed drafts, tasks/board; pane resizing and state retention |
| content | category/sidebar, reading-focused | home, catalog, search, article/detail, author/profile and reading navigation |
| website | top navigation, section/landing | home, product/features, pricing presentation, FAQ and contact form with clearly local submission boundary |
| commerce | catalog-focused, purchase flow | product list/detail, cart, checkout form, order detail; local demo transitions and no real payments |

Account entry/recovery presentation, history, empty/loading/error/access-denied examples are included where relevant; they do not simulate secure production authentication, authorization, uploads or payments. Only completed systems/pages appear as runnable catalog entries; planned work is labeled and has no dead-end navigation. Each displayed action has a real bounded local effect or a clearly stated unavailable capability.

### Current inventory and actual gaps

Six current complete HTML examples exist: customer-workspace, records-table, customer-detail, settings-console, note-studio and content-catalog. They cover useful interactions and broad responsive page types. They are not yet a reusable set of separate layout shells and business View fragments. Mobile adaptation is not equivalent to a mobile-specific layout family, and the current writing workspace is not a full desktop layout collection.

- [x] Define the admin host/View boundary: flow content versus self-scrolling workspaces, one scroll owner per region, route ownership, state initialization and disposal, dependencies and supported host widths.
- [ ] Layout families: admin side navigation, admin top navigation, admin mixed navigation, desktop resource/editor workspace, mobile adaptive navigation with drill-down routes, natural content shell.
- [ ] View coverage: dashboard; searchable/paged records; free-form detail; record editor; grouped settings; history/timeline; resource library; notifications/inbox; multi-step task; calendar/schedule; sign-in/account recovery presentation; personal center; empty/error/access-denied recovery; content/article/catalog.
- [ ] Reuse existing example content first. Do not build every layout/View combination or duplicate Views per layout. Declare compatibility where interaction/scroll requirements genuinely differ.
- [x] Present admin as selectable system/layout versions with navigation and real local interactions; link each layout, View and dependency source so AI can copy the appropriate parts without guessing.

### Preview/runtime decision

Verified current implementation: View calls HTTP.get for text; HTTP uses fetch. Preview the multi-file library over same-origin HTTP(S); a static file server suffices. No server-side HTML rendering, business API or Master runtime is required for a portable local-fixture demo once its assets/paths are served correctly. Current examples use /ui asset paths, so the static root must map them or a portable copy must adapt paths. Do not promise double-click file:// compatibility. Offline single-file packaging is a separate optional project, not a prerequisite or reason to change State.

View currently loads once per instance and deduplicates scripts at document scope; it does not provide isolated instance globals or automatic reload when file changes. Plan composition using its existing contract, unique state namespaces and explicit initialization; do not assume new loader or engine behavior. Each system declares persistence explicitly; admin labels browser-local fixture snapshots and preferences. API integration belongs to the eventual application.

### Delivery TODO after plan/directory confirmation

1. [x] P0 (admin scope): confirm this plan/directory; document layout/View scroll profiles, state namespaces, navigation, View loading/deduplication, dependency ownership and catalog fields. Inventory the six existing reference pages and preserve their tested interactions; migration into later systems remains pending.
2. [x] P1: deliver the independent admin system first. Side-navigation and top-navigation layouts must consume identical customer and settings View files. Add home, edit/order/history/recovery Views and mixed navigation, with useful real interactions. Complete the catalog's source/preview/AI-recipe links.
3. [x] P2: mobile adaptive navigation directly shares admin business Views; desktop explorer shares editor/tasks/history, migrated from note-studio. Preserve drafts and route state; no copied customer pages or second rendering engine.
4. [x] P3: deliver content, website and commerce systems, plus their relevant account/task/error examples. Reuse common component capabilities, not copied business state or a new page-schema engine. See the authorized expansion above.
5. [ ] Throughout: discover missing capabilities from real template scenarios. First check Bootstrap and existing components; implement a stable shared component only when necessary, with YAML, executable protocol cases and visual/consumer checks. Use editable Views/blocks for presentation variations. Ask only for missing material authority; State changes always require prior communication.
6. [x] Admin acceptance (repeat for each later system): working navigation, search/select/edit/local save and reload boundaries as applicable; Hash refresh/back-forward; data/draft ownership; no duplicate View scripts or globals; loading/empty/error/retry; keyboard, themes/density, wide/narrow hosts and zoom; no dead actions, overflow or new console errors. Save actual screenshots and results.
7. [x] Admin catalog and handoff (repeat for later systems): AI-facing catalog identifies matching system/layout/View, dependency/source files, data/persistence boundaries and adaptation instructions. Update SOP discovery to template-first targeted reading, retain required State/component/security contracts, and leave an explicit remaining-gap list. No automatic commits, publishing, loader upgrades or State modifications.

Initial admin delivery had thirteen Views; this iteration grows to eighteen. Three layouts share one dispatcher. The catalog remains navigation-only. Six standalone examples remain references; note-studio has also been reorganized into the desktop system. See admin/ASSESSMENT.md for the earlier baseline and ../../ITERATION-REVIEW.md for this iteration.

## Authorized workflow/system iteration, 2026-10-29

- [x] Admin grows to18 Views: optional multi-step creation uses AutoForm and one draft; JSON import includes mapping/correction/skip and explicit commit; actual JSON export has scope/fields and repeatable snapshot download; result list/detail distinguishes completed/skipped/failed items.
- [x] Recovery cases: missing resource/task, out-of-range query, duplicate emails, bad file, failed save/retry, navigation cancellation, unchanged mapping retains corrected rows; current detail outside the list page stays visible with explanation.
- [x] Mobile: adaptive bottom/rail/sidebar navigation and drill-down routes; shared admin Views and local data, query/resource restoration, edit/save, root/more organization.
- [x] Desktop: resource SplitPane/Resizer and narrow list drawer; CodeEditor modes, retained drafts, tasks, one save boundary, Ctrl/⌘ S, snapshot-to-draft recovery and failure/discard flows.
- [x] Catalog: keyword/type selection, real previews, layout counts, source/manifest/recipe links and explicit unpublished directions.
- [x] Reuse decision: current workflows need native file/select/checkbox, List, AutoForm, Pane and existing editor capabilities. No new generic component is justified yet. FileUpload's real transport queue and StepForm's cross-consumer protocol remain separate future gaps, rather than aliases for one JSON task page.
- [x] Final evidence and visual review: 68 unique browser scenarios,8 static checks and coverage mapping pass; 34×12 visual comparisons reviewed, affected final controls rechecked. See `/ui/templates/ITERATION-REVIEW.md`. State unchanged; no commit/build/restart.

This iteration does not implement production CSV/Excel parsing, server upload/progress, authorization or background queues in the browser. Those belong to existing Table/Editor/domain APIs. Content, website, commerce and formal assistive-technology compliance remain separately scoped work, not hidden completed entries.

## Stable component capabilities

- [x] RepeatFields — ItemCollection + AutoForm/native named controls; stable row errors, validation, focus, reorder and stale-result protection; inventory remains one array draft and save boundary.
- [x] FileUpload — native selection/drop, bounded queue/concurrency, optional measured progress, cancel/retry and existing attachments. Host adapter owns server storage/authorization. patterns shows an explicitly local receiver with original-byte download, not a fake server upload.
- [x] RemoteSelect bounded single/multiple values, ID/label restoration, keyboard/IME, required/disabled and async recovery; CRM/projects/AutoForm consumers verified. Free-text TagsInput remains distinct; virtualized and tree/path selection remain separate gaps.
- [x] StepForm — retained slot panels, forward native/AutoForm/async validation, backward retention and cancellation; one host save. patterns/onboarding is optional; simple profile remains a direct form.
- [x] Query toolbar assessment — existing PagedList filterfields + FilterBar already cover current multiple conditions, host query drafts and Hash-applied values; existing analytics/CRM/inventory regression verifies this. Saved queries/advanced preference management remain a separate variant; no second query engine added.
- [x] ResourcePicker — Modal + PagedList with pending IDs, across-page search, optional custom content, async validation, confirm/cancel and bounded selected area; CRM quote and inventory consumers.
- [x] TreeSelect / Cascader — List + ResourcePicker, independent parent/leaf rules, lazy retry/cancellation, derived path and native directional keyboard; inventory category/OA department consumers.
- [x] ImageViewer — native image lifecycle, grouped navigation, zoom/pan, keyboard and return focus; commerce/patterns consumers.
- [x] Calendar basic interaction — month grid, week/day agendas, local-date/range/event protocol and keyboard; booking retains capacity/conflict rules and Hash date/mode. Resource time-grid dragging and recurring schedules remain future capabilities.

## Editable template library

- [x] Customer detail — `/ui/templates/customer-detail.html`: ordinary section/dl, Bootstrap columns, direct State bindings and application-owned actions. The DetailView component experiment was withdrawn; no field schema or component slots are required.
- [ ] Other detail variants — admin order detail delivered; product/account details pending; reuse layouts as starting points and freely insert or move business sections.
- [x] Admin history presentation — editable nodes, labels, status, time and business actions. Extract a component only if shared interaction/lifecycle requirements emerge.
- [x] Step-task pages — admin creation/import provide step header, content and action layouts using AutoForm/native controls and one draft. A generic StepForm remains conditional on a stable cross-consumer lifecycle need.
- [x] Admin analytical overview (metrics and summaries; chart-rich variants remain future) — metric, chart and summary sections; compose existing Chart and Bootstrap.
- [ ] Scheduling workspace — compose a calendar capability with application-specific event details and actions when a real project selects it.

Templates live separately from components under `/ui/templates/`, with an HTML gallery and manifest.json. Templates may use components, but are not registered APIs. The approved system plan above determines subsequent work; the original component backlog is an input, not a requirement to build every component regardless of actual template need.

## Trial correction and cleanup

The first DetailView trial optimized schema brevity before establishing whether layout customization justified a component. Stable behaviors remain components; editable business structures are templates. The customer example now demonstrates the latter and is verified with page-level tests.

Previous standalone-template acceptance: 10 browser regressions passed (customer binding/routing/preferences/responsive modes and existing template gallery/pages), 6 static contract/density checks passed, and in-app browser interaction/console review passed. State and existing shared components were not changed. No commit, rebuild or restart was performed.

Removed disk sources do not automatically delete built-in DocDB documents. The two obsolete experiment paths require explicit DocDB cleanup (do not recreate compatibility aliases):

- [ ] `/_system/AI/Development/Frontend/DetailView.yaml`
- [ ] `/_system/AI/Development/Frontend/DetailView.test.yaml`

## Admin visual follow-up, 2026-10-29

- [x] Independent default/sm/lg × ordinary/ui-link × light/dark evidence; real View/region visual inspection and representative task review. See `/ui/templates/systems/admin/VISUAL-REVIEW.md`.
- [x] Fix dark outline/input contrast, readable pagination captions, navigation labels, narrow mixed-layout space, dashboard task order, detail return/edit priority and selected-row text contrast. State unchanged.
- [x] Language policy confirmed by user: master owns automatic translation/files; ensure UI strings use `{#...#}`. Do not add a template dictionary or translation service.
- [x] Add a reusable customer master/detail workspace: SplitPane + automatic Resizer, shared list/detail Views, Hash pane/selection/view/query recovery, LocalStorage width preference, independent-context copied-link tests. Record the Table module capability comparison in the template README.
- [ ] Optional formal accessibility gate: native target-browser zoom and assistive-technology review; do not call current evidence full WCAG certification.

- [ ] Future domain templates informed by Table: real API-backed import/export, backup/recovery presentation, saved analyses and chart workspace. These are application Views/workflows, not client-side replacements for TableDB or SQL services.


## 2026-10-29 用户复核后的导航修正

- [x] 合并缺乏独立任务价值的 desktop focus 和 mobile bottom/stack 版本；当前 3 系统、5 布局（admin 3、mobile 1、desktop 1）。移动“逐层”是路由行为，不再当作布局卖点。
- [x] Nav 共享 list/value/nav 协议，支持横向溢出菜单、纵向、rail、bar；顶部保持单行，按实际宿主宽度计算。
- [x] AppShell 复用 SplitPane 的抽屉和 Resizer；透明填满导航区，宽度偏好保留。资源列表小屏统一列表图标，不复制 Browse/Detail 开关。
- [x] 删除资源区重复标题/说明，移动 header 提供返回时移除 View 中重复的常规返回入口。
- [x] 静态 dark light meta + 共享 CSS 从 data-bs-theme 声明当前 color-scheme，无动态 meta；标准浏览器自动深色可退出，第三方强制重绘不能保证。
- [x] 规范加入有明确否决条件的导航/分栏验收表；组件协议、真实任务、动画中切页/销毁、断点边缘与视觉审核共同作为证据。
- [ ] 内容/网站/交易等后续系统仍按原优先级推进；本轮不靠增加空外壳扩充数量。
