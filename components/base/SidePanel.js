/** A non-modal tabbed region. Its slotted content keeps its native DOM lifetime. */
globalThis.Component.register('SidePanel', container => {
	const state = container.state, content = container.querySelector('[data-panel-content]')
	state.single = container.hasAttribute('single')
	container.panelID = container.id || 'side-panel-' + UUID.make()
	if (state.tabs === undefined) state.tabs = []
	if (state.active === undefined) state.active = ''
	if (state.open === undefined) state.open = false
	let normalizing = false, returnFocus = null
	const validate = tabs => {
		if (!Array.isArray(tabs) || tabs.some(tab => !tab || typeof tab.id !== 'string' || !tab.id) || new Set(tabs.map(tab => tab.id)).size !== tabs.length) throw new TypeError('SidePanel tabs require unique non-empty string ids')
	}
	const sync = () => {
		if (normalizing) return
		normalizing = true
		try {
			validate(state.tabs)
			if (!state.tabs.some(tab => tab.id === state.active)) state.active = state.tabs[0]?.id || ''
			if (!state.tabs.length) state.open = false
			for (const section of content.querySelectorAll('[data-panel-tab]')) {
				if (section.closest('SidePanel') !== container) continue
				const id = section.getAttribute('data-panel-tab'), visible = state.open && state.active === id
				section.hidden = !visible; section.inert = !visible
				section.setAttribute('role', 'tabpanel')
				section.id = container.tabPaneID(id)
				section.setAttribute('aria-labelledby', container.tabID(id))
			}
		} finally { normalizing = false }
	}
	container.tabID = id => container.panelID + '-tab-' + encodeURIComponent(id)
	container.tabPaneID = id => container.panelID + '-pane-' + encodeURIComponent(id)
	const emit = () => {
		container.dispatchEvent(new CustomEvent('change', { detail: !!state.open, bubbles: false }))
		container.dispatchEvent(new CustomEvent('statechange', { detail: { open: !!state.open, active: state.active, tabs: state.tabs.map(tab => ({ ...tab })) }, bubbles: false }))
	}
	container.addEventListener('bind', event => { state.open = !!event.detail })
	container.toggle = (open = !state.open) => {
		if (open && !state.tabs.length) return
		if (open && !state.open && !container.contains(document.activeElement)) returnFocus = document.activeElement
		if (!open && container.contains(document.activeElement)) document.activeElement.blur()
		state.open = !!open
		if (!open && returnFocus?.isConnected && !returnFocus.closest('[inert]')) returnFocus.focus({ preventScroll: true })
		emit()
	}
	container.openTab = tab => {
		const id = typeof tab === 'string' ? tab : tab?.id
		if (!state.tabs.some(item => item.id === id)) {
			if (typeof tab !== 'object') throw new Error('Unknown SidePanel tab: ' + id)
			validate([...state.tabs, tab]); state.tabs = [...state.tabs, { ...tab }]
		}
		state.active = id
		container.toggle(true)
	}
	container.closeTab = (id = state.active, { force = false } = {}) => {
		const index = state.tabs.findIndex(tab => tab.id === id)
		if (index < 0) return
		if (!force && !container.dispatchEvent(new CustomEvent('beforeclose', { detail: { id }, cancelable: true, bubbles: false }))) return
		const focused = container.contains(document.activeElement)
		state.tabs = state.tabs.filter(tab => tab.id !== id)
		if (focused && state.open) requestAnimationFrame(() => document.getElementById(container.tabID(state.active))?.focus())
		if (!state.tabs.length) container.toggle(false)
		else emit()
		container.dispatchEvent(new CustomEvent('tabclose', { detail: { id }, bubbles: false }))
	}
	container.tabKey = event => {
		if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Delete'].includes(event.key)) return
		event.preventDefault()
		if (event.key === 'Delete') { container.closeTab(); return }
		const index = state.tabs.findIndex(tab => tab.id === state.active), last = state.tabs.length - 1
		const next = event.key === 'Home' ? 0 : event.key === 'End' ? last : (index + (event.key === 'ArrowRight' ? 1 : last)) % state.tabs.length
		container.openTab(state.tabs[next].id)
		requestAnimationFrame(() => document.getElementById(container.tabID(state.active))?.focus())
	}
	container.addEventListener('keydown', event => { if (event.key === 'Escape' && !event.isComposing && state.open) { event.preventDefault(); container.toggle(false) } })
	const stop = ['tabs', 'active', 'open'].map(key => state.__watch(key, sync))
	const observer = new MutationObserver(sync); observer.observe(content, { childList: true, subtree: true })
	DOMDisposer.add(container, () => { observer.disconnect(); stop.forEach(unwatch => unwatch()) })
	sync()
}, Util.makeDom(/*html*/`
<aside class="bg-body text-body border shadow d-flex flex-column" role="complementary" aria-label="Side panel" $.hidden="!this.state.open" $.inert="!this.state.open">
  <header class="d-flex align-items-center border-bottom bg-body-tertiary px-2 pt-2 gap-1 flex-shrink-0">
    <div $if="!this.state.single" class="nav nav-tabs border-0 flex-nowrap flex-fill overflow-x-auto" role="tablist" aria-label="Panel tabs">
      <div $each="this.state.tabs" as="tab" key="id" class="d-flex align-items-center flex-shrink-0">
        <button type="button" role="tab" class="nav-link text-nowrap" $class="this.state.active===tab.id?'active':''" $id="this.tabID(tab.id)" $aria-controls="this.tabPaneID(tab.id)" $aria-selected="this.state.active===tab.id?'true':'false'" $tabindex="this.state.active===tab.id?0:-1" $onclick="this.openTab(tab.id)" $onkeydown="this.tabKey(event)"><i $if="tab.icon" aria-hidden="true" $class="'bi bi-'+tab.icon+' me-1'"></i><span $text="tab.label||tab.id"></span></button>
        <button type="button" class="btn  btn-link text-body-secondary px-1" $aria-label="'Close tab: '+(tab.label||tab.id)" $onclick="this.closeTab(tab.id)"><i class="bi bi-x" aria-hidden="true"></i></button>
      </div>
    </div>
    <span $if="this.state.single" class="flex-fill text-truncate pb-2" $text="this.state.tabs.find(tab=>tab.id===this.state.active)?.label||''"></span>
    <button type="button" class="btn  btn-link text-body-secondary mb-2" aria-label="Close panel" $onclick="this.state.single?this.closeTab():this.toggle(false)"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
  </header>
  <div slot-id="content" data-panel-content class="d-flex flex-column flex-fill h-100 overflow-auto" style="min-height:0"></div>
</aside>
`), Util.makeDom(/*html*/`
<style>
  SidePanel { position:fixed; z-index:1040; right:0; top:var(--side-panel-top,0px); bottom:0; width:var(--side-panel-width,min(480px,50vw)); min-width:0; min-height:0; }
  SidePanel[hidden], SidePanel [data-panel-tab][hidden] { display:none !important; }
  SidePanel[docked] { position:relative; top:auto; right:auto; bottom:auto; flex:0 0 var(--side-panel-width,min(480px,40vw)); width:var(--side-panel-width,min(480px,40vw)); }
  SidePanel [data-panel-tab] { min-height:0; }
  @media (max-width:767.98px) { SidePanel { top:auto; left:0; width:100%; height:var(--side-panel-height,55dvh); max-height:90dvh; border-radius:var(--bs-border-radius-lg) var(--bs-border-radius-lg) 0 0; } }
  @media (max-width:767.98px) { SidePanel[docked] { position:fixed; flex:none; bottom:0; width:100%; } }
</style>
`))
