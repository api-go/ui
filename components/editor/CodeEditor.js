/**
 * CodeMirror-backed source editor and AutoForm string control.
 */
globalThis.Component.register('CodeEditor', container => {
  const cm = globalThis.CodeMirror
  const host = container.querySelector('.code-editor-host')
  const state = container.state
  let view = null
  let value = container.getAttribute('value') || ''
  let languageSequence = 0
  let diagnosticSignature = ''
  let destroyed = false
  let suppressChange = false

  const languageCompartment = new cm.Compartment()
  const themeCompartment = new cm.Compartment()
  const readonlyCompartment = new cm.Compartment()
  const path = () => state.path ?? container.getAttribute('path') ?? ''
  const requestedLanguage = () => cm.resolveLanguage({ lang: container.getAttribute('lang'), path: path() })
  const readonlyExtensions = () => [
    cm.EditorState.readOnly.of(container.hasAttribute('readonly')),
    cm.EditorView.editable.of(!container.hasAttribute('readonly'))
  ]
  const themeExtension = () => container.getAttribute('theme') === 'dark' ? cm.oneDark : []
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
  const updateValue = next => {
    next = String(next ?? '')
    value = next
    if (!view || view.state.doc.toString() === next) return
    suppressChange = true
    try { view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: next } }) }
    finally { suppressChange = false }
  }
  const emitChange = () => {
    value = view.state.doc.toString()
    if (container.documentMode && state.data !== value) state.data = value
    container.dispatchEvent(new CustomEvent('change', { detail: value, bubbles: false }))
    container.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const installLanguage = async name => {
    const sequence = ++languageSequence
    const factory = await cm.loadLanguage(name)
    if (destroyed || sequence !== languageSequence) return
    container.language = name
    if (view) view.dispatch({ effects: languageCompartment.reconfigure(factory()) })
  }

  Object.defineProperty(container, 'value', {
    configurable: true,
    get: () => view ? view.state.doc.toString() : value,
    set: updateValue
  })
  Object.defineProperty(container, 'view', { configurable: true, get: () => view })

  container.diagnostics = []
  container.language = requestedLanguage()
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
  container.focus = () => view?.focus()
  container.addEventListener('bind', event => { container.value = event.detail })

  const documentMode = container.hasAttribute('path') || container.hasAttribute('api') || state.path !== undefined || state.version !== undefined
  container.documentMode = documentMode
  if (documentMode) {
    globalThis.Editor.connect(container, { type: 'code', defaultData: value, normalize: next => String(next ?? '') })
    state.__watch('data', updateValue)
    updateValue(state.data)
  }
  state.__watch('path', () => {
    if (container.hasAttribute('lang')) return
    const name = requestedLanguage()
    if (name !== container.language) installLanguage(name).catch(error => container.dispatchEvent(new CustomEvent('error', { detail: error, bubbles: false })))
  })

  container.ready = cm.loadLanguage(container.language).then(factory => {
    if (destroyed) return container
    view = new cm.EditorView({
      state: cm.EditorState.create({
        doc: value,
        extensions: [
          cm.setup,
          cm.keymap.of([cm.indentWithTab]),
          languageCompartment.of(factory()),
          themeCompartment.of(themeExtension()),
          readonlyCompartment.of(readonlyExtensions()),
          syntaxLinter,
          cm.lintGutter(),
          cm.EditorView.updateListener.of(update => { if (update.docChanged && !suppressChange) emitChange() })
        ]
      }),
      parent: host
    })
    container.dispatchEvent(new CustomEvent('ready', { detail: container, bubbles: false }))
    return container
  }).catch(error => {
    container.dispatchEvent(new CustomEvent('error', { detail: error, bubbles: false }))
    throw error
  })

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'lang' || mutation.attributeName === 'path') {
        const name = requestedLanguage()
        if (name !== container.language) installLanguage(name).catch(error => container.dispatchEvent(new CustomEvent('error', { detail: error, bubbles: false })))
      } else if (mutation.attributeName === 'theme' && view) {
        view.dispatch({ effects: themeCompartment.reconfigure(themeExtension()) })
      } else if (mutation.attributeName === 'readonly' && view) {
        view.dispatch({ effects: readonlyCompartment.reconfigure(readonlyExtensions()) })
      } else if (mutation.attributeName === 'value') {
        updateValue(container.getAttribute('value') || '')
      }
    }
  })
  observer.observe(container, { attributes: true, attributeFilter: ['lang', 'path', 'theme', 'readonly', 'value'] })
  globalThis.DOMDisposer.add(container, () => {
    destroyed = true
    observer.disconnect()
    view?.destroy()
    view = null
  })
}, globalThis.Util.makeDom(/*html*/`<div class="code-editor-root"><div class="code-editor-host"></div></div>`), globalThis.Util.makeDom(/*html*/`<style>
  CodeEditor { display:block; min-height:160px; border:1px solid var(--bs-border-color); border-radius:var(--bs-border-radius); overflow:hidden; background:var(--bs-body-bg); }
  CodeEditor .code-editor-host, CodeEditor .cm-editor { height:100%; min-height:inherit; }
  CodeEditor .cm-scroller { overflow:auto; font-family:var(--bs-font-monospace); font-size:.875rem; }
  CodeEditor .cm-focused { outline:2px solid rgba(var(--bs-primary-rgb),.25); outline-offset:-2px; }
  CodeEditor[readonly] .cm-content { cursor:default; }
</style>`))

globalThis.AutoForm?.register('CodeEditor', 'code')
globalThis.Editor?.register({
  name: 'CodeEditor',
  component: 'CodeEditor',
  extensions: ['js', 'mjs', 'cjs', 'json', 'yaml', 'yml', 'py', 'html', 'htm', 'css'],
  types: ['code', 'javascript', 'json', 'yaml', 'python', 'html', 'css'],
  mimeTypes: ['text/javascript', 'application/javascript', 'application/json', 'application/yaml', 'text/yaml', 'text/x-python', 'text/html', 'text/css']
})
