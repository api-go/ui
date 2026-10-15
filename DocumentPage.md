# Natural scrolling pages

Use for reading, discovery and sequential flows: homepages, articles, catalogs, ordinary details and checkout. The document scrolls. Do not force content to fill the viewport or put a small scrollbar around every section.

Read SOP.md (Development-SOP.md in the public host), State.yaml, Bootstrap.yaml and the contracts used below.

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

## Composition

Use container for readable width, row/col-* for responsive sections, and PageHeader for hierarchy. Cards are useful for independent items, not mandatory wrappers around every section. Let long text wrap. Use a short controlled horizontal scroll only for intrinsically wide content.

A content-driven page may use min-height for a short-page shell, but its body must grow. Marketing-specific typography and imagery can use scoped design rules and semantic tokens; do not force all brands into an admin theme.

## Executable example

The following complete same-origin page uses current /ui assets. It has no backend dependency. Connect real APIs and loading/error states when data becomes remote.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <script src="./frameworks/State.js"></script>
  <script src="./frameworks/Bootstrap.js"></script>
  <script src="./components/base/PageHeader.js"></script>
</head>
<body class="m-0">
<script>
  const catalog_state = NewState({ query: '', rows: Array.from({length: 24}, (_, i) => ({ id: i, title: 'Collection ' + (i+1) })) })
</script>
<main class="container py-4">
  <PageHeader heading="Explore collections" $.state.description="'Browse the collection and choose what interests you.'"></PageHeader>
  <label class="form-label mt-4" for="catalogSearch">Find a collection</label>
  <input id="catalogSearch" class="form-control mb-4" type="search" $bind="catalog_state.query">
  <div class="row g-3">
    <div class="col-12 col-md-6 col-lg-4" $each="catalog_state.rows.filter(row=>row.title.toLowerCase().includes(catalog_state.query.toLowerCase()))" as="row" key="id">
      <article class="border rounded p-3 h-100">
        <h2 class="h5" $text="row.title"></h2>
        <p class="text-body-secondary mb-0">A collection with readable content and consistent spacing.</p>
      </article>
    </div>
  </div>
  <p role="status" $if="!catalog_state.rows.some(row=>row.title.toLowerCase().includes(catalog_state.query.toLowerCase()))">No matching collections.</p>
</main>
</body>
</html>
```

## Acceptance

At 390px and 1280px, the document scrolls vertically, cards reflow, search and no-match state work, and the page has no horizontal overflow. Verify semantic headings, focus, contrast and long localized content.
