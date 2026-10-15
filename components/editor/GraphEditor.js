/**
 * Free-position graph editor for plots, flows, and relationship documents.
 */
const GRAPH_EDITOR_SCHEMAS = {
  node: [
    { name: 'title', label: '{#Title#}', type: 'text', setting: { required: true } },
    { name: 'content', label: '{#Content#}', type: 'textarea', setting: { rows: 6, maxlength: 4000 } }
  ],
  edge: [
    { name: 'label', label: '{#Label#}', type: 'text' },
    { name: 'content', label: '{#Content#}', type: 'textarea', setting: { rows: 4, maxlength: 2000 } }
  ]
}

globalThis.Component.register('GraphEditor', container => {
  const defaultData = () => ({ nodes: [{ id: 'root', title: '{#Starting point#}', content: '', x: 0, y: 0 }], edges: [], view: {} })
  const normalize = value => {
    const data = globalThis.GraphDocument.normalize(value?.nodes ? value : defaultData())
    data.nodes = data.nodes.map((node, index) => ({ ...node, x: Number.isFinite(Number(node.x)) ? Number(node.x) : (index % 4) * 240, y: Number.isFinite(Number(node.y)) ? Number(node.y) : Math.floor(index / 4) * 150 }))
    return data
  }
  container.readonly = container.hasAttribute('readonly')
  container.nodeWidth = Number(container.getAttribute('node-width')) || 190
  container.nodeHeight = Number(container.getAttribute('node-height')) || 84
  globalThis.Editor.connect(container, { type: 'graph', defaultData, normalize })

  const state = container.state
  if (state.extraSchemas === undefined && state.extraschemas !== undefined) state.extraSchemas = state.extraschemas
  const schemas = () => globalThis.Editor.mergeSchemas(GRAPH_EDITOR_SCHEMAS, state.extraSchemas || {})
  state.dirty = false
  const sizes = {}, viewport = container.querySelector('.graph-viewport'), scene = container.querySelector('.graph-scene'), svg = container.querySelector('.graph-edges')
  let initialFit = true, renderTimer, dragCleanup
  const markerId = `graph-arrow-${(globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).replace(/[^a-z0-9-]/gi, '')}`
  const canvas = globalThis.GraphCanvas.create(viewport, scene, { view: state.data.view, onChange: view => { state.view = view } })
  container.canvas = canvas; state.view = canvas.view

  const routeEdges = (data, nodes) => {
    const positions = new Map(nodes.map(node => [node.id, node]))
    const groups = new Map()
    for (const edge of data.edges) {
      const key = [edge.from, edge.to].sort().join('\u0000')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(edge.id)
    }
    const boundary = (node, toward) => {
      const center = { x: node.x + node.width / 2, y: node.y + node.height / 2 }
      const dx = toward.x - center.x, dy = toward.y - center.y
      if (!dx && !dy) return center
      const ratio = Math.min(Math.abs((node.width / 2) / (dx || Number.EPSILON)), Math.abs((node.height / 2) / (dy || Number.EPSILON)))
      return { x: center.x + dx * ratio, y: center.y + dy * ratio }
    }
    return data.edges.map(edge => {
      const from = positions.get(edge.from), to = positions.get(edge.to)
      if (!from || !to) return null
      const fromCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 }, toCenter = { x: to.x + to.width / 2, y: to.y + to.height / 2 }
      const start = boundary(from, toCenter), end = boundary(to, fromCenter)
      const key = [edge.from, edge.to].sort().join('\u0000'), siblings = groups.get(key), lane = siblings.indexOf(edge.id) - (siblings.length - 1) / 2
      if (siblings.length > 1) {
        const canonical = edge.from <= edge.to ? { from: start, to: end } : { from: end, to: start }
        const dx = canonical.to.x - canonical.from.x, dy = canonical.to.y - canonical.from.y, length = Math.max(1, Math.hypot(dx, dy))
        const control = { x: (start.x + end.x) / 2 - dy / length * lane * 56, y: (start.y + end.y) / 2 + dx / length * lane * 56 }
        return { ...edge, x: (start.x + 2 * control.x + end.x) / 4, y: (start.y + 2 * control.y + end.y) / 4, path: `M ${start.x} ${start.y} Q ${control.x} ${control.y}, ${end.x} ${end.y}` }
      }
      const curve = Math.max(48, Math.abs(end.x - start.x) / 2), direction = end.x >= start.x ? 1 : -1
      return { ...edge, x: (start.x + end.x) / 2, y: (start.y + end.y) / 2, path: `M ${start.x} ${start.y} C ${start.x + curve * direction} ${start.y}, ${end.x - curve * direction} ${end.y}, ${end.x} ${end.y}` }
    }).filter(Boolean)
  }
  const syncEdgeSelection = () => svg.querySelectorAll('.graph-edge').forEach(path => path.classList.toggle('selected', path.dataset.edgeId === state.selectedEdgeId))

  const drawEdges = () => {
    svg.innerHTML = `<defs><marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--bs-secondary-color)"></path></marker></defs>`
    for (const edge of state.edgeLayouts || []) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', edge.path); path.setAttribute('class', state.selectedEdgeId === edge.id ? 'graph-edge selected' : 'graph-edge')
      path.setAttribute('marker-end', `url(#${markerId})`); path.dataset.edgeId = edge.id
      path.addEventListener('click', event => { event.stopPropagation(); container.selectEdge(edge) })
      path.addEventListener('dblclick', event => { event.stopPropagation(); container.editEdge(edge) })
      svg.appendChild(path)
    }
    syncEdgeSelection()
  }
  const measure = () => {
    let changedSize = false
    container.querySelectorAll('[data-graph-node]').forEach(element => {
      const next = { width: element.offsetWidth, height: element.offsetHeight }, previous = sizes[element.dataset.nodeId]
      if (!previous || Math.abs(previous.width - next.width) > 1 || Math.abs(previous.height - next.height) > 1) { sizes[element.dataset.nodeId] = next; changedSize = true }
    })
    if (changedSize) render(false)
  }
  const render = (fit = false) => {
    clearTimeout(renderTimer)
    const data = normalize(state.data)
    const nodes = data.nodes.map(node => ({ ...node, width: sizes[node.id]?.width || container.nodeWidth, height: sizes[node.id]?.height || container.nodeHeight }))
    state.layoutNodes = nodes; state.edgeLayouts = routeEdges(data, nodes)
    renderTimer = setTimeout(() => { drawEdges(); measure(); if (fit || initialFit) { initialFit = false; canvas.fit(nodes) } }, 0)
  }
  const changed = (data, reason, detail = {}) => {
    state.data = normalize(data); state.dirty = true; render(false)
    container.dispatchEvent(new CustomEvent('change', { detail: state.data, bubbles: false }))
    container.dispatchEvent(new CustomEvent('update', { detail: { data: state.data, reason, ...detail }, bubbles: false }))
  }
  state.__watch('data', () => render(false))
  state.__watch('extraschemas', value => { state.extraSchemas = value })
  state.__watch('extraSchemas', () => { if (state.editing) state.editing.schema = schemas()[state.editing.kind] })

  container.selectNode = (node, event) => {
    if (!container.readonly && event?.shiftKey && state.selectedNodeId && state.selectedNodeId !== node.id) return container.connect(state.selectedNodeId, node.id)
    const previewing = !!state.previewItem
    state.selectedNodeId = node?.id || null; state.selectedEdgeId = null
    if (!node) { state.previewItem = null; state.previewNode = null }
    else if (previewing) { state.previewItem = { key: `node:${node.id}`, kind: 'node', value: node }; state.previewNode = node }
    container.focus({ preventScroll: true })
    syncEdgeSelection()
    container.dispatchEvent(new CustomEvent('select', { detail: node || null, bubbles: false }))
  }
  container.selectEdge = edge => {
    const previewing = !!state.previewItem
    state.selectedEdgeId = edge?.id || null; state.selectedNodeId = null
    if (!edge) { state.previewItem = null; state.previewNode = null }
    else if (previewing) { state.previewItem = { key: `edge:${edge.id}`, kind: 'edge', value: edge }; state.previewNode = null }
    container.focus({ preventScroll: true }); syncEdgeSelection(); container.dispatchEvent(new CustomEvent('select', { detail: edge || null, bubbles: false }))
  }
  container.addNode = (position = null) => {
    if (container.readonly) return null
    const data = normalize(state.data)
    if (!position) { const rect = viewport.getBoundingClientRect(); position = canvas.toWorld(rect.left + rect.width / 2, rect.top + rect.height / 2) }
    const node = globalThis.GraphDocument.addNode(data, { title: '{#New plot point#}', content: '', x: Math.round(position.x), y: Math.round(position.y) })
    changed(data, 'add-node', { node }); container.selectNode(node); container.editNode(node); return node
  }
  container.connect = (from, to) => {
    if (container.readonly) return null
    const fromId = typeof from === 'object' ? from.id : from, toId = typeof to === 'object' ? to.id : to, data = normalize(state.data)
    const edge = globalThis.GraphDocument.addEdge(data, fromId, toId, { label: '' })
    if (edge) { changed(data, 'add-edge', { edge }); container.selectEdge(edge) }
    return edge
  }
  const modal = () => container.querySelector('Modal.graph-editor-modal')
  const hideEditor = () => {
    const dialog = modal()
    if (!dialog) return
    dialog.hide()
    if (dialog.classList.contains('show')) dialog.addEventListener('shown.bs.modal', () => dialog.hide(), { once: true })
  }
  container.edit = (kind, value) => {
    if (container.readonly || !value) return null
    const schema = schemas()[kind], draft = globalThis.NewState(globalThis.Editor.applyDefaults(globalThis.Editor.clone(value), schema))
    state.editing = { kind, id: value.id, draft, schema, title: kind === 'node' ? '{#Edit node#}' : '{#Edit edge#}' }
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
  container.editNode = node => container.edit('node', node)
  container.editEdge = edge => container.edit('edge', edge)
  container.commitEdit = () => {
    if (!state.editing) return
    const form = modal()?.querySelector('AutoForm')
    if (form?.form && !form.form.reportValidity()) return
    const data = normalize(state.data), list = state.editing.kind === 'node' ? data.nodes : data.edges, index = list.findIndex(item => item.id === state.editing.id), value = globalThis.Editor.clone(state.editing.draft)
    if (index >= 0) list[index] = { ...list[index], ...value }
    hideEditor(); state.editing = null; changed(data, `edit-${value.from !== undefined ? 'edge' : 'node'}`, { value })
  }
  container.cancelEdit = () => { hideEditor(); state.editing = null }
  container.removeSelected = async (options = {}) => {
    if (container.readonly) return false
    const data = normalize(state.data)
    const target = state.selectedNodeId ? data.nodes.find(item => item.id === state.selectedNodeId) : data.edges.find(item => item.id === state.selectedEdgeId)
    if (!target) return false
    if (options.confirm !== false && !(globalThis.Dialog?.confirm ? await globalThis.Dialog.confirm(`{#Delete#}: ${target.title || target.label || target.id}?`, { type: 'danger' }) : globalThis.confirm(`Delete: ${target.title || target.label || target.id}?`))) return false
    state.previewItem = null; state.previewNode = null
    if (state.selectedNodeId) { const node = target; globalThis.GraphDocument.removeNode(data, state.selectedNodeId); state.selectedNodeId = null; changed(data, 'remove-node', { node }) }
    else { const edge = target; globalThis.GraphDocument.removeEdge(data, state.selectedEdgeId); state.selectedEdgeId = null; changed(data, 'remove-edge', { edge }) }
    return true
  }
  container.startNodeDrag = (node, event, element) => {
    if (event.button !== 0 || event.target.closest('button,input,textarea,select,a')) return
    event.stopPropagation(); dragCleanup?.(); if (!event.shiftKey) container.selectNode(node)
    const startX = event.clientX, startY = event.clientY, originX = node.x, originY = node.y, scale = canvas.view.scale
    const move = moveEvent => {
      const x = originX + (moveEvent.clientX - startX) / scale, y = originY + (moveEvent.clientY - startY) / scale
      element.style.left = `${x}px`; element.style.top = `${y}px`
      const layoutNode = state.layoutNodes?.find(item => item.id === node.id)
      if (layoutNode) { layoutNode.x = x; layoutNode.y = y; state.edgeLayouts = routeEdges(normalize(state.data), state.layoutNodes); drawEdges() }
    }
    const end = endEvent => {
      const dx = endEvent.clientX - startX, dy = endEvent.clientY - startY
      if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) { dragCleanup?.(); return }
      const data = normalize(state.data), target = data.nodes.find(item => item.id === node.id)
      if (target) {
        target.x = Math.round(originX + dx / scale); target.y = Math.round(originY + dy / scale)
        if (container.readonly) { state.data = data; render(false); container.dispatchEvent(new CustomEvent('layoutchange', {detail:{node:target,data},bubbles:false})) }
        else changed(data, 'move-node', { node: target })
      }
      dragCleanup?.()
    }
    dragCleanup = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); dragCleanup = null }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', end)
  }
  container.fit = () => canvas.fit(state.layoutNodes || [])
  container.onCanvasClick = event => { if (!event.target.closest('[data-graph-node],.graph-edge-label,.graph-edge,button,.graph-preview')) container.selectNode(null) }
  container.onCanvasDoubleClick = event => {
    if (container.readonly || event.target.closest('[data-graph-node],.graph-edge-label,.graph-edge,button')) return
    event.preventDefault(); container.addNode(canvas.toWorld(event.clientX, event.clientY))
  }
  container.togglePreview = () => {
    const kind = state.selectedNodeId ? 'node' : state.selectedEdgeId ? 'edge' : null
    if (!kind) return
    const value = kind === 'node' ? state.data.nodes.find(node => node.id === state.selectedNodeId) : state.data.edges.find(edge => edge.id === state.selectedEdgeId)
    const key = `${kind}:${value?.id}`
    state.previewItem = state.previewItem?.key === key ? null : { key, kind, value }
    state.previewNode = state.previewItem?.kind === 'node' ? state.previewItem.value : null
  }
  container.previewTitle = () => state.previewItem?.kind === 'node' ? state.previewItem.value.title : state.previewItem?.value.label || '{#Connection#}'
  container.previewContent = () => {
    if (!state.previewItem) return ''
    if (state.previewItem.kind === 'node') return state.previewItem.value.content || ''
    const edge = state.previewItem.value, from = state.data.nodes.find(node => node.id === edge.from), to = state.data.nodes.find(node => node.id === edge.to)
    return edge.content || `${from?.title || edge.from} → ${to?.title || edge.to}`
  }
  container.onKeydown = event => {
    if (event.target?.matches?.('input,textarea,select,[contenteditable="true"]')) return
    if ((event.key === 'Delete' || event.key === 'Backspace') && (state.selectedNodeId || state.selectedEdgeId)) { event.preventDefault(); container.removeSelected({ confirm: !(event.ctrlKey || event.metaKey) }) }
    else if (event.key === ' ' && (state.selectedNodeId || state.selectedEdgeId)) { event.preventDefault(); container.togglePreview() }
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
    { id: 'fit', group: 'view', label: '{#Fit graph#}', icon: 'bounding-box', run: () => container.fit() },
    { id: 'add-node', label: '{#Add node#}', icon: 'plus-lg', disabled: () => container.readonly, run: () => container.addNode() },
    { id: 'remove-selected', label: '{#Delete selected#}', icon: 'trash', disabled: () => container.readonly || (!state.selectedNodeId && !state.selectedEdgeId), run: () => container.removeSelected() }
  ])
  const documentSave = container.save
  container.save = async () => { const data = normalize(state.data); data.view = canvas.view; state.data = data; const result = await documentSave(); if (result) state.dirty = false; return result }
  container.addEventListener('loaded', () => { state.dirty = false; render(true) })
  container.addEventListener('saved', () => { state.dirty = false })
  const outsidePointer = event => { if (!container.contains(event.target)) { state.previewItem = null; state.previewNode = null } }
  document.addEventListener('pointerdown', outsidePointer)
  render(true)
  globalThis.DOMDisposer.add(container, () => { clearTimeout(renderTimer); dragCleanup?.(); canvas.destroy(); document.removeEventListener('pointerdown', outsidePointer); modal()?.removeEventListener('keydown', container.onEditorKeydown); document.removeEventListener('keydown', outsideEditorEscape) })
}, globalThis.Util.makeDom(/*html*/`
<div class="graph-editor-root d-flex flex-column h-100 border rounded overflow-hidden bg-body" tabindex="0" $onkeydown="this.onKeydown(event)">
  <div $if="this.hasAttribute('toolbar')" slot-id="toolbar" class="d-flex align-items-center gap-2 border-bottom px-2 py-2 bg-body">
    <button type="button" class="graph-fit btn  btn-outline-secondary" $onclick="this.fit()" title="{#Fit graph#}"><i class="bi bi-bounding-box"></i></button>
    <div class="flex-grow-1"></div><button $if="!this.hasAttribute('nosave')" type="button" class="graph-save" $class="'btn  '+(this.state.dirty?'btn-primary':'btn-outline-secondary')" $disabled="!this.state.dirty || this.state.saving" $onclick="this.save()"><i class="bi bi-save me-1"></i>{#Save#}</button>
  </div>
  <div class="graph-viewport flex-grow-1 position-relative overflow-hidden bg-body-tertiary" $onclick="this.onCanvasClick(event)" $ondblclick="this.onCanvasDoubleClick(event)">
    <span $if="!this.readonly && this.state.selectedNodeId" class="graph-connect-hint position-absolute top-0 start-0 m-2 px-2 py-1 rounded small text-body-secondary bg-body border"><i class="bi bi-link-45deg me-1"></i>{#Shift-click another node to connect#}</span>
    <div class="graph-scene position-absolute">
      <svg class="graph-edges position-absolute overflow-visible" width="1" height="1"></svg>
      <div class="graph-nodes position-absolute">
        <template $each="this.state.layoutNodes || []" as="node" index="nodeIndex" key="id">
          <article data-graph-node class="graph-editor-node card position-absolute shadow-sm" $data-node-id="node.id" $class="this.state.selectedNodeId===node.id?'border-primary border-2':''" $style="'left:'+node.x+'px;top:'+node.y+'px;width:'+node.width+'px;min-height:'+node.height+'px'" $onpointerdown="this.startNodeDrag(node,event,thisNode)" $onclick="event.stopPropagation();this.selectNode(node,event)" $ondblclick="event.stopPropagation();this.editNode(node)">
            <div slot-id="node" class="card-body p-2"><div class="graph-node-title fw-semibold" $text="node.title"></div><div $if="node.content" class="graph-node-content small text-muted mt-1" $text="node.content"></div></div>
            <div slot-id="node-actions" class="graph-node-actions position-absolute"></div>
          </article>
        </template>
        <template $each="this.state.edgeLayouts || []" as="edge" index="edgeIndex" key="id">
          <button type="button" class="graph-edge-label btn  btn-outline-secondary position-absolute" $class="this.state.selectedEdgeId===edge.id?'border-primary':''" $style="'left:'+edge.x+'px;top:'+edge.y+'px'" $onclick="event.stopPropagation();this.selectEdge(edge)" $ondblclick="event.stopPropagation();this.editEdge(edge)"><span slot-id="edge-label" $text="edge.label || '↗'"></span></button>
        </template>
      </div>
      <div slot-id="empty" $if="!this.state.data.nodes.length" class="position-absolute text-muted">{#No nodes#}</div>
    </div>
    <div $if="this.state.previewItem" class="graph-preview position-absolute top-0 start-50 translate-middle-x mt-3 rounded-2 shadow px-3 py-2 text-dark" role="tooltip" aria-live="polite"><div class="graph-preview-arrow"></div><div class="small fw-semibold mb-1" $text="this.previewTitle()"></div><div class="small opacity-75 text-break" $text="this.previewContent() || '{#No content#}'"></div></div>
  </div>
  <Modal class="graph-editor-modal">
    <div slot="body"><div slot-id="editor"><AutoForm nobutton vertical></AutoForm></div></div>
    <div slot="footer"><button type="button" class="btn btn-secondary" $onclick="thisNode.closest('GraphEditor').cancelEdit()">{#Cancel#}</button><button type="button" class="btn btn-primary" $onclick="thisNode.closest('GraphEditor').commitEdit()">{#Save#}</button></div>
  </Modal>
</div>
`), globalThis.Util.makeDom(/*html*/`<style>
  GraphEditor { display:block; min-height:360px; }
  GraphEditor .graph-viewport { touch-action:none; cursor:grab; }
  GraphEditor .graph-viewport.graph-panning { cursor:grabbing; }
  GraphEditor .graph-edge { fill:none; stroke:var(--bs-secondary-color); stroke-width:2; pointer-events:stroke; cursor:pointer; }
  GraphEditor .graph-edge.selected { stroke:var(--bs-primary); stroke-width:3; }
  GraphEditor .graph-editor-node { cursor:move; }
  GraphEditor .graph-node-title { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden; }
  GraphEditor .graph-node-content { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:4; overflow:hidden; }
  GraphEditor .graph-node-actions { right:0; top:0; transform:translate(50%,-50%); }
  GraphEditor .graph-node-actions .btn { display:inline-flex;align-items:center;justify-content:center; }
  GraphEditor .graph-edge-label { transform:translate(-50%,-50%); z-index:3; min-width:30px; width:max-content; max-width:140px; white-space:normal; overflow-wrap:anywhere; line-height:1.15; }
  GraphEditor .graph-preview { width:min(400px, calc(100% - 2rem)); max-height:45%; overflow:auto; z-index:10; pointer-events:none; background:rgba(var(--bs-info-rgb),.88); border:1px solid rgba(var(--bs-info-rgb),1); backdrop-filter:blur(4px); font-size:.875rem; }
  GraphEditor .graph-preview-arrow { position:absolute; left:50%; bottom:-6px; width:12px; height:12px; background:inherit; transform:translateX(-50%) rotate(45deg); }
  GraphEditor:focus { outline:none; }
</style>`))

globalThis.Editor?.register({ name: 'GraphEditor', component: 'GraphEditor', extensions: ['graph'], types: ['graph'], mimeTypes: ['application/x-graph+json'] })
