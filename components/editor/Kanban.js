/**
 * Editable Kanban document component.
 */
const KANBAN_SCHEMAS = {
  column: [{ name: 'title', label: '{#Title#}', type: 'text', setting: { required: true } }],
  card: [
    { name: 'title', label: '{#Title#}', type: 'text', setting: { required: true } },
    { name: 'content', label: '{#Content#}', type: 'textarea', setting: { rows: 5, maxlength: 4000 } }
  ]
}

globalThis.Component.register('Kanban', container => {
  const normalize = value => {
    if (Array.isArray(value)) value = { columns: value }
    const data = value && typeof value === 'object' ? globalThis.Editor.clone(value) : {}
    data.columns = Array.isArray(data.columns) ? data.columns : []
    data.columns = data.columns.map(column => ({ ...column, id: String(column.id || globalThis.GraphDocument?.id?.('column') || `column-${Math.random().toString(36).slice(2)}`), title: column.title || '{#Untitled#}', items: Array.isArray(column.items) ? column.items.map(card => ({ ...card, id: String(card.id || `card-${Math.random().toString(36).slice(2)}`), title: card.title ?? card.content ?? '{#Untitled#}' })) : [] }))
    return data
  }
  container.readonly = container.hasAttribute('readonly')
  globalThis.Editor.connect(container, { type: 'kanban', defaultData: () => ({ columns: [] }), normalize })

  const state = container.state
  // HTML lowercases attribute names, so declarative $.state.extraSchemas arrives as extraschemas.
  if (state.extraSchemas === undefined && state.extraschemas !== undefined) state.extraSchemas = state.extraschemas
  let sortableControllers = [], sortableTimer
  state.dirty = false
  const schemas = () => globalThis.Editor.mergeSchemas(KANBAN_SCHEMAS, state.extraSchemas || {})
  const changed = (data, reason, detail = {}) => {
    state.data = normalize(data)
    state.dirty = true
    container.dispatchEvent(new CustomEvent('change', { detail: state.data, bubbles: false }))
    container.dispatchEvent(new CustomEvent('update', { detail: { data: state.data, reason, ...detail }, bubbles: false }))
  }
  const destroySortables = () => { sortableControllers.forEach(controller => controller.destroy()); sortableControllers = [] }
  const initSortables = () => {
    clearTimeout(sortableTimer); sortableTimer = setTimeout(() => {
      destroySortables()
      if (container.readonly) return
      const columns = container.querySelector('.kanban-columns')
      if (columns) sortableControllers.push(globalThis.SortableAPI.create(columns, {
        animation: 150, draggable: '.kanban-column', handle: '.kanban-column-handle',
        onEnd: event => {
          if (event.oldIndex === event.newIndex) return
          const data = normalize(state.data), [column] = data.columns.splice(event.oldIndex, 1)
          data.columns.splice(event.newIndex, 0, column); changed(data, 'move-column', { oldIndex: event.oldIndex, newIndex: event.newIndex })
        }
      }))
      container.querySelectorAll('.kanban-items').forEach(element => sortableControllers.push(globalThis.SortableAPI.create(element, {
        animation: 150, group: `kanban-${container.id || container._kanbanId}`, draggable: '.kanban-card', handle: '.kanban-card-handle', emptyInsertThreshold: 24,
        onEnd: event => {
          const fromId = event.from.dataset.columnId, toId = event.to.dataset.columnId
          if (fromId === toId && event.oldIndex === event.newIndex) return
          const data = normalize(state.data), from = data.columns.find(column => column.id === fromId), to = data.columns.find(column => column.id === toId)
          if (!from || !to) return
          const [card] = from.items.splice(event.oldIndex, 1)
          if (!card) return
          to.items.splice(event.newIndex, 0, card)
          changed(data, 'move-card', { card, from: fromId, to: toId, oldIndex: event.oldIndex, newIndex: event.newIndex })
        }
      })))
    }, 0)
  }
  container._kanbanId = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
  container.state.__watch('data', initSortables)
  container.state.__watch('extraSchemas', () => {
    if (state.editing?.kind) state.editing.schema = schemas()[state.editing.kind]
  })
  container.state.__watch('extraschemas', value => { state.extraSchemas = value })

  const modal = () => container.querySelector('Modal.kanban-editor')
  const hideEditor = () => {
    const dialog = modal()
    if (!dialog) return
    dialog.hide()
    if (dialog.classList.contains('show')) dialog.addEventListener('shown.bs.modal', () => dialog.hide(), { once: true })
  }
  container.edit = (kind, value, { columnId = null, isNew = false } = {}) => {
    if (container.readonly) return null
    const schema = schemas()[kind] || []
    const draft = globalThis.NewState(globalThis.Editor.applyDefaults(globalThis.Editor.clone(value || {}), schema))
    const titles = { column: isNew ? '{#Add column#}' : '{#Edit column#}', card: isNew ? '{#Add card#}' : '{#Edit card#}' }
    state.editing = { kind, id: draft.id, columnId, isNew, draft, schema, title: titles[kind] }
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
  container.addColumn = () => container.edit('column', { id: `column-${globalThis.crypto?.randomUUID?.() || Date.now()}`, title: '{#New column#}', items: [] }, { isNew: true })
  container.editColumn = column => container.edit('column', column)
  container.addCard = column => container.edit('card', { id: `card-${globalThis.crypto?.randomUUID?.() || Date.now()}`, title: '{#New card#}', content: '' }, { columnId: column.id, isNew: true })
  container.editCard = (card, column) => container.edit('card', card, { columnId: column.id })
  container.commitEdit = () => {
    const editing = state.editing
    if (!editing) return
    const form = modal()?.querySelector('AutoForm')
    if (form?.form && !form.form.reportValidity()) return
    const data = normalize(state.data), value = globalThis.Editor.clone(editing.draft)
    if (editing.kind === 'column') {
      const index = data.columns.findIndex(column => column.id === editing.id)
      if (index < 0) data.columns.push({ ...value, items: value.items || [] })
      else data.columns[index] = { ...data.columns[index], ...value, items: data.columns[index].items }
    } else {
      const column = data.columns.find(item => item.id === editing.columnId)
      if (!column) return
      const index = column.items.findIndex(card => card.id === editing.id)
      if (index < 0) column.items.push(value)
      else column.items[index] = { ...column.items[index], ...value }
    }
    hideEditor(); state.editing = null; changed(data, editing.isNew ? `add-${editing.kind}` : `edit-${editing.kind}`, { value })
  }
  container.cancelEdit = () => { hideEditor(); state.editing = null }
  const confirmed = async (message, confirm = true) => !confirm || (globalThis.Dialog?.confirm ? globalThis.Dialog.confirm(message, { type: 'danger' }) : globalThis.confirm(message))
  container.removeColumn = async (column, options = {}) => {
    if (container.readonly || !await confirmed(`{#Delete column#}: ${column.title}?`, options.confirm !== false)) return false
    const data = normalize(state.data); data.columns = data.columns.filter(item => item.id !== column.id); changed(data, 'remove-column', { column }); return true
  }
  container.removeCard = async (card, column, options = {}) => {
    if (container.readonly || !await confirmed(`{#Delete card#}: ${card.title}?`, options.confirm !== false)) return false
    const data = normalize(state.data), target = data.columns.find(item => item.id === column.id); if (!target) return false
    target.items = target.items.filter(item => item.id !== card.id); changed(data, 'remove-card', { card, column }); return true
  }
  container.deleteEditing = async () => {
    const editing = state.editing
    if (!editing || editing.isNew) return
    const data = normalize(state.data)
    if (editing.kind === 'column') {
      const column = data.columns.find(item => item.id === editing.id)
      if (column && await container.removeColumn(column)) container.cancelEdit()
    } else {
      const column = data.columns.find(item => item.id === editing.columnId), card = column?.items.find(item => item.id === editing.id)
      if (card && await container.removeCard(card, column)) container.cancelEdit()
    }
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
    { id: 'add-column', label: '{#Add column#}', icon: 'layout-three-columns', disabled: () => container.readonly, run: () => container.addColumn() }
  ])
  const documentSave = container.save
  container.save = async () => { const result = await documentSave(); if (result) state.dirty = false; return result }
  container.addEventListener('loaded', () => { state.dirty = false })
  container.addEventListener('saved', () => { state.dirty = false })
  initSortables()
  globalThis.DOMDisposer.add(container, () => { clearTimeout(sortableTimer); destroySortables(); modal()?.removeEventListener('keydown', container.onEditorKeydown); document.removeEventListener('keydown', outsideEditorEscape) })
}, globalThis.Util.makeDom(/*html*/`
<div class="kanban-root d-flex flex-column h-100 min-h-0 border rounded bg-body overflow-hidden">
  <div $if="this.hasAttribute('toolbar')" slot-id="toolbar" class="kanban-toolbar d-flex align-items-center gap-2 border-bottom bg-body px-3 py-2">
    <strong class="text-truncate" $text="this.state.data.title || '{#Kanban#}'"></strong>
    <div $if="!this.readonly" class="dropdown">
      <button type="button" class="btn btn-sm btn-link link-secondary p-1" data-bs-toggle="dropdown" aria-expanded="false" title="{#Board menu#}"><i class="bi bi-three-dots"></i></button>
      <ul class="dropdown-menu shadow-sm"><li><button type="button" class="dropdown-item" $onclick="this.addColumn()"><i class="bi bi-layout-three-columns me-2"></i>{#Add column#}</button></li></ul>
    </div>
    <div class="flex-grow-1"></div>
    <button $if="!this.hasAttribute('nosave')" type="button" class="kanban-save" $class="'btn btn-sm '+(this.state.dirty?'btn-primary':'btn-outline-secondary')" $disabled="!this.state.dirty || this.state.saving" $onclick="this.save()"><i class="bi bi-save me-1"></i>{#Save#}</button>
  </div>
  <div class="kanban-columns d-flex gap-3 flex-grow-1 overflow-auto p-3 align-items-stretch">
    <template $each="this.state.data.columns" as="column" index="columnIndex" key="id">
      <section class="kanban-column d-flex flex-column flex-shrink-0 rounded-3" $data-column-id="column.id">
        <div slot-id="column-header" class="kanban-column-header d-flex align-items-center gap-2 kanban-column-handle px-2 py-2">
          <i $if="!this.readonly" class="bi bi-grip-vertical text-secondary opacity-50"></i>
          <strong class="text-truncate flex-grow-1 px-1" $text="column.title"></strong><span class="badge rounded-pill text-bg-secondary fw-normal" $text="column.items.length"></span>
          <button $if="!this.readonly" class="btn btn-sm btn-link link-secondary p-1" type="button" title="{#Add card#}" $onclick="event.stopPropagation();this.addCard(column)"><i class="bi bi-plus-lg"></i></button>
          <div $if="!this.readonly" class="dropdown">
            <button class="btn btn-sm btn-link link-secondary p-1" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="{#Column menu#}" $onclick="event.stopPropagation()"><i class="bi bi-three-dots"></i></button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
              <li><button type="button" class="dropdown-item" $onclick="this.editColumn(column)"><i class="bi bi-pencil me-2"></i>{#Edit column#}</button></li>
              <li><hr class="dropdown-divider"></li>
              <li><button type="button" class="dropdown-item text-danger" $onclick="this.removeColumn(column)"><i class="bi bi-trash me-2"></i>{#Delete column#}</button></li>
            </ul>
          </div>
        </div>
        <div class="kanban-items flex-grow-1 overflow-auto px-2 pb-2" $data-column-id="column.id">
          <template $each="column.items" as="card" index="cardIndex" key="id">
            <article class="kanban-card card border-0 mb-2" $data-card-id="card.id" $ondblclick="this.editCard(card,column)">
              <div slot-id="card" class="card-body px-3 py-2 kanban-card-handle">
                <div class="d-flex align-items-start gap-2"><div class="flex-grow-1 min-w-0"><div class="fw-semibold text-break" $text="card.title"></div><div $if="card.content" class="kanban-card-content small text-muted mt-1" $text="card.content"></div></div>
                  <div slot-id="card-actions" class="d-flex gap-1"></div>
                </div>
              </div>
            </article>
          </template>
          <div slot-id="empty-column" $if="!column.items.length" class="kanban-empty position-absolute top-0 start-0 w-100 pe-none"></div>
        </div>
      </section>
    </template>
    <div $if="!this.state.data.columns.length" class="text-muted m-auto">{#No columns#}</div>
  </div>
  <Modal class="kanban-editor">
    <div slot="body"><div slot-id="editor"><AutoForm nobutton vertical></AutoForm></div></div>
    <div slot="footer">
      <button $if="thisNode.closest('Kanban').state.editing && !thisNode.closest('Kanban').state.editing.isNew" type="button" class="kanban-delete-editing btn btn-link text-danger me-auto" $onclick="thisNode.closest('Kanban').deleteEditing()">{#Delete#}</button>
      <button type="button" class="btn btn-secondary" $onclick="thisNode.closest('Kanban').cancelEdit()">{#Cancel#}</button>
      <button type="button" class="btn btn-primary" $onclick="thisNode.closest('Kanban').commitEdit()">{#Save#}</button>
    </div>
  </Modal>
</div>
`), globalThis.Util.makeDom(/*html*/`<style>
  Kanban { display:block; min-height:320px; }
  Kanban .min-h-0 { min-height:0; }
  Kanban .min-w-0 { min-width:0; }
  Kanban .kanban-columns { background:var(--bs-tertiary-bg); }
  Kanban .kanban-column { width:300px; min-height:180px; align-self:stretch; background:var(--bs-secondary-bg); border:1px solid var(--bs-border-color-translucent); }
  Kanban .kanban-column-header { min-height:46px; }
  Kanban .kanban-items { min-height:72px; position:relative; }
  Kanban .kanban-card { background:var(--bs-body-bg); box-shadow:0 1px 2px rgba(0,0,0,.08); transition:box-shadow .15s, transform .15s; }
  Kanban .kanban-card:hover { box-shadow:0 3px 10px rgba(0,0,0,.12); transform:translateY(-1px); }
  Kanban .kanban-card-content { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:3; overflow:hidden; }
  Kanban .kanban-empty { min-height:64px; }
  Kanban .kanban-items:has(.kanban-card) > .kanban-empty { display:none; }
  Kanban .kanban-column-handle, Kanban .kanban-card-handle { cursor:grab; }
  Kanban .sortable-ghost { opacity:.35; }
  Kanban .sortable-drag { cursor:grabbing; }
</style>`))

globalThis.Editor?.register({ name: 'Kanban', component: 'Kanban', extensions: ['kanban'], types: ['kanban'], mimeTypes: ['application/x-kanban+json'] })
