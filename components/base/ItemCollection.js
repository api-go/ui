globalThis.Component.register('ItemCollection', container => {
	const layout = container.getAttribute('layout') || 'horizontal'
	const type = container.getAttribute('type') || 'object'
	if (!['horizontal', 'vertical'].includes(layout)) throw new Error('ItemCollection layout must be horizontal or vertical')
	if (!['object', 'string', 'number', 'boolean'].includes(type)) throw new Error('ItemCollection type must be object, string, number, or boolean')
	container.layout = layout
	container.type = type
	container.addEventListener('change', event => { if (event.target !== container) event.stopImmediatePropagation() })
	const emptyValue = () => type === 'object' ? globalThis.NewState({}) : type === 'boolean' ? false : ''
	const clearedFields = value => Array.isArray(value) ? [] : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, field]) => [key, clearedFields(field)])) : typeof value === 'boolean' ? false : ''
	container.state = globalThis.NewState({ list: [], newItem: emptyValue(), errors: {}, validating: false, validationError: '' })
	const idfield = container.getAttribute('idfield') || 'id'
	const rowKey = (item, index) => String(item && typeof item === 'object' && item[idfield] != null ? item[idfield] : index)
	const rowElements = () => [...container.querySelectorAll('[data-collection-row]')].filter(row => row.closest('ItemCollection') === container)
	let validationVersion = 0
	container.setErrors = errors => {
		const clean = {}, keys = container.state.list.map(rowKey)
		for (const [key, fields] of Object.entries(errors || {})) if (keys.includes(key) && fields && typeof fields === 'object') {
			const messages = Object.fromEntries(Object.entries(fields).filter(([, message]) => typeof message === 'string' && message.trim()))
			if (Object.keys(messages).length) clean[key] = messages
		}
		container.state.errors = clean
		for (const row of rowElements()) for (const form of row.querySelectorAll('AutoForm')) if (form.closest('ItemCollection') === container) form.setErrors(clean[row.dataset.collectionRow] || {})
	}
	container.focusField = (key, field) => {
		const row = rowElements().find(row => row.dataset.collectionRow === String(key)); if (!row) return false
		const form = row.querySelector('AutoForm'); if (form) return form.focusField(field)
		const control = [...row.querySelectorAll('input,select,textarea,button')].find(control => control.name === field && !control.disabled)
		if (control) { control.focus(); return true }; return false
	}
	container.rowErrors = index => container.state.errors[rowKey(container.state.list[index], index)] || {}
	container.showRowErrors = index => !rowElements().find(row => row.dataset.collectionRow === rowKey(container.state.list[index], index))?.querySelector('AutoForm')
	container.validate = async () => {
		const version = ++validationVersion, snapshot = JSON.stringify(container.state.list)
		container.setErrors({}); container.state.validationError = ''
		for (const row of rowElements()) {
			for (const form of row.querySelectorAll('AutoForm')) if (form.closest('ItemCollection') === container && !await form.validate()) return false
			for (const control of row.querySelectorAll('input,select,textarea')) if (!control.closest('AutoForm') && !control.checkValidity()) { control.reportValidity(); return false }
		}
		if (version !== validationVersion || snapshot !== JSON.stringify(container.state.list)) return false
		if (typeof container.validator !== 'function') return true
		container.state.validating = true
		try {
			const errors = await container.validator(JSON.parse(snapshot))
			if (version !== validationVersion || snapshot !== JSON.stringify(container.state.list)) return false
			container.setErrors(errors); const key = Object.keys(container.state.errors)[0]
			if (key) { container.focusField(key, Object.keys(container.state.errors[key])[0]); return false }; return true
		} catch { if (version === validationVersion) container.state.validationError = '{#Validation failed. Please try again.#}'; return false }
		finally { if (version === validationVersion) container.state.validating = false }
	}
	const invalidate = event => {
		if (event?.target?.closest?.('.item-collection-creator')) return
		validationVersion++; container.state.validating = false; container.state.validationError = ''
		const row = event?.target?.closest?.('[data-collection-row]'), field = event?.target?.name
		if (row && field && container.state.errors[row.dataset.collectionRow]?.[field]) {
			const next = Util.clone(container.state.errors); delete next[row.dataset.collectionRow][field]; container.setErrors(next)
		}
	}
	container.addEventListener('input', invalidate)
	container.addEventListener('changed', invalidate)
	container.state.__watch('list', () => { invalidate(); container.setErrors(container.state.list.every(item => item && typeof item === 'object' && item[idfield] != null) ? container.state.errors : {}) })
	DOMDisposer.add(container, invalidate)
	Object.defineProperty(container, 'newItem', { configurable: true, enumerable: true, get: () => container.state.newItem, set: value => { container.state.newItem = value } })
	Object.defineProperty(container, 'value', { get: () => container.state.list, set: value => { container.state.list = Array.isArray(value) ? value : [] } })
	container.addEventListener('bind', event => { container.state.list = Array.isArray(event.detail) ? event.detail : [] })
	const emitChange = () => container.dispatchEvent(new CustomEvent('change', { bubbles: false, detail: [...container.state.list] }))
	container.add = () => {
		let item = type === 'object' ? (globalThis.Util.clone(container.newItem) || {}) : container.newItem
		if (type === 'object' && item && typeof item === 'object' && !Array.isArray(item)) item = globalThis.NewState(item)
		if (type === 'string') item = String(item ?? '')
		if (type === 'number') item = Number(item)
		if (type === 'boolean') item = item === true || item === 'true' || item === 1 || item === '1'
		const event = new CustomEvent('beforeadd', { bubbles: false, cancelable: true, detail: { item, source: container } })
		if (!container.dispatchEvent(event)) return false
		container.state.list = [...container.state.list, item]; emitChange(); container.newItem = type === 'object' ? globalThis.NewState(clearedFields(container.newItem)) : emptyValue(); return true
	}
	container.submitCreator = () => {
		const creator = container.querySelector('.item-collection-creator')
		creator?.querySelectorAll('input,select,textarea,[contenteditable="true"]').forEach(control => {
			const eventName = ['INPUT', 'TEXTAREA'].includes(control.tagName) && ['textarea', 'text', 'password', 'email', 'number', 'search', 'url', 'tel'].includes(control.type || 'text') || control.isContentEditable ? 'input' : 'change'
			control.dispatchEvent(new Event(eventName, { bubbles: true }))
		})
		const event = new CustomEvent('creatorsubmit', { bubbles: false, cancelable: true, detail: { source: creator } })
		container.dispatchEvent(event)
		return event.defaultPrevented ? false : container.add()
	}
	container.remove = index => { container.state.list = container.state.list.filter((_, itemIndex) => itemIndex !== index); emitChange() }
	container.reorder = (oldIndex, newIndex) => {
		if (oldIndex === newIndex || oldIndex < 0 || newIndex < 0 || oldIndex >= container.state.list.length || newIndex >= container.state.list.length) return false
		const list = [...container.state.list], [item] = list.splice(oldIndex, 1)
		list.splice(newIndex, 0, item); container.state.list = list; emitChange(); return true
	}
	const setupSortable = () => {
		const items = container.querySelector('[data-item-collection-items]')
		if (!items || !globalThis.SortableAPI) return
		globalThis.SortableAPI.create(items, { animation: 150, onEnd: event => { if (event.oldIndex !== event.newIndex) container.reorder(event.oldIndex, event.newIndex) } })
	}
	setTimeout(setupSortable, 0)
	container.state.__watch('list', () => { setTimeout(setupSortable, 0) })
}, globalThis.Util.makeDom(/*html*/`
<div class="item-collection-root d-flex" $class="this.layout==='vertical'?'flex-column align-items-stretch':'flex-row flex-wrap align-items-center'">
    <div class="item-collection-items d-flex" $class="this.layout==='vertical'?'flex-column align-items-stretch':'flex-row flex-wrap align-items-center'" data-item-collection-items>
        <template $each="this.state.list" as="item" index="index">
            <div class="item-collection-item d-flex align-items-center" $data-collection-row="String(item&&typeof item==='object'&&item[this.getAttribute('idfield')||'id']!=null?item[this.getAttribute('idfield')||'id']:index)">
                <div class="item-collection-value"><div slot-id="item"></div><ul class="text-danger small mt-2 mb-0 ps-3" $if="Object.keys(this.rowErrors(index)).length && this.showRowErrors(index)"><li $each="Object.entries(this.rowErrors(index))" as="failure"><button class="btn btn-link text-danger text-start p-0" type="button" $text="failure[1]" $onclick="this.focusField(thisNode.closest('[data-collection-row]').dataset.collectionRow,failure[0])"></button></li></ul></div>
                <button type="button" class="item-collection-remove btn btn-link text-danger d-inline-flex align-items-center justify-content-center flex-shrink-0" aria-label="{#Remove#}" title="{#Remove#}" $onclick="this.remove(index)">
					<i class="bi bi-x" aria-hidden="true"></i>
				</button>
            </div>
        </template>
    </div>
    <div class="item-collection-compose d-flex align-items-center">
		<div slot-id="creator" class="item-collection-creator d-flex align-items-center"></div>
		<button type="button" class="item-collection-add btn btn-primary d-inline-flex align-items-center justify-content-center flex-shrink-0" aria-label="{#Add#}" title="{#Add#}" $onclick="this.submitCreator()"><i class="bi bi-plus-lg" aria-hidden="true"></i></button>
    </div>
    <p class="text-danger mb-0" role="alert" $if="this.state.validationError" $text="this.state.validationError"></p>
</div>
`), globalThis.Util.makeDom(/*html*/`
<style>
	ItemCollection, ItemCollection .item-collection-items, ItemCollection .item-collection-item, ItemCollection .item-collection-compose, ItemCollection .item-collection-creator {min-width:0;max-width:100%;gap:var(--ui-gap,.5rem);}
	ItemCollection .item-collection-compose {flex:0 1 auto;}
	ItemCollection .item-collection-creator {flex:1 1 auto;}
	ItemCollection .item-collection-creator > *, ItemCollection .item-collection-value {min-width:0;max-width:100%;}
	ItemCollection .item-collection-remove {opacity:0;}
	@media(hover:none) {ItemCollection .item-collection-remove {opacity:1;}}
	ItemCollection .item-collection-item:hover .item-collection-remove, ItemCollection .item-collection-item:focus-within .item-collection-remove {opacity:1}
</style>
`))
