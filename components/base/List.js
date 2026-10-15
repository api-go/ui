/**
 * List Component Module
 */
globalThis.Component.register('List', container => {
	container.mode = container.getAttribute('mode') || 'normal'
	container.activeMode = container.getAttribute('activemode') || 'background'
	if (!document.getElementById('apigo-list-active-mode')) { const style = document.createElement('style'); style.id = 'apigo-list-active-mode'; style.textContent = 'List .list-active-background.active,List .list-active-background.text-primary,List .list-active-rounded.active,List .list-active-rounded.text-primary{background:transparent!important;color:var(--bs-body-color)!important;position:relative}List .list-active-background.active::before,List .list-active-background.text-primary::before,List .list-active-rounded.active::before,List .list-active-rounded.text-primary::before{content:"";position:absolute;z-index:0;inset:0;background:var(--bs-secondary-bg)}List .list-active-rounded.active::before,List .list-active-rounded.text-primary::before{inset:0 .25rem;border-radius:.5rem}List .list-active-background.active>* ,List .list-active-background.text-primary>* ,List .list-active-rounded.active>* ,List .list-active-rounded.text-primary>*{position:relative;z-index:1}List .list-active-text.active,List .list-active-text.text-primary{background:transparent!important;color:var(--bs-primary)!important}'; document.head.appendChild(style) }
	container.fast = container.hasAttribute('fast')
	container.remote = container.hasAttribute('remote')
	container.multiple = container.hasAttribute('multiple')
	container.draggableItems = container.hasAttribute('draggable-items')
	container.dropTargetField = container.getAttribute('drop-target-field') || ''
	container.rowHeight = Math.max(20, Number(container.getAttribute('row-height')) || parseFloat(getComputedStyle(container).getPropertyValue('--ui-list-row')) || 40)
	if (container.remote && (!container.fast || container.mode !== 'normal')) throw new Error('remote List requires fast and mode=normal')
	container.collapsible = container.hasAttribute('collapsible')
	container.treeIndent = Math.max(0, Number(container.getAttribute('indent')) || 12)
	container.collapseThreshold = Math.max(0, Number(container.getAttribute('collapse-threshold')) || 0)
	if (container.hasAttribute('auto-select') && !container.hasAttribute('tabindex')) container.tabIndex = 0

	const padTopEl = container.fast ? container.querySelector('.vs-pad-top') : null
	const padBottomEl = container.fast ? container.querySelector('.vs-pad-bottom') : null

	const defaultSets = {
		idfield: 'id', labelfield: 'label', summaryfield: 'summary',
		groupidfield: 'id', grouplabelfield: 'label', groupsummaryfield: 'summary', groupfield: 'group',
		parentfield: 'parent', groupicon: 'folder', groupiconfield: '', groupiconclassfield: '', itemicon: 'file', iconfield: '', iconclassfield: '', disabledfield: '', haschildrenfield: ''
	}
	// Field names are ordinary declarative attributes, so static markup needs no setup script.
	Object.keys(defaultSets).forEach(name => {
		if (container.hasAttribute(name)) container[name] = container.getAttribute(name)
	})
	container.collapsed = globalThis.NewState({})
	container.state.renderedList = []
	if (!Array.isArray(container.state.selectedItems)) container.state.selectedItems = []
	let selectionAnchor = -1, draggedItems = []

	container.addEventListener('bind', e => {
		if (container.multiple) container.state.selectedItems = Array.isArray(e.detail) ? [...e.detail] : []
		else container.state.selectedItem = e.detail
	})
	container.isItemSelected = item => container.multiple ? container.state.selectedItems.includes(item?.[container.idfield]) : container.state.selectedItem === item?.[container.idfield]
	container.startItemDrag = (event, item) => {
		if (!container.draggableItems || item.type !== 'item') return event.preventDefault()
		const id = item[container.idfield], ids = container.multiple && container.state.selectedItems.includes(id) ? container.state.selectedItems : [id]
		draggedItems = (container.state.list || []).filter(entry => ids.includes(entry[container.idfield]))
		event.dataTransfer.effectAllowed = 'move'
		event.dataTransfer.setData('application/x-apigo-list-items', JSON.stringify(ids))
	}
	container.dropItems = (event, target) => {
		event.currentTarget.classList.remove('list-drop-target')
		if (!container.draggableItems || target.type !== 'item' || (container.dropTargetField && !target[container.dropTargetField]) || !draggedItems.length) return
		event.preventDefault(); event.stopPropagation()
		container.dispatchEvent(new CustomEvent('itemdrop', { detail: { items: [...draggedItems], target }, bubbles: false }))
		draggedItems = []
	}
	container.overItemDrag = (event, item) => {
		if (!container.draggableItems || item.type !== 'item' || (container.dropTargetField && !item[container.dropTargetField])) return
		event.preventDefault(); event.currentTarget.classList.add('list-drop-target')
	}
	container.leaveItemDrag = event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.classList.remove('list-drop-target') }

	const matchString = (val, query) => {
		if (query === undefined || query === null || query === '') return true
		return String(val || '').toLowerCase().includes(String(query).toLowerCase())
	}

	const matchesItem = (item, filter, filterFunc) => {
		if (filterFunc && !filterFunc(item)) return false
		if (filter === 0) filter = ''

		if (filter !== undefined && filter !== null && filter !== '') {
			if (typeof filter === 'object') {
				for (const [key, qVal] of Object.entries(filter)) {
					if (qVal !== undefined && qVal !== null && qVal !== '') {
						if (!matchString(item[key], qVal)) return false
					}
				}
			} else {
				const q = String(filter).trim()
				if (q) {
					const labelMatches = matchString(item[container.labelfield], q)
					const summaryMatches = matchString(item[container.summaryfield], q)
					if (!labelMatches && !summaryMatches) return false
				}
			}
		}
		return true
	}

	const updateFlatList = () => {
		globalThis.Util.updateDefaults(container, defaultSets)
		if (container.remote) return
		let list = Array.isArray(container.state.list) ? container.state.list : []
		let filter = container.state.filter
		let order = container.state.order
		const filterFunc = container._filterFunc
		const orderFunc = container._orderFunc

		if (filter === 0) filter = ''
		if (order === 0) order = ''

		if (orderFunc) {
			list = [...list].sort(orderFunc)
		} else if (order) {
			if (typeof order === 'string') {
				const parts = order.trim().split(/\s+/)
				const field = parts[0]
				const isDesc = parts[1]?.toLowerCase() === 'desc' || field.startsWith('-')
				const cleanField = field.startsWith('-') ? field.slice(1) : field
				list = [...list].sort((a, b) => {
					const valA = a[cleanField]
					const valB = b[cleanField]
					if (valA === undefined || valA === null) return isDesc ? 1 : -1
					if (valB === undefined || valB === null) return isDesc ? -1 : 1
					if (typeof valA === 'string' && typeof valB === 'string') {
						return isDesc ? valB.localeCompare(valA) : valA.localeCompare(valB)
					}
					return isDesc ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1)
				})
			}
		}

		const flatList = []
		if (container.mode === 'group') {
			const filteredList = list.filter(item => matchesItem(item, filter, filterFunc))
			const itemMap = {}
			filteredList.forEach(item => (itemMap[item[container.groupfield]] ??= []).push(item));
			(Array.isArray(container.state.groups) ? container.state.groups : []).forEach(group => {
				const items = itemMap[group[container.groupidfield]]
				let groupMatches = false
				if (filter !== undefined && filter !== null && filter !== '') {
					if (typeof filter === 'object') {
						groupMatches = true
						for (const [key, qVal] of Object.entries(filter)) {
							if (qVal !== undefined && qVal !== null && qVal !== '') {
								if (!matchString(group[key], qVal)) {
									groupMatches = false
									break
								}
							}
						}
					} else {
						const q = String(filter).trim()
						if (q) {
							groupMatches = matchString(group[container.grouplabelfield], q) ||
								matchString(group[container.groupsummaryfield], q)
						}
					}
				}

				if ((items && items.length > 0) || groupMatches || (!filter && !filterFunc)) {
					flatList.push({ type: 'group', ...group })
					if (items) items.forEach(item => flatList.push({ type: 'item', ...item }))
				}
			})
		} else if (container.mode === 'tree') {
			const itemMap = {}
			list.forEach(item => { itemMap[item[container.idfield]] = item })

			const matches = new Set()
			list.forEach(item => {
				if (matchesItem(item, filter, filterFunc)) {
					matches.add(item[container.idfield])
				}
			})

			const keep = new Set(matches)
			if (filter || filterFunc) {
				matches.forEach(id => {
					let curr = itemMap[id]
					while (curr) {
						const parentId = curr[container.parentfield]
						if (!parentId) break
						if (keep.has(parentId)) break
						keep.add(parentId)
						curr = itemMap[parentId]
					}
				})
			}

			const childrenMap = {}
			list.forEach(item => {
				if ((!filter && !filterFunc) || keep.has(item[container.idfield])) {
					const parentId = item[container.parentfield] || ''
						; (childrenMap[parentId] ??= []).push(item)
				}
			})

			const traverse = (items, level, parents) => items.forEach(item => {
				const id = item[container.idfield]
				const hasChildren = !!childrenMap[id]?.length || !!(container.haschildrenfield && item[container.haschildrenfield])
				if (hasChildren && container.hasAttribute('default-collapsed') && container.collapsed[id] === undefined) container.collapsed[id] = true
				if (hasChildren && container.collapseThreshold && (childrenMap[id]?.length || 0) > container.collapseThreshold && container.collapsed[id] === undefined) container.collapsed[id] = true
				const isCollapsed = container.collapsed[id]
				// `type` is also a common business field (for example Doc folders).
				// Keep the renderer discriminator authoritative after spreading user data.
				flatList.push({ ...item, type: 'item', _level: level, _hasChildren: hasChildren, _parents: parents })
				if (childrenMap[id]?.length && !isCollapsed) traverse(childrenMap[id], level + 1, [...parents, id])
			})
			traverse(childrenMap[''] || [], 0, [])
		} else {
			const filteredList = list.filter(item => matchesItem(item, filter, filterFunc))
			filteredList.forEach(item => flatList.push({ type: 'item', ...item }))
		}
		container.state.flatList = flatList
	}

	container.state.__watch('list', updateFlatList)
	container.state.__watch('filter', updateFlatList)
	container.state.__watch('order', updateFlatList)
	const vs = container.fast ? globalThis.VirtualScroll() : null
	let source, generation = 0, selectedIndex = -1, keyboardQueue = Promise.resolve()
	const pages = new Map(), pending = new Map(), failed = new Set(), pageSize = 100
	if (container.remote) Object.assign(container.state, { total: 0, loading: false, error: '' })
	const fetchPage = (offset, focus) => {
		if (!source) return Promise.resolve(null)
		if (!focus && pages.has(offset)) return Promise.resolve({ offset, total: container.state.total, list: pages.get(offset) })
		if (pending.has(offset)) return pending.get(offset)
		const version = generation, loader = source
		container.state.loading = true
		const request = Promise.resolve().then(() => loader({ offset, limit: pageSize, focus })).then(result => {
			if (version !== generation) return null
			if (!result || !Array.isArray(result.list) || !Number.isInteger(result.total) || result.total < 0 || !Number.isInteger(result.offset) || result.offset < 0 || result.list.length > pageSize || result.offset + result.list.length > result.total || (!focus && result.offset !== offset)) throw new Error('Invalid List range response')
			container.state.total = result.total
			pages.set(result.offset, result.list)
			while (pages.size > 6) pages.delete(pages.keys().next().value)
			const index = result.list.findIndex(item => item[container.idfield] === container.state.selectedItem)
			if (index >= 0) selectedIndex = result.offset + index
			return result
		}).catch(error => {
			if (version === generation) { failed.add(offset); container.state.error = error.message || String(error); container.dispatchEvent(new CustomEvent('loaderror', { detail: error })) }
			throw error
		}).finally(() => {
			if (version === generation) { pending.delete(offset); container.state.loading = pending.size > 0; if (!focus) renderRemote() }
		})
		pending.set(offset, request)
		return request
	}
	const remoteItem = index => pages.get(Math.floor(index / pageSize) * pageSize)?.[index % pageSize]
	const renderRemote = () => {
		if (!container.remote) return
		const total = container.state.total, count = Math.max(1, Math.ceil(container.clientHeight / container.rowHeight))
		const start = Math.max(0, Math.min(total, Math.floor(container.scrollTop / container.rowHeight) - count)), end = Math.min(total, start + count * 3)
		if (padTopEl) padTopEl.style.height = `${start * container.rowHeight}px`
		if (padBottomEl) padBottomEl.style.height = `${(total - end) * container.rowHeight}px`
		container.state.listStartIndex = start
		container.state.renderedList = Array.from({ length: end - start }, (_, i) => ({ ...remoteItem(start + i), type: 'item', _loading: !remoteItem(start + i) }))
		for (let offset = Math.floor(start / pageSize) * pageSize; offset < end; offset += pageSize) {
			if (!pages.has(offset) && !pending.has(offset) && !failed.has(offset)) fetchPage(offset).catch(() => { })
		}
	}
	container.reload = async (options = {}) => {
		if (!container.remote) return
		generation++; pages.clear(); pending.clear(); failed.clear(); selectedIndex = -1
		Object.assign(container.state, { total: 0, error: '', loading: false, renderedList: [] })
		container.scrollTop = 0
		renderRemote()
		const version = generation, result = await fetchPage(0, options.focus)
		if (result && version === generation) {
			// Establish the full scroll extent before setting a focused offset;
			// otherwise the browser clamps scrollTop to the empty viewport.
			if (padBottomEl) padBottomEl.style.height = `${result.total * container.rowHeight}px`
			container.scrollTop = result.offset * container.rowHeight
			renderRemote()
		}
	}
	container.reveal = async index => {
		if (!container.remote || !Number.isInteger(index) || index < 0 || index >= container.state.total) return
		const version = generation
		await fetchPage(Math.floor(index / pageSize) * pageSize)
		if (version !== generation) return
		const top = index * container.rowHeight, bottom = top + container.rowHeight
		if (top < container.scrollTop) container.scrollTop = top
		else if (bottom > container.scrollTop + container.clientHeight) container.scrollTop = Math.max(0, bottom - container.clientHeight)
		renderRemote()
	}
	Object.defineProperty(container, 'loadrange', { get: () => source, set: value => { source = value; if (container.remote) container.reload({ focus: container.state.selectedItem }).catch(() => { }) } })
	container.state.__watch('selectedItem', value => {
		if (!container.remote) return
		selectedIndex = -1
		for (const [offset, items] of pages) { const found = items.findIndex(item => item[container.idfield] === value); if (found >= 0) { selectedIndex = offset + found; break } }
		if (value !== null && value !== undefined && value !== '' && selectedIndex < 0 && source) container.reload({ focus: value }).catch(() => { })
	})

	let refreshing = false
	container.refresh = () => {
		if (container.remote) { renderRemote(); return }
		if (!container.fast || refreshing) return
		refreshing = true
		try {
			const res = vs.calc(container, container.state.flatList)
			if (res) {
				if (padTopEl) padTopEl.style.height = `${res.prevHeight}px`
				if (padBottomEl) padBottomEl.style.height = `${res.postHeight}px`
				container.state.listStartIndex = res.listStartIndex
				container.state.renderedList = res.renderedList
			}
		} finally {
			setTimeout(() => { refreshing = false }, 0)
		}
	}

	container.onItemUpdate = (index, node) => { if (container.fast && !container.remote) vs.update(index + (container.state.listStartIndex || 0), node) }

	container.state.__watch('flatList', flatList => {
		if (container.fast) {
			if (padTopEl) padTopEl.style.height = '0px'
			if (padBottomEl) padBottomEl.style.height = '0px'
			container.state.listStartIndex = 0
			container.state.renderedList = vs.reset(flatList, container) || []
			setTimeout(() => { if (container.state.flatList === flatList) vs.init(flatList, container.refresh) })
		} else container.state.renderedList = flatList
	})

	container.selectItem = async (item, index, options = {}) => {
		if (item._loading) return
		const next = item[container.idfield]
		const source = String(container.changebind || '')
		let discarded = false
		let selected = container.state.selectedItem
		if (source && next !== container.state.selectedItem && globalThis.State?.changes?.[source] === true) {
			if (!await globalThis.Dialog?.confirm?.('{#There are unsaved changes. Discard them#}?', { type: 'warning' })) return
			globalThis.State.changes[source] = false
			discarded = true
		}
		if (container.multiple) {
			const current = [...container.state.selectedItems], event = options.event || {}, visible = (container.state.flatList || []).filter(entry => entry.type === 'item'), absolute = index + (container.fast && !options.absolute ? (container.state.listStartIndex || 0) : 0)
			if (event.shiftKey && selectionAnchor >= 0) {
				const from = Math.min(selectionAnchor, absolute), to = Math.max(selectionAnchor, absolute)
				container.state.selectedItems = [...new Set([...current, ...visible.slice(from, to + 1).map(entry => entry[container.idfield])])]
			} else if (event.ctrlKey || event.metaKey) {
				container.state.selectedItems = current.includes(next) ? current.filter(id => id !== next) : [...current, next]
				selectionAnchor = absolute
			} else { container.state.selectedItems = [next]; selectionAnchor = absolute }
			selected = [...container.state.selectedItems]
			container.state.selectedItem = selected.length === 1 ? selected[0] : null
		} else if (container.hasAttribute('auto-select')) {
			selected = options.keepSelected ? next : (container.state.selectedItem === next ? null : next)
			container.state.selectedItem = selected
			if (container.mode === 'group' && container.hasAttribute('auto-select-group')) container.state.selectedGroup = null
			if (container.remote) selectedIndex = selected == null ? -1 : index + (options.absolute ? 0 : (container.state.listStartIndex || 0))
		}
		if (!container.hasAttribute('silent')) container.dispatchEvent(new CustomEvent('change', { detail: selected, bubbles: false }))
		if (container.multiple) container.dispatchEvent(new CustomEvent('selectionchange', { detail: [...container.state.selectedItems], bubbles: false }))
		container.dispatchEvent(new CustomEvent('itemclick', { bubbles: false, detail: { item, selected, selectedItems: container.multiple ? [...container.state.selectedItems] : undefined, index: index + (container.fast && !options.absolute ? (container.state.listStartIndex || 0) : 0), discarded } }))
		// Scroll only this list, and only enough to reveal the selected row.
		if (options.keyboard) setTimeout(() => {
			const row = container.querySelector('.list-group-item.text-primary')
			if (!row) return
			const bounds = container.getBoundingClientRect(), rect = row.getBoundingClientRect()
			const top = bounds.top + container.clientTop, bottom = top + container.clientHeight
			if (rect.top < top) container.scrollTop += rect.top - top
			else if (rect.bottom > bottom) container.scrollTop += rect.bottom - bottom
		}, 0)
	}
	container.clearSelection = async () => {
		const previousItem = container.state.selectedItem, previousItems = [...container.state.selectedItems], previousGroup = container.state.selectedGroup
		if (previousItem == null && !previousItems.length && previousGroup == null) return
		const source = String(container.changebind || '')
		let discarded = false
		if (source && globalThis.State?.changes?.[source] === true) {
			if (!await globalThis.Dialog?.confirm?.('{#There are unsaved changes. Discard them#}?', { type: 'warning' })) return
			globalThis.State.changes[source] = false
			discarded = true
		}
		container.state.selectedItem = null
		container.state.selectedItems = []
		container.state.selectedGroup = null
		if (container.remote) selectedIndex = -1
		if (!container.hasAttribute('silent')) container.dispatchEvent(new CustomEvent('change', { detail: null, bubbles: false }))
		if (container.multiple) container.dispatchEvent(new CustomEvent('selectionchange', { detail: [], bubbles: false }))
		container.dispatchEvent(new CustomEvent('selectionclear', { bubbles: false, detail: { previousItem, previousItems, previousGroup, discarded } }))
	}
	container.addEventListener('click', event => { if (event.target === container) container.clearSelection() })
	container.selectGroup = (item, index) => {
		let selected = container.state.selectedGroup
		if (container.hasAttribute('auto-select-group')) {
			selected = container.state.selectedGroup === item[container.groupidfield] && container.state.selectedItem == null ? null : item[container.groupidfield]
			container.state.selectedGroup = selected
			container.state.selectedItem = null
		}
		container.dispatchEvent(new CustomEvent('groupclick', { bubbles: false, detail: { item, selected, index } }))
	}
	container.expandItem = id => { if (container.mode === 'tree' && container.collapsible) { container.collapsed[id] = false; updateFlatList() } }
	container.toggleCollapse = item => {
		if (!container.collapsible || !item._hasChildren) return
		const id = item[container.idfield]
		if (container.collapsed[id] && !container.dispatchEvent(new CustomEvent('beforeexpand', { cancelable: true, detail: { item } }))) return
		container.collapsed[id] = !container.collapsed[id]
		updateFlatList()
	}
	container.activateItem = (item, index) => { if (!item._loading) container.dispatchEvent(new CustomEvent('itemactivate', { detail: { item, index: index + (container.fast ? (container.state.listStartIndex || 0) : 0) } })) }
	container.collapseAll = () => {
		if (container.mode !== 'tree' || !container.collapsible) return
		const parents = new Set((Array.isArray(container.state.list) ? container.state.list : []).map(item => item[container.parentfield]).filter(Boolean))
		parents.forEach(id => { container.collapsed[id] = true })
		updateFlatList()
	}
	container.isAllCollapsed = () => {
		if (container.mode !== 'tree' || !container.collapsible) return false
		const parents = new Set((Array.isArray(container.state.list) ? container.state.list : []).map(item => item[container.parentfield]).filter(Boolean))
		return parents.size > 0 && [...parents].every(id => container.collapsed[id])
	}
	container.toggleAll = () => container.isAllCollapsed() ? container.expandAll() : container.collapseAll()
	container.expandAll = () => {
		if (container.mode !== 'tree' || !container.collapsible) return
		Object.keys(container.collapsed).forEach(id => { container.collapsed[id] = false })
		updateFlatList()
	}
	container.itemIcon = item => (container.iconfield && item?.[container.iconfield]) || container.itemicon
	container.addEventListener('keydown', event => {
		if (!container.hasAttribute('auto-select') || container.mode === 'tree' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
		if (event.target !== container && event.target.closest?.('input,textarea,select,button,a,[contenteditable="true"]')) return
		if (event.target.closest?.('List') !== container) return
		if (container.remote) {
			if (!['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) return
			event.preventDefault(); event.stopPropagation()
			const version = generation, key = event.key
			keyboardQueue = keyboardQueue.then(async () => {
				if (version !== generation || !container.state.total) return
				const index = key === 'Enter' ? selectedIndex : selectedIndex < 0 ? (key === 'ArrowUp' ? container.state.total - 1 : 0) : Math.max(0, Math.min(container.state.total - 1, selectedIndex + (key === 'ArrowUp' ? -1 : 1)))
				if (index < 0) return
				await fetchPage(Math.floor(index / pageSize) * pageSize)
				if (version !== generation) return
				const item = remoteItem(index)
				if (!item) return
				if (key === 'Enter') container.dispatchEvent(new CustomEvent('itemactivate', { detail: { item, index } }))
				else { await container.selectItem(item, index, { keepSelected: true, keyboard: true, absolute: true }); if (version === generation && selectedIndex === index) await container.reveal(index) }
			}).catch(() => { })
			return
		}
		if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || (container.mode === 'tree' && ['ArrowLeft', 'ArrowRight'].includes(event.key))) { event.preventDefault(); event.stopPropagation() }
		const visible = (container.state.flatList || []).map((item, index) => ({ item, index })).filter(entry => entry.item.type === 'item')
		if (!visible.length) return
		const current = visible.findIndex(entry => entry.item[container.idfield] === container.state.selectedItem)
		if (event.key === 'Enter' && current >= 0) { event.preventDefault(); const entry = visible[current]; container.dispatchEvent(new CustomEvent('itemactivate', { detail: entry })); return }
		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			const nextIndex = current < 0 ? (event.key === 'ArrowUp' ? visible.length - 1 : 0) : Math.max(0, Math.min(visible.length - 1, current + (event.key === 'ArrowUp' ? -1 : 1)))
			if (nextIndex === current) return
			event.preventDefault()
			const next = visible[nextIndex]
			container.selectItem(next.item, next.index, { keepSelected: true, keyboard: true, absolute: true })
			return
		}
		if (container.mode !== 'tree' || !container.collapsible || current < 0) return
		const entry = visible[current], id = entry.item[container.idfield]
		if (event.key === 'ArrowRight' && entry.item._hasChildren && container.collapsed[id]) {
			event.preventDefault(); container.collapsed[id] = false; updateFlatList()
		} else if (event.key === 'ArrowLeft' && entry.item._hasChildren && !container.collapsed[id]) {
			event.preventDefault(); container.collapsed[id] = true; updateFlatList()
		}
	})

	Object.defineProperty(container, 'filterFunc', {
		get: () => container._filterFunc,
		set: v => { container._filterFunc = v; updateFlatList(); }
	})
	Object.defineProperty(container, 'orderFunc', {
		get: () => container._orderFunc,
		set: v => { container._orderFunc = v; updateFlatList(); }
	})

	updateFlatList()
	if (globalThis.Bootstrap?.observeDensity) DOMDisposer.add(container, Bootstrap.observeDensity(container, (_, css) => {
		const previous = container.rowHeight;
		container.rowHeight = Math.max(20, Number(container.getAttribute('row-height')) || parseFloat(css.getPropertyValue('--ui-list-row')) || 40);
		if (container.remote) {
			container.scrollTop = container.scrollTop / previous * container.rowHeight;
			container.refresh();
		} else if (container.fast) {
			const list = container.state.flatList || [];
			container.scrollTop = container.scrollTop / previous * container.rowHeight;
			container.state.renderedList = vs.reset(list, container) || [];
			vs.init(list, container.refresh);
		}
	}))
}, globalThis.Util.makeDom(/*html*/`
<div class="list-group overflow-auto" onscroll="this.refresh()" $onclick="if(!event.target.closest('.list-group-item'))this.clearSelection()" style="overflow-anchor:none">
        <div class="vs-pad-top flex-shrink-0" style="height:0px;"></div>
        <template slot-id="item" $each="this.state.renderedList">
			<div $onupdate="this.onItemUpdate(index, thisNode)" $.draggable="this.draggableItems&&item.type==='item'" $ondragstart="this.startItemDrag(event,item)" $ondragover="this.overItemDrag(event,item)" $ondragleave="this.leaveItemDrag(event)" $ondrop="this.dropItems(event,item)" $style="(this.remote?'height:'+this.rowHeight+'px;min-height:'+this.rowHeight+'px;flex-shrink:0;':'')+''+'cursor:default;user-select:none'" $class="list-group-item border-0 bg-transparent  d-inline-flex align-items-center w-100  \${item.type==='group'?'fw-semibold':((this.hasAttribute('auto-select')||this.multiple)?'list-group-item-action ':'') + (this.mode==='group'?'ps-4':'')} \${item.type==='group'?(this.hasAttribute('auto-select-group')&&this.state?.selectedGroup===item[this.groupidfield]?'text-primary fw-semibold':''):((this.hasAttribute('auto-select')||this.multiple)&&this.isItemSelected(item)?'text-primary fw-semibold':'')} list-active-\${this.activeMode}" $onclick="event.stopPropagation();this.focus({preventScroll:true});item.type==='group'?this.selectGroup(item,index):this.selectItem(item,index,{event})" $ondblclick="if(item.type==='item')this.activateItem(item,index)">
                        <template $if="item.type === 'group'">
                                <template $if="this.groupicon">
									<span $class="bi bi-\${this.groupiconfield ? item[this.groupiconfield] || this.groupicon : this.groupicon} \${this.groupiconclassfield ? item[this.groupiconclassfield] || 'text-body' : 'text-body'}"></span>
                                </template>
                                <div class="list-primary-text text-truncate px-1" $text="\${item[this.grouplabelfield]}"></div>
                                <div class="list-summary-text opacity-75 small text-truncate text-end" $text="\${item[this.groupsummaryfield] || ''}"></div>
                                <div slot-id="group-actions"></div>
                        </template>
                        <template $if="item.type === 'item'">
                                <template $if="this.mode === 'tree'">
								<div $style="width:\${item._level * this.treeIndent + (this.collapsible ? 16 : 0)}px; cursor:\${this.collapsible ? 'pointer' : 'default'}" class="text-end text-muted flex-shrink-0" $onclick="event.stopPropagation(); this.toggleCollapse(item)">
								<template $if="this.collapsible && item._hasChildren">
										<i $class="bi \${this.collapsed[item[this.idfield]] ? 'bi-caret-right-fill' : 'bi-caret-down-fill'}"></i>
								</template>
								<template $if="!item._hasChildren && this.itemIcon(item)">
										<i $class="opacity-50 bi bi-\${this.itemIcon(item)}"></i>
								</template>
							</div>
						</template>
						<template $if="this.mode !== 'tree' && this.itemIcon(item)">
                                <span $class="bi bi-\${this.itemIcon(item)} \${(this.iconclassfield && item[this.iconclassfield]) || 'text-body'}"></span>
                                </template>
                                <div class="list-primary-text text-truncate px-1" $class="item[this.disabledfield]?'text-body-secondary opacity-50':''" $text="\${item[this.labelfield] || ''}"></div>
                                <div class="list-summary-text opacity-75 fs-7 small ms-2 text-truncate text-end" $text="\${item[this.summaryfield] || ''}"></div>
                                <div slot-id="item-actions"></div>
                        </template>
                </div>
        </template>
        <div class="vs-pad-bottom flex-shrink-0" style="height:0px;"></div>
</div>
`), globalThis.Util.makeDom(`<style>
List .list-group-item {font-size:var(--ui-item-font,1rem);padding:var(--ui-item-y,.5rem) var(--ui-item-x,1rem);}
List .list-primary-text{min-width:0;max-width:75%;flex:0 1 auto}List .list-summary-text{min-width:25%;flex:1 1 25%}List .list-summary-text:empty{min-width:0;flex:1 1 0}List .list-group-item:not(:has(.list-summary-text:not(:empty))) .list-primary-text{max-width:100%}List .list-group-item.list-drop-target{outline:2px solid var(--bs-primary);outline-offset:-2px;background:rgba(var(--bs-primary-rgb),.12)!important}
</style>`))
