/**
 * Nav Component Module
 */
globalThis.Component.register('Nav', container => {
	container.state.orientation ??= container.getAttribute('orientation') || (container.hasAttribute('vertical') ? 'vertical' : 'horizontal')
    Object.defineProperty(container,'vertical',{get:()=>['vertical','rail'].includes(container.state.orientation),set:value=>{container.state.orientation=value?'vertical':'horizontal'}})
    container.setOrientation = mode => { if(!['horizontal','vertical','rail','bar'].includes(mode))throw Error('Nav: invalid orientation');if(container.state.orientation!==mode)container.state.orientation=mode }
    container.state.overflowIndices=[]
    container.state.overflowItems=[]
    container.isOverflow = index => container.state.overflowIndices.includes(index)
    container.overflowActive = () => container.state.overflowItems.some(item=>item.name===container.state.value)
    const flatten = items => items.flatMap((item,index)=>item.type==='dropdown'?[{type:'label',name:'group:'+item.name,label:item.label},...(item.items||item.list||[])]:item.type==='fill'?[]:item.type==='label'?[{...item,name:item.name||'label:'+index}]:[item])
    // Keep overflow rows in source order; resizing only hides rows, never rebuilds their identities.
    container.overflowMenu = () => (container.state.list||[]).flatMap((item,index)=>flatten([item]).map((entry,child)=>({item:entry,index,key:index+':'+child})))
    let frame
    const measure = () => {
      if(!container.isConnected)return
      if(container.vertical || container.state.orientation==='bar'){
        if(container.state.overflowIndices.length){container.state.overflowIndices=[];container.state.overflowItems=[]}return
      }
      const area=container.querySelector('[data-nav-items]'),more=container.querySelector('[data-nav-more]')
      if(!area||!more||!area.clientWidth)return
      const nodes=[...area.children].filter(node=>node.hasAttribute('data-nav-index'))
      const list=container.state.list||[],fill=nodes.filter(node=>list[Number(node.dataset.navIndex)]?.type==='fill')
      const fixed=fill.reduce((sum,node)=>sum+(node.querySelector('[slot-id="tools-end"]')?.scrollWidth||0),0)
      const candidates=nodes.filter(node=>list[Number(node.dataset.navIndex)]?.type!=='fill')
      const total=candidates.reduce((sum,node)=>sum+node.getBoundingClientRect().width,0)
      let room=area.clientWidth-fixed-(total+fixed>area.clientWidth?more.getBoundingClientRect().width:0),used=0,over=[]
      for(const node of candidates){const width=node.getBoundingClientRect().width,index=Number(node.dataset.navIndex);if(used+width>room+.5)over.push(index);else if(!over.length)used+=width;else over.push(index)}
      if(!over.length)globalThis.bootstrap?.Dropdown.getInstance(more.querySelector('[data-bs-toggle=dropdown]'))?.hide()
      if(JSON.stringify(over)!==JSON.stringify(container.state.overflowIndices)){container.state.overflowIndices=over;container.state.overflowItems=flatten(over.map(index=>list[index]))}
    }
    const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure)}
    const resize=new ResizeObserver(schedule);resize.observe(container)
    const mutation=new MutationObserver(schedule);mutation.observe(container,{childList:true,subtree:true,characterData:true})
    const stops=['list','orientation','value'].map(key=>container.state.__watch(key,schedule))
    const stopDensity=globalThis.Bootstrap?.observeDensity?.(container,schedule)
    DOMDisposer.add(container,()=>{cancelAnimationFrame(frame);resize.disconnect();mutation.disconnect();stops.forEach(stop=>stop());stopDensity?.();for(const button of container.querySelectorAll('[data-bs-toggle=dropdown]'))globalThis.bootstrap?.Dropdown.getInstance(button)?.dispose()})
    container.reflow=schedule
    schedule()
	container.sm = container.hasAttribute('sm')
	container.homepage = container.homepage || container.getAttribute('homepage') || '#'
    container.homeurl = container.homeurl || container.getAttribute('homeurl') || ''
	container.state.openName = container.state.openName || null
	container.state.value = container.state.value || null

	container.addEventListener('bind', e => {
		container.state.value = e.detail
	})

	container.confirmChange = async item => {
		if (item?.changeguard === false) return { allowed: true, discarded: false }
		const source = String(container.changebind || '')
		const changed = source === '*' ? globalThis.State?._exitBlocks > 0 : !!source && globalThis.State?.changes?.[source] === true
		if (!changed) return { allowed: true, discarded: false }
		if (!await globalThis.Dialog?.confirm?.('{#There are unsaved changes. Discard them#}?', { type: 'warning' })) return { allowed: false, discarded: false }
		if (source === '*') {
			for (const key of Object.keys(globalThis.State.changes)) if (globalThis.State.changes[key] === true) globalThis.State.changes[key] = false
		} else globalThis.State.changes[source] = false
		return { allowed: true, discarded: true }
	}
	container.click = async (item, noselect, event) => {
		if(item.disabled)return
		const menuTrigger = (item.closemenu || event?.currentTarget?.closest('.nav-overflow')) && event?.currentTarget?.closest('.dropdown')?.querySelector('[data-bs-toggle="dropdown"]')
		const guard = await container.confirmChange(item)
		if (!guard.allowed) return
		if (menuTrigger) globalThis.bootstrap.Dropdown.getInstance(menuTrigger)?.hide()
		const selected = !item.noselect && !noselect
		if (selected) {
			container.state.value = item.name
			container.dispatchEvent(new CustomEvent('change', { detail: item.name, bubbles: false }))
		}
		container.dispatchEvent(new CustomEvent('nav', { detail: { item, name: item.name, selected, discarded: guard.discarded }, bubbles: false }))
	}
	container.clickHome = async () => {
		const guard = await container.confirmChange()
		if (guard.allowed) { if(container.homeurl)location.href=container.homeurl;else location.hash=container.homepage }
	}
	container.clickSubitem = (item,event) => container.click(item, false, event)
	container.toggleGroup = item => {
		container.state.openName = container.state.openName === item.name ? null : item.name
		container.dispatchEvent(new CustomEvent('nav', { detail: { item, name: item.name, open: container.state.openName === item.name, selected: false }, bubbles: false }))
	}
}, globalThis.Util.makeDom(/*html*/`
<div $class="\${this.vertical ? 'd-flex flex-column h-100 align-self-stretch overflow-visible' : 'navbar navbar-expand flex-nowrap position-relative'} bg-transparent px-2 \${this.state.orientation==='bar'?'nav-bar':this.state.orientation==='rail'?'nav-rail':''} \${this.vertical ? 'py-2' : 'py-1'} align-items-center \${this.vertical ? 'align-items-start' : ''}" $style="this.vertical ? 'min-height:0;' : ''">
	<button $if="this.state.brand?.image||this.state.brand?.icon||this.state.brand?.label" type="button" class="btn btn-link nav-brand d-flex align-items-center gap-2 flex-shrink-0" aria-label="{#Home#}" $onclick="this.clickHome()">
        <template $if="this.state?.brand?.image">
                <img $src="this.state.brand.image" $class="\${this.vertical ? 'mb-2' : 'mx-1'}" style="height:30px;width:auto;max-width:300px">
        </template>
        <template $if="this.state?.brand?.icon">
                <i $class="bi bi-\${this.state.brand.icon} \${this.vertical ? 'mb-2' : 'mx-1'}"></i>
        </template>
        <template $if="this.state?.brand?.label">
                <span $class="\${this.vertical ? 'mb-2 fw-bold' : 'mx-1'}" $text="this.state.brand.label"></span>
        </template>
	</button>
	<div data-nav-items $class="d-flex \${this.vertical ? 'w-100 flex-fill flex-column gap-1' : 'align-items-center flex-fill flex-nowrap'}" $style="this.vertical ? 'min-height:0; overflow-y:auto; overflow-x:visible;' : ''">
		<template $each="this.state?.list || []">
			<div $data-nav-index="index" $data-nav-hidden="this.isOverflow(index)?'true':'false'" $aria-hidden="this.isOverflow(index)?'true':'false'" $class="\${this.vertical ? 'nav nav-pills flex-column w-100 position-relative' : 'navbar-nav nav-entry flex-row align-items-center flex-shrink-0'} \${!this.vertical && item.type==='fill' ? 'flex-fill' : ''}"><template $if="item.type==='slot'"><div $attr="'slot-id=' + item.name"></div></template>
			<template $if="item.type==='fill'"><div slot-id="tools-end" class="d-flex align-items-center justify-content-end flex-shrink-0 ms-auto"></div></template>
			<template $if="item.type==='label'">
				<div $class="\${this.vertical ? 'small text-uppercase text-body-secondary fw-semibold px-2 py-1 mt-2' : 'navbar-text small text-uppercase text-body-secondary fw-semibold px-2'} \${item.class || ''}" $text="item.label"></div>
			</template>
			<template $if="item.type==='button'">
								<button type="button" $disabled="item.disabled" $title="item.label||item.name" $aria-current="this.state.value===item.name?'page':'false'" $aria-label="item.label || item.name" $class="nav-link \${this.state.value===item.name?'active':''} \${this.vertical ? 'w-100 text-start' : ''} \${item.class || ''}" $onclick="this.click(item)">
						<i aria-hidden="true" $if="item.icon" $class="bi bi-\${item.icon}"></i><span $if="item.label" $class="\${this.vertical ? 'text-truncate' : ''} \${this.sm ? 'small' : ''}" $text="item.label"></span>
				</button>
				</template>
				<template $if="item.type==='dropdown'">
					<template $if="this.vertical">
						<div class="w-100">
							<button type="button" $class="nav-link w-100 text-start d-flex align-items-center justify-content-between \${item.class || ''}" $onclick="this.toggleGroup(item)">
								<span class="d-inline-flex align-items-center">
									<i aria-hidden="true" $if="item.icon" $class="bi bi-\${item.icon}"></i><span class="text-truncate" $text="item.label"></span>
								</span>
								<i $class="bi \${this.state.openName===item.name?'bi-chevron-down':'bi-chevron-right'} small ms-2"></i>
							</button>
							<template $if="this.state.openName===item.name">
								<div class="d-flex flex-column w-100 ps-2 mt-1">
									<template $each="item.items || item.list" as="subitem">
										<template $if="subitem.type==='label'">
											<div $class="small text-uppercase text-body-secondary fw-semibold px-2 py-1 \${subitem.class || ''}" $text="subitem.label"></div>
										</template>
										<template $if="subitem.type==='button'">
											<button type="button" $disabled="subitem.disabled" $aria-current="this.state.value===subitem.name?'page':'false'" $class="nav-link w-100 text-start \${this.state.value===subitem.name?'active':''} \${subitem.class || ''}" $onclick="this.clickSubitem(subitem,event)">
											<i $if="subitem.icon" $class="bi bi-\${subitem.icon} me-2 d-inline-block" style="width:1em;"></i><span $text="subitem.label"></span>
											</button>
										</template>
										<template $if="subitem.type==='switch'">
											<div $class="d-flex align-items-center px-2 py-2 \${subitem.class || ''}">
											<i $if="subitem.icon" $class="bi bi-\${subitem.icon} me-2 d-inline-block" style="width:1em;"></i><span $text="subitem.label"></span><div class="flex-fill"></div>
												<div class="form-switch ms-2"><input class="form-check-input" type="checkbox" $bind="subitem.bind[subitem.name]"></div>
											</div>
										</template>
									</template>
								</div>
							</template>
						</div>
					</template>
					<template $if="!this.vertical">
						<div class="dropdown">
							<button type="button" $class="nav-link \${item.caret===false?'':'dropdown-toggle'} \${item.class || ''}" data-bs-toggle="dropdown" data-bs-auto-close="outside" $aria-label="item.label || item.name">
								<i aria-hidden="true" $if="item.icon" $class="bi bi-\${item.icon}"></i><span $if="item.label" $class="''" $text="item.label"></span>
							</button>
							<div class="dropdown-menu p-2 bg-body shadow" $class="item.align==='start'?'dropdown-menu-start':'dropdown-menu-end'" $style="'width: ' + (item.width || 250) + 'px; z-index: 1080;'">
								<template $each="item.items || item.list" as="subitem">
									<template $if="subitem.type==='label'">
										<div $class="dropdown-header \${subitem.class || ''}" $text="subitem.label"></div>
									</template>
									<template $if="subitem.type==='button'">
										<button type="button" $disabled="subitem.disabled" $aria-current="this.state.value===subitem.name?'page':'false'" $aria-label="subitem.label || subitem.name" $class="dropdown-item \${this.state.value===subitem.name?'active':''} \${subitem.class || ''}" $onclick="this.clickSubitem(subitem,event)">
											<i aria-hidden="true" $if="subitem.icon" $class="bi bi-\${subitem.icon} me-2 d-inline-block" style="width:1em;"></i><span $text="subitem.label"></span>
										</button>
									</template>
									<template $if="subitem.type==='switch'">
										<div $class="d-flex align-items-center px-3 py-2 \${subitem.class || ''}">
											<i $if="subitem.icon" $class="bi bi-\${subitem.icon} me-2 d-inline-block" style="width:1em;"></i><span $text="subitem.label"></span><div class="flex-fill"></div>
												<div class="form-switch ms-2"><input class="form-check-input" type="checkbox" $bind="subitem.bind[subitem.name]"></div>
										</div>
									</template>
								</template>
							</div>
						</div>
					</template>
				</template>
			</div>
		</template>

      <div data-nav-more class="dropdown nav-overflow flex-shrink-0" $data-nav-hidden="this.state.overflowIndices.length?'false':'true'" $aria-hidden="this.state.overflowIndices.length?'false':'true'">
       <button type="button" class="btn btn-link text-body" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-label="{#More navigation#}" aria-expanded="false" $class="this.overflowActive()?'fw-semibold':''"><i class="bi bi-three-dots" aria-hidden="true"></i></button>
       <div class="dropdown-menu dropdown-menu-end p-2 bg-body shadow">
        <template $each="this.overflowMenu()" as="overflowEntry" key="key"><div $data-nav-menu-index="overflowEntry.index" $.hidden="!this.isOverflow(overflowEntry.index)">
         <div $if="overflowEntry.item.type==='label'" class="dropdown-header" $text="overflowEntry.item.label"></div>
         <button $if="overflowEntry.item.type==='button'" type="button" class="dropdown-item" $class="this.state.value===overflowEntry.item.name?'active':''" $disabled="overflowEntry.item.disabled" $aria-label="overflowEntry.item.label||overflowEntry.item.name" $aria-current="this.state.value===overflowEntry.item.name?'page':'false'" $onclick="this.click(overflowEntry.item,false,event)"><i aria-hidden="true" $if="overflowEntry.item.icon" $class="'bi bi-'+overflowEntry.item.icon+' me-2'"></i><span $text="overflowEntry.item.label||overflowEntry.item.name"></span></button>
         <label $if="overflowEntry.item.type==='switch'" class="dropdown-item d-flex align-items-center gap-2"><input class="form-check-input mt-0" type="checkbox" $bind="overflowEntry.item.bind[overflowEntry.item.name]"><span $text="overflowEntry.item.label"></span></label>
        </div></template>
       </div>
      </div>
	</div>
</div>
`), globalThis.Util.makeDom(/*html*/`<style>
	Nav {min-width:0;min-height:0;max-width:100%;}
    Nav [data-nav-items] {min-width:0;position:relative;}
    Nav [data-nav-hidden="true"] {position:absolute !important;visibility:hidden;pointer-events:none;inset:0 auto auto -10000px;}
    Nav .nav-entry {width:max-content;}
    Nav [slot-id="tools-end"] {width:max-content;}
    Nav .nav-overflow .dropdown-menu {max-width:calc(100vw - 1rem);max-height:min(70dvh,32rem);overflow:auto;}
    Nav.nav-rail .nav-link > span {display:none;}
    Nav.nav-rail .nav-link {justify-content:center;}
    Nav.nav-bar [data-nav-items] {width:100%;}
    Nav.nav-bar .nav-entry {flex:1 1 0%;width:auto;min-width:0;}
    Nav.nav-bar .nav-link {flex-direction:column;gap:.125rem;width:100%;padding-inline:var(--ui-tool-space);}
    Nav.nav-bar .nav-link > span {font-size:.8em;}
    Nav.nav-bar [data-nav-more] {display:none;}
    Nav .nav-link {white-space:nowrap;color:var(--bs-body-color);}
    Nav .nav-link.active, Nav .dropdown-item.active {
		background: rgba(var(--bs-secondary-rgb), .18) !important;
		color: inherit !important;
		font-weight: 600;
	}
	Nav .nav-link { display:flex;align-items:center;gap:var(--ui-gap,.5rem);border-radius: .5rem; font-size:var(--ui-item-font,1rem);padding:var(--ui-item-y,.5rem) var(--ui-item-x,1rem); }
	Nav .dropdown-item.active { border-radius: .375rem; }
</style>`))
