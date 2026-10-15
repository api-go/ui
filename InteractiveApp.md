# Interactive applications

Use for continuous work: chat, notebooks, inboxes, editors, boards and canvases. Fill the available host. Preserve the user's working context, drafts and resource identity while panels change.

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

| Task | Composition | Scroll/interaction owner |
| --- | --- | --- |
| Chat or inbox | AppShell + SplitPane + list + Pane | Resource list, message history; composer outside history |
| Editor | AppShell + SplitPane + Pane scroll=none + editor | Editor viewport; actions outside it |
| Board/canvas | AppShell + Pane scroll=none + Kanban/Mindmap/GraphEditor | Component viewport and documented gestures |
| Resource preview | Existing workspace + SidePanel | SidePanel's documented responsive panel |

A SplitPane chooses one retained pane on narrow hosts. SidePanel is for auxiliary previews or documented draft tabs; do not implement a second competing tab manager. Derive the initial pane from resource route state when appropriate. Keep hidden drafts mounted only when retention is required, and dispose resource work when the host actually closes it.

Treat route, session memory and durable persistence separately. A route restores resource identity, not an unsaved draft. Continuous autosave requires an explicit host protocol for failures and conflicts; it must not silently bypass the shared save contract.

## Executable example

For history with a fixed composer, see Patterns/conversationLayout.md. Use ChatBox for the master-specific Agent protocol instead of recreating it in application code.

This complete same-origin notebook demonstrates retained in-memory drafts and a self-scrolling native editor. It explicitly does not claim persistence. Real persistence must add loading, error, dirty/save and navigation guards according to the host APIs.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <script src="./frameworks/State.js"></script>
  <script src="./frameworks/Bootstrap.js"></script>
  <script src="./utilities/Disposer.js"></script>
  <script src="./utilities/MouseMover.js"></script>
  <script src="./utilities/VirtualScroll.js"></script>
  <script src="./components/base/Modal.js"></script>
  <script src="./components/base/Dialog.js"></script>
  <script src="./components/base/Resizer.js"></script>
  <script src="./components/base/PageHeader.js"></script>
  <script src="./components/base/Pane.js"></script>
  <script src="./components/base/SplitPane.js"></script>
  <script src="./components/base/AppShell.js"></script>
  <script src="./components/base/List.js"></script>
</head>
<body class="m-0">
<script>
  const notebookEntries = [{id:'welcome',label:'Welcome'},{id:'ideas',label:'Ideas'}]
  const notebook_state = NewState({ drafts: NewState({welcome:'Write your first note here.',ideas:'Capture an idea.'}) })
</script>
<AppShell viewport>
  <span slot="header" class="fw-semibold">Notebook</span>
  <SplitPane slot="content" $bind="LocalStorage.notebookSidebarWidth" $.state.pane="Hash.notebookEntry?'main':'sidebar'">
    <Pane slot="sidebar" scroll="none">
      <h2 slot="header" class="h5 mb-0">Notes</h2>
      <List slot="content" auto-select $.state.list="notebookEntries" $bind="Hash.notebookEntry"></List>
    </Pane>
    <Pane slot="main" scroll="none">
      <h1 slot="header" class="h4 mb-0">Note editor</h1>
      <div slot="content" class="d-flex flex-column p-3 gap-2">
        <p role="status" $if="!Hash.notebookEntry">Choose a note to start writing.</p>
        <p role="alert" $if="Hash.notebookEntry && !notebookEntries.some(entry=>entry.id===Hash.notebookEntry)">Note unavailable. Choose another note.</p>
        <template $if="notebookEntries.some(entry=>entry.id===Hash.notebookEntry)">
          <label for="noteDraft" class="form-label">Draft</label>
          <textarea id="noteDraft" class="form-control flex-fill" style="min-height:0;resize:none" $bind="notebook_state.drafts[Hash.notebookEntry]"></textarea>
          <p class="small text-body-secondary mb-0">In-memory example. Drafts remain while switching notes; reloading resets them.</p>
        </template>
      </div>
    </Pane>
  </SplitPane>
</AppShell>
</body>
</html>
```

## Acceptance

At 390px and 1280px, the editor fills its region, its long content scrolls internally, the document does not scroll, and pane changes retain draft input. Verify keyboard operation, selection recovery, browser history and invalid routes. For a real editor, verify save, reload and cancellation; for chat verify long history and composer availability.
