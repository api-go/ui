# Management workspaces

Use for records, operations, configuration and review. Fill the host and keep navigation, filters and actions stable while results and details scroll independently. Management describes the task, not the end-user identity.

Read SOP.md (Development-SOP.md in the public host), State.yaml, Bootstrap.yaml and each selected component contract.

## Shared layout rules

- Choose one page type before markup. A product may contain multiple types.
- Use Bootstrap utilities and theme-aware semantic colors. Grid is appropriate for content/form columns; Flex is appropriate for bounded workspaces. Necessary reusable sizing and breakpoint rules belong in the framework.
- A workspace fills its bounded host. Only its outer document shell uses viewport height. Intermediate regions must shrink on both axes.
- Assign one scroll owner per content region. Use Pane scroll=auto for ordinary content; scroll=none around self-scrolling List/DataGrid/editors or another layout.
- Keep headers, toolbars and footers outside their region's scrolling body. Do not create competing nested scrollbars.
- Route state belongs in namespaced Hash fields; layout preferences belong in namespaced LocalStorage fields; temporary requests and drafts belong in one module_state.
- Navigating to a different resource must pass the documented dirty guard. Hash does not perform authorization or confirmation.
- Restore a route by loading and validating its resource. Unknown, missing or denied resources produce a visible state and a recovery action, never a misleading selection.
- Long text, large collections, narrow hosts, keyboard use, zoom and both themes are required boundary states.

## Composition recipes

| Task | Composition | Scroll owner |
| --- | --- | --- |
| Resource browser | AppShell + SplitPane + Pane + List + detail | List and detail Pane independently |
| Filtered records | AppShell + Pane + PageHeader + toolbar + DataGrid/table + footer | DataGrid, or Pane for ordinary table |
| Configuration | AppShell + Pane + PageHeader + grouped AutoForm + footer | Pane body; save remains in footer |
| Dashboard | AppShell + Pane + responsive Bootstrap sections | Pane body |

SplitPane automatically provides its resizer. Bind width to a stable LocalStorage preference. Bind navigable selection to a namespaced Hash field. Use Nav .changebind="*" for global dirty navigation and List .changebind="SourceKey" for a saved editor's resource selection.

Use a comfortable default density; select compact controls explicitly for a dense task. Align numbers, clarify units, group fields by business purpose and keep one primary page action. A table is not automatically a DataGrid: use DataGrid only when its capabilities and data contract fit.

## Executable example

For complete filtered-table and grouped-form pages, see Patterns/filteredTable.md and Patterns/groupedPreferences.md. They use the same layout primitives; no extra page-specific layout framework is required.

This complete same-origin example intentionally uses local immutable IDs and representative long content. The selected record survives refresh; widths persist. It demonstrates layout, not server persistence or authorization.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <script src="/ui/frameworks/State.js"></script>
  <script src="/ui/frameworks/Bootstrap.js"></script>
  <script src="/ui/utilities/Disposer.js"></script>
  <script src="/ui/utilities/MouseMover.js"></script>
  <script src="/ui/utilities/VirtualScroll.js"></script>
  <script src="/ui/components/base/Modal.js"></script>
  <script src="/ui/components/base/Dialog.js"></script>
  <script src="/ui/components/base/Resizer.js"></script>
  <script src="/ui/components/base/PageHeader.js"></script>
  <script src="/ui/components/base/Pane.js"></script>
  <script src="/ui/components/base/SplitPane.js"></script>
  <script src="/ui/utilities/UUID.js"></script><script src="/ui/components/base/AppShell.js"></script>
  <script src="/ui/components/base/Nav.js"></script>
  <script src="/ui/components/base/List.js"></script>
</head>
<body class="m-0">
<script>
  const workspaceModules = [{type:'button',name:'records',label:'Records',icon:'collection'}]
  const workspace_state = NewState({ rows: Array.from({length:150},(_,i)=>({id:'record-'+i,label:'Record '+i,summary:'Active'})) })
  if (!Hash.workspaceModule) Hash.go({ workspaceModule: 'records' })
</script>
<AppShell viewport>
  <span slot="header" class="fw-semibold">Operations</span>
  <Nav slot="navigation" vertical $.state.list="workspaceModules" $bind="Hash.workspaceModule"></Nav>
  <SplitPane slot="content" $bind="LocalStorage.workspaceSidebarWidth" $.state.pane="Hash.workspaceRecord?'main':'sidebar'">
    <Pane slot="sidebar" scroll="none">
      <PageHeader slot="header" heading="Records"></PageHeader>
      <List slot="content" auto-select $.state.list="workspace_state.rows" $bind="Hash.workspaceRecord"></List>
    </Pane>
    <Pane slot="main">
      <h2 slot="header" class="h5 mb-0">Record details</h2>
      <div slot="content" class="p-3">
        <p role="status" $if="!Hash.workspaceRecord">Select a record to inspect it.</p>
        <template $if="Hash.workspaceRecord">
          <p $text="workspace_state.rows.find(row=>row.id===Hash.workspaceRecord)?.label || 'Record unavailable'"></p>
          <p $if="!workspace_state.rows.some(row=>row.id===Hash.workspaceRecord)" role="alert">This record is unavailable. Choose another record.</p>
          <p $each="Array.from({length:60},(_,i)=>i)" as="paragraph">Record information and history.</p>
        </template>
      </div>
    </Pane>
  </SplitPane>
</AppShell>
</body>
</html>
```

## Acceptance

At 1280px, only list and detail scroll, the document does not scroll, and resizing retains a usable detail region. At 390px or a narrow embedding host, a list icon opens the same resource list in the shared SplitPane drawer, retaining content, search and selection; close/Escape restore focus. Reload and back/forward restore the selected resource. Invalid IDs show a recoverable state. For remote data, distinguish loading, successful empty results and errors; verify retry and dirty save/discard through the actual owning APIs.
