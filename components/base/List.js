/**
 * List Component Module
 */
globalThis.Component.register('List', container => {
	container.mode = container.getAttribute('mode') || 'normal'
	container.fast = container.hasAttribute('fast')
	container.collapsible = container.hasAttribute('collapsible')

	const padTopEl = container.fast ? container.querySelector('.vs-pad-top') : null
	const padBottomEl = container.fast ? container.querySelector('.vs-pad-bottom') : null

	const defaultSets = {
		idfield: 'id', labelfield: 'label', summaryfield: 'summary',
		groupidfield: 'id', grouplabelfield: 'label', groupsummaryfield: 'summary', groupfield: 'group',
		parentfield: 'parent', groupicon: 'folder', itemicon: 'file', iconfield: ''
	}
	// Field names are ordinary declarative attributes, so static markup needs no setup script.
	Object.keys(defaultSets).forEach(name => {
		if (container.hasAttribute(name)) container[name] = container.getAttribute(name)
	})
	container.collapsed = globalThis.NewState({})
	container.state.renderedList = []

	container.addEventListener('bind', e => {
		container.state.selectedItem = e.detail
	})

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
				const hasChildren = !!childrenMap[id]?.length
				const isCollapsed = container.collapsed[id]
				// `type` is also a common business field (for example Doc folders).
				// Keep the renderer discriminator authoritative after spreading user data.
				flatList.push({ ...item, type: 'item', _level: level, _hasChildren: hasChildren, _parents: parents })
				if (hasChildren && !isCollapsed) traverse(childrenMap[id], level + 1, [...parents, id])
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

	let refreshing = false
	container.refresh = () => {
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

	container.onItemUpdate = (index, node) => { if (container.fast) vs.update(index + (container.state.listStartIndex || 0), node) }

	container.state.__watch('flatList', flatList => {
		if (container.fast) {
			if (padTopEl) padTopEl.style.height = '0px'
			if (padBottomEl) padBottomEl.style.height = '0px'
			container.state.listStartIndex = 0
			container.state.renderedList = vs.reset(flatList, container) || []
			setTimeout(() => { if (container.state.flatList === flatList) vs.init(flatList, container.refresh) })
		} else container.state.renderedList = flatList
	})

	container.selectItem = (item, index) => {
		if (container.hasAttribute('auto-select')) {
			container.state.selectedItem = container.state.selectedItem === item[container.idfield] ? null : item[container.idfield]
		}
		container.dispatchEvent(new CustomEvent('change', { detail: container.state.selectedItem, bubbles: false }))
		container.dispatchEvent(new CustomEvent('itemclick', { bubbles: false, detail: { item, index: index + (container.fast ? (container.state.listStartIndex || 0) : 0) } }))
	}
	container.selectGroup = (item, index) => {
		if (container.hasAttribute('auto-select-group')) container.state.selectedGroup = container.state.selectedGroup === item[container.groupidfield] ? null : item[container.groupidfield]
		container.dispatchEvent(new CustomEvent('groupclick', { bubbles: false, detail: { item, index } }))
	}
	container.toggleCollapse = (item) => { if (container.collapsible && item._hasChildren) { container.collapsed[item[container.idfield]] = !container.collapsed[item[container.idfield]]; updateFlatList(); } }
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

	Object.defineProperty(container, 'filterFunc', {
		get: () => container._filterFunc,
		set: v => { container._filterFunc = v; updateFlatList(); }
	})
	Object.defineProperty(container, 'orderFunc', {
		get: () => container._orderFunc,
		set: v => { container._orderFunc = v; updateFlatList(); }
	})

	updateFlatList()
}, globalThis.Util.makeDom(/*html*/`
<div class="list-group overflow-auto" onscroll="this.refresh()" style="overflow-anchor:none">
        <div class="vs-pad-top flex-shrink-0" style="height:0px;"></div>
        <template slot-id="item" $each="this.state.renderedList">
                <div $onupdate="this.onItemUpdate(index, thisNode)" $style="cursor:\${item.type==='group'?(this.hasAttribute('auto-select-group')?'pointer':'default'):(this.hasAttribute('auto-select')?'pointer':'default')}" $class="list-group-item border-0 bg-transparent small \${this.mode==='tree'?'py-0':'py-1'} d-inline-flex align-items-center w-100 pe-2 \${item.type==='group'?'fw-semibold ps-2':'list-group-item-action ' + (this.mode==='group'?'ps-4':'ps-2')} \${item.type==='group'?(this.state?.selectedGroup===item[this.groupidfield]?'text-primary fw-semibold':''):(this.state?.selectedItem===item[this.idfield]?'text-primary fw-semibold':'')}" $onclick="item.type==='group'?this.selectGroup(item,index):this.selectItem(item,index)">
                        <template $if="item.type === 'group'">
                                <template $if="this.groupicon">
                                        <span $class="bi bi-\${this.groupicon} text-body"></span>
                                </template>
                                <div class="flex-fill text-truncate px-1" $text="\${item[this.grouplabelfield]}"></div>
                                <div class="opacity-50 small flex-fill text-truncate text-end" $text="\${item[this.groupsummaryfield] || ''}"></div>
                                <div slot-id="group-actions"></div>
                        </template>
                        <template $if="item.type === 'item'">
                                <template $if="this.mode === 'tree'">
                                        <div $style="width:\${item._level * 16 + (this.collapsible ? 16 : 0)}px; cursor:\${this.collapsible ? 'pointer' : 'default'}" class="text-end text-muted flex-shrink-0" $onclick="event.stopPropagation(); this.toggleCollapse(item)">
                                                <template $if="this.collapsible && item._hasChildren">
                                                        <i $class="bi \${this.collapsed[item[this.idfield]] ? 'bi-caret-right-fill' : 'bi-caret-down-fill'}"></i>
                                                </template>
                                        </div>
                                </template>
						<template $if="this.mode === 'tree' && !item._hasChildren && this.itemIcon(item)">
								<span $class="opacity-50 bi bi-\${this.itemIcon(item)}"></span>
						</template>
						<template $if="this.mode !== 'tree' && this.itemIcon(item)">
								<span $class="bi bi-\${this.itemIcon(item)} text-body"></span>
                                </template>
                                <div class="flex-fill text-truncate px-1" $text="\${item[this.labelfield] || ''}"></div>
                                <div class="opacity-50 fs-7 small ms-2 flex-fill text-truncate text-end" $text="\${item[this.summaryfield] || ''}"></div>
                                <div slot-id="item-actions"></div>
                        </template>
                </div>
        </template>
        <div class="vs-pad-bottom flex-shrink-0" style="height:0px;"></div>
</div>
`))
