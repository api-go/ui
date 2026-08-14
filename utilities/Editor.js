/**
 * Editor registry and optional document transport.
 */
const Editor = (() => {
  const definitions = new Map()
  const clone = value => {
    if (value === undefined) return undefined
    try { return structuredClone(value) } catch (_) { return JSON.parse(JSON.stringify(value)) }
  }
  const cleanExtension = value => String(value || '').toLowerCase().replace(/^\./, '')
  const assertResponse = response => {
    if (!response || response.ok === false || response.error) throw new Error(response?.error || 'Document request failed')
    const result = response.result
    if (result && typeof result === 'object' && (result.ok === false || result.error)) throw new Error(result.error || 'Document request failed')
    return result
  }
  const contentFrom = (result, type, path) => {
    if (!result || !Object.prototype.hasOwnProperty.call(result, 'data')) throw new Error('Document response data is required')
    const meta = result.meta && typeof result.meta === 'object' ? result.meta : {}
    let content = result.data
    if (typeof content === 'string' && String(meta.type || '').toLowerCase() === 'json') {
      try { content = JSON.parse(content) } catch (_) { throw new Error(`Invalid ${type || 'document'} JSON`) }
    }
    const isEnvelope = content && typeof content === 'object' && !Array.isArray(content) && content.type && Object.prototype.hasOwnProperty.call(content, 'data')
    const document = isEnvelope ? clone(content) : Editor.createDocument(type || 'document', content)
    return {
      ...document,
      path: meta.path ?? document.path ?? path,
      version: meta.version ?? document.version,
      meta
    }
  }

  const Editor = {
    register(definition) {
      if (!definition?.name || !definition?.component) throw new Error('Editor.register requires name and component')
      const normalized = {
        extensions: [], types: [], mimeTypes: [],
        ...definition,
        extensions: (definition.extensions || []).map(cleanExtension),
        types: (definition.types || []).map(value => String(value).toLowerCase()),
        mimeTypes: (definition.mimeTypes || []).map(value => String(value).toLowerCase())
      }
      definitions.set(normalized.name, normalized)
      return normalized
    },
    unregister(name) { return definitions.delete(name) },
    get(name) { return definitions.get(name) },
    list() { return [...definitions.values()] },
    resolve({ path = '', type = '', mime = '' } = {}) {
      const values = [...definitions.values()]
      const normalizedType = String(type).toLowerCase()
      if (normalizedType) {
        const found = values.find(item => item.types.includes(normalizedType))
        if (found) return found
      }
      const filename = String(path).split(/[?#]/, 1)[0]
      const extension = cleanExtension(filename.includes('.') ? filename.slice(filename.lastIndexOf('.') + 1) : '')
      if (extension) {
        const found = values.find(item => item.extensions.includes(extension))
        if (found) return found
      }
      const normalizedMime = String(mime).toLowerCase().split(';', 1)[0]
      if (normalizedMime) {
        const found = values.find(item => item.mimeTypes.includes(normalizedMime))
        if (found) return found
      }
      return values.find(item => item.default) || null
    },
    createDocument(type, data, extra = {}) {
      return { type, formatVersion: 1, ...extra, data: clone(data ?? {}) }
    },
    mergeSchemas(defaultSchemas = {}, extraSchemas = {}) {
      const result = {}
      for (const kind of new Set([...Object.keys(defaultSchemas || {}), ...Object.keys(extraSchemas || {})])) {
        const base = (defaultSchemas?.[kind] || []).map(item => ({ ...item, setting: { ...(item.setting || {}) } }))
        for (const addition of extraSchemas?.[kind] || []) {
          const index = base.findIndex(item => item.name === addition.name)
          if (index < 0) base.push({ ...addition, setting: { ...(addition.setting || {}) } })
          else base[index] = { ...base[index], ...addition, setting: { ...(base[index].setting || {}), ...(addition.setting || {}) } }
        }
        result[kind] = base.filter(item => !item.hidden)
      }
      return result
    },
    applyDefaults(target, schema = []) {
      for (const field of schema) {
        if (field.name && target[field.name] === undefined && field.default !== undefined) target[field.name] = clone(field.default)
      }
      return target
    },
    setTools(container, tools = []) {
      container.editorTools = tools.map(tool => ({ group: 'primary', ...tool }))
      container.getTools = () => container.editorTools.map(tool => ({
        ...tool,
        hidden: typeof tool.hidden === 'function' ? !!tool.hidden() : !!tool.hidden,
        disabled: typeof tool.disabled === 'function' ? !!tool.disabled() : !!tool.disabled,
        active: typeof tool.active === 'function' ? !!tool.active() : !!tool.active
      }))
      container.runTool = (id, ...args) => {
        const tool = container.editorTools.find(item => item.id === id)
        if (!tool || (typeof tool.disabled === 'function' ? tool.disabled() : tool.disabled)) return undefined
        const result = tool.run?.(...args)
        container.dispatchEvent(new CustomEvent('toolschange', { detail: container.getTools(), bubbles: false }))
        return result
      }
      container.dispatchEvent(new CustomEvent('toolschange', { detail: container.getTools(), bubbles: false }))
      return container.editorTools
    },
    async load({ api, path, version, type }) {
      if (!api) throw new Error('Document api is required for automatic load')
      if (!path) throw new Error('Document path is required for automatic load')
      const request = { action: 'get', path }
      if (version !== undefined && version !== null && version !== '') request.version = version
      return contentFrom(assertResponse(await globalThis.HTTP.post({ url: api, data: request })), type, path)
    },
    async save({ api, path, data }) {
      if (!api) throw new Error('Document api is required for automatic save')
      if (!path) throw new Error('Document path is required for automatic save')
      if (data === undefined) throw new Error('Document data is required for automatic save')
      return assertResponse(await globalThis.HTTP.post({ url: api, data: { action: 'set', path, data } }))
    },
    connect(container, { type, defaultData, normalize = value => value } = {}) {
      if (!type) throw new Error('Editor.connect requires a document type')
      const state = container.state
      if (state.path === undefined && container.hasAttribute('path')) state.path = container.getAttribute('path')
      if (state.version === undefined && container.hasAttribute('version')) state.version = Number(container.getAttribute('version')) || container.getAttribute('version')
      if (state.data === undefined) state.data = normalize(clone(typeof defaultData === 'function' ? defaultData() : defaultData) || {})
      else state.data = normalize(state.data)
      container.documentType = type
      let loadSequence = 0
      container.load = async () => {
        const api = container.api || container.getAttribute('api')
        if (!api) return state.data
        const path = state.path
        const sequence = ++loadSequence
        state.loading = true
        state.error = null
        try {
          const document = await Editor.load({ api, path, version: state.version, type })
          if (sequence !== loadSequence) return state.data
          state.document = document
          state.loadedVersion = document.version
          state.data = normalize(document.data)
          container.dispatchEvent(new CustomEvent('loaded', { detail: document, bubbles: false }))
          return state.data
        } catch (error) {
          if (sequence !== loadSequence) return state.data
          state.error = error.message
          container.dispatchEvent(new CustomEvent('error', { detail: error, bubbles: false }))
          throw error
        } finally { if (sequence === loadSequence) state.loading = false }
      }
      container.save = async () => {
        const path = state.path
        const previous = { ...(state.document || {}) }
        delete previous.data; delete previous.type; delete previous.version; delete previous.path
        const document = Editor.createDocument(type, state.data, { ...previous, path, formatVersion: previous.formatVersion || 1 })
        const event = new CustomEvent('save', { detail: document, cancelable: true, bubbles: false })
        if (!container.dispatchEvent(event)) return null
        const api = container.api || container.getAttribute('api')
        if (!api) return document
        state.saving = true
        state.error = null
        try {
          const result = await Editor.save({ api, path, data: document })
          const meta = result?.meta && typeof result.meta === 'object' ? result.meta : null
          const version = meta?.version ?? result?.version
          if (version !== undefined && version !== null) state.loadedVersion = version
          state.document = { ...document, ...(meta ? { meta } : {}), ...(version !== undefined && version !== null ? { version } : {}) }
          container.dispatchEvent(new CustomEvent('saved', { detail: result, bubbles: false }))
          return result
        } catch (error) {
          state.error = error.message
          container.dispatchEvent(new CustomEvent('error', { detail: error, bubbles: false }))
          throw error
        } finally { state.saving = false }
      }
      let queued = false
      const queueLoad = () => {
        if (queued || !(container.api || container.getAttribute('api')) || !state.path) return
        queued = true
        Promise.resolve().then(() => { queued = false; container.load().catch(() => {}) })
      }
      state.__watch('path', queueLoad)
      state.__watch('version', queueLoad)
      queueLoad()
      return container
    },
    clone
  }
  return Editor
})()

globalThis.Editor = Editor
