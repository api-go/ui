# Component contracts and browser checks

Each public component has a sibling `Name.yaml` API contract and `Name.test.yaml` executable usage cases. Read only the contracts needed by the current interface, then start from `templates/` or `examples/density.html`.

Run `npm run dev` and open `/ui/tools/check` to inspect every component, or `/ui/tools/check?name=AutoForm&case=0` for one independently runnable case. The runner accepts `attributes`, `slots`, `before`, `actions`, and `after`; checks observe DOM, public values, bound data and emitted events. Fixtures use disposable browser state on the local test origin and local mock HTTP endpoints. They require no master server, account, or production data.

`npm test` runs the complete public YAML contracts at wide/narrow sizes and sm/lg density. It measures visible controls, icon centers and bounded regions, including open Dialog and composed Resizer surfaces. Every visual component must have visible geometry evidence; API is nonvisual. Existing HTML regression pages remain available through `npm run test:legacy`.

A contract test publishes `body[data-test-status]`, `globalThis.__componentTestResult`, and `component-test-complete`. Tests run against package-owned assets, including the bundled State/Bootstrap snapshots. Public examples and minified entry loading must also work from a nested package URL.

Prefer structured actions/checks to scripts. Every documented attribute/property/method/event/slot/state needs exercised coverage. Test valid and invalid inputs, cancellations, explicit saves, dirty drafts, restored routes, keyboard access and asynchronous recovery. Density changes must preserve live nodes, focus and draft values; don't hardcode small classes or pixel button heights.
