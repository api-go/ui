# Component synchronization validation — 2026-10-28

- `npm run build`: 45 contracts and 34 public components validated; 66 browser modules built.
- `npm test`: ListDataSource's 4 unit cases pass; 132/136 component/density/viewport combinations pass. Pagination and PagedList pass at 1280px and 390px with both ui-sm and ui-lg. PagedList includes native checkbox clicks, clear, page changes and a custom identity field.
- An untouched HEAD archive produces 124/128 passing combinations. Its four List failures match the synchronized tree exactly: empty-summary spacer, virtual scroll window/index and revealing selected ancestors, in all four viewport/density combinations. These existing List failures remain outside this component synchronization.
- Codex in-app browser: the records template loads through `ui.js` with automatic dependencies; pagination, search, page-size select, selection slot actions, ui-link and native selection reset were exercised. No related console errors were reported.
- State snapshots were preserved. Bootstrap was imported from the newly built sibling package without running the combined framework synchronization command.
