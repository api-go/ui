/**
 * Nav Component Module
 */
globalThis.Component.register('Nav', container => {
	container.vertical = container.hasAttribute('vertical')
	container.state.openName = container.state.openName || null
	container.state.value = container.state.value || null

	container.addEventListener('bind', e => {
		container.state.value = e.detail
	})

	container.click = (item, noselect) => {
		const selected = !item.noselect && !noselect
		if (selected) {
			container.state.value = item.name
			container.dispatchEvent(new CustomEvent('change', { detail: item.name, bubbles: false }))
		}
		container.dispatchEvent(new CustomEvent('nav', { detail: { item, name: item.name, selected }, bubbles: false }))
	}
	container.clickSubitem = item => {
		container.click(item)
	}
	container.toggleGroup = item => {
		container.state.openName = container.state.openName === item.name ? null : item.name
		container.dispatchEvent(new CustomEvent('nav', { detail: { item, name: item.name, open: container.state.openName === item.name, selected: false }, bubbles: false }))
	}
}, globalThis.Util.makeDom(/*html*/`
<div $class="\${this.vertical ? 'd-flex flex-column border-end h-100 align-self-stretch overflow-visible' : 'navbar navbar-expand border-bottom'} bg-body-secondary px-2 \${this.vertical ? 'py-3' : 'py-1'} align-items-center \${this.vertical ? 'align-items-start' : ''}" $style="this.vertical ? 'min-height:0;' : ''">
	<div class="d-flex align-items-center gap-2">
        <template $if="this.state?.brand?.image">
                <img $src="this.state.brand.image" $class="\${this.vertical ? 'mb-2' : 'mx-1'}" style="height:30px;width:auto;max-width:300px">
        </template>
        <template $if="this.state?.brand?.icon">
                <i $class="bi bi-\${this.state.brand.icon} \${this.vertical ? 'mb-2' : 'mx-1'}"></i>
        </template>
        <template $if="this.state?.brand?.label">
                <span $class="\${this.vertical ? 'mb-2 fw-bold' : 'mx-1'}" style="transform: translateY(3px);" $text="this.state.brand.label"></span>
        </template>
	</div>
	<div $class="d-flex \${this.vertical ? 'w-100 flex-fill mt-2 flex-column' : 'ms-2 align-items-center flex-fill'}" $style="this.vertical ? 'min-height:0; overflow-y:auto; overflow-x:visible;' : ''">
		<template $each="this.state?.list || []">
				<div $class="\${this.vertical ? 'nav nav-pills flex-column w-100 position-relative' : 'navbar-nav flex-row align-items-center'} \${!this.vertical && item.type==='fill' ? 'flex-fill' : ''}">
			<template $if="item.type==='label'">
				<div $class="\${this.vertical ? 'small text-uppercase text-body-secondary fw-semibold px-2 py-1 mt-2' : 'navbar-text small text-uppercase text-body-secondary fw-semibold px-2'} \${item.class || ''}" $text="item.label"></div>
			</template>
			<template $if="item.type==='button'">
				<button $class="nav-link \${this.state.value===item.name?'active':''} \${this.vertical ? 'w-100 text-start py-1 px-2' : ''} \${item.class || ''}" $onclick="this.click(item)">
						<i $class="bi bi-\${item.icon} me-2"></i><span $class="\${this.vertical ? 'text-truncate' : 'd-none d-' + (this.state?.list?.length>5?'lg':'md') + '-inline'}" $text="item.label"></span>
				</button>
				</template>
				<template $if="item.type==='dropdown'">
					<template $if="this.vertical">
						<div class="w-100">
							<button type="button" $class="nav-link w-100 text-start py-1 px-2 d-flex align-items-center justify-content-between \${item.class || ''}" $onclick="this.toggleGroup(item)">
								<span class="d-inline-flex align-items-center">
									<i $class="bi bi-\${item.icon} me-2"></i><span class="text-truncate" $text="item.label"></span>
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
											<button $class="nav-link w-100 text-start py-1 px-2 \${this.state.value===subitem.name?'active':''} \${subitem.class || ''}" $onclick="this.clickSubitem(subitem)">
												<i $class="bi bi-\${subitem.icon} me-2 d-inline-block" style="width: 16px;"></i><span $text="subitem.label"></span>
											</button>
										</template>
										<template $if="subitem.type==='switch'">
											<div $class="d-flex align-items-center px-2 py-2 \${subitem.class || ''}">
												<i $class="bi bi-\${subitem.icon} me-2 d-inline-block" style="width: 16px;"></i><span $text="subitem.label"></span><div class="flex-fill"></div>
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
							<button type="button" $class="nav-link dropdown-toggle \${item.class || ''}" data-bs-toggle="dropdown">
								<i $class="bi bi-\${item.icon} me-2"></i><span $class="'d-none d-' + (this.state?.list?.length>5?'lg':'md') + '-inline'" $text="item.label"></span>
							</button>
							<div class="dropdown-menu dropdown-menu-end p-2 bg-body-secondary shadow" $style="'width: ' + (item.width || 250) + 'px; z-index: 1080;'">
								<template $each="item.items || item.list" as="subitem">
									<template $if="subitem.type==='label'">
										<div $class="dropdown-header \${subitem.class || ''}" $text="subitem.label"></div>
									</template>
									<template $if="subitem.type==='button'">
										<button $class="dropdown-item \${this.state.value===subitem.name?'active':''} \${subitem.class || ''}" $onclick="this.clickSubitem(subitem)">
											<i $class="bi bi-\${subitem.icon} me-2 d-inline-block" style="width: 16px;"></i><span $text="subitem.label"></span>
										</button>
									</template>
									<template $if="subitem.type==='switch'">
										<div $class="d-flex align-items-center px-3 py-2 \${subitem.class || ''}">
											<i $class="bi bi-\${subitem.icon} me-2 d-inline-block" style="width: 16px;"></i><span $text="subitem.label"></span><div class="flex-fill"></div>
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
	</div>
</div>
`))
