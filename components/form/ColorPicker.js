/**
 * ColorPicker Component
 */
globalThis.Component.register('ColorPicker', container => {
        container.addEventListener('change', event => { if (event.target !== container && event.detail === undefined) event.stopImmediatePropagation() })
        container.state = globalThis.NewState({ value: '#000000' })
        container.sm = container.hasAttribute('sm') || container.closest('AutoForm')?.sm || false
        container.addEventListener('bind', e => {
                container.state.value = e.detail || '#000000'
        })
        Object.defineProperty(container, 'value', {
                get: () => container.state.value,
                set: v => { container.state.value = v || '#000000'; }
        })
        container.updateValue = (val) => {
                container.state.value = val
                container.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: val }))
        }
}, globalThis.Util.makeDom(/*html*/`
<div class="d-flex align-items-center gap-2 w-100">
  <input type="color" $class="form-control form-control-color flex-shrink-0 \${this.sm ? 'form-control-sm' : ''}" $bind="this.state.value" $onchange="this.updateValue(thisNode.value)">
  <input type="text" $class="form-control \${this.sm ? 'form-control-sm' : ''}" $bind="this.state.value" $onchange="this.updateValue(thisNode.value)">
</div>
`))

if (globalThis.AutoForm) {
    globalThis.AutoForm.register('ColorPicker')
}
