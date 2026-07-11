/**
 * TagsInput Component
 */
globalThis.Component.register('TagsInput', container => {
    container.state = globalThis.NewState({ value: [] })
    container.placeholder = container.getAttribute('placeholder') || ''

    const setValue = value => {
        container.state.value = [...new Set((Array.isArray(value) ? value : []).filter(tag => typeof tag === 'string' && tag.trim()).map(tag => tag.trim()))]
    }
    container.addEventListener('bind', event => setValue(event.detail))

    Object.defineProperty(container, 'value', {
        get: () => container.state.value,
        set: setValue
    })

    container._change = () => container.dispatchEvent(new CustomEvent('change', { bubbles: false, detail: [...container.state.value] }))
    container._removeTag = index => {
        container.state.value.splice(index, 1)
        container.state.value = [...container.state.value]
        container._change()
    }
    container._addTag = value => {
        const tag = value.trim()
        if (tag && !container.state.value.includes(tag)) {
            container.state.value = [...container.state.value, tag]
            container._change()
        }
    }
}, globalThis.Util.makeDom(/*html*/`
<div class="form-control d-flex flex-wrap gap-1 align-items-center" style="min-height:38px;cursor:text">
  <template $each="this.state.value">
    <button type="button" class="btn btn-sm btn-outline-primary rounded-pill py-0 px-2" $onkeydown="${globalThis.Util.getFunctionBody(function (event) {
                if (['Backspace', 'Delete'].includes(event.key)) {
                        event.preventDefault()
                        this._removeTag(index)
                        Promise.resolve().then(() => {
                                const buttons = globalThis.$$(this, 'button');
                                (buttons.length > 0 ? buttons[index > 0 ? index - 1 : 0] : globalThis.$(this, 'input')).focus()
                        })
                }
        })}" $text="item"></button>
  </template>
  <input type="text" class="border-0 shadow-none py-0 px-2 flex-grow-1 bg-transparent" $placeholder="this.placeholder || '{#new tag name#}'" style="min-width:100px;width:0;outline:none" $onchange="event.stopPropagation()" $oninput="event.stopPropagation()" $onkeydown="${globalThis.Util.getFunctionBody(function (event) {
                if (event.isComposing) return
                if (['Enter', ',', ' '].includes(event.key)) {
                        event.preventDefault()
                        const v = thisNode.value.trim()
                        this._addTag(v)
                        thisNode.value = ''
                }
        })}">
</div>
`), globalThis.Util.makeDom(/*html*/`<style>TagsInput button:focus {background-color:var(--bs-btn-hover-bg);color:var(--bs-btn-hover-color)}</style>`))

if (globalThis.AutoForm) {
    globalThis.AutoForm.register('TagsInput')
}
