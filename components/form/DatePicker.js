/**
 * DatePicker Component
 */
globalThis.Component.register('DatePicker', container => {
        container.addEventListener('change', event => { if (event.target !== container && event.detail === undefined) event.stopImmediatePropagation() })
        container.state = globalThis.NewState({ start: '', end: '' })
        for (const [name, fallback] of Object.entries({type:'date',min:'',max:'',step:'',label:'{#Start#}',endlabel:'{#End#}',required:false,disabled:false,readonly:false})) {
                const initial=container[name]??(typeof fallback==='boolean'?container.hasAttribute(name):container.getAttribute(name)??fallback)
                container.state[name]=initial
                Object.defineProperty(container,name,{get:()=>container.state[name],set:value=>{if(name==='type'&&!['date','time','datetime-local','month','week'].includes(value))throw Error('DatePicker: unsupported native type');container.state[name]=value},configurable:true})
        }
        Object.defineProperty(container,'end',{get:()=>container.state.end,set:value=>{container.state.end=String(value??'')},configurable:true})
        container.endMin=()=>container.state.start&&(!container.min||container.state.start>container.min)?container.state.start:container.min
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
  <input $type="this.type" $class="form-control \${this.sm ? 'form-control-sm' : ''}" $aria-label="this.label" $min="this.min" $max="this.max" $step="this.step||'any'" $required="this.required" $disabled="this.disabled" $readonly="this.readonly" $bind="this.state.start" $onchange="this.updateStart(thisNode.value)">
  <template $if="this.isRange">
    <span class="text-muted mx-1">-</span>
    <input $type="this.type" $class="form-control \${this.sm ? 'form-control-sm' : ''}" $aria-label="this.endlabel" $min="this.endMin()" $max="this.max" $step="this.step||'any'" $required="this.required" $disabled="this.disabled" $readonly="this.readonly" $bind="this.state.end" $onchange="this.updateEnd(thisNode.value)">
  </template>
</div>
`))

if (globalThis.AutoForm) {
    globalThis.AutoForm.register('DatePicker')
}
