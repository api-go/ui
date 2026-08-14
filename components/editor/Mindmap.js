/**
 * Automatically laid-out tree editor backed by GraphDocument.
 */
const MINDMAP_SCHEMAS = {
  node: [
    { name: 'title', label: '{#Title#}', type: 'text', setting: { required: true } },
    { name: 'content', label: '{#Content#}', type: 'textarea', setting: { rows: 5, maxlength: 2000 } }
  ]
}

globalThis.Component.register('Mindmap', container => {
  container.readonly = container.hasAttribute('readonly')
  const defaultSettings = {
    direction: ['left', 'right'].includes(container.getAttribute('direction')) ? container.getAttribute('direction') : 'right',
    nodeWidth: Number(container.getAttribute('node-width')) || 176,
    nodeHeight: Number(container.getAttribute('node-height')) || 64,
    hGap: Number(container.getAttribute('h-gap')) || 80,
    vGap: Number(container.getAttribute('v-gap')) || 28
  }
  const defaultData = () => ({ nodes: [{ id: 'root', title: 'Central topic', content: '' }], edges: [], view: {}, settings: { ...defaultSettings } })
  const normalize = value => {
    const data = globalThis.GraphDocument.normalize(value?.nodes || value?.root || value?.children || value?.id ? value : defaultData())
    data.settings = { ...defaultSettings, ...(data.settings || {}) }
    if (!['left', 'right'].includes(data.settings.direction)) data.settings.direction = defaultSettings.direction
    const incoming = new Set(data.edges.map(edge => edge.to)), roots = data.nodes.filter(node => !incoming.has(node.id))
    if (roots.length > 1) roots.slice(1).forEach(root => globalThis.GraphDocument.addEdge(data, roots[0].id, root.id))
    return data
  }
  globalThis.Editor.connect(container, { type: 'mindmap', defaultData, normalize })

  const state = container.state
  if (state.extraSchemas === undefined && state.extraschemas !== undefined) state.extraSchemas = state.extraschemas
  const schemas = () => globalThis.Editor.mergeSchemas(MINDMAP_SCHEMAS, state.extraSchemas || {})
  state.dirty = false
  const sizes = {}, viewport = container.querySelector('.graph-viewport'), scene = container.querySelector('.graph-scene'), svg = container.querySelector('.graph-edges')
  let initialFit = true, renderTimer
  const canvas = globalThis.GraphCanvas.create(viewport, scene, {
    view: state.data.view,
    onChange: view => { state.view = view }
  })
  container.canvas = canvas
  state.view = canvas.view

  const drawEdges = () => {
    svg.innerHTML = ''
    for (const edge of state.layoutEdges || []) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', edge.path); path.setAttribute('class', 'mindmap-edge')
      svg.appendChild(path)
    }
  }
  const measure = () => {
    let changedSize = false
    container.querySelectorAll('[data-graph-node]').forEach(node => {
      const next = { width: node.offsetWidth, height: node.offsetHeight }
      const previous = sizes[node.dataset.nodeId]
      if (!previous || Math.abs(previous.width - next.width) > 1 || Math.abs(previous.height - next.height) > 1) { sizes[node.dataset.nodeId] = next; changedSize = true }
    })
    if (changedSize) render(false)
  }
  const render = (fit = false) => {
    clearTimeout(renderTimer)
    const data = normalize(state.data)
    if (!state.data?.settings) state.data = data
    const settings = data.settings
    const layout = globalThis.GraphDocument.layoutTree(data, { direction: settings.direction, nodeWidth: settings.nodeWidth, nodeHeight: settings.nodeHeight, hGap: settings.hGap, vGap: settings.vGap, sizes })
    state.layoutNodes = layout.nodes; state.layoutEdges = layout.edges
    renderTimer = setTimeout(() => {
      drawEdges(); measure()
      if (fit || initialFit) { initialFit = false; canvas.fit(state.layoutNodes) }
    }, 0)
  }
  const changed = (data, reason, detail = {}) => {
    state.data = normalize(data); state.dirty = true; render(false)
    container.dispatchEvent(new CustomEvent('change', { detail: state.data, bubbles: false }))
    container.dispatchEvent(new CustomEvent('update', { detail: { data: state.data, reason, ...detail }, bubbles: false }))
  }
  state.__watch('data', () => render(false))
  state.__watch('extraschemas', value => { state.extraSchemas = value })
  state.__watch('extraSchemas', () => { if (state.editing) state.editing.schema = schemas().node })

  container.selectNode = node => {
    const previewing = !!state.previewNode
    state.selectedNodeId = node?.id || null
    if (!node) state.previewNode = null
    else if (previewing) state.previewNode = node
    container.focus({ preventScroll: true })
    container.dispatchEvent(new CustomEvent('select', { detail: node || null, bubbles: false }))
  }
  const modal = () => container.querySelector('Modal.mindmap-editor')
  const hideEditor = () => {
    const dialog = modal()
    if (!dialog) return
    dialog.hide()
    if (dialog.classList.contains('show')) dialog.addEventListener('shown.bs.modal', () => dialog.hide(), { once: true })
  }
  container.editNode = node => {
    if (container.readonly || !node) return null
    const schema = schemas().node, draft = globalThis.NewState(globalThis.Editor.applyDefaults(globalThis.Editor.clone(node), schema))
    state.editing = { kind: 'node', id: node.id, draft, schema, title: '{#Edit node#}' }
    const dialog = modal(), form = dialog?.querySelector('AutoForm')
    if (form) {
      form.state.schema = []; form.state._schema = []; form.state.data = draft
      Promise.resolve().then(() => { if (state.editing?.draft === draft) form.state.schema = schema })
    }
    if (dialog) {
      dialog.state.title = state.editing.title
      dialog.show()
    }
    return draft
  }
  container.commitEdit = () => {
    if (!state.editing) return
    const form = modal()?.querySelector('AutoForm')
    if (form?.form && !form.form.reportValidity()) return
    const data = normalize(state.data), index = data.nodes.findIndex(node => node.id === state.editing.id), value = globalThis.Editor.clone(state.editing.draft)
    if (index >= 0) data.nodes[index] = { ...data.nodes[index], ...value }
    hideEditor(); state.editing = null; changed(data, 'edit-node', { node: value })
  }
  container.cancelEdit = () => { hideEditor(); state.editing = null }
  container.addChild = parent => {
    if (container.readonly) return null
    const data = normalize(state.data), parentNode = parent || data.nodes.find(node => node.id === state.selectedNodeId) || data.nodes[0]
    if (!parentNode) return null
    const node = globalThis.GraphDocument.addNode(data, { title: 'New topic', content: '' }, parentNode.id)
    parentNode.collapsed = false; changed(data, 'add-node', { node, parent: parentNode }); container.selectNode(node); container.editNode(node)
    return node
  }
  container.addSibling = node => {
    if (container.readonly || !node) return null
    const data = normalize(state.data), incoming = data.edges.find(edge => edge.to === node.id)
    const parent = incoming ? data.nodes.find(item => item.id === incoming.from) : node
    return container.addChild(parent)
  }
  container.removeNode = async (node, options = {}) => {
    if (container.readonly || !node) return false
    const data = normalize(state.data), incoming = new Set(data.edges.map(edge => edge.to))
    if (!incoming.has(node.id)) return false
    const confirm = options.confirm !== false
    if (confirm && !(globalThis.Dialog?.confirm ? await globalThis.Dialog.confirm(`{#Delete node#}: ${node.title}?`, { type: 'danger' }) : globalThis.confirm(`Delete node: ${node.title}?`))) return false
    globalThis.GraphDocument.removeNode(data, node.id, { cascade: true }); state.selectedNodeId = null; state.previewNode = null; changed(data, 'remove-node', { node }); return true
  }
  container.toggleNode = node => {
    if (!node) return
    const data = normalize(state.data), target = data.nodes.find(item => item.id === node.id)
    if (!target) return
    target.collapsed = !target.collapsed; changed(data, 'toggle-node', { node: target })
  }
  container.fit = () => canvas.fit(state.layoutNodes || [])
  container.setDirection = direction => {
    if (!['left', 'right'].includes(direction)) return
    const data = normalize(state.data)
    if (data.settings.direction === direction) return
    data.settings.direction = direction; changed(data, 'change-direction', { direction }); setTimeout(() => container.fit(), 0)
  }
  container.togglePreview = () => {
    if (!state.selectedNodeId) return
    state.previewNode = state.previewNode ? null : state.data.nodes.find(node => node.id === state.selectedNodeId) || null
  }
  container.onCanvasClick = event => {
    if (event.target.closest('[data-graph-node],button,.mindmap-preview')) return
    container.selectNode(null)
  }
  container.onKeydown = event => {
    if (event.target?.matches?.('input,textarea,select,[contenteditable="true"]') || !state.selectedNodeId) return
    const node = state.data.nodes.find(item => item.id === state.selectedNodeId)
    if (!node) return
    if (event.key === 'Tab') { event.preventDefault(); container.addChild(node) }
    else if (event.key === 'Enter') { event.preventDefault(); container.addSibling(node) }
    else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); container.removeNode(node, { confirm: !(event.ctrlKey || event.metaKey) }) }
    else if (event.key === ' ') { event.preventDefault(); container.togglePreview() }
  }
  container.onEditorKeydown = event => {
    event.stopPropagation()
    if (event.key === 'Escape') { event.preventDefault(); container.cancelEdit() }
    else if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && !event.target?.matches?.('textarea,button')) { event.preventDefault(); container.commitEdit() }
  }
  modal()?.addEventListener('keydown', container.onEditorKeydown)
  const outsideEditorEscape = event => {
    if (state.editing && event.key === 'Escape' && !modal()?.contains(event.target)) { event.preventDefault(); container.cancelEdit() }
  }
  document.addEventListener('keydown', outsideEditorEscape)
  container.schemas = schemas
  globalThis.Editor.setTools(container, [
    { id: 'direction-left', group: 'view', label: 'Expand left', icon: 'diagram-3', active: () => state.data.settings?.direction === 'left', run: () => container.setDirection('left') },
    { id: 'direction-right', group: 'view', label: 'Expand right', icon: 'diagram-3', active: () => state.data.settings?.direction === 'right', run: () => container.setDirection('right') },
    { id: 'fit', group: 'view', label: 'Fit map', icon: 'bounding-box', run: () => container.fit() },
    { id: 'add-child', label: 'Add child', icon: 'node-plus', disabled: () => container.readonly, run: () => container.addChild() }
  ])
  const documentSave = container.save
  container.save = async () => { const data = normalize(state.data); data.view = canvas.view; state.data = data; const result = await documentSave(); if (result) state.dirty = false; return result }
  container.addEventListener('loaded', () => { state.dirty = false; render(true) })
  container.addEventListener('saved', () => { state.dirty = false })
  const outsidePointer = event => { if (!container.contains(event.target)) state.previewNode = null }
  document.addEventListener('pointerdown', outsidePointer)
  render(true)
  globalThis.DOMDisposer.add(container, () => { clearTimeout(renderTimer); canvas.destroy(); document.removeEventListener('pointerdown', outsidePointer); modal()?.removeEventListener('keydown', container.onEditorKeydown); document.removeEventListener('keydown', outsideEditorEscape) })
}, globalThis.Util.makeDom(/*html*/`
<div class="mindmap-root d-flex flex-column h-100 border rounded overflow-hidden bg-body" tabindex="0" $onkeydown="this.onKeydown(event)">
  <div $if="this.hasAttribute('toolbar')" slot-id="toolbar" class="d-flex align-items-center gap-2 border-bottom px-2 py-2 bg-body">
    <div class="btn-group btn-group-sm" role="group" aria-label="{#Direction#}">
      <button type="button" class="mindmap-direction mindmap-direction-left" $class="'btn '+(this.state.data.settings?.direction==='left'?'btn-secondary':'btn-outline-secondary')" $onclick="this.setDirection('left')" title="{#Expand left#}"><i class="bi bi-diagram-3"></i></button>
      <button type="button" class="mindmap-direction mindmap-direction-right" $class="'btn '+(this.state.data.settings?.direction==='right'?'btn-secondary':'btn-outline-secondary')" $onclick="this.setDirection('right')" title="{#Expand right#}"><i class="bi bi-diagram-3"></i></button>
    </div>
    <button type="button" class="mindmap-fit btn btn-sm btn-outline-secondary" $onclick="this.fit()" title="{#Fit map#}"><i class="bi bi-bounding-box"></i></button>
    <div class="flex-grow-1"></div>
    <span $if="this.state.selectedNodeId" class="small text-muted d-none d-lg-inline">Tab {#child#} · Enter {#sibling#} · Space {#preview#}</span>
    <button $if="!this.hasAttribute('nosave')" type="button" class="mindmap-save" $class="'btn btn-sm '+(this.state.dirty?'btn-primary':'btn-outline-secondary')" $disabled="!this.state.dirty || this.state.saving" $onclick="this.save()"><i class="bi bi-save me-1"></i>{#Save#}</button>
  </div>
  <div class="graph-viewport flex-grow-1 position-relative overflow-hidden bg-body-tertiary" $onclick="this.onCanvasClick(event)">
    <div class="graph-scene position-absolute">
      <svg class="graph-edges position-absolute overflow-visible" width="1" height="1"></svg>
      <div class="graph-nodes position-absolute">
        <template $each="this.state.layoutNodes || []" as="node" index="nodeIndex" key="id">
          <article data-graph-node class="mindmap-node card position-absolute shadow-sm" $data-node-id="node.id" $class="this.state.selectedNodeId===node.id?'border-primary border-2':''" $style="'left:'+node.x+'px;top:'+node.y+'px;width:'+node.width+'px;min-height:'+node.height+'px'" $onclick="event.stopPropagation();this.selectNode(node)" $ondblclick="event.stopPropagation();this.editNode(node)">
            <div slot-id="node" class="card-body p-2 d-flex align-items-center gap-2">
              <div class="flex-grow-1 min-w-0"><div class="mindmap-node-title fw-semibold" $text="node.title"></div><div $if="node.content" class="mindmap-node-content small text-muted" $text="node.content"></div></div>
            </div>
            <div slot-id="node-actions" class="mindmap-node-actions position-absolute d-flex gap-1">
              <button $if="GraphDocument.children(this.state.data,node.id).length" type="button" class="btn btn-sm btn-outline-secondary rounded-circle p-0" title="{#Collapse#}" $onclick="event.stopPropagation();this.toggleNode(node)"><i $class="'bi '+(node.collapsed?'bi-chevron-right':'bi-chevron-down')"></i></button>
            </div>
          </article>
        </template>
      </div>
      <div slot-id="empty" $if="!this.state.data.nodes.length" class="position-absolute text-muted">{#No nodes#}</div>
    </div>
    <div $if="this.state.previewNode" class="mindmap-preview position-absolute top-0 start-50 translate-middle-x mt-3 rounded-2 shadow px-3 py-2 text-dark" role="tooltip" aria-live="polite">
      <div class="mindmap-preview-arrow"></div><div class="small fw-semibold mb-1" $text="this.state.previewNode.title"></div><div $if="this.state.previewNode.content" class="small opacity-75 text-break" $text="this.state.previewNode.content"></div><div $if="!this.state.previewNode.content" class="small opacity-50">{#No content#}</div>
    </div>
  </div>
  <Modal class="mindmap-editor">
    <div slot="body"><div slot-id="editor"><AutoForm nobutton vertical></AutoForm></div></div>
    <div slot="footer"><button type="button" class="btn btn-secondary" $onclick="thisNode.closest('Mindmap').cancelEdit()">{#Cancel#}</button><button type="button" class="btn btn-primary" $onclick="thisNode.closest('Mindmap').commitEdit()">{#Save#}</button></div>
  </Modal>
</div>
`), globalThis.Util.makeDom(/*html*/`<style>
  Mindmap { display:block; min-height:360px; }
  Mindmap .graph-viewport { touch-action:none; cursor:grab; }
  Mindmap .graph-viewport.graph-panning { cursor:grabbing; }
  Mindmap .graph-scene { left:0; top:0; }
  Mindmap .mindmap-edge { fill:none; stroke:var(--bs-primary); stroke-width:2; }
  Mindmap .mindmap-node { cursor:pointer; }
  Mindmap .mindmap-node-title { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden; }
  Mindmap .mindmap-node-content { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:3; overflow:hidden; margin-top:.25rem; }
  Mindmap .mindmap-node-actions { right:-13px; top:50%; transform:translateY(-50%); z-index:2; }
  Mindmap .mindmap-node-actions .btn { width:26px; height:26px; line-height:24px; }
  Mindmap .min-w-0 { min-width:0; }
  Mindmap .mindmap-direction i { display:inline-block; }
  Mindmap .mindmap-direction-left i { transform:rotate(90deg); }
  Mindmap .mindmap-direction-right i { transform:rotate(-90deg); }
  Mindmap .mindmap-preview { width:min(360px, calc(100% - 2rem)); max-height:40%; overflow:auto; z-index:10; pointer-events:none; background:rgba(var(--bs-info-rgb),.88); border:1px solid rgba(var(--bs-info-rgb),1); backdrop-filter:blur(4px); font-size:.875rem; }
  Mindmap .mindmap-preview-arrow { position:absolute; left:50%; bottom:-6px; width:12px; height:12px; background:inherit; transform:translateX(-50%) rotate(45deg); }
  Mindmap:focus { outline:none; }
</style>`))

globalThis.Editor?.register({ name: 'Mindmap', component: 'Mindmap', extensions: ['mindmap'], types: ['mindmap'], mimeTypes: ['application/x-mindmap+json'] })
