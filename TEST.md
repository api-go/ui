# Test Report

## v1.0.10 - 2026-10-15

- `npm run build`: 42 YAML API contracts、32 public components; source and minified assets generated. Checked-in framework snapshots are preserved unless `sync:frameworks` is explicitly requested.
- `npm test`: 128/128 component contract and DOM geometry combinations passed (32 components × 1280/390 px × lg/sm), including clipping, internal control sizes, icon centering and live density changes. Local disposable HTTP fixtures require no master backend.
- `npm run test:legacy`: all 18 legacy HTML regression pages passed. Assertions now follow inherited density, public AutoForm schema and current component root structure.
- Release smoke: source and minified loader groups both load all public components, CodeEditor placeholder/language and DataGrid/DBTypeInput shared-source deduplication; all five template pages load without page errors. `npm pack --dry-run` includes the minified entry, contracts, guides and templates (276 files).
- Codex in-app browser: lg → sm preserves ItemCollection draft; 31px buttons have zero vertical icon-center offset. Content template category filtering updates Hash and restores the same two results after reload; no relevant console errors. Bootstrap snapshot equals v1.0.15 dist/bootstrap.js byte for byte.
- Scope: master-private components are excluded. npm publication deferred by user request.

## v1.0.4 - 2026-08-17

- AI 验收：构建后使用 Codex 内置浏览器打开相关组件与 utility 测试页，验证 List 树折叠、CodeEditor 换行/主题/滚动、HTTP stream 响应等受影响行为。
- `npm test`: 仅作为 CI 或人工独立环境的标准 Playwright 全量回归入口。
- `npm run build`: 生成浏览器可直接加载的组件、utility、framework 和相邻 minified 文件。

## GitHub migration validation (pending release)

Module paths and internal dependency versions are migrated. Development verification uses GOWORK=off and explicit sibling replacements; remove these replacements before release. See migration validation logs for actual results. Existing unrelated working changes are preserved and require separate review.

## Migration release verification

Build and npm pack --dry-run passed. UI passed 168/168 automated public density contracts. Internal-browser acceptance was replaced with automated verification under the user’s explicit authorization.
