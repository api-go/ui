/**
 * AutoForm Core Component
 */

const AUTOFORM_BLUEPRINT = globalThis.Util.makeDom(/*html*/`
<div class="auto-form-root">
  <form $class="\${this.inline ? 'd-flex flex-wrap align-items-center gap-3' : (this.vertical ? 'd-flex flex-column' : (this.horizontal ? 'auto-grid-form forced-horizontal' : 'auto-grid-form'))}" $onsubmit="event.stopPropagation();event.preventDefault();this.submit()">

  <template $each="this.state._schema || []">
    <template $$if="item.if || 'true'">
    <template $if="item.type === 'divider'">
      <div style="grid-column:1/-1" class="pt-2 pb-1"><hr class="my-2"><div $if="item.label" $text="item.label" class="small fw-semibold text-muted text-uppercase"></div></div>
    </template>
    <template $if="item.type !== 'divider'">
    <div style="display:contents">
        <label $name="item.name" $class="\${this.inline ? 'mb-0 text-muted text-nowrap' : 'col-form-label text-muted'}" $text="item.label"></label>
        <div control-wrapper $class="\${this.inline ? 'd-flex align-items-center' : 'mb-3 d-flex align-items-center'}">
          <template $if="['text', 'password', 'email', 'number', 'date', 'datetime', 'file'].includes(item.type)"><input $name="item.name" $type="item.type" $.="item.setting || {}" $$readonly="typeof item.setting?.readonly === 'string' ? item.setting.readonly : !!item.setting?.readonly" $$disabled="typeof item.setting?.disabled === 'string' ? item.setting.disabled : !!item.setting?.disabled" $$required="typeof item.setting?.required === 'string' ? item.setting.required : !!item.setting?.required" $bind="this.state.data[item.name]" $class="form-control \${item.type === 'number' ? 'text-end' : ''}"></template>

          <template $if="item.type === 'select'"><select $name="item.name" $.="item.setting || {}" $$disabled="typeof item.setting?.disabled === 'string' ? item.setting.disabled : !!item.setting?.disabled" $$required="typeof item.setting?.required === 'string' ? item.setting.required : !!item.setting?.required" $bind="this.state.data[item.name]" class="form-select">
              <option value="" $if="item.placeholder" $text="item.placeholder" disabled selected></option>
              <option $each="item.options" as="opt" $value="opt.value !== undefined ? opt.value : opt" $text="opt.label || opt"></option>
          </select></template>

          <template $if="['checkbox', 'radio'].includes(item.type)"><div class="d-flex align-items-center flex-wrap gap-3 h-100" style="padding: 0 0.75rem; min-height: calc(2.25rem + 2px);">
              <label $each="item.options || [item.text||item.label||item.name]" as="opt" class="form-check mb-0 d-flex align-items-center" style="padding-left:0; cursor:pointer;">
                  <input $name="item.name" class="form-check-input m-0 me-2" style="float:none;" $type="item.type" $.="item.setting || {}" $$disabled="typeof item.setting?.disabled === 'string' ? item.setting.disabled : !!item.setting?.disabled" $$required="typeof item.setting?.required === 'string' ? item.setting.required : !!item.setting?.required" $value="item.options ? (opt.value !== undefined ? opt.value : opt) : 'on'" $bind="this.state.data[item.name]">
                  <span $if="!this.inline || (item.options && item.options.length > 0)" $text="opt.label || opt" class="form-check-label"></span>
              </label>
          </div></template>

          <template $if="item.type === 'switch'"><div class="form-check form-switch fs-5 d-flex align-items-center m-0" style="padding: 0 0.75rem; min-height: calc(2.25rem + 2px); display:flex !important;">
              <input $name="item.name" class="form-check-input m-0" style="float:none; cursor:pointer" type="checkbox" $.="item.setting || {}" $$disabled="typeof item.setting?.disabled === 'string' ? item.setting.disabled : !!item.setting?.disabled" $bind="this.state.data[item.name]">
          </div></template>

          <template $if="item.type === 'textarea'"><textarea $name="item.name" class="form-control" $.="item.setting || {}" $$readonly="typeof item.setting?.readonly === 'string' ? item.setting.readonly : !!item.setting?.readonly" $$disabled="typeof item.setting?.disabled === 'string' ? item.setting.disabled : !!item.setting?.disabled" $$required="typeof item.setting?.required === 'string' ? item.setting.required : !!item.setting?.required" $bind="this.state.data[item.name]"></textarea></template>


          <template $if="item.type === 'label'"><span $name="item.name" $.="item.setting || {}" $text="item.value ?? this.state.data[item.name] ?? ''" class="form-control-plaintext text-break py-1"></span></template>
        </div>
    </div>
    </template>
    </template>
  </template>

  <div $class="\${this.inline ? '' : 'd-flex justify-content-end align-items-baseline gap-3 mt-2'}" $style="\${this.inline ? '' : 'grid-column:1/-1'}">
      <div slot-id="actions"></div>
      <button $if="!this.nobutton" type="submit" class="btn btn-primary" $text="this.submitlabel || '{#Submit#}'"></button>
  </div>
  </form>
</div>
`)

const AUTOFORM_STYLE = globalThis.Util.makeDom(/*html*/`<style>
        .auto-grid-form { display: block; }
        .auto-grid-form .col-form-label { text-align: left; margin-bottom: 0.25rem; padding-top: 0; }

        @media (min-width: 576px) {
                .auto-grid-form { display: grid; grid-template-columns: max-content 1fr; gap: 0 1.5rem; }
                .auto-grid-form .col-form-label { text-align: right; margin-bottom: 1rem; padding-right: 0; max-width: 200px; padding-top: calc(0.375rem + 1px); }
        .auto-grid-form [control-wrapper] { min-height: calc(2.25rem + 2px); }
        }

        .auto-grid-form.forced-horizontal { display: grid !important; grid-template-columns: max-content 1fr !important; gap: 0 1.5rem !important; }
        .auto-grid-form.forced-horizontal .col-form-label { text-align: right !important; margin-bottom: 1rem !important; padding-right: 0 !important; max-width: 200px !important; padding-top: calc(0.375rem + 1px) !important; }
    .auto-grid-form.forced-horizontal [control-wrapper] { min-height: calc(2.25rem + 2px) !important; }

    .auto-form-root .form-check-input { width: 1.2em; height: 1.2em; }
    .auto-form-root .form-switch .form-check-input { width: 2em; }
</style>`)

const DB_FORM_TYPE_MAP = {
        i: 'number', ui: 'number', bi: 'number', ubi: 'number', ti: 'number', f: 'number', ff: 'number',
        b: 'switch', d: 'date', dt: 'datetime', t: 'textarea'
};

const getDbFormType = type => DB_FORM_TYPE_MAP[type] || 'text';

// Database field definitions are converted only for rendering. Form data keeps
// its original keys, so submitting an AutoForm still returns the API row shape.
const normalizeSchemaItem = field => {
        if (!field?.tableID) return field;
        const settings = field.settings || {};
        return {
                ...field,
                name: field.name,
                label: settings.label ?? field.label ?? field.name,
                type: settings.type ?? getDbFormType(field.type),
                options: settings.options ?? field.options,
                placeholder: settings.placeholder ?? field.placeholder,
                setting: settings.attrs ?? field.setting,
                if: settings.if ?? field.if
        };
};

globalThis.Component.register('AutoForm', container => {
        if (!Array.isArray(container.state.schema)) container.state.schema = []
        const setSchema = schema => {
                container.state._schema = Array.isArray(schema) ? schema.map(normalizeSchemaItem) : [];
        };
        container.state.__watch('schema', setSchema)
        setSchema(container.state.schema)

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
    container.nobutton = container.hasAttribute('nobutton')
    container.submitlabel = container.getAttribute('submitlabel') || ''
        container.request = { method: 'POST' }
        container.response = {}
        container.result = null

        container.form = globalThis.$(container, 'form')
        container.submit = (opt = {}) => {
                if (!container.form.reportValidity()) return globalThis.Toast?.show('{#verify failed#}', { type: 'danger' })
                if (!container.dispatchEvent(new CustomEvent('submit', { detail: container.data, cancelable: true, bubbles: false }))) return
                const req = { ...container.request, data: container.data, noui: true, ...opt }
                let task = null
                if (container.api) task = container.api.do(req)
                else if (container.request.url) task = globalThis.HTTP.request(req)
                else return console.warn('{#please config .api or .request.url to auto submit#}')
                task.then(resp => {
                        container.response = resp
                        container.result = resp.result
                        if (typeof resp.result === 'object' && resp.result.error) throw new Error(resp.result.error)
                        container.dispatchEvent(new CustomEvent('response', { detail: resp, bubbles: false }))
                }).catch(err => {
                        globalThis.Toast?.show(err.message, { type: 'danger' })
                        container.dispatchEvent(new CustomEvent('error', { detail: err, bubbles: true }))
                })
        }

}, AUTOFORM_BLUEPRINT, AUTOFORM_STYLE)

const findAnchorInBlueprint = (root) => {
    let f = root.querySelector('[control-wrapper]');
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
            const node = globalThis.Util.makeDom(`<template $if="item.type?.toLowerCase() === '${type.toLowerCase()}'"><${name} $name="item.name" $.="item.setting || {}"${toolbar} $bind="thisNode.closest('AutoForm').data[item.name]" class="w-100"></${name}></template>`)
            wrapper.appendChild(node)
        }
    }
}

globalThis.AutoForm = AutoForm;
