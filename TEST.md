# Test Report

## v1.0.4 - 2026-08-17

- AI 验收：构建后使用 Codex 内置浏览器打开相关组件与 utility 测试页，验证 List 树折叠、CodeEditor 换行/主题/滚动、HTTP stream 响应等受影响行为。
- `npm test`: 仅作为 CI 或人工独立环境的标准 Playwright 全量回归入口。
- `npm run build`: 生成浏览器可直接加载的组件、utility、framework 和相邻 minified 文件。
