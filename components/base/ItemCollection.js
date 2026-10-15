globalThis.Component.register('ItemCollection', container => {
	const layout = container.getAttribute('layout') || 'horizontal'
	const type = container.getAttribute('type') || 'object'
	if (!['horizontal', 'vertical'].includes(layout)) throw new Error('ItemCollection layout must be horizontal or vertical')
	if (!['object', 'string', 'number', 'boolean'].includes(type)) throw new Error('ItemCollection type must be object, string, number, or boolean')
	container.layout = layout
	container.type = type
	const emptyValue = () => type === 'object' ? globalThis.NewState({}) : type === 'boolean' ? false : ''
	container.newItem = emptyValue()
	container.state = globalThis.NewState({ list: [] })
	Object.defineProperty(container, 'value', { get: () => container.state.list, set: value => { container.state.list = Array.isArray(value) ? value : [] } })
	container.addEventListener('bind', event => { container.state.list = Array.isArray(event.detail) ? event.detail : [] })
	const emitChange = () => container.dispatchEvent(new CustomEvent('change', { bubbles: false, detail: [...container.state.list] }))
	container.add = () => {
		let item = type === 'object' ? (globalThis.Util.clone(container.newItem) || {}) : container.newItem
		if (type === 'string') item = String(item ?? '')
		if (type === 'number') item = Number(item)
		if (type === 'boolean') item = item === true || item === 'true' || item === 1 || item === '1'
		const event = new CustomEvent('beforeadd', { bubbles: false, cancelable: true, detail: { item, source: container } })
		if (!container.dispatchEvent(event)) return false
		container.state.list = [...container.state.list, item]; emitChange(); container.newItem = emptyValue(); return true
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
<div class="d-flex" $class="this.layout==='vertical'?'flex-column align-items-stretch':'flex-row flex-wrap align-items-center'">
    <div class="item-collection-items d-flex" $class="this.layout==='vertical'?'flex-column align-items-stretch':'flex-row flex-wrap align-items-center'" data-item-collection-items>
        <template $each="this.state.list" as="item" index="index">
            <div class="item-collection-item d-flex align-items-center">
                <div slot-id="item" class="item-collection-value"></div>
                <button type="button" class="item-collection-remove btn btn-link text-danger d-inline-flex align-items-center justify-content-center flex-shrink-0" aria-label="{#Remove#}" title="{#Remove#}" $onclick="this.remove(index)">
					<i class="bi bi-x"></i>
				</button>
            </div>
        </template>
    </div>
    <div class="item-collection-compose d-flex align-items-center">
		<div slot-id="creator" class="item-collection-creator d-flex align-items-center"></div>
		<button type="button" class="item-collection-add btn btn-primary d-inline-flex align-items-center justify-content-center flex-shrink-0" aria-label="{#Add#}" title="{#Add#}" $onclick="this.submitCreator()"><i class="bi bi-plus-lg"></i></button>
    </div>
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
