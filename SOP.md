# Frontend Development SOP

This SOP applies to application pages and reusable components built with this package. Read `llms.txt` first, then this file, before changing frontend code.

## Design philosophy

1. Start from the data model. Load one editable draft object from the server, bind controls directly to its fields with `$bind`, and let interactions update that draft in memory.
2. Save explicitly. Editing, adding, removing, sorting, selecting, and toggling only mutate the draft and mark it dirty. The Save command submits the complete relevant draft; do not maintain parallel pending queues or perform hidden per-control persistence.
3. Keep components neutral and stateless with respect to business rules. Reusable collection, picker, and editor components expose values, slots, and events; account-specific validation, permission expansion, and persistence stay in the Account page or service.
4. Prefer declarative framework capabilities: `$bind`, `$if`, `$each`, slots, and component events. Do not introduce computed-template tricks when a direct hash/state condition expresses the same state.
5. Use Bootstrap 5 as the visual language. Prefer plain `d-flex`, direction, wrapping, gap, alignment, spacing, typography, color, border, and responsive utility classes. Add CSS only for behavior Bootstrap cannot express, such as a compact hover-only remove control.
6. Classify the interface using llms.txt: DocumentPage.md, AdminWorkspace.md or InteractiveApp.md. Use content-driven height for natural pages and bounded filling regions for workspaces/apps. Use Flex for region composition and Bootstrap Grid for content/form columns. Only the outer application shell owns viewport height. Do not repair unclear structure with arbitrary heights or page-specific overrides.
7. Keep information hierarchy consistent. Use PageHeader for the page title and primary action, Pane for fixed region tools/actions and a controlled body, and SplitPane for resizable sidebar/main composition. Use one scroll owner per region; scroll=none delegates to a self-scrolling component. Narrow layouts must retain access to every region.
8. Preserve user data. Normalize only what the domain requires; comparisons may be case-insensitive, but stored paths must not be lowercased implicitly.
9. Expose one page-local NewState namespace named <module>_state. Keep independently reactive nested groups under that root. Immutable constants and pure action helpers may remain outside it. Do not mirror Hash or LocalStorage into another reactive owner unless an explicit editable draft/save boundary requires it.

## Component workflow

Set ui-sm/ui-lg once on html/body for global density; omit for BS defaults and use ui-default for a local reset. Explicit BS size classes and spacing utilities win. New generated controls inherit density instead of repeating fixed small classes. See examples/density.html for a complete zero-page-CSS demonstration with FilterBar, ActionBar, RequestState and virtualized data. Density is independent of screen size and theme.

1. Fix the lowest reusable abstraction first, then integrate it into the page.
2. A Slot receiver must contain only replaceable Slot content. Keep required controls, such as remove buttons, in a stable wrapper outside the receiver.
3. Document every public attribute, property, method, event, and Slot in YAML and cover each behavior in the component test page.
4. Application-specific components belong to their host application; framework-neutral primitives belong in this package.
5. When the host uses automatic asset versioning, load `ui.js?autoversion=1`; do not append or hard-code child asset versions.

## Save and navigation contract

1. Every editable view owns one dirty signal derived from draft mutations.
2. Save is enabled exactly when that draft is dirty and disabled again only after the server confirms the complete save.
3. Switching editable resources and leaving or refreshing the page must use the shared dirty-source mechanism and ask before discarding changes. Navigable identity binds to namespaced Hash fields; local layout preferences bind to LocalStorage.
4. Save failures keep the draft and dirty state intact. Never show success before the server confirms persistence.

## Required verification

1. Run focused syntax/component tests.
2. Use this package's local static test server and the Codex in-app browser. Follow the host application's own acceptance commands when integrating.
3. Exercise every changed control through the UI: add, edit/select, remove, reorder where supported, save, reload, and verify persisted values.
4. Verify Save enabled/disabled transitions and navigation/unload protection.
5. Test affected page states at wide and narrow sizes, both themes, keyboard navigation, long content and route reload/back/forward. Verify bounded workspaces do not scroll the document and natural pages do.
6. Check browser console errors and the relevant current server log after reproducing the interaction.
7. Remove temporary test data only after persistence has been verified.

Code inspection alone is not UI acceptance. A feature is complete only when its real browser interaction and saved result agree.
