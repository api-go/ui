/**
 * CardGrid: a compact, selectable alternative to DataGrid for object collections.
 */
globalThis.Component.register('CardGrid', container => {
	let state = container.state
	const idField = container.getAttribute('id-field') || 'id'
	const titleField = container.getAttribute('title-field') || 'name'
	const api = container.getAttribute('api') || ''
	const limit = Math.min(Math.max(Number(container.getAttribute('limit')) || 200, 1), 200)
	const clone = value => { try { if (globalThis.structuredClone) return structuredClone(value) } catch (_) {} return JSON.parse(JSON.stringify(value)) }
	let anchor = -1, searchTimer, request = 0, drag = null, activeSort = '', activeFilter = ''
	Object.assign(state, {list: Array.isArray(state.list) ? state.list : [], selected: [], total: 0, query: '', sort: '', filter: '', sortoptions: state.sortoptions || state.sortOptions || [], filteroptions: state.filteroptions || state.filterOptions || [], loading: false, saving: false, editor: null, editorOpen: false})
	if (!api) state._source = [...state.list]
	let internalList = false
	const assignList = value => { internalList = true; state.list = value; internalList = false }
	const key = item => String(item?.[idField] ?? '')
	container.keyOf = key
	container._items = new Map()
	container.rememberItem = item => { const value=key(item);container._items.set(value,item);return value }
	const selectedKeys = () => new Set((state.selected || []).map(key))
	const publishSelection = () => container.dispatchEvent(new CustomEvent('selectionchange', {detail: container.getSelectedItems()}))
	const setSelection = items => { state.selected = [...items]; publishSelection() }
	const sortList = list => {
		const raw = activeSort, descending = raw.startsWith('-'), field = descending ? raw.slice(1) : raw
		if (!field) return list
		return [...list].sort((a, b) => String(a?.[field] ?? '').localeCompare(String(b?.[field] ?? ''), undefined, {numeric: true}) * (descending ? -1 : 1))
	}
	container.isSelected = item => selectedKeys().has(key(item))
	container.getSelectedItems = () => {
		const keys = selectedKeys()
		return (state.list || []).filter(item => keys.has(key(item)))
	}
	container.clearSelection = () => { anchor = -1; setSelection([]) }
	container.selectAll = () => setSelection(state.list || [])
	container.selectItem = (item, event = {}) => {
		const list = state.list || [], index = list.findIndex(value => key(value) === key(item)), current = selectedKeys()
		if (event.shiftKey && anchor >= 0) {
			const [from, to] = [anchor, index].sort((a, b) => a - b)
			if (!(event.ctrlKey || event.metaKey)) current.clear()
			for (let i = from; i <= to; i++) current.add(key(list[i]))
		} else if (event.ctrlKey || event.metaKey) {
			current.has(key(item)) ? current.delete(key(item)) : current.add(key(item)); anchor = index
		} else { current.clear(); current.add(key(item)); anchor = index }
		setSelection(list.filter(value => current.has(key(value))))
		container.dispatchEvent(new CustomEvent('itemclick', {detail: {item, selected: container.getSelectedItems()}}))
	}
	container.openEditor = item => {
		if (!container.hasAttribute('editable')) return
		const detail = {item: item || {}, editor: clone(item || {})}
		if (!container.dispatchEvent(new CustomEvent('beforeedit', {cancelable: true, detail}))) return
		state.editor = detail.editor
		state.editorOpen = true
	}
	container.newItem = () => container.openEditor({})
	const call = async (action, payload = {}) => {
		if (!api) return null
		const response = await globalThis.HTTP.post({url: api, data: {action, ...(state.params || {}), ...payload}})
		const result = response?.result
		if (!response?.ok || !result?.ok) throw new Error(result?.error || response?.error || `${action} failed`)
		return result
	}
	container.reload = async () => {
		state = container.state
		const version = ++request
		state.loading = true
		try {
			let list
			if (api) {
				const result = await call(container.getAttribute('query-action') || 'query', {query: state.query || '', sort: activeSort, filter: activeFilter, offset: 0, limit})
				if (version !== request) return
				list = result?.list || result?.data || []
				state.total = Number(result?.count ?? result?.total ?? list.length)
			} else {
				const query = String(state.query || '').toLowerCase()
				const filter = activeFilter
				list = (state._source || state.list || []).filter(item => { const status=String(item?.reviewStatus ?? item?.status ?? (item?.pending?.action ? 'pending' : 'approved')).toLowerCase(); return (!query || JSON.stringify(item).toLowerCase().includes(query)) && (!filter || status === filter) }).slice(0, limit)
				state.total = list.length
			}
			assignList(sortList(list).slice(0, limit)); container.bindToolbarOptions()
			const available = new Set(state.list.map(key)); state.selected = (state.selected || []).filter(item => available.has(key(item)))
			container.dispatchEvent(new CustomEvent('load', {detail: {list: state.list, total: state.total}}))
		} catch (error) { globalThis.Toast?.show(error.message || String(error), {type: 'danger'}); container.dispatchEvent(new CustomEvent('loaderror', {detail: error})) }
		finally { if (version === request) state.loading = false }
	}
	container.scheduleReload = () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => container.reload(), 220) }
	container.closeDropdown = event => { const toggle = event?.target?.closest('.dropdown')?.querySelector('[data-bs-toggle="dropdown"]'); if (toggle) globalThis.bootstrap?.Dropdown?.getOrCreateInstance(toggle)?.hide() }
	container.setSort = (value, event) => { state = container.state; activeSort = String(value || ''); state.sort = activeSort; container.closeDropdown(event) }
	container.setFilter = (value, event) => { state = container.state; activeFilter = String(value || ''); state.filter = activeFilter; container.closeDropdown(event) }
	container.clearFilter = event => { state = container.state; activeFilter = ''; state.filter = ''; container.closeDropdown(event) }
	container.onToolbarClick = event => {
		const button = event.target.closest('[data-card-grid-action]')
		if (!button) return
		if (button.dataset.cardGridAction === 'sort') container.setSort(button.dataset.value, event)
		else if (button.dataset.cardGridAction === 'filter') container.setFilter(button.dataset.value, event)
		else if (button.dataset.cardGridAction === 'clear-filter') container.clearFilter(event)
	}
	container.bindToolbarOptions = () => queueMicrotask(() => {
		const toggle=container.querySelector('[data-card-grid-filter-toggle]');toggle?.classList.toggle('text-primary',!!activeFilter);toggle?.classList.toggle('text-body-secondary',!activeFilter)
		for(const option of container.querySelectorAll('[data-card-grid-action="filter"]'))option.classList.toggle('active',option.dataset.value===activeFilter)
		const clear=container.querySelector('[data-card-grid-action="clear-filter"]');if(clear)clear.closest('li').hidden=!activeFilter
	})
	container.addEventListener('click', container.onToolbarClick, true)
	container.saveEditor = async () => {
		if (!state.editor) return
		const form = container.querySelector('.card-grid-editor AutoForm')
		if (!form?.form?.reportValidity()) return
		state.saving = true
		try {
			const value = clone(form.data || state.editor)
			const event = new CustomEvent('save', {cancelable: true, detail: {value}})
			if (!container.dispatchEvent(event)) return
			if (api) await call(container.getAttribute('save-action') || 'save', {value})
			else { const source = [...(state._source || state.list || [])], index = source.findIndex(item => key(item) === key(value)); index >= 0 ? source.splice(index, 1, value) : source.push(value); state._source = source; assignList(source) }
			state.editorOpen = false; await container.reload()
		} catch (error) { globalThis.Toast?.show(error.message || String(error), {type: 'danger'}) }
		finally { state.saving = false }
	}
	container.removeItems = async items => {
		items = (items || []).filter(item => key(item))
		if (!items.length || !await globalThis.Dialog.confirm(`{#Delete#} ${items.length} {#items#}?`, {type: 'danger'})) return
		const event = new CustomEvent('remove', {cancelable: true, detail: {items}})
		if (!container.dispatchEvent(event)) return
		try {
			if (api) { const result = await call(container.getAttribute('remove-action') || 'remove', {ids: items.map(key)}); if (result?.failed?.length) globalThis.Toast?.show(`${result.failed.length} {#items could not be removed#}`, {type:'warning'}) }
			else { const removed = new Set(items.map(key)), source = (state._source || state.list || []).filter(item => !removed.has(key(item))); state._source = source; assignList(source) }
			container.clearSelection(); await container.reload()
		} catch (error) { globalThis.Toast?.show(error.message || String(error), {type: 'danger'}) }
	}
	container.removeSelected = () => container.removeItems(container.getSelectedItems())
	container.removeOne = (item, event) => { event?.stopPropagation(); container.removeItems([item]) }
	container.onCardPointerDown = (item, event) => { if (event.button === 0) container.selectItem(item, event) }
	container.onCardDoubleClick = (item, event) => { event.preventDefault(); container.openEditor(item); container.dispatchEvent(new CustomEvent('itemactivate', {detail: {item}})) }
	container.onCanvasPointerDown = event => {
		if (event.button !== 0 || event.target.closest('.card-grid-card')) return
		event.preventDefault()
		const surface = container.querySelector('.card-grid-surface'), rect = surface.getBoundingClientRect(), box = container.querySelector('.card-grid-selection-box')
		drag = {x: event.clientX - rect.left + surface.scrollLeft, y: event.clientY - rect.top + surface.scrollTop, additive: event.ctrlKey || event.metaKey, initial: selectedKeys()}
		box.hidden = false; container.updateSelectionBox(event)
	}
	container.updateSelectionBox = event => {
		if (!drag) return
		const surface = container.querySelector('.card-grid-surface'), rect = surface.getBoundingClientRect(), x = event.clientX - rect.left + surface.scrollLeft, y = event.clientY - rect.top + surface.scrollTop
		const selection = {left: Math.min(drag.x, x), top: Math.min(drag.y, y), right: Math.max(drag.x, x), bottom: Math.max(drag.y, y)}
		const box = container.querySelector('.card-grid-selection-box'); Object.assign(box.style, {left: `${selection.left}px`, top: `${selection.top}px`, width: `${selection.right-selection.left}px`, height: `${selection.bottom-selection.top}px`})
		const keys = drag.additive ? new Set(drag.initial) : new Set()
		for (const card of container.querySelectorAll('.card-grid-card')) { const r = card.getBoundingClientRect(), cr = {left:r.left-rect.left+surface.scrollLeft, top:r.top-rect.top+surface.scrollTop, right:r.right-rect.left+surface.scrollLeft, bottom:r.bottom-rect.top+surface.scrollTop}; if (cr.left <= selection.right && cr.right >= selection.left && cr.top <= selection.bottom && cr.bottom >= selection.top) keys.add(card.dataset.key) }
		state.selected = state.list.filter(item => keys.has(key(item)))
	}
	container.finishSelectionBox = () => { if (!drag) return; drag = null; const box = container.querySelector('.card-grid-selection-box'); if (box) box.hidden = true; publishSelection() }
	container.titleOf = item => String(item?.[titleField] ?? item?.label ?? key(item))
	container.state.__watch('list', value => { if (!api && !internalList && Array.isArray(value)) state._source = [...value] })
	container.state.__watch('params', () => container.reload())
	container.state.__watch('sort', value => { if (value !== undefined) activeSort=String(value || ''); container.reload() })
	container.state.__watch('filter', value => { if (value !== undefined) activeFilter=String(value || ''); container.reload() })
	container.state.__watch('editorOpen', value => { const modal = container.querySelector('.card-grid-editor'); if (modal && !value && modal.classList.contains('show')) modal.hide(true) })
	window.addEventListener('pointermove', container.updateSelectionBox)
	window.addEventListener('pointerup', container.finishSelectionBox)
	container._destroy = () => { clearTimeout(searchTimer); container.removeEventListener('click', container.onToolbarClick, true); container._surface?.removeEventListener('pointerdown', container.onCanvasPointerDown); window.removeEventListener('pointermove', container.updateSelectionBox); window.removeEventListener('pointerup', container.finishSelectionBox) }
	globalThis.DOMDisposer?.add(container, container._destroy)
	queueMicrotask(() => {
		state = container.state
		for (const [name,value] of Object.entries({list:[],selected:[],total:0,query:'',sort:'',filter:'',sortoptions:[],filteroptions:[],loading:false,saving:false,editor:null,editorOpen:false})) if (state[name] === undefined) state[name] = value
		container._surface = container.querySelector('.card-grid-surface')
		container._surface?.addEventListener('pointerdown', container.onCanvasPointerDown); container.reload()
	})
}, globalThis.Util.makeDom(/*html*/`
<div class="card-grid-root d-flex flex-column h-100 min-h-0 bg-body" tabindex="0">
	<div $if="!this.hasAttribute('notoolbar')" class="card-grid-toolbar border-bottom d-flex align-items-center gap-2 px-3" $onload="this.bindToolbarOptions()">
		<div slot-id="toolbar-start" class="d-flex align-items-center gap-2"></div>
		<button class="btn  btn-link p-0" $onclick="this.state.selected?.length ? this.clearSelection() : this.selectAll()" title="{#Select all / clear#}"><i class="bi bi-check-all"></i></button>
		<span class="small text-body-secondary" $text="(this.state.selected?.length || 0) + ' / ' + (this.state.total || 0)"></span>
		<button $if="this.hasAttribute('editable')" class="btn  btn-link p-1" title="{#Add#}" $onclick="this.newItem()"><i class="bi bi-plus-lg"></i></button>
		<button $if="this.hasAttribute('editable')" class="btn  btn-link text-danger p-1" title="{#Delete selected#}" $disabled="!this.state.selected?.length" $onclick="this.removeSelected()"><i class="bi bi-trash"></i></button>
		<div slot-id="toolbar-actions" class="d-flex align-items-center gap-2"></div>
		<span class="flex-fill"></span>
		<div class="input-group " style="max-width:260px"><span class="input-group-text bg-transparent"><i class="bi bi-search"></i></span><input class="form-control" type="search" placeholder="{#Search#}" $bind="this.state.query" $oninput="this.scheduleReload()"></div>
		<div class="dropdown position-relative"><button class="btn  btn-link p-1" data-bs-toggle="dropdown" title="{#Sort#}"><i class="bi bi-sort-down"></i></button><ul class="dropdown-menu dropdown-menu-end"><template $each="this.state.sortoptions || []" as="option"><li><button class="dropdown-item" data-card-grid-action="sort" $data-value="option.value" $class="this.state.sort===option.value?'active':''" $text="option.label"></button></li></template><li $if="!this.state.sortoptions?.length"><span class="dropdown-item-text text-body-secondary">{#No sort options#}</span></li></ul></div>
		<div $if="this.state.filteroptions?.length" class="dropdown position-relative"><button class="btn  btn-link p-1 text-body-secondary" data-card-grid-filter-toggle data-bs-toggle="dropdown" title="{#Filter#}"><i class="bi bi-funnel-fill"></i></button><ul class="dropdown-menu dropdown-menu-end"><template $each="this.state.filteroptions || []" as="option"><li><button class="dropdown-item" data-card-grid-action="filter" $data-value="option.value" $text="option.label"></button></li></template><li class="border-top mt-1 pt-1" hidden><button class="dropdown-item text-body-secondary" data-card-grid-action="clear-filter"><i class="bi bi-eraser me-2"></i>{#Clear filter#}</button></li></ul></div>
		<div slot-id="toolbar-end" class="d-flex align-items-center gap-2"></div>
	</div>
	<div class="card-grid-surface position-relative flex-fill overflow-auto p-3">
		<div $if="this.state.loading" class="position-absolute top-50 start-50 translate-middle spinner-border text-primary"></div>
		<div $if="!this.state.loading && !this.state.list?.length" class="h-100 d-flex align-items-center justify-content-center text-body-secondary"><div slot-id="empty">{#No items#}</div></div>
		<div class="card-grid-items">
			<template $each="this.state.list || []" key="id"><article $data-key="this.rememberItem(item)" $data-item="JSON.stringify(item)" $class="'card-grid-card card bg-body-tertiary border position-relative ' + (this.isSelected(item)?'card-grid-selected':'')" $onpointerdown="this.onCardPointerDown(item,event)" $ondblclick="this.onCardDoubleClick(item,event)">
				<div class="card-grid-actions position-absolute top-0 end-0 p-1 d-flex gap-1"><button $if="this.hasAttribute('editable')" class="btn  btn-link p-1" title="{#Edit#}" $onclick="event.stopPropagation();this.openEditor(item)"><i class="bi bi-pencil"></i></button><button $if="this.hasAttribute('editable')" class="btn  btn-link text-danger p-1" title="{#Delete#}" $onclick="this.removeOne(item,event)"><i class="bi bi-trash"></i></button></div>
				<div slot-id="card" class="card-body p-3 overflow-hidden"><strong class="d-block text-truncate pe-4" $text="this.titleOf(item)"></strong></div>
			</article></template>
		</div>
		<div class="card-grid-selection-box position-absolute border border-primary bg-primary-subtle opacity-50" hidden></div>
	</div>
	<Modal class="card-grid-editor" width="min(92vw, 900px)" guard-dirty $.state.title="this.titleOf(this.state.editor) || '{#New item#}'" $bind="this.state.editorOpen">
		<div slot="body"><AutoForm nobutton vertical $.state.data="thisNode.closest('CardGrid').state.editor" $.state.schema="thisNode.closest('CardGrid').state.schema || []"></AutoForm></div>
		<div slot="footer"><span class="flex-fill"></span><button class="btn  btn-secondary" $onclick="const grid=thisNode.closest('CardGrid');grid.state.editorOpen=false;thisNode.closest('Modal').hide(true)">{#Cancel#}</button><button class="btn  btn-primary" $disabled="thisNode.closest('CardGrid').state.saving" $onclick="thisNode.closest('CardGrid').saveEditor()"><i class="bi bi-floppy me-1"></i>{#Save#}</button></div>
	</Modal>
</div>
`), globalThis.Util.makeDom(/*html*/`
<style>
	CardGrid { display:block; min-width:0; min-height:0; }
	.card-grid-root { min-height:0; user-select:none; }
	.card-grid-toolbar { flex:0 0 auto; min-height:var(--ui-toolbar-height,48px); }
	.card-grid-items { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,320px)); gap:var(--ui-section-gap,1.5rem); justify-content:space-evenly; align-content:start; }
	.card-grid-card { min-width:0; min-height:112px; cursor:default; border-width:2px !important; transition:border-color .12s,box-shadow .12s,background-color .12s; }
	.card-grid-card:hover:not(.card-grid-selected) { border-color:var(--bs-secondary-color) !important; box-shadow:0 .125rem .35rem rgba(0,0,0,.08); }
	.card-grid-card.card-grid-selected { border-color:var(--bs-primary) !important; background:rgba(var(--bs-primary-rgb),.10) !important; box-shadow:0 0 0 .2rem rgba(var(--bs-primary-rgb),.16); }
	.card-grid-actions { opacity:0; transition:opacity .15s; z-index:2; }
	.card-grid-card:hover .card-grid-actions, .card-grid-card:focus-within .card-grid-actions { opacity:1; }
	.card-grid-selection-box { pointer-events:none; z-index:10; }
	@media (max-width:575.98px) { .card-grid-items { grid-template-columns:1fr; } .card-grid-toolbar { padding-inline:.5rem !important; } }
</style>
`))
