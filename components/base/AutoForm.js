/**
 * AutoForm Core Component
 */

const AUTOFORM_BLUEPRINT = globalThis.Util.makeDom(/*html*/`
<div class="auto-form-root d-block">
  <div class="alert alert-danger" role="alert" $if="Object.keys(this.state.errors || {}).length">
    <ul class="mb-0 ps-3"><li $each="Object.entries(this.state.errors || {})" as="failure"><button type="button" class="btn btn-link text-danger text-start p-0" $onclick="this.focusField(failure[0])" $text="failure[1]"></button></li></ul>
  </div>
  <p role="status" $if="this.state.validating" class="text-body-secondary">{#Validating#}…</p>
  <form $class="this.state._columnsLayout ? 'auto-form-sections d-flex flex-column' : (this.inline ? 'd-flex flex-wrap align-items-center gap-3' : (this.vertical ? 'd-flex flex-column' : (this.horizontal ? 'auto-grid-form forced-horizontal' : 'auto-grid-form')))" $onsubmit="event.stopPropagation();event.preventDefault();this.submit()">

  <template $each="this.state._sections || []" as="section">
  <template $$if="section.if || 'true'">
  <fieldset class="border-0 p-0 m-0" $style="this.state._columnsLayout ? 'min-width:0' : 'display:contents'">
  <legend class="h6 float-none border-bottom pb-2 mb-3" $if="section.label" $text="section.label"></legend>
  <div data-form-section $class="this.state._columnsLayout ? 'auto-form-columns' : ''" $style="this.state._columnsLayout ? '--auto-form-columns:'+this.columnsFor(section) : 'display:contents'">
  <template $each="section.groups" as="group">
    <template $$if="group.root.if || 'true'">
    <template $if="group.root.type === 'divider'">
      <div style="grid-column:1/-1" class="pt-2 pb-1"><hr class="my-2"><div $if="group.root.label" $text="group.root.label" class="small fw-semibold text-muted text-uppercase"></div></div>
    </template>
    <template $if="group.root.type !== 'divider'">
    <div data-form-field $class="this.state._columnsLayout ? 'auto-form-field'+(this.horizontal?' auto-form-field-horizontal':'') : ''" $style="this.state._columnsLayout ? 'grid-column:span '+this.spanFor(group.root,section) : 'display:contents'">
        <label $for="this.controlID(group.root)" $name="group.root.name" $class="this.inline ? 'mb-0 text-muted text-nowrap '+(this.sm?'small':'') : (this.state._columnsLayout ? 'form-label text-body-secondary text-break '+(this.sm?'small':'') : 'col-form-label text-muted '+(this.sm?'col-form-label-sm':''))" $text="group.root.label"></label>
        <div control-wrapper $class="(this.inline || this.state._columnsLayout ? '' : 'mb-3 ')+'d-flex align-items-center gap-2'">
          <template $each="group.items" as="item">
          <template $$if="item.if || 'true'">
          <div control-item style="display:contents">
          <template $if="['text', 'password', 'email', 'number', 'date', 'datetime', 'file'].includes(item.type)"><input $name="item.name" $type="item.type === 'datetime' ? 'datetime-local' : item.type" $.="item.setting || {}" $id="this.controlID(item)" $$readonly="typeof item.setting?.readonly === 'string' ? item.setting.readonly : !!item.setting?.readonly" $$disabled="typeof item.setting?.disabled === 'string' ? item.setting.disabled : !!item.setting?.disabled" $$required="typeof item.setting?.required === 'string' ? item.setting.required : !!item.setting?.required" $bind="this.state.data[item.name]" $class="form-control \${this.sm ? 'form-control-sm' : ''} \${item.type === 'number' ? 'text-end' : ''}"></template>

          <template $if="item.type === 'select'"><select $name="item.name" $.="item.setting || {}" $id="this.controlID(item)" $$disabled="typeof item.setting?.disabled === 'string' ? item.setting.disabled : !!item.setting?.disabled" $$required="typeof item.setting?.required === 'string' ? item.setting.required : !!item.setting?.required" $bind="this.state.data[item.name]" $class="form-select \${this.sm ? 'form-select-sm' : ''}">
              <option value="" $if="item.placeholder" $text="item.placeholder" disabled selected></option>
              <option $$each="item.options" as="opt" $value="opt.value !== undefined ? opt.value : opt" $text="opt.label || opt"></option>
          </select></template>

          <template $if="['checkbox', 'radio'].includes(item.type)"><div class="d-flex align-items-center flex-wrap gap-3 px-3">
              <label $each="item.options || [item.text||item.label||item.name]" as="opt" index="optionIndex" class="form-check mb-0 d-flex align-items-center" style="padding-left:0; cursor:pointer;">
                  <input $name="item.name" class="form-check-input m-0 me-2" style="float:none;" $type="item.type" $.="item.setting || {}" $id="this.controlID(item, optionIndex)" $$disabled="typeof item.setting?.disabled === 'string' ? item.setting.disabled : !!item.setting?.disabled" $$required="typeof item.setting?.required === 'string' ? item.setting.required : !!item.setting?.required" $value="item.options ? (opt.value !== undefined ? opt.value : opt) : 'on'" $bind="this.state.data[item.name]">
                  <span $if="!this.inline || (item.options && item.options.length > 0)" $text="opt.label || opt" class="form-check-label"></span>
              </label>
          </div></template>

          <template $if="item.type === 'switch'"><div class="form-check form-switch d-flex align-items-center m-0 px-3">
              <input $name="item.name" class="form-check-input m-0" style="float:none; cursor:pointer" type="checkbox" $.="item.setting || {}" $id="this.controlID(item)" $$disabled="typeof item.setting?.disabled === 'string' ? item.setting.disabled : !!item.setting?.disabled" $bind="this.state.data[item.name]">
          </div></template>

          <template $if="item.type === 'textarea'"><textarea $name="item.name" $class="form-control \${this.sm ? 'form-control-sm' : ''}" $.="item.setting || {}" $id="this.controlID(item)" $$readonly="typeof item.setting?.readonly === 'string' ? item.setting.readonly : !!item.setting?.readonly" $$disabled="typeof item.setting?.disabled === 'string' ? item.setting.disabled : !!item.setting?.disabled" $$required="typeof item.setting?.required === 'string' ? item.setting.required : !!item.setting?.required" $bind="this.state.data[item.name]"></textarea></template>


          <template $if="item.type === 'label'"><span $name="item.name" $.="item.setting || {}" $id="this.controlID(item)" $text="item.value ?? this.state.data[item.name] ?? ''" class="form-control-plaintext text-break py-1"></span></template>
          </div>
          </template>
          </template>
          <template $each="group.items" as="fieldError"><span class="invalid-feedback d-block" $if="this.state.errors?.[fieldError.name]" $text="this.state.errors?.[fieldError.name]"></span></template>
        </div>
    </div>
    </template>
    </template>
  </template>
  </div>
  </fieldset>
  </template>
  </template>

  <div $class="\${this.inline ? '' : 'd-flex justify-content-end align-items-baseline gap-3 mt-2'}" $style="\${this.inline ? '' : 'grid-column:1/-1'}">
      <div slot-id="actions"></div>
      <button $if="!this.nobutton" type="submit" $class="btn btn-primary \${this.sm ? 'btn-sm' : ''}" $text="this.submitlabel || '{#Submit#}'"></button>
  </div>
  </form>
</div>
`)

const AUTOFORM_STYLE = globalThis.Util.makeDom(/*html*/`<style>
        AutoForm { container-type:inline-size; }
        AutoForm .auto-form-sections { gap:var(--ui-section-gap,1.5rem); }
        AutoForm .auto-form-columns { display:grid; grid-template-columns:repeat(var(--auto-form-columns,1),minmax(0,1fr)); gap:var(--ui-field-gap,1rem) var(--ui-column-gap,1.5rem); }
        AutoForm .auto-form-field { min-width:0; }
        AutoForm .auto-form-field > [control-wrapper], AutoForm .auto-form-field > [control-wrapper] > * { min-width:0; }
        AutoForm .auto-form-field-horizontal { display:grid; grid-template-columns:fit-content(40%) minmax(0,1fr); align-items:center; gap:0 1rem; }
        AutoForm .auto-form-field-horizontal > label { margin-bottom:0; }
        .auto-grid-form { display: block; }
        .auto-grid-form .col-form-label { display:flex; align-items:center; justify-content:flex-start; text-align:left; margin-bottom:0.25rem; padding:0; }

        @media (min-width: 576px) {
                .auto-grid-form { display: grid; grid-template-columns: max-content 1fr; gap: 0 1.5rem; }
                .auto-grid-form .col-form-label { justify-content:flex-end; text-align:right; margin-bottom:1rem; max-width:200px; }
        }

        .auto-grid-form.forced-horizontal { display: grid !important; grid-template-columns: max-content 1fr !important; gap: 0 1.5rem !important; }
        .auto-grid-form.forced-horizontal .col-form-label { justify-content:flex-end !important; text-align:right !important; margin-bottom:1rem !important; max-width:200px !important; }
@container(max-width:35.99rem) {
  AutoForm .auto-grid-form, AutoForm .auto-grid-form.forced-horizontal { display:block !important; }
  AutoForm .auto-grid-form .col-form-label, AutoForm .auto-grid-form.forced-horizontal .col-form-label { justify-content:flex-start !important;text-align:left !important;max-width:none !important;margin-bottom:.25rem !important; }
  AutoForm .auto-form-field-horizontal {display:block;}
  AutoForm .auto-form-field-horizontal > label {margin-bottom:.5rem;}
}
</style>`)

const DB_FORM_TYPE_MAP = {
	i: 'number', ui: 'number', bi: 'number', ubi: 'number', ti: 'number', f: 'number', ff: 'number',
	b: 'switch', d: 'date', dt: 'datetime', t: 'textarea'
};

const getDbFormType = type => DB_FORM_TYPE_MAP[type] || 'text';

// Database field definitions are converted only for rendering. Form data keeps
// its original keys, so submitting an AutoForm still returns the API row shape.
const withPlaceholder = field => field?.placeholder == null ? field : {
	...field,
	setting: { ...(field.setting || {}), placeholder: field.placeholder }
};

const normalizeSchemaItem = field => {
	if (!field?.tableID) return withPlaceholder(field);
	const settings = field.settings || {};
	return withPlaceholder({
		...field,
		name: field.name,
		label: settings.label ?? field.label ?? field.name,
		type: settings.type ?? getDbFormType(field.type),
		options: settings.options ?? field.options,
		placeholder: settings.placeholder ?? field.placeholder,
		setting: settings.attrs ?? field.setting,
		if: settings.if ?? field.if
	});
};

const groupSchemaItems = fields => {
	const groups = [];
	const roots = new Map();
	for (const item of fields) {
		const target = item?.appendTo && roots.get(item.appendTo);
		if (target) {
			target.items.push(item);
			continue;
		}
		const group = { root: item, items: [item] };
		groups.push(group);
		if (item?.name && !item.appendTo && item.type !== 'divider') roots.set(item.name, group);
		else if (item?.appendTo) console.warn(`AutoForm appendTo target must be a preceding root field: ${item.appendTo}`);
	}
	return groups;
};

// Layout groups only organize fields; they never create nested data owners.
const formColumnCount = value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 4 ? Number(value) : 1
const sectionSchemaItems = fields => {
	const sections = []
	let pending = []
	const flush = () => { if (pending.length) sections.push({ groups: groupSchemaItems(pending) }); pending = [] }
	for (const field of fields) {
		if (field.type !== 'group') { pending.push(field); continue }
		flush()
		if (!Array.isArray(field.items)) throw new TypeError('AutoForm group requires an items array')
		const children = field.items.map(normalizeSchemaItem)
		if (children.some(item => item.type === 'group')) throw new TypeError('AutoForm groups cannot be nested; use sibling groups')
		sections.push({ label: field.label, if: field.if, columns: field.columns, groups: groupSchemaItems(children) })
	}
	flush()
	return sections
}

globalThis.Component.register('AutoForm', container => {
	const controlPrefix = 'autoform-' + UUID.make()
	container.controlID = (item, optionIndex = 0) => {
		const id = String(item.setting?.id || controlPrefix + '-' + encodeURIComponent(item.name))
		return optionIndex ? id + '-' + optionIndex : id
	}
	if (!Array.isArray(container.state.schema)) container.state.schema = []
	container.state.columns ??= formColumnCount(container.getAttribute('columns') ?? 1)
	container.state._capacity = 1
	const layoutMode = () => {
		const fields = container.state.schema || []
		const requested = container.hasAttribute('columns') || formColumnCount(container.state.columns) > 1 || fields.some(field => field.type === 'group' || field.colspan != null)
		if (container.hasAttribute('inline') && requested) throw new TypeError('AutoForm inline cannot be combined with columns, groups or colspan')
		container.state._columnsLayout = requested
	}
	container.columnsFor = section => Math.min(formColumnCount(section.columns ?? container.state.columns), container.state._capacity)
	container.spanFor = (field, section) => {
		const columns = container.columnsFor(section)
		return field.colspan === 'full' ? columns : Math.min(columns, Math.max(1, Number.isInteger(field.colspan) ? field.colspan : 1))
	}
	const setSchema = schema => {
		const fields = Array.isArray(schema) ? schema.map(normalizeSchemaItem) : [];
		container.state._sections = sectionSchemaItems(fields)
		layoutMode()
	};
	container.state.__watch('schema', setSchema)
	setSchema(container.state.schema)
	container.state.__watch('columns', layoutMode)
	const measure = () => {
		// About 18rem per field plus Bootstrap's 1.5rem column gap, measured in
		// the actual embedding region rather than the browser viewport.
		const unit = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
		const css = getComputedStyle(container)
		const length = (name, fallback) => { const value=css.getPropertyValue(name).trim(); return value ? parseFloat(value)*(value.endsWith('rem')?unit:1) : fallback }
		const gap=length('--ui-column-gap',1.5*unit), field=length('--ui-field-min',18*unit)
		const capacity = Math.max(1, Math.min(4, Math.floor((container.clientWidth + gap)/(field+gap))))
		if (container.state._capacity !== capacity) container.state._capacity = capacity
	}
	let layoutFrame
	const observer = new ResizeObserver(() => {
		cancelAnimationFrame(layoutFrame)
		layoutFrame = requestAnimationFrame(measure)
	})
	observer.observe(container)
	globalThis.DOMDisposer.add(container, () => { observer.disconnect(); cancelAnimationFrame(layoutFrame) })
	measure()
	if (globalThis.Bootstrap?.observeDensity) DOMDisposer.add(container, Bootstrap.observeDensity(container, measure))

	const ensureProxy = v => (v && typeof v === 'object' && !v.__isProxy) ? globalThis.NewState(v) : v;
	const setData = value => {
		const data = ensureProxy(value || {})
		container.data = data
		if (container.state.data !== data) container.state.data = data
	}
	container.state.__watch('data', setData)
	setData(container.state.data)

	container.vertical = container.hasAttribute('vertical')
	container.horizontal = container.hasAttribute('horizontal')
	container.inline = container.hasAttribute('inline')
	container.sm = container.hasAttribute('sm')
	container.nobutton = container.hasAttribute('nobutton')
	container.submitlabel = container.getAttribute('submitlabel') || ''
	container.request = { method: 'POST' }
	container.response = {}
	container.result = null
	container.addEventListener('change', event => {
		if (event.target?.tagName !== 'SELECT') return
		if (event.target.name) container.data[event.target.name] = event.target.value
		setTimeout(() => container.querySelectorAll('select[name]').forEach(select => {
			if (select.value !== String(container.data[select.name] ?? '')) container.data[select.name] = select.value
		}))
	})

	container.form = globalThis.$(container, 'form')
	container.state.errors ??= {}
	container.state.validating = false
	let validationVersion = 0, submitting = false
	container.setErrors = errors => {
		const clean = {}
		for (const [name, message] of Object.entries(errors || {})) {
			if (typeof message === 'string' && message.trim()) Object.defineProperty(clean, name, {value:message, enumerable:true})
		}
		container.state.errors = clean
	}
	container.focusField = name => {
		const control = Array.from(container.form.elements).find(node => node.name === name && node.getClientRects().length && !node.disabled)
		if (control) { control.focus(); return true }
		container.dispatchEvent(new CustomEvent('revealfield', {detail:{name}, bubbles:false}))
		return false
	}
	const invalidateValidation = () => { validationVersion++; container.state.validating = false }
	DOMDisposer.add(container, invalidateValidation)
	container.addEventListener('input', invalidateValidation)
	container.addEventListener('change', invalidateValidation)
	container.addEventListener('changed', invalidateValidation)
	container.validate = async () => {
		const version = ++validationVersion
		container.setErrors({})
		if (!container.form.reportValidity()) return false
		if (typeof container.validator !== 'function') return true
		const snapshot = JSON.stringify(container.data)
		container.state.validating = true
		try {
			// Validate the complete draft, including fields absent from the DOM.
			const errors = await container.validator(JSON.parse(snapshot))
			if (version !== validationVersion || snapshot !== JSON.stringify(container.data)) return false
			container.setErrors(errors)
			const first = Object.keys(container.state.errors)[0]
			if (first) container.focusField(first)
			return !first
		} catch (_) {
			if (version === validationVersion && snapshot === JSON.stringify(container.data)) container.setErrors({_form:'Validation failed. Please retry.'})
			return false
		} finally {
			if (version === validationVersion) container.state.validating = false
		}
	}
	container.submit = async (opt = {}) => {
		if (submitting) return false
		submitting = true
		try {
		// Native validation identifies/focuses the field. A bottom-corner toast can
		// cover a fixed Save action and hover there indefinitely while retrying.
		if (!await container.validate()) return false
		if (!container.dispatchEvent(new CustomEvent('submit', { detail: container.data, cancelable: true, bubbles: false }))) return
		const req = { ...container.request, data: container.data, noui: true, ...opt }
		let task = null
		if (container.api) task = container.api.do(req)
		else if (container.request.url) task = globalThis.HTTP.request(req)
		else return console.warn('{#please config .api or .request.url to auto submit#}')
		await task.then(resp => {
			container.response = resp
			container.result = resp.result
			if (resp.result !== null && typeof resp.result === 'object' && resp.result.error) throw new Error(resp.result.error)
			container.dispatchEvent(new CustomEvent('response', { detail: resp, bubbles: false }))
		}).catch(err => {
			globalThis.Toast?.show(err.message, { type: 'danger' })
			container.dispatchEvent(new CustomEvent('error', { detail: err, bubbles: true }))
		})
		} finally { submitting = false }
	}

}, AUTOFORM_BLUEPRINT, AUTOFORM_STYLE)

const findAnchorInBlueprint = (root) => {
	let f = root.querySelector('[control-item]');
	if (f) return f;
	for (const t of root.querySelectorAll('template')) {
		f = findAnchorInBlueprint(t.content); if (f) return f;
	}
	return null;
}

const AutoForm = {
	customTypes: [],
	register: (name, typeName) => {
		const type = typeName || name
		if (!AutoForm.customTypes.find(t => t.name === name)) {
			AutoForm.customTypes.push({ name, typeName: type })
			AutoForm._addAutoFormComponent(name, type)
		}
	},
	_addAutoFormComponent: (name, type) => {
		const wrapper = findAnchorInBlueprint(AUTOFORM_BLUEPRINT)
		if (wrapper) {
			const toolbar = name === 'CodeEditor' ? ' $$toolbar="item.setting?.toolbar !== false"' : ''
			const node = globalThis.Util.makeDom(`<template $if="item.type?.toLowerCase() === '${type.toLowerCase()}'"><${name} $name="item.name" $.="item.setting || {}" $id="thisNode.closest('AutoForm').controlID(item)" $.options="item.options || []"${toolbar} $bind="thisNode.closest('AutoForm').data[item.name]" class="w-100"></${name}></template>`)
			wrapper.appendChild(node)
		}
	}
}

globalThis.AutoForm = AutoForm;
