/**
 * DatePicker Component
 */
globalThis.Component.register('DatePicker', container => {
        container.addEventListener('change', event => { if (event.target !== container && event.detail === undefined) event.stopImmediatePropagation() })
        container.state = globalThis.NewState({ start: '', end: '' })
        container.sm = container.hasAttribute('sm') || container.closest('AutoForm')?.sm || false

        const rangeEnd = () => {
                const form = container.closest('AutoForm')
                const name = container.getAttribute('name')
                const item = form?.state?.schema?.find(i => i.name === name)
                return item?.setting?.rangeEnd || container.rangeEnd || container.getAttribute('rangeend') || ''
        }

        container.addEventListener('bind', e => {
                container.state.start = e.detail || ''
                const form = container.closest('AutoForm')
                const endName = rangeEnd()
                if (form && endName) {
                        container.state.end = form.data[endName] || ''
                }
        })

        Object.defineProperty(container, 'isRange', {
                get: () => {
                        return container.hasAttribute('range') || !!rangeEnd()
                }
        })

        Object.defineProperty(container, 'value', {
                get: () => container.state.start,
                set: v => { container.state.start = v || ''; }
        })

        container.updateStart = (val) => {
                container.state.start = val
                container.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: val }))
        }

        container.updateEnd = (val) => {
                container.state.end = val
                const form = container.closest('AutoForm')
                const endName = rangeEnd()
                if (form && endName) {
                        form.data[endName] = val
                }
                container.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: val }))
        }
}, globalThis.Util.makeDom(/*html*/`
<div class="d-flex align-items-center gap-1 w-100">
  <input type="date" $class="form-control \${this.sm ? 'form-control-sm' : ''}" $bind="this.state.start" $onchange="this.updateStart(thisNode.value)">
  <template $if="this.isRange">
    <span class="text-muted mx-1">-</span>
    <input type="date" $class="form-control \${this.sm ? 'form-control-sm' : ''}" $bind="this.state.end" $onchange="this.updateEnd(thisNode.value)">
  </template>
</div>
`))

if (globalThis.AutoForm) {
    globalThis.AutoForm.register('DatePicker')
}
