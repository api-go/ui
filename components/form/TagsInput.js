/**
 * TagsInput Component
 */
globalThis.Component.register('TagsInput', container => {
	const initialOptions = Array.isArray(container.options) ? container.options : []
    container.state = globalThis.NewState({ value: [], options: initialOptions })
    container.placeholder = container.getAttribute('placeholder') || ''
    container.sm = container.hasAttribute('sm') || container.closest('AutoForm')?.sm || false
	Object.defineProperty(container, 'options', {
		get: () => container.state.options,
		set: value => { container.state.options = Array.isArray(value) ? value : [] },
		configurable: true
	})
	container.optionValue = option => String(option?.value ?? option ?? '').trim()
	container.optionLabel = option => String(option?.label ?? container.optionValue(option))
	container.availableOptions = () => container.state.options
		.filter(option => container.optionValue(option) && !container.state.value.includes(container.optionValue(option)))

    const setValue = value => {
        container.state.value = [...new Set((Array.isArray(value) ? value : []).filter(tag => typeof tag === 'string' && tag.trim()).map(tag => tag.trim()))]
    }
    container.addEventListener('bind', event => setValue(event.detail))

    Object.defineProperty(container, 'value', {
        get: () => container.state.value,
        set: setValue
    })

    container._change = () => container.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: [...container.state.value] }))
    container._removeTag = index => {
        container.state.value.splice(index, 1)
        container.state.value = [...container.state.value]
        container._change()
    }
    container._addTag = value => {
		const tag = String(value || '').trim()
        if (tag && !container.state.value.includes(tag)) {
            container.state.value = [...container.state.value, tag]
            container._change()
        }
    }
    container._commitInput = input => {
        container._addTag(input.value)
        input.value = ''
    }
	container._tagKeydown = (index, event) => {
		if (!['Backspace', 'Delete'].includes(event.key)) return
		event.preventDefault()
		container._removeTag(index)
		queueMicrotask(() => {
			const buttons = globalThis.$$(container, 'button')
			;(buttons.length ? buttons[index > 0 ? index - 1 : 0] : globalThis.$(container, 'input'))?.focus()
		})
	}
	container._inputKeydown = (input, event) => {
		if (event.isComposing || event.key !== 'Enter') return
		event.preventDefault()
		event.stopPropagation()
		container._commitInput(input)
	}
}, globalThis.Util.makeDom(/*html*/`
<div $class="form-control position-relative d-flex flex-wrap gap-1 align-items-center \${this.sm ? 'form-control-sm' : ''}" style="cursor:text">
  <template $each="this.state.value">
    <button type="button" class="btn  btn-outline-primary rounded-pill py-0 px-2" $onkeydown="this._tagKeydown(index,event)" $text="item"></button>
  </template>
  <input type="text" class="border-0 shadow-none py-0 px-2 flex-grow-1 bg-transparent" $placeholder="this.placeholder || '{#new tag name#}'" style="min-width:100px;width:0;outline:none" $onchange="event.stopPropagation()" $oninput="event.stopPropagation()" $onblur="setTimeout(()=>this._commitInput(thisNode),150)" $onkeydown="this._inputKeydown(thisNode,event)">
<div $if="this.availableOptions().length" class="dropdown-menu tags-input-options w-100 mt-1 overflow-auto" style="max-height:220px;top:100%;left:0">
  <button $each="this.availableOptions()" type="button" class="dropdown-item py-1" $text="this.optionLabel(item)" $onclick="this._addTag(this.optionValue(item))"></button>
</div>
</div>
`), globalThis.Util.makeDom(/*html*/`<style>
TagsInput button:focus {background-color:var(--bs-btn-hover-bg);color:var(--bs-btn-hover-color)}
TagsInput:focus-within .tags-input-options {display:block}
</style>`))

if (globalThis.AutoForm) {
    globalThis.AutoForm.register('TagsInput')
}
