/**
 * Dialog Component Module
 */
globalThis.Component.register('Dialog', container => {
  globalThis.Component.getSetupFunction('Modal')(container)
  const actionButtons = () => [...container.querySelectorAll('.modal-footer button:not(:disabled)')]
  const onKeydown = event => {
    if (event.isComposing) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      container.result = 0
      container.hide()
      return
    }
    if (event.key !== 'Enter' || event.target?.matches?.('textarea,[contenteditable="true"]')) return
    const button = event.target?.closest?.('.modal-footer button') || actionButtons().at(-1)
    if (!button) return
    event.preventDefault()
    event.stopPropagation()
    button.click()
  }
  // Dialog owns Escape's result; handle it before Bootstrap's static-backdrop
  // listener can queue a second animation after this dialog has been removed.
  container.addEventListener('keydown', onKeydown, true)
  container.addEventListener('shown.bs.modal', () => {
    document.querySelectorAll('.modal-backdrop').item(document.querySelectorAll('.modal-backdrop').length - 1)?.classList.add('dialog-backdrop')
    actionButtons().at(-1)?.focus()
  })
}, globalThis.Util.makeDom(/*html*/`
<div class="modal fade" data-bs-backdrop="static">
  <div class="modal-dialog modal-dialog-centered">
    <div $class="modal-content bg-body text-body border-\${this.state?.type || 'primary'} border-2 shadow-lg">
      <template $if="this.state?.title">
        <div $class="modal-header py-2 px-3 bg-body-tertiary fw-bold text-\${this.state?.type || 'primary'}" $text="this.state?.title"></div>
      </template>
      <div class="modal-body p-4 text-center">
        <div $text="this.state?.message" class="fs-5 text-body-secondary"></div>
      </div>
      <div class="modal-footer py-2 px-3 bg-body-tertiary border-0 d-flex justify-content-center gap-3">
        <template $each="this.state?.buttons">
        <button type="button" $class="'btn  px-3 btn-'+(index === this.state.buttons.length-1 ? (this.state.type === 'body' ? 'primary' : this.state.type) : 'secondary')" $onclick="this.result=index+1; this.hide()" $text="item"></button>
        </template>
      </div>
    </div>
  </div>
</div>
`), globalThis.Util.makeDom(/*html*/`
<style>
  Dialog.modal { background: transparent; border: 0; padding: 0; }
  .modal-backdrop.dialog-backdrop.show { opacity: .25; }
</style>
`))

let _dialogCount = 0
globalThis.Dialog = {
show({ title = '', message = '', buttons = ['{#Close#}'], type = 'body' }) {
        const d = document.body.appendChild(document.createElement('Dialog'))
        d.style.zIndex = 2000 + ++_dialogCount
        Promise.resolve().then(() => {
                Object.assign(d.state, { message, title, type, buttons })
                d.show()
        })
        return new Promise((resolve) => {
                d.addEventListener('change', e => {
                        _dialogCount--
                        resolve(d.result || 0)
                        d.remove()
                })
        })
},
alert(message, options = {}) {
        return this.show({ message, ...options })
},
confirm(message, options = {}) {
        return new Promise(resolve => this.show({ message, buttons: ['{#Cancel#}', '{#Confirm#}'], ...options }).then(index => resolve(index >= 2)).catch(() => resolve(false)))
}
}
