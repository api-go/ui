/**
 * CodeMirror-backed source editor with optional Markdown and sandboxed HTML preview.
 */
globalThis.Component.register('CodeEditor', container => {
  const cm = globalThis.CodeMirror
  const host = container.querySelector('.code-editor-host')
  const sourcePane = container.querySelector('.code-editor-source')
  const previewPane = container.querySelector('.code-editor-preview')
  const markdownPreview = container.querySelector('.code-editor-markdown')
  const htmlPreview = container.querySelector('.code-editor-html')
  const toolbar = container.querySelector('.code-editor-toolbar')
  const previewTools = container.querySelector('.code-editor-preview-tools')
  const modeButtons = [...container.querySelectorAll('[data-mode]')]
  const viewButtons = [...container.querySelectorAll('[data-view-tool]')]
  const toolButtons = [...container.querySelectorAll('[data-tool]')]
  const state = container.state
  let view = null
  let value = container.getAttribute('value') || ''
  let mode = 'source'
  let languageSequence = 0
  let previewSequence = 0
  let previewTimer = null
  let diagnosticSignature = ''
  let destroyed = false
  let suppressChange = false

  const languageCompartment = new cm.Compartment()
  const themeCompartment = new cm.Compartment()
  const readonlyCompartment = new cm.Compartment()
	const wrapCompartment = new cm.Compartment()
  const path = () => state.path ?? container.getAttribute('path') ?? ''
  const requestedLanguage = () => cm.resolveLanguage({ lang: container.getAttribute('lang'), path: path() })
  const previewable = () => container.language === 'markdown' || container.language === 'html'
  const requestedMode = () => ['source', 'split', 'preview'].includes(container.getAttribute('mode')) ? container.getAttribute('mode') : 'source'
  const readonlyExtensions = () => [
    cm.EditorState.readOnly.of(container.hasAttribute('readonly')),
    cm.EditorView.editable.of(!container.hasAttribute('readonly'))
  ]
	const darkTheme = () => container.getAttribute('theme') === 'dark' || ((!container.hasAttribute('theme') || container.getAttribute('theme') === 'auto') && document.documentElement.getAttribute('data-bs-theme') === 'dark')
	const themeExtension = () => darkTheme() ? cm.oneDark : []
	const wrapExtension = () => container.hasAttribute('wrap') ? cm.EditorView.lineWrapping : []
  const emitError = error => container.dispatchEvent(new CustomEvent('error', { detail: error, bubbles: false }))

  const collectDiagnostics = editorView => {
    if (!editorView) return []
    const diagnostics = []
    const tree = cm.ensureSyntaxTree(editorView.state, editorView.state.doc.length, 100) || cm.syntaxTree(editorView.state)
    tree.cursor().iterate(node => {
      if (!node.type.isError) return
      const from = Math.min(node.from, editorView.state.doc.length)
      const to = Math.max(from, Math.min(node.to || node.from + 1, editorView.state.doc.length))
      diagnostics.push({ from, to, severity: 'error', source: container.language, message: 'Syntax error' })
    })
    return diagnostics
  }
  const publishDiagnostics = diagnostics => {
    container.diagnostics = diagnostics
    const signature = diagnostics.map(item => `${item.from}:${item.to}:${item.message}`).join('|')
    if (signature === diagnosticSignature) return
    diagnosticSignature = signature
    container.dispatchEvent(new CustomEvent('diagnostics', { detail: diagnostics, bubbles: false }))
  }
  const syntaxLinter = cm.linter(editorView => {
    const diagnostics = collectDiagnostics(editorView)
    publishDiagnostics(diagnostics)
    return diagnostics
  }, { delay: 180 })

  const renderPreview = async () => {
    clearTimeout(previewTimer)
    previewTimer = null
    const sequence = ++previewSequence
    const source = container.value
    container.classList.remove('code-editor-preview-stale')
    if (!previewable()) return false
    if (container.language === 'markdown') {
      if (!globalThis.Markdown) {
        if (!globalThis.__ApigoUIRuntime?.loadAsset) throw new Error('Markdown preview requires the UI runtime')
        await globalThis.__ApigoUIRuntime.loadAsset('libraries/Markdown.js')
      }
      if (destroyed || sequence !== previewSequence) return false
      markdownPreview.innerHTML = globalThis.Markdown.render(source, {
        allowHtml: container.hasAttribute('allowhtml'),
        breaks: container.hasAttribute('breaks')
      })
      markdownPreview.hidden = false
      htmlPreview.hidden = true
    } else {
      const scripts = container.hasAttribute('previewscripts')
      htmlPreview.setAttribute('sandbox', scripts ? 'allow-scripts' : '')
      let previewSource = source
	  if (typeof container.transformPreview === 'function') previewSource = await container.transformPreview(source)
	  if (!scripts) previewSource = previewSource.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
      htmlPreview.srcdoc = previewSource
      htmlPreview.hidden = false
      markdownPreview.hidden = true
    }
    container.dispatchEvent(new CustomEvent('preview', { detail: { language: container.language, source }, bubbles: false }))
    return true
  }
  const schedulePreview = () => {
    if (mode === 'source' || !previewable()) return
    if (container.language === 'html' && container.hasAttribute('previewscripts') && !container.hasAttribute('previewauto')) {
      container.classList.add('code-editor-preview-stale')
      return
    }
    clearTimeout(previewTimer)
    previewTimer = setTimeout(() => renderPreview().catch(emitError), 180)
  }
  const applyMode = next => {
    next = ['source', 'split', 'preview'].includes(next) && previewable() ? next : 'source'
    const changed = mode !== next
    mode = next
    container.dataset.mode = mode
    modeButtons.forEach(button => button.classList.toggle('active', button.dataset.mode === mode))
    viewButtons.forEach(button => button.classList.toggle('active', button.dataset.viewTool === mode || (mode === 'split' && button.dataset.viewTool === `split-${container.getAttribute('split-direction') === 'horizontal' ? 'horizontal' : 'vertical'}`)))
    sourcePane.hidden = mode === 'preview'
    previewPane.hidden = mode === 'source'
    if (mode !== 'source') renderPreview().catch(emitError)
    requestAnimationFrame(() => view?.requestMeasure())
    if (changed) container.dispatchEvent(new CustomEvent('modechange', { detail: mode, bubbles: false }))
    if (changed && container.getTools) container.dispatchEvent(new CustomEvent('toolschange', { detail: container.getTools(), bubbles: false }))
    return mode
  }
  const updatePreviewAvailability = () => {
    const available = previewable()
    const previousMode = mode
    toolbar.hidden = !container.hasAttribute('toolbar') || container.hasAttribute('notoolbar')
    if (previewTools) previewTools.hidden = !available
    if (!available) applyMode('source')
    else applyMode(requestedMode())
    if (mode === previousMode && container.getTools) container.dispatchEvent(new CustomEvent('toolschange', { detail: container.getTools(), bubbles: false }))
  }
  const updateValue = next => {
    next = String(next ?? '')
    value = next
    if (view && view.state.doc.toString() !== next) {
      suppressChange = true
      try { view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: next } }) }
      finally { suppressChange = false }
    }
    schedulePreview()
  }
  const emitChange = () => {
    value = view.state.doc.toString()
    if (container.documentMode && state.data !== value) state.data = value
    container.dispatchEvent(new CustomEvent('change', { detail: value, bubbles: false }))
    container.dispatchEvent(new Event('input', { bubbles: true }))
    schedulePreview()
  }
  const installLanguage = async name => {
    const sequence = ++languageSequence
    const factory = await cm.loadLanguage(name)
    if (destroyed || sequence !== languageSequence) return
    container.language = name
    if (view) view.dispatch({ effects: languageCompartment.reconfigure(factory()) })
    updatePreviewAvailability()
  }

  Object.defineProperty(container, 'value', {
    configurable: true,
    get: () => view ? view.state.doc.toString() : value,
    set: updateValue
  })
  Object.defineProperty(container, 'view', { configurable: true, get: () => view })
  Object.defineProperty(container, 'mode', {
    configurable: true,
    get: () => mode,
    set: next => {
      next = String(next || 'source').toLowerCase()
      if (container.getAttribute('mode') !== next) container.setAttribute('mode', next)
      else applyMode(next)
    }
  })

  container.diagnostics = []
  container.language = requestedLanguage()
  container.refreshPreview = renderPreview
  container.setMode = next => { container.mode = next; return container.mode }
  container.validate = () => {
    const diagnostics = collectDiagnostics(view)
    publishDiagnostics(diagnostics)
    return diagnostics
  }
  container.reindent = () => {
    if (!view) return container.value
    const changes = cm.indentRange(view.state, 0, view.state.doc.length)
    if (!changes.empty) view.dispatch({ changes })
    return container.value
  }
	container.pretty = () => {
		const language = String(container.language || requestedLanguage()).toLowerCase()
		if (language === 'json') {
			try { container.value = JSON.stringify(JSON.parse(container.value), null, 2) } catch (_) { return container.reindent() }
			return container.value
		}
		return container.reindent()
	}
	container.setWrap = enabled => {
		enabled = !!enabled
		container.toggleAttribute('wrap', enabled)
		return enabled
	}
	container.toggleFullscreen = async () => {
		container.classList.toggle('code-editor-fullscreen')
		container.dispatchEvent(new CustomEvent('toolschange', { detail: container.getTools?.() || [], bubbles: false }))
		return container.classList.contains('code-editor-fullscreen')
	}
  globalThis.Editor.setTools(container, [
    { id: 'source', group: 'view', label: 'Source', icon: 'code-slash', active: () => mode === 'source', hidden: () => !previewable(), run: () => container.setMode('source') },
    { id: 'split-vertical', group: 'view', label: 'Split left and right', icon: 'layout-split', active: () => mode === 'split' && container.getAttribute('split-direction') !== 'horizontal', hidden: () => !previewable(), run: () => { container.setAttribute('split-direction', 'vertical'); container.setMode('split') } },
    { id: 'split-horizontal', group: 'view', label: 'Split top and bottom', icon: 'view-stacked', active: () => mode === 'split' && container.getAttribute('split-direction') === 'horizontal', hidden: () => !previewable(), run: () => { container.setAttribute('split-direction', 'horizontal'); container.setMode('split') } },
    { id: 'preview', group: 'view', label: 'Preview', icon: 'eye', active: () => mode === 'preview', hidden: () => !previewable(), run: () => container.setMode('preview') },
    { id: 'validate', group: 'document', label: 'Validate syntax', icon: 'check2-circle', run: () => container.validate() },
		{ id: 'pretty', group: 'document', label: 'Pretty', icon: 'stars', run: () => container.pretty() }
	,{ id: 'wrap', group: 'view', label: 'Wrap lines', icon: 'text-wrap', active: () => container.hasAttribute('wrap'), run: () => container.setWrap(!container.hasAttribute('wrap')) },
	{ id: 'fullscreen', group: 'view', label: 'Fullscreen', icon: 'arrows-fullscreen', run: () => container.toggleFullscreen() }
  ])
  container.focus = () => view?.focus()
  container.addEventListener('bind', event => {
    // A module switch may briefly unbind the control with an undefined value.
    // Do not erase the live editor document during that transient state.
    if (event.detail !== undefined && event.detail !== null) container.value = event.detail
  })
  // Reconcile explicitly after document transport completes. This also covers
  // host state implementations that coalesce a rapid path/data update.
  container.addEventListener('loaded', () => {
    if (state.data !== undefined && state.data !== null) updateValue(state.data)
    requestAnimationFrame(() => view?.requestMeasure())
  })
  modeButtons.forEach(button => button.addEventListener('click', () => { container.mode = button.dataset.mode }))
  toolButtons.forEach(button => button.addEventListener('click', () => container.runTool?.(button.dataset.tool)))

  const documentMode = container.hasAttribute('path') || container.hasAttribute('api') || state.path !== undefined || state.version !== undefined
  container.documentMode = documentMode
  if (documentMode) {
    globalThis.Editor.connect(container, {
      type: 'code',
      defaultData: value,
      normalize: next => typeof next === 'string' ? next : JSON.stringify(next ?? {}, null, 2)
    })
    state.__watch('data', next => {
      if (next !== undefined && next !== null) updateValue(next)
    })
    if (state.data !== undefined && state.data !== null) updateValue(state.data)
  }
  state.__watch('path', () => {
    if (container.hasAttribute('lang')) return
    const name = requestedLanguage()
    if (name !== container.language) installLanguage(name).catch(emitError)
  })

  // Never block the editable surface on a dynamically loaded language package.
  // Syntax highlighting is an enhancement and is installed asynchronously below.
  view = new cm.EditorView({
    state: cm.EditorState.create({
      doc: value,
      extensions: [
        cm.setup,
        cm.keymap.of([cm.indentWithTab]),
        languageCompartment.of([]),
        themeCompartment.of(themeExtension()),
        readonlyCompartment.of(readonlyExtensions()),
		wrapCompartment.of(wrapExtension()),
        syntaxLinter,
        cm.lintGutter(),
        cm.EditorView.updateListener.of(update => { if (update.docChanged && !suppressChange) emitChange() })
      ]
    }),
    parent: host
  })
  updatePreviewAvailability()
  container.ready = installLanguage(container.language).then(() => container).catch(error => { emitError(error); return container })
  container.ready.then(() => container.dispatchEvent(new CustomEvent('ready', { detail: container, bubbles: false })))

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'lang' || mutation.attributeName === 'path') {
        const name = requestedLanguage()
        if (name !== container.language) installLanguage(name).catch(emitError)
      } else if (mutation.attributeName === 'theme' && view) {
        view.dispatch({ effects: themeCompartment.reconfigure(themeExtension()) })
      } else if (mutation.attributeName === 'readonly' && view) {
        view.dispatch({ effects: readonlyCompartment.reconfigure(readonlyExtensions()) })
	  } else if (mutation.attributeName === 'wrap' && view) {
		view.dispatch({ effects: wrapCompartment.reconfigure(wrapExtension()) })
		container.dispatchEvent(new CustomEvent('toolschange', { detail: container.getTools?.() || [], bubbles: false }))
      } else if (mutation.attributeName === 'value') {
        updateValue(container.getAttribute('value') || '')
      } else if (mutation.attributeName === 'mode') {
        applyMode(requestedMode())
      } else if (mutation.attributeName === 'notoolbar' || mutation.attributeName === 'toolbar') {
        updatePreviewAvailability()
      } else if (['previewscripts', 'allowhtml', 'breaks'].includes(mutation.attributeName) && mode !== 'source') {
        renderPreview().catch(emitError)
      }
    }
  })
	observer.observe(container, { attributes: true, attributeFilter: ['lang', 'path', 'theme', 'readonly', 'wrap', 'value', 'mode', 'toolbar', 'notoolbar', 'split-direction', 'previewscripts', 'allowhtml', 'breaks'] })
	const themeObserver = new MutationObserver(() => {
		if ((!container.hasAttribute('theme') || container.getAttribute('theme') === 'auto') && view) view.dispatch({ effects: themeCompartment.reconfigure(themeExtension()) })
	})
	themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] })
  globalThis.DOMDisposer.add(container, () => {
    destroyed = true
    clearTimeout(previewTimer)
    observer.disconnect()
	themeObserver.disconnect()
    view?.destroy()
    view = null
    htmlPreview.srcdoc = ''
  })
}, globalThis.Util.makeDom(/*html*/`
<div class="code-editor-root">
  <div class="code-editor-toolbar btn-toolbar border-bottom p-1 gap-1" hidden>
    <div class="btn-group btn-group-sm code-editor-preview-tools" role="group" aria-label="Preview mode">
      <button type="button" class="btn btn-sm" data-tool="source" data-view-tool="source" title="Source"><i class="bi bi-code-slash"></i></button>
      <button type="button" class="btn btn-sm" data-tool="split-vertical" data-view-tool="split-vertical" title="Split left and right"><i class="bi bi-layout-split"></i></button>
      <button type="button" class="btn btn-sm" data-tool="split-horizontal" data-view-tool="split-horizontal" title="Split top and bottom"><i class="bi bi-view-stacked"></i></button>
      <button type="button" class="btn btn-sm" data-tool="preview" data-view-tool="preview" title="Preview"><i class="bi bi-eye"></i></button>
    </div>
    <div class="btn-group btn-group-sm" role="group" aria-label="Code tools">
      <button type="button" class="btn btn-sm btn-link text-body-secondary" data-tool="validate" title="Validate"><i class="bi bi-check2-circle"></i></button>
      <button type="button" class="btn btn-sm btn-link text-body-secondary" data-tool="pretty" title="Pretty"><i class="bi bi-stars"></i></button>
      <button type="button" class="btn btn-sm btn-link text-body-secondary" data-tool="wrap" title="Wrap lines"><i class="bi bi-text-wrap"></i></button>
      <button type="button" class="btn btn-sm btn-link text-body-secondary" data-tool="fullscreen" title="Fullscreen"><i class="bi bi-arrows-fullscreen"></i></button>
    </div>
  </div>
  <div class="code-editor-workspace">
    <div class="code-editor-source"><div class="code-editor-host"></div></div>
    <div class="code-editor-preview" hidden>
      <div class="code-editor-markdown markdown-body" hidden></div>
      <iframe class="code-editor-html" title="HTML preview" sandbox hidden></iframe>
    </div>
  </div>
</div>
`), globalThis.Util.makeDom(/*html*/`<style>
  CodeEditor { display:block; min-height:160px; overflow:hidden; background:var(--bs-body-bg); }
  CodeEditor.code-editor-root { display:flex; flex-direction:column; width:100%; height:100%; min-height:inherit; }
	CodeEditor .code-editor-toolbar { min-height:28px; height:28px; justify-content:flex-end; padding:.05rem .25rem !important; }
	CodeEditor .code-editor-toolbar .btn { font-size:.75rem; line-height:1; padding:.2rem .3rem; }
	CodeEditor .code-editor-preview-tools .btn { position:relative; border:0; border-radius:0; color:var(--bs-secondary-color); background:transparent; }
	CodeEditor .code-editor-preview-tools .btn + .btn::before { content:''; position:absolute; left:0; top:25%; height:50%; border-left:1px solid var(--bs-border-color); }
	CodeEditor .code-editor-preview-tools .btn.active, CodeEditor .code-editor-preview-tools .btn:hover { color:var(--bs-primary); background:transparent; }
	CodeEditor .code-editor-toolbar [data-tool="fullscreen"] i { display:inline-block; font-size:.8em; }
  CodeEditor .code-editor-workspace { display:grid; grid-template-columns:minmax(0, 1fr); flex:1 1 0; width:100%; height:0; min-height:0; }
  CodeEditor[data-mode="split"] .code-editor-workspace { grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); }
  CodeEditor[data-mode="split"][split-direction="horizontal"] .code-editor-workspace { grid-template-columns:minmax(0, 1fr); grid-template-rows:minmax(0, 1fr) minmax(0, 1fr); }
  CodeEditor .code-editor-source, CodeEditor .code-editor-preview { min-width:0; min-height:0; overflow:hidden; }
  CodeEditor .code-editor-source { position:relative; }
  CodeEditor .code-editor-preview { border-left:1px solid var(--bs-border-color); background:var(--bs-body-bg); }
  CodeEditor[data-mode="split"][split-direction="horizontal"] .code-editor-preview { border-left:0; border-top:1px solid var(--bs-border-color); }
  CodeEditor .code-editor-host { position:absolute; inset:0; }
  CodeEditor .code-editor-host, CodeEditor .cm-editor { height:100%; min-height:0; }
	CodeEditor.code-editor-fullscreen { position:fixed !important; inset:0 !important; z-index:2147483647 !important; width:100vw !important; height:100vh !important; min-height:0; background:var(--bs-body-bg); transform:none !important; }
  CodeEditor .cm-scroller { overflow:auto; font-family:var(--bs-font-monospace); font-size:.875rem; }
	[data-bs-theme="dark"] CodeEditor .cm-gutters { color:var(--bs-secondary-color); background:var(--bs-tertiary-bg); border-color:var(--bs-border-color); }
  CodeEditor .cm-focused { outline:2px solid rgba(var(--bs-primary-rgb),.25); outline-offset:-2px; }
  CodeEditor .cm-cursor, CodeEditor .cm-dropCursor { border-left:2px solid var(--bs-primary) !important; filter:drop-shadow(0 0 1px var(--bs-body-bg)); }
  CodeEditor[readonly] .cm-content { cursor:default; }
  CodeEditor .code-editor-markdown { box-sizing:border-box; height:100%; overflow:auto; padding:1rem; overflow-wrap:anywhere; }
  CodeEditor .code-editor-html { display:block; width:100%; height:100%; min-height:160px; border:0; background:white; }
  CodeEditor .markdown-body > :first-child { margin-top:0; } CodeEditor .markdown-body > :last-child { margin-bottom:0; }
  CodeEditor .markdown-body h1, CodeEditor .markdown-body h2 { padding-bottom:.3em; border-bottom:1px solid var(--bs-border-color); }
  CodeEditor .markdown-body h1 { font-size:2em; } CodeEditor .markdown-body h2 { font-size:1.5em; } CodeEditor .markdown-body h3 { font-size:1.25em; }
  CodeEditor .markdown-body h1, CodeEditor .markdown-body h2, CodeEditor .markdown-body h3, CodeEditor .markdown-body h4, CodeEditor .markdown-body h5, CodeEditor .markdown-body h6 { margin:1.25em 0 .6em; font-weight:600; line-height:1.25; }
  CodeEditor .markdown-body p, CodeEditor .markdown-body ul, CodeEditor .markdown-body ol, CodeEditor .markdown-body blockquote, CodeEditor .markdown-body pre, CodeEditor .markdown-body table { margin:0 0 1em; }
  CodeEditor .markdown-body blockquote { padding:0 1em; color:var(--bs-secondary-color); border-left:.25em solid var(--bs-border-color); }
  CodeEditor .markdown-body code { padding:.15em .35em; border-radius:.25rem; background:var(--bs-tertiary-bg); font-family:var(--bs-font-monospace); font-size:.875em; }
  CodeEditor .markdown-body pre { padding:1em; overflow:auto; border-radius:var(--bs-border-radius); background:var(--bs-tertiary-bg); }
  CodeEditor .markdown-body pre code { padding:0; background:transparent; }
  CodeEditor .markdown-body table { display:block; width:max-content; max-width:100%; overflow:auto; border-collapse:collapse; }
  CodeEditor .markdown-body th, CodeEditor .markdown-body td { padding:.4em .75em; border:1px solid var(--bs-border-color); }
  CodeEditor .markdown-body img { max-width:100%; height:auto; }
  @media (max-width:767.98px) {
    CodeEditor[data-mode="split"] .code-editor-workspace { grid-template-columns:minmax(0, 1fr); grid-template-rows:minmax(160px, 1fr) minmax(160px, 1fr); }
    CodeEditor[data-mode="split"] .code-editor-preview { border-left:0; border-top:1px solid var(--bs-border-color); }
  }
</style>`))

globalThis.AutoForm?.register('CodeEditor', 'code')
globalThis.Editor?.register({
  name: 'CodeEditor',
  component: 'CodeEditor',
  extensions: ['js', 'mjs', 'cjs', 'json', 'yaml', 'yml', 'py', 'html', 'htm', 'css', 'md', 'markdown', 'txt', 'text', 'log', 'conf', 'config', 'ini', 'env', 'csv', 'xml', 'sql', 'sh', 'bash'],
  types: ['code', 'javascript', 'json', 'yaml', 'python', 'html', 'css', 'markdown'],
  mimeTypes: ['text/javascript', 'application/javascript', 'application/json', 'application/yaml', 'text/yaml', 'text/x-python', 'text/html', 'text/css', 'text/markdown']
})
